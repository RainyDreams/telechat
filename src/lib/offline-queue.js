/**
 * 离线消息队列管理
 *
 * - 消息发送失败时存入本地队列
 * - 重连成功后自动 flush
 * - 基于 localStorage 持久化
 */

const QUEUE_KEY = 'telechat_offline_queue';
const MAX_QUEUE_SIZE = 500;

export class OfflineQueue {
  constructor() {
    this._queue = [];
    this._sending = false;
    this._load();
  }

  get size() {
    return this._queue.length;
  }

  get isEmpty() {
    return this._queue.length === 0;
  }

  /**
   * 添加消息到队列
   * @param {object} message - 待发送的消息
   */
  enqueue(message) {
    const entry = {
      id: message._msgId || String(Date.now()) + '-' + Math.random().toString(36).slice(2, 8),
      data: message,
      enqueuedAt: Date.now(),
      attempts: 0,
    };

    this._queue.push(entry);

    // 限制队列大小
    if (this._queue.length > MAX_QUEUE_SIZE) {
      this._queue = this._queue.slice(-MAX_QUEUE_SIZE);
    }

    this._save();
    return entry.id;
  }

  /**
   * 移除指定消息
   */
  remove(id) {
    this._queue = this._queue.filter((e) => e.id !== id);
    this._save();
  }

  /**
   * 清空队列
   */
  clear() {
    this._queue = [];
    this._save();
  }

  /**
   * 获取队列中所有待发消息（按时间排序）
   */
  getPending() {
    return [...this._queue];
  }

  /**
   * Flush 队列 — 将所有消息通过 transport 发送
   * @param {Transport} transport
   * @returns {{ sent: number, failed: number }}
   */
  async flush(transport) {
    if (this._sending || !transport || !transport.isConnected) {
      return { sent: 0, failed: 0 };
    }

    this._sending = true;
    let sent = 0;
    let failed = 0;
    const completed = [];

    for (const entry of this._queue) {
      try {
        entry.attempts++;
        await transport.send(entry.data);
        completed.push(entry.id);
        sent++;
      } catch (e) {
        failed++;
        if (entry.attempts >= 3) {
          completed.push(entry.id); // 超过重试次数，丢弃
        }
        // 未超过重试次数的保留，等下次 flush
      }
    }

    // 移除已完成的
    for (const id of completed) {
      this.remove(id);
    }

    this._sending = false;
    return { sent, failed };
  }

  // ===== 持久化 =====

  _load() {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this._queue = parsed;
        }
      }
    } catch {
      this._queue = [];
    }
  }

  _save() {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this._queue));
    } catch {
      // localStorage 可能满了
    }
  }
}

/**
 * 创建离线队列实例
 */
export function createOfflineQueue() {
  return new OfflineQueue();
}
