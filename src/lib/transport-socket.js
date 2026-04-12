/**
 * WebSocket 兼容适配器 — 封装 Transport 为 WebSocket-like 接口
 */
import { Transport } from './transport.js';
import { generateSnowflakeId } from './snowflake.js';

const WS_CONNECTING = 0;
const WS_OPEN = 1;
const WS_CLOSING = 2;
const WS_CLOSED = 3;

class OfflineQueue {
  constructor() { this._q = []; this._load(); }
  get isEmpty() { return this._q.length === 0; }
  get size() { return this._q.length; }
  enqueue(msg) { this._q.push({ id: String(Date.now()) + Math.random().toString(36).slice(2,6), data: msg, ts: Date.now(), attempts: 0 }); if (this._q.length > 500) this._q = this._q.slice(-500); this._save(); }
  clear() { this._q = []; this._save(); }
  async flush(transport) {
    if (!transport || !transport.isConnected) return { sent: 0, failed: 0 };
    let sent = 0, failed = 0; const done = [];
    for (const e of this._q) { try { e.attempts++; await transport.send(e.data); done.push(e.id); sent++; } catch { failed++; if (e.attempts >= 3) done.push(e.id); }
    }
    this._q = this._q.filter(e => !done.includes(e.id)); this._save();
    return { sent, failed };
  }
  _load() { try { const r = localStorage.getItem('telechat_offline_queue'); if (r) this._q = JSON.parse(r); } catch { this._q = []; } }
  _save() { try { localStorage.setItem('telechat_offline_queue', JSON.stringify(this._q)); } catch {} }
}

export class TransportSocket {
  constructor(wsUrl, httpUrl, options = {}) {
    this._wsUrl = wsUrl;
    this._httpUrl = httpUrl || wsUrl?.replace(/^ws/, 'http');
    this.readyState = WS_CLOSED;
    this._mode = 'ws';
    this.onopen = null; this.onmessage = null; this.onclose = null; this.onerror = null;
    this._offlineQueue = new OfflineQueue();
    this._transport = new Transport({ wsUrl: this._wsUrl, httpUrl: this._httpUrl, reconnectDelay: options.reconnectDelay || 1000, maxReconnectDelay: options.maxReconnectDelay || 30000 });
    this._setupEvents();
  }
  get offlineQueue() { return this._offlineQueue; }
  get mode() { return this._mode; }
  get transport() { return this._transport; }

  connect() { this.readyState = WS_CONNECTING; this._transport.connect('auto'); }
  reconnect() { this.readyState = WS_CONNECTING; this._transport.disconnect(); setTimeout(() => this._transport.connect('auto'), 100); }
  close(code, reason) { this.readyState = WS_CLOSING; this._transport.disconnect(); this.readyState = WS_CLOSED; }

  send(data) {
    if (this.readyState !== WS_OPEN) throw new Error('WebSocket is not open');
    let parsed; try { parsed = typeof data === 'string' ? JSON.parse(data) : data; } catch { parsed = { raw: data }; }
    if (!parsed.msgId && parsed.type === 'chat') parsed.msgId = generateSnowflakeId();
    this._transport.send(parsed).catch(() => { this._offlineQueue.enqueue(parsed); if (this.onerror) this.onerror(new ErrorEvent('error')); });
    return JSON.stringify(parsed);
  }

  _setupEvents() {
    this._transport.on('open', ({ mode }) => { this.readyState = WS_OPEN; this._mode = mode; this._flushOffline(); if (this.onopen) this.onopen(new Event('open')); });
    this._transport.on('message', (data) => { if (this.onmessage) this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) })); });
    this._transport.on('close', ({ reason }) => { this.readyState = WS_CLOSED; if (this.onclose) this.onclose(new CloseEvent('close', { reason })); });
    this._transport.on('state-change', ({ to }) => { if (to === 'connecting' || to === 'reconnecting') this.readyState = WS_CONNECTING; else if (to === 'connected') this.readyState = WS_OPEN; else if (to === 'disconnected') this.readyState = WS_CLOSED; });
  }

  async _flushOffline() { if (!this._offlineQueue.isEmpty) { const { sent } = await this._offlineQueue.flush(this._transport); if (sent > 0) console.log(`[TransportSocket] Flushed ${sent} offline messages`); } }
}

export function createTransportSocket(wsUrl, httpUrl, options) { return new TransportSocket(wsUrl, httpUrl, options); }
