/**
 * LINKCONNECT Service Worker
 *
 * 功能：
 * - 离线缓存基础页面
 * - Web Push 通知处理
 * - 点击通知跳转到对应聊天
 * - 后台消息同步
 */

const CACHE_NAME = 'linkconnect-v2';
const OFFLINE_URL = '/';
const MAX_NOTIFICATION_BODY_LENGTH = 120;

// 需要预缓存的资源
const PRECACHE_URLS = [
  '/',
  '/index.html',
];

// ===== Install =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // 立即激活，不等待旧 SW 退出
  self.skipWaiting();
});

// ===== Activate =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    // 清理旧版本缓存
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => {
      // 立即接管所有页面
      return self.clients.claim();
    })
  );
});

// ===== Fetch — Network First, fallback to Cache =====
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 只处理 GET 请求
  if (request.method !== 'GET') return;

  // 只处理 http/https 请求（忽略 chrome-extension, moz-extension 等）
  if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) return;

  // API 请求不缓存
  if (request.url.includes('/api/') || request.url.includes('/ws')) return;

  // 对于导航请求和静态资源，使用 network-first 策略
  event.respondWith(
    fetch(request)
      .then((response) => {
        // 成功获取，更新缓存
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            try { cache.put(request, responseClone); } catch { /* ignore unsupported schemes */ }
          });
        }
        return response;
      })
      .catch(() => {
        // 网络失败，尝试缓存
        return caches.match(request).then((cached) => {
          return cached || caches.match(OFFLINE_URL);
        });
      })
  );
});

// ===== Push 通知处理 =====
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: '新消息', body: event.data?.text() || '' };
  }

  const title = payload.title || 'LINKCONNECT';
  const options = {
    body: truncateBody(payload.body || '收到新消息'),
    icon: payload.icon || '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: payload.tag || 'linkconnect-message',
    data: {
      groupId: payload.groupId || '',
      url: buildNotificationUrl(payload),
      ...payload.data,
    },
    actions: buildNotificationActions(payload),
    requireInteraction: payload.requireInteraction || false,
    silent: false,
    timestamp: payload.timestamp || Date.now(),
  };

  // 合并通知：如果有相同 tag 的通知，合并显示
  event.waitUntil(
    self.registration.getNotifications({ tag: options.tag }).then((existingNotifications) => {
      if (existingNotifications.length > 0) {
        // 合并为一条通知
        const mergedOptions = mergeNotifications(existingNotifications[0], options, payload);
        return self.registration.showNotification(title, mergedOptions);
      }
      return self.registration.showNotification(title, options);
    })
  );
});

// ===== 通知点击 =====
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = data.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // 查找已打开的窗口
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          // 聚焦已打开的窗口并导航
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            groupId: data.groupId || '',
            url: targetUrl,
          });
          return;
        }
      }
      // 没有已打开的窗口，打开新窗口
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ===== 后台同步 =====
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// ===== 消息通道 — 与主线程通信 =====
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_NAME });
  }
});

// ===== 工具函数 =====

function truncateBody(text) {
  if (!text) return '';
  if (text.length <= MAX_NOTIFICATION_BODY_LENGTH) return text;
  return text.slice(0, MAX_NOTIFICATION_BODY_LENGTH - 3) + '...';
}

function buildNotificationUrl(payload) {
  const origin = self.location.origin;
  if (payload.groupId) {
    return `${origin}/?group=${encodeURIComponent(payload.groupId)}`;
  }
  return origin;
}

function buildNotificationActions(payload) {
  const actions = [];
  if (payload.groupId) {
    actions.push({ action: 'open-chat', title: '查看' });
  }
  actions.push({ action: 'dismiss', title: '忽略' });
  return actions;
}

function mergeNotifications(existing, newOptions, payload) {
  const existingData = existing.data || {};
  const count = (existingData.unreadCount || 1) + 1;

  return {
    ...newOptions,
    body: `收到 ${count} 条新消息`,
    data: {
      ...newOptions.data,
      unreadCount: count,
    },
  };
}

async function syncMessages() {
  // 后台同步：通知主线程拉取最新消息
  const clients = await self.clients.matchAll({ type: 'window' });
  for (const client of clients) {
    client.postMessage({ type: 'SYNC_MESSAGES' });
  }
}
