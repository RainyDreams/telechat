/**
 * WebSocket 兼容适配器
 *
 * 将 Transport 层封装为 WebSocket-like 接口，
 * 这样 App.vue 中的 ws.readyState / ws.send / ws.close 调用
 * 不需要大规模修改。
 *
 * 同时提供增强功能：
 * - 自动降级（WebSocket → HTTP 长轮询）
 * - 离线队列
 * - 雪花消息 ID
 */

import { Transport } from './transport.js';
import { OfflineQueue } from './offline-queue.js';
import { generateSnowflakeId } from './snowflake.js';

// WebSocket readyState 兼容常量
const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

export class TransportSocket {
  constructor(wsUrl, httpUrl, options = {}) {
    this._wsUrl = wsUrl;
    this._httpUrl = httpUrl || wsUrl?.replace(/^ws/, 'http');
    this._options = options;

    // 状态
    this.readyState = CLOSED;
    this._mode = 'ws'; // 'ws' | 'poll'

    // 事件处理器（兼容 WebSocket 接口）
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;

    // 离线队列
    this._offlineQueue = options.offlineQueue || new OfflineQueue();

    // Transport 实例
    this._transport = new Transport({
      wsUrl: this._wsUrl,
      httpUrl: this._httpUrl,
      reconnectDelay: options.reconnectDelay || 1000,
      maxReconnectDelay: options.maxReconnectDelay || 30000,
      longPollTimeout: options.longPollTimeout || 25000,
    });

    this._setupTransportEvents();
  }

  get offlineQueue() {
    return this._offlineQueue;
  }

  get mode() {
    return this._mode;
  }

  get transport() {
    return this._transport;
  }

  /**
   * 连接服务器
   */
  connect() {
    this.readyState = CONNECTING;
    this._transport.connect('auto');
  }

  /**
   * 手动重连
   */
  reconnect() {
    this.readyState = CONNECTING;
    this._transport.disconnect();
    setTimeout(() => this._transport.connect('auto'), 100);
  }

  /**
   * 断开连接
   */
  close(code, reason) {
    this.readyState = CLOSING;
    this._transport.disconnect();
    this.readyState = CLOSED;
  }

  /**
   * 发送消息（兼容 WebSocket 接口）
   * 自动注入雪花 msgId
   */
  send(data) {
    if (this.readyState !== OPEN) {
      throw new Error('WebSocket is not open');
    }

    let parsed;
    if (typeof data === 'string') {
      try {
        parsed = JSON.parse(data);
      } catch {
        parsed = { raw: data };
      }
    } else {
      parsed = data;
    }

    // 自动注入雪花 msgId（如果还没有）
    if (!parsed.msgId && parsed.type === 'chat') {
      parsed.msgId = generateSnowflakeId();
    }

    const serialized = JSON.stringify(parsed);

    // 通过 Transport 发送
    this._transport.send(parsed).catch((err) => {
      // 发送失败，加入离线队列
      this._offlineQueue.enqueue(parsed);
      if (this.onerror) {
        this.onerror(new ErrorEvent('error', { message: err.message }));
      }
    });

    return serialized;
  }

  // ===== 内部 =====

  _setupTransportEvents() {
    this._transport.on('open', ({ mode }) => {
      this.readyState = OPEN;
      this._mode = mode;

      // 连接成功，flush 离线队列
      this._flushOfflineQueue();

      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    });

    this._transport.on('message', (data) => {
      if (this.onmessage) {
        // 封装为 MessageEvent 以兼容 WebSocket 接口
        this.onmessage(new MessageEvent('message', {
          data: JSON.stringify(data),
        }));
      }
    });

    this._transport.on('close', ({ reason }) => {
      this.readyState = CLOSED;
      if (this.onclose) {
        this.onclose(new CloseEvent('close', { reason }));
      }
    });

    this._transport.on('state-change', ({ from, to }) => {
      if (to === 'connecting' || to === 'reconnecting') {
        this.readyState = CONNECTING;
      } else if (to === 'connected') {
        this.readyState = OPEN;
      } else if (to === 'disconnected') {
        this.readyState = CLOSED;
      }
    });

    this._transport.on('reconnecting', () => {
      // 可以在这里通知 UI
    });
  }

  async _flushOfflineQueue() {
    if (this._offlineQueue.isEmpty) return;
    const { sent } = await this._offlineQueue.flush(this._transport);
    if (sent > 0) {
      console.log(`[TransportSocket] Flushed ${sent} offline messages`);
    }
  }
}

/**
 * 工厂函数
 */
export function createTransportSocket(wsUrl, httpUrl, options) {
  return new TransportSocket(wsUrl, httpUrl, options);
}
