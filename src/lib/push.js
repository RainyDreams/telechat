/**
 * Web Push 订阅管理
 *
 * - 注册 Service Worker
 * - 请求通知权限
 * - 订阅 Push（VAPID）
 * - 向服务端注册订阅
 */

const SW_PATH = '/sw.js';
const PUSH_SUBSCRIBE_KEY = 'telechat_push_subscribed';

/**
 * 注册 Service Worker
 * @returns {ServiceWorkerRegistration|null}
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Push] Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: '/',
      updateViaCache: 'none',
    });

    // 监听更新
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            // 新版本已激活，可提示用户刷新
            console.log('[Push] Service Worker updated');
          }
        });
      }
    });

    // 监听来自 SW 的消息
    navigator.serviceWorker.addEventListener('message', handleSWMessage);

    console.log('[Push] Service Worker registered');
    return registration;
  } catch (error) {
    console.error('[Push] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * 请求通知权限
 * @returns {NotificationPermission}
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('[Push] Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * 订阅 Push
 * @param {ServiceWorkerRegistration} registration
 * @param {string} vapidPublicKey - VAPID 公钥 (base64url)
 * @returns {PushSubscription|null}
 */
export async function subscribePush(registration, vapidPublicKey) {
  if (!registration || !('PushManager' in window)) {
    console.warn('[Push] Push not supported');
    return null;
  }

  try {
    // 检查是否已有订阅
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // 创建新订阅
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, // 必须为 true（Chrome 要求）
        applicationServerKey,
      });
      console.log('[Push] Subscribed:', subscription.endpoint);
    }

    return subscription;
  } catch (error) {
    console.error('[Push] Subscribe failed:', error);
    return null;
  }
}

/**
 * 取消订阅
 */
export async function unsubscribePush() {
  if (!('serviceWorker' in navigator)) return false;

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return false;

  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return false;

  await subscription.unsubscribe();
  localStorage.removeItem(PUSH_SUBSCRIBE_KEY);
  return true;
}

/**
 * 检查当前推送订阅状态
 */
export async function getPushStatus() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { supported: false, permission: 'denied', subscribed: false };
  }

  const permission = Notification.permission;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = registration
    ? await registration.pushManager.getSubscription()
    : null;

  return {
    supported: true,
    permission,
    subscribed: Boolean(subscription),
    endpoint: subscription?.endpoint || '',
  };
}

/**
 * 向服务端注册 Push 订阅
 * @param {PushSubscription} subscription
 * @param {string} apiUrl - 后端 API 地址
 */
export async function registerPushSubscription(subscription, apiUrl) {
  if (!subscription) return false;

  try {
    const resp = await fetch(`${apiUrl}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: arrayBufferToBase64(subscription.getKey('auth')),
        },
      }),
    });

    if (resp.ok) {
      localStorage.setItem(PUSH_SUBSCRIBE_KEY, '1');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[Push] Register subscription failed:', error);
    return false;
  }
}

/**
 * 完整的 Push 初始化流程
 * @param {string} vapidPublicKey
 * @param {string} apiUrl
 */
export async function initPush(vapidPublicKey, apiUrl) {
  // 1. 注册 SW
  const registration = await registerServiceWorker();
  if (!registration) return { success: false, reason: 'sw-failed' };

  // 2. 请求通知权限
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') return { success: false, reason: 'permission-denied' };

  // 3. 订阅 Push
  if (!vapidPublicKey) return { success: false, reason: 'no-vapid-key' };
  const subscription = await subscribePush(registration, vapidPublicKey);
  if (!subscription) return { success: false, reason: 'subscribe-failed' };

  // 4. 向服务端注册
  const registered = await registerPushSubscription(subscription, apiUrl);
  if (!registered) return { success: false, reason: 'register-failed' };

  return { success: true, subscription };
}

// ===== 工具函数 =====

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer) {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function handleSWMessage(event) {
  const { type, groupId } = event.data || {};

  if (type === 'NOTIFICATION_CLICK') {
    // 导航到对应聊天
    if (groupId) {
      const url = new URL(window.location.href);
      url.searchParams.set('group', groupId);
      window.history.pushState({}, '', url.toString());
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }

  if (type === 'SYNC_MESSAGES') {
    // 触发消息同步（通过已有的 WebSocket 连接）
    window.dispatchEvent(new CustomEvent('telechat-sync-messages'));
  }
}
