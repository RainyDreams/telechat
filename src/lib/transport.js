/**
 * Transport 传输层抽象
 *
 * 支持两种传输模式：
 * 1. WebSocket（优先）— 原生双向实时通信
 * 2. HTTP 长轮询（降级）— POST 发送 + GET 长轮询接收
 *
 * 统一 API：on(event, handler) / send(data) / connect() / disconnect()
 * 模拟 Socket.IO 风格的事件驱动接口
 */

const DEFAULT_OPTIONS = {
  // WebSocket 配置
  wsUrl: '',
  // HTTP 长轮询配置
  httpUrl: '',
  // 通用配置
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  reconnectBackoff: 1.5,
  longPollTimeout: 25000, // 长轮询超时时间(ms)
  sendTimeout: 10000, // 发送超时
};

class EventEmitter {
  constructor() {
    this._listeners = new Map();
  }

  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const set = this._listeners.get(event);
    if (set) {
      set.delete(handler);
    }
  }

  once(event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      handler(...args);
    };
    return this.on(event, wrapper);
  }

  emit(event, ...args) {
    const set = this._listeners.get(event);
    if (set) {
      for (const handler of set) {
        try {
          handler(...args);
        } catch (e) {
          console.error(`[Transport] Error in ${event} handler:`, e);
        }
      }
    }
  }

  removeAll(event) {
    if (event) {
      this._listeners.delete(event);
    } else {
      this._listeners.clear();
    }
  }
}

export class Transport extends EventEmitter {
  constructor(options = {}) {
    super();
    this._opts = { ...DEFAULT_OPTIONS, ...options };

    // 状态
    this._state = 'disconnected'; // disconnected | connecting | connected | reconnecting
    this._mode = 'auto'; // auto | ws | poll
    this._sessionId = null;
    this._lastMsgId = '';

    // WebSocket
    this._ws = null;

    // HTTP 长轮询
    this._pollController = null; // AbortController for current poll
    this._sendSequence = 0;

    // 重连
    this._reconnectTimer = null;
    this._reconnectDelay = this._opts.reconnectDelay;
    this._intentionalClose = false;

    // ACK 等待队列
    this._pendingAcks = new Map(); // seq -> { resolve, reject, timer }
    this._ackSeq = 0;
  }

  get state() {
    return this._state;
  }

  get mode() {
    return this._mode;
  }

  get sessionId() {
    return this._sessionId;
  }

  get isConnected() {
    return this._state === 'connected';
  }

  /**
   * 连接服务器
   * @param {'auto'|'ws'|'poll'} mode - 传输模式
   */
  connect(mode = 'auto') {
    this._intentionalClose = false;
    this._mode = mode;
    this._cancelReconnect();

    if (mode === 'ws' || mode === 'auto') {
      this._connectWebSocket();
    } else {
      this._connectPolling();
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    this._intentionalClose = true;
    this._cancelReconnect();
    this._cleanup();
    this._setState('disconnected');
  }

  /**
   * 发送消息
   * @param {object} data - 消息数据
   * @returns {Promise} 如果需要 ACK 确认，返回 Promise
   */
  send(data) {
    if (this._state !== 'connected') {
      // 离线时写入离线队列
      this.emit('send-failed', data, 'not-connected');
      return Promise.reject(new Error('Transport not connected'));
    }

    if (this._mode === 'ws') {
      return this._sendViaWebSocket(data);
    } else {
      return this._sendViaHttp(data);
    }
  }

  /**
   * 发送并等待 ACK
   */
  async sendWithAck(data, timeout = this._opts.sendTimeout) {
    const seq = ++this._ackSeq;
    const msg = { ...data, _ack: seq };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this._pendingAcks.delete(seq);
        reject(new Error('ACK timeout'));
      }, timeout);

