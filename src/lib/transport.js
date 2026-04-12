/**
 * Transport 传输层抽象
 * 支持 WebSocket + HTTP 长轮询双模传输
 */
const DEFAULT_OPTIONS = {
  wsUrl: '', httpUrl: '',
  reconnectDelay: 1000, maxReconnectDelay: 30000, reconnectBackoff: 1.5,
  longPollTimeout: 25000, sendTimeout: 10000,
};

class EventEmitter {
  constructor() { this._l = new Map(); }
  on(e, h) { if (!this._l.has(e)) this._l.set(e, new Set()); this._l.get(e).add(h); return () => this.off(e, h); }
  off(e, h) { const s = this._l.get(e); if (s) s.delete(h); }
  once(e, h) { const w = (...a) => { this.off(e, w); h(...a); }; return this.on(e, w); }
  emit(e, ...a) { const s = this._l.get(e); if (s) for (const h of s) try { h(...a); } catch(err) { console.error(err); } }
  removeAll(e) { e ? this._l.delete(e) : this._l.clear(); }
}

export class Transport extends EventEmitter {
  constructor(options = {}) {
    super();
    this._o = { ...DEFAULT_OPTIONS, ...options };
    this._state = 'disconnected';
    this._mode = 'auto';
    this._sessionId = null;
    this._lastMsgId = '';
    this._ws = null;
    this._pollCtrl = null;
    this._reconnectTimer = null;
    this._reconnectDelay = this._o.reconnectDelay;
    this._intentionalClose = false;
    this._pendingAcks = new Map();
    this._ackSeq = 0;
  }
  get state() { return this._state; }
  get mode() { return this._mode; }
  get sessionId() { return this._sessionId; }
  get isConnected() { return this._state === 'connected'; }

  connect(mode = 'auto') {
    this._intentionalClose = false;
    this._mode = mode;
    this._cancelReconnect();
    if (mode === 'ws' || mode === 'auto') this._connectWS();
    else this._connectPoll();
  }

  disconnect() {
    this._intentionalClose = true;
    this._cancelReconnect();
    this._cleanup();
    this._setState('disconnected');
  }

  send(data) {
    if (this._state !== 'connected') { this.emit('send-failed', data, 'not-connected'); return Promise.reject(new Error('Not connected')); }
    return this._mode === 'ws' ? this._sendWS(data) : this._sendHTTP(data);
  }

  async sendWithAck(data, timeout = this._o.sendTimeout) {
    const seq = ++this._ackSeq;
    const msg = { ...data, _ack: seq };
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this._pendingAcks.delete(seq); reject(new Error('ACK timeout')); }, timeout);
      this._pendingAcks.set(seq, { resolve, reject, timer });
      this.send(msg).catch(reject);
    });
  }

  _connectWS() {
    if (!this._o.wsUrl) { this._mode = 'poll'; this._connectPoll(); return; }
    this._cleanup();
    this._setState(this._state === 'reconnecting' ? 'reconnecting' : 'connecting');
    try { this._ws = new WebSocket(this._o.wsUrl); } catch(e) { this._mode = 'poll'; this._connectPoll(); return; }
    this._ws.onopen = () => { this._mode = 'ws'; this._setState('connected'); this._resetDelay(); this.emit('open', { mode: 'ws' }); };
    this._ws.onmessage = (ev) => this._handleRaw(ev.data);
    this._ws.onclose = (ev) => {
      this._ws = null;
      if (this._intentionalClose) { this._setState('disconnected'); this.emit('close', { reason: 'intentional' }); return; }
      this._setState('reconnecting'); this.emit('close', { reason: ev.reason || 'ws-closed' }); this._scheduleReconnect();
    };
    this._ws.onerror = () => {};
  }

  _sendWS(data) {
    return new Promise((resolve, reject) => { try { this._ws.send(JSON.stringify(data)); resolve(); } catch(e) { reject(e); } });
  }

  _connectPoll() {
    this._cleanup();
    this._setState(this._state === 'reconnecting' ? 'reconnecting' : 'connecting');
    this._mode = 'poll';
    this._setState('connected');
    this._resetDelay();
    this.emit('open', { mode: 'poll' });
    this._startPoll();
  }

  async _startPoll() {
    if (this._state !== 'connected' || this._mode !== 'poll') return;
    const url = new URL(this._o.httpUrl + '/api/poll');
    if (this._sessionId) url.searchParams.set('sid', this._sessionId);
    if (this._lastMsgId) url.searchParams.set('after', this._lastMsgId);
    this._pollCtrl = new AbortController();
    try {
      const resp = await fetch(url.toString(), { method: 'GET', signal: this._pollCtrl.signal, headers: { 'Accept': 'application/json' } });
      if (!resp.ok) throw new Error(`Poll failed: ${resp.status}`);
      const result = await resp.json();
      if (result.sessionId) this._sessionId = result.sessionId;
      if (Array.isArray(result.messages)) for (const msg of result.messages) { if (msg.id) this._lastMsgId = msg.id; this._handleRaw(msg.data || msg); }
      if (this._state === 'connected' && this._mode === 'poll') this._startPoll();
    } catch(e) {
      if (e.name === 'AbortError') return;
      if (this._state === 'connected' && this._mode === 'poll') setTimeout(() => this._startPoll(), 1000);
    }
  }

  _sendHTTP(data) {
    if (!this._o.httpUrl) return Promise.reject(new Error('No HTTP URL'));
    return fetch(this._o.httpUrl + '/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: this._sessionId, data }) })
      .then(r => { if (!r.ok) throw new Error(`Send failed: ${r.status}`); return r.json(); });
  }

  _handleRaw(raw) {
    let data; try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return; }
    if (!data || typeof data !== 'object') return;
    if (data._ack) { const p = this._pendingAcks.get(data._ack); if (p) { clearTimeout(p.timer); this._pendingAcks.delete(data._ack); p.resolve(data); } return; }
    if (data.type === 'ack' && data.ackSeq) { const p = this._pendingAcks.get(data.ackSeq); if (p) { clearTimeout(p.timer); this._pendingAcks.delete(data.ackSeq); p.resolve(data); } return; }
    this.emit('message', data);
  }

  _scheduleReconnect() {
    if (this._intentionalClose) return;
    this._cancelReconnect();
    this._reconnectTimer = setTimeout(() => {
      if (this._intentionalClose) return;
      this._setState('reconnecting'); this.emit('reconnecting', { attempt: true });
      if (this._mode === 'auto' || this._mode === 'ws') this._connectWS(); else this._connectPoll();
      this._reconnectDelay = Math.min(this._reconnectDelay * this._o.reconnectBackoff, this._o.maxReconnectDelay);
    }, this._reconnectDelay);
  }

  _cancelReconnect() { if (this._reconnectTimer) { clearTimeout(this._reconnectTimer); this._reconnectTimer = null; } }
  _resetDelay() { this._reconnectDelay = this._o.reconnectDelay; }

  _cleanup() {
    if (this._ws) { try { this._ws.close(); } catch {} this._ws = null; }
    if (this._pollCtrl) { try { this._pollCtrl.abort(); } catch {} this._pollCtrl = null; }
    for (const [, p] of this._pendingAcks) { clearTimeout(p.timer); p.reject(new Error('Disconnected')); }
    this._pendingAcks.clear();
  }

  _setState(newState) {
    if (this._state !== newState) { const old = this._state; this._state = newState; this.emit('state-change', { from: old, to: newState }); }
  }
}

export function createTransport(options) { return new Transport(options); }