      this._pendingAcks.set(seq, { resolve, reject, timer });
      this.send(msg).catch(reject);
    });
  }

  // ===== WebSocket =====

  _connectWebSocket() {
    if (!this._opts.wsUrl) {
      console.warn('[Transport] No wsUrl configured, falling back to polling');
      this._mode = 'poll';
      this._connectPolling();
      return;
    }

    this._cleanup();
    this._setState(this._state === 'reconnecting' ? 'reconnecting' : 'connecting');

    try {
      this._ws = new WebSocket(this._opts.wsUrl);
    } catch (e) {
      console.warn('[Transport] WebSocket creation failed, falling back to polling:', e);
      this._mode = 'poll';
      this._connectPolling();
      return;
    }

    this._ws.onopen = () => {
      this._mode = 'ws';
      this._setState('connected');
      this._resetReconnectDelay();
      this.emit('open', { mode: 'ws' });
    };

    this._ws.onmessage = (event) => {
      this._handleRawMessage(event.data);
    };

    this._ws.onclose = (event) => {
      this._ws = null;
      if (this._intentionalClose) {
        this._setState('disconnected');
        this.emit('close', { reason: 'intentional' });
        return;
      }
      // WebSocket 断开，尝试降级到长轮询
      if (this._mode === 'auto' || this._mode === 'ws') {
        console.log('[Transport] WebSocket closed, trying long-polling fallback');
        this._setState('reconnecting');
        this.emit('close', { reason: event.reason || 'ws-closed' });
        this._scheduleReconnect();
      }
    };

    this._ws.onerror = () => {
      // error 后面通常跟着 close，不在这里处理
    };
  }

  _sendViaWebSocket(data) {
    return new Promise((resolve, reject) => {
      try {
        this._ws.send(JSON.stringify(data));
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  // ===== HTTP 长轮询 =====

  _connectPolling() {
    this._cleanup();
    this._setState(this._state === 'reconnecting' ? 'reconnecting' : 'connecting');
    this._mode = 'poll';

    // 长轮询模式下立即进入 connected 状态（不需要握手）
    this._setState('connected');
    this._resetReconnectDelay();
    this.emit('open', { mode: 'poll' });

    // 开始长轮询循环
    this._startLongPoll();
  }

  async _startLongPoll() {
    if (this._state !== 'connected' || this._mode !== 'poll') return;

    const url = new URL(this._opts.httpUrl + '/api/poll');
    if (this._sessionId) url.searchParams.set('sid', this._sessionId);
    if (this._lastMsgId) url.searchParams.set('after', this._lastMsgId);

    this._pollController = new AbortController();

    try {
      const resp = await fetch(url.toString(), {
        method: 'GET',
        signal: this._pollController.signal,
        headers: { 'Accept': 'application/json' },
      });

      if (!resp.ok) {
        throw new Error(`Poll failed: ${resp.status}`);
      }

      const result = await resp.json();

      if (result.sessionId) {
        this._sessionId = result.sessionId;
      }

      if (Array.isArray(result.messages)) {
        for (const msg of result.messages) {
          if (msg.id) this._lastMsgId = msg.id;
          this._handleRawMessage(msg.data || msg);
        }
      }

      // 立即发起下一轮长轮询
      if (this._state === 'connected' && this._mode === 'poll') {
        this._startLongPoll();
      }
    } catch (e) {
      if (e.name === 'AbortError') return; // 主动取消

      console.warn('[Transport] Long-poll error:', e.message);
      // 等一下再重试
      if (this._state === 'connected' && this._mode === 'poll') {
        setTimeout(() => this._startLongPoll(), 1000);
      }
    }
  }

  _sendViaHttp(data) {
    if (!this._opts.httpUrl) {
      return Promise.reject(new Error('No HTTP URL configured'));
    }

    const url = this._opts.httpUrl + '/api/send';
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: this._sessionId,
        data,
      }),
    }).then((resp) => {
      if (!resp.ok) throw new Error(`Send failed: ${resp.status}`);
      return resp.json();
    }).then((result) => {
      // 处理 ACK
      if (data._ack) {
        this._handleAck(data._ack, result);
      }
      return result;
    });
  }

  // ===== 消息处理 =====

  _handleRawMessage(raw) {
    let data;
    try {
      data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return;
    }

    if (!data || typeof data !== 'object') return;

    // 处理 ACK 响应
    if (data._ack) {
      this._handleAckResponse(data._ack, data);
      return;
    }

    // 处理服务端发来的 ACK 确认
    if (data.type === 'ack' && data.ackSeq) {
      this._handleAckResponse(data.ackSeq, data);
      return;
    }

    this.emit('message', data);
  }

  _handleAckResponse(seq, data) {
    const pending = this._pendingAcks.get(seq);
    if (pending) {
      clearTimeout(pending.timer);
      this._pendingAcks.delete(seq);
      pending.resolve(data);
    }
  }

  _handleAck(seq, data) {
    const pending = this._pendingAcks.get(seq);
    if (pending) {
      clearTimeout(pending.timer);
      this._pendingAcks.delete(seq);
      pending.resolve(data);
    }
  }

  // ===== 重连 =====

  _scheduleReconnect() {
    if (this._intentionalClose) return;

    this._cancelReconnect();
    this._reconnectTimer = setTimeout(() => {
      if (this._intentionalClose) return;
      this._setState('reconnecting');
      this.emit('reconnecting', { attempt: true });

      // 尝试 WebSocket，失败则降级
      if (this._mode === 'auto' || this._mode === 'ws') {
        this._connectWebSocket();
      } else {
        this._connectPolling();
      }

      // 增加退避时间
      this._reconnectDelay = Math.min(
        this._reconnectDelay * this._opts.reconnectBackoff,
        this._opts.maxReconnectDelay
      );
    }, this._reconnectDelay);
  }

  _cancelReconnect() {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
  }

  _resetReconnectDelay() {
    this._reconnectDelay = this._opts.reconnectDelay;
  }

  // ===== 清理 =====

  _cleanup() {
    // 关闭 WebSocket
    if (this._ws) {
      try { this._ws.close(); } catch { /* ignore */ }
      this._ws = null;
    }

    // 取消长轮询
    if (this._pollController) {
      try { this._pollController.abort(); } catch { /* ignore */ }
      this._pollController = null;
    }

    // 清理 ACK 队列
    for (const [, pending] of this._pendingAcks) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Transport disconnected'));
    }
    this._pendingAcks.clear();
  }

  _setState(newState) {
    if (this._state !== newState) {
      const old = this._state;
      this._state = newState;
      this.emit('state-change', { from: old, to: newState });
    }
  }
}

/**
 * 创建 Transport 实例的工厂函数
 */
export function createTransport(options) {
  return new Transport(options);
}
