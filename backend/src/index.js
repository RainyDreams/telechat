const SYSTEM_GROUP = 'system';
const SYSTEM_NOTICE_GROUP = 'system-notice';
const GROUP_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;

const MAX_GROUPS_PER_USER = 24;
const MAX_CHAT_PER_10S = 24;
const MAX_IMAGE_PER_60S = 8;
const MAX_JOIN_PER_MIN = 20;
const MAX_INVITE_PER_MIN = 30;
const MAX_INVALID_ACTION_PER_MIN = 40;

const POW_DIFFICULTY = 3;
const INVITE_TTL_DEFAULT_SECONDS = 2 * 24 * 60 * 60;
const INVITE_TTL_MAX_SECONDS = 7 * 24 * 60 * 60;
const CONTACT_ALIAS_MAX = 40;
const NICKNAME_MAX = 24;
const GROUP_NAME_MAX = 40;
const GROUP_ANNOUNCEMENT_MAX = 240;
const MIGRATION_TTL_MS = 10 * 60 * 1000;
const CONTACT_REQUEST_TTL_MS = 10 * 60 * 1000;
const GROUP_INVITE_APPROVAL_TTL_MS = 10 * 60 * 1000;
const DIRECT_REQUEST_TTL_MS = 10 * 60 * 1000;
const DEFAULT_INVITE_MAX_USES = 10;
const MAX_INVITE_MAX_USES = 999;
const MAX_ACTIVE_INVITES_PER_GROUP = 5;
const SHORT_INVITE_CODE_LENGTH = 8;
const SHORT_INVITE_CODE_PATTERN = /^[A-Za-z0-9]{6,16}$/;
const SHORT_INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

const MAX_BASE64_FIELD_LENGTH = 1_500_000;
const MAX_ENCRYPTED_KEY_LENGTH = 4096;
const MAX_IDENTITY_KEY_LENGTH = 8192;
const MAX_DEVICE_FINGERPRINT_LENGTH = 128;
const MAX_DEVICE_SECRET_LENGTH = 256;
const MAX_DEVICE_TOKEN_LENGTH = 128;
const MAX_DEVICE_PROFILE_FIELD_LENGTH = 180;

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

const enc = new TextEncoder();
const MIN_INVITE_SIGNING_SECRET_LENGTH = 32;

const isBase64 = (value, maxLen = MAX_BASE64_FIELD_LENGTH) => {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= maxLen &&
    /^[A-Za-z0-9+/=]+$/.test(value)
  );
};

const sanitizeGroupId = (value) => {
  if (typeof value !== 'string') return null;
  const gid = value.trim();
  if (!GROUP_ID_PATTERN.test(gid)) return null;
  return gid;
};

const isDirectGroupId = (groupId) => {
  return typeof groupId === 'string' && groupId.startsWith('dm-');
};

const parseDirectGroupId = (groupId) => {
  if (!isDirectGroupId(groupId)) return null;
  const body = groupId.slice(3);
  const parts = body.split(':').filter(Boolean);
  if (parts.length !== 2) return null;
  return parts;
};

const buildDirectGroupId = (uidA, uidB) => {
  if (!uidA || !uidB) return '';
  const pair = [uidA, uidB].sort();
  return `dm-${pair[0]}:${pair[1]}`;
};

const buildDmPairKey = (fpA, fpB) => {
  if (!fpA || !fpB) return '';
  const pair = [fpA, fpB].sort();
  return `pair:${pair[0]}:${pair[1]}`;
};

const sanitizeText = (value, maxLen) => {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text || text.length > maxLen) return null;
  return text;
};

const sanitizeOptionalText = (value, maxLen) => {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) : text;
};

const sanitizeGroupName = (value) => {
  const name = sanitizeOptionalText(value, GROUP_NAME_MAX);
  return name || '';
};

const sanitizeNickname = (value) => {
  if (typeof value !== 'string') return null;
  const nickname = value.trim();
  if (!nickname || nickname.length > NICKNAME_MAX) return null;
  if (/[\u0000-\u001f\u007f]/.test(nickname)) return null;
  return nickname;
};

const sanitizeDeviceFingerprint = (value) => {
  if (typeof value !== 'string') return null;
  const fp = value.trim();
  if (!fp || fp.length > MAX_DEVICE_FINGERPRINT_LENGTH) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(fp)) return null;
  return fp;
};

const sanitizeDeviceSecret = (value) => {
  if (typeof value !== 'string') return null;
  const secret = value.trim();
  if (!secret || secret.length > MAX_DEVICE_SECRET_LENGTH) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(secret)) return null;
  return secret;
};

const sanitizeDeviceToken = (value) => {
  if (typeof value !== 'string') return null;
  const token = value.trim();
  if (!token || token.length > MAX_DEVICE_TOKEN_LENGTH) return null;
  if (!/^[a-f0-9]+$/i.test(token)) return null;
  return token;
};

const sanitizeDeviceProfile = (value) => {
  const profile = value && typeof value === 'object' ? value : {};
  return {
    userAgent: sanitizeOptionalText(profile.userAgent, MAX_DEVICE_PROFILE_FIELD_LENGTH),
    language: sanitizeOptionalText(profile.language, 32),
    platform: sanitizeOptionalText(profile.platform, 64),
    timezone: sanitizeOptionalText(profile.timezone, 64),
    screen: sanitizeOptionalText(profile.screen, 32),
    touch: sanitizeOptionalText(profile.touch, 16),
  };
};

const safeParseJson = (raw) => {
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const randomHex = (lenBytes = 8) => {
  const bytes = crypto.getRandomValues(new Uint8Array(lenBytes));
  return Array.from(bytes).map((v) => v.toString(16).padStart(2, '0')).join('');
};

const getConfiguredSecret = (value, minLength = 1) => {
  if (typeof value !== 'string') return '';
  const secret = value.trim();
  if (!secret || secret.length < minLength) return '';
  return secret;
};

const randomShortCode = (length = SHORT_INVITE_CODE_LENGTH) => {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    out += SHORT_INVITE_CODE_ALPHABET[bytes[i] % SHORT_INVITE_CODE_ALPHABET.length];
  }
  return out;
};

const sanitizeInviteMaxUses = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return DEFAULT_INVITE_MAX_USES;
  return Math.max(1, Math.min(MAX_INVITE_MAX_USES, Math.floor(num)));
};

const sanitizeShortInviteCode = (value) => {
  if (typeof value !== 'string') return '';
  const code = value.trim();
  return SHORT_INVITE_CODE_PATTERN.test(code) ? code : '';
};

const FRIENDLY_NICKNAME_PREFIXES = [
  '晴空',
  '南风',
  '晚星',
  '晨雾',
  '松弛',
  '远山',
  '微光',
  '流云',
  '海盐',
  '初雪',
  '蓝桥',
  '长夏',
];

const FRIENDLY_NICKNAME_SUFFIXES = [
  '松果',
  '云朵',
  '小满',
  '月见',
  '木棉',
  '青柚',
  '可可',
  '铃兰',
  '花火',
  '竹枝',
  '星砂',
  '橘子',
];

const randomIndex = (size) => {
  if (!Number.isFinite(size) || size <= 0) return 0;
  return crypto.getRandomValues(new Uint32Array(1))[0] % size;
};

const createFriendlyNicknameCandidate = () => {
  const prefix = FRIENDLY_NICKNAME_PREFIXES[randomIndex(FRIENDLY_NICKNAME_PREFIXES.length)] || '微光';
  const suffix = FRIENDLY_NICKNAME_SUFFIXES[randomIndex(FRIENDLY_NICKNAME_SUFFIXES.length)] || '云朵';
  const serial = String(randomIndex(90) + 10);
  return `${prefix}${suffix}${serial}`;
};

const parseGroupCreatedAtFromId = (groupId = '') => {
  const text = typeof groupId === 'string' ? groupId.trim() : '';
  const match = text.match(/^grp-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})(?:-|$)/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDefaultGroupName = (label = '用户', date = new Date()) => {
  const safeLabel = typeof label === 'string' && label.trim() ? label.trim() : '用户';
  const safeDate = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const month = safeDate.getMonth() + 1;
  const day = safeDate.getDate();
  const hour = String(safeDate.getHours()).padStart(2, '0');
  const minute = String(safeDate.getMinutes()).padStart(2, '0');
  return `【${safeLabel}】在${month}月${day}日${hour}${minute}发起的群聊`;
};

const defaultGroupNameForSender = (sender, groupId = '') => {
  const nickname = typeof sender?.nickname === 'string' ? sender.nickname.trim() : '';
  const uid = typeof sender?.uid === 'string' ? sender.uid : '';
  const label = nickname || (uid ? `用户 ${uid.slice(0, 6)}` : '用户');
  return formatDefaultGroupName(label, parseGroupCreatedAtFromId(groupId) || new Date());
};

const isGeneratedContactAlias = (alias, uid = '') => {
  const text = typeof alias === 'string' ? alias.trim() : '';
  if (!text) return true;
  const normalizedUid = typeof uid === 'string' ? uid.trim() : '';
  if (normalizedUid && (text === `用户 ${normalizedUid}` || text === `用户 ${normalizedUid.slice(0, 6)}`)) {
    return true;
  }
  return /^用户\s+[A-Za-z0-9_-]{4,}$/.test(text);
};

const defaultContactAliasForSession = (session, fallbackUid = '') => {
  const nickname = typeof session?.nickname === 'string' ? session.nickname.trim() : '';
  if (nickname) return nickname;
  const uid = typeof session?.uid === 'string' ? session.uid : (typeof fallbackUid === 'string' ? fallbackUid : '');
  return uid ? `用户 ${uid}` : '用户';
};

const resolveContactAlias = (candidate, session, fallbackUid = '') => {
  const alias = sanitizeOptionalText(candidate, CONTACT_ALIAS_MAX);
  const uid = typeof session?.uid === 'string' ? session.uid : (typeof fallbackUid === 'string' ? fallbackUid : '');
  if (alias && !isGeneratedContactAlias(alias, uid)) return alias;
  return defaultContactAliasForSession(session, fallbackUid);
};

const getOsFromUserAgent = (ua) => {
  if (typeof ua !== 'string') return 'Unknown';
  const agent = ua.toLowerCase();
  if (agent.includes('android')) return 'Android';
  if (agent.includes('iphone') || agent.includes('ipad') || agent.includes('ios')) return 'iOS';
  if (agent.includes('windows')) return 'Windows';
  if (agent.includes('mac')) return 'macOS';
  if (agent.includes('linux')) return 'Linux';
  return 'Unknown';
};

const formatLocation = (cf) => {
  if (!cf) return 'Unknown';
  const parts = [];
  if (cf.city) parts.push(cf.city);
  if (cf.region) parts.push(cf.region);
  if (cf.country) parts.push(cf.country);
  return parts.length ? parts.join(' · ') : 'Unknown';
};

const base64UrlEncodeBytes = (bytes) => {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const base64UrlEncodeText = (text) => {
  return base64UrlEncodeBytes(enc.encode(text));
};

const deriveDeviceFingerprint = async (deviceSecret) => {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(`telechat-device:${deviceSecret}`));
  return base64UrlEncodeBytes(new Uint8Array(digest));
};

const deriveDeviceBindingToken = (deviceSecret) => {
  const secretBytes = base64UrlToBytes(deviceSecret);
  if (!secretBytes || !secretBytes.length) return '';
  const out = new Uint8Array(24);
  let acc = 0x6d;
  for (let i = 0; i < out.length; i += 1) {
    const a = secretBytes[i % secretBytes.length];
    const b = secretBytes[(i * 5 + 1) % secretBytes.length];
    const c = secretBytes[(i * 11 + 7) % secretBytes.length];
    acc = (acc + a + ((b << 1) & 0xff) + i * 17) & 0xff;
    out[i] = (acc ^ b ^ ((c + i * 23) & 0xff)) & 0xff;
  }
  return Array.from(out).map((value) => value.toString(16).padStart(2, '0')).join('');
};

const base64UrlToBytes = (base64url) => {
  if (typeof base64url !== 'string' || !/^[A-Za-z0-9_-]+$/.test(base64url)) return null;
  const padded = `${base64url}${'='.repeat((4 - (base64url.length % 4 || 4)) % 4)}`;
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  try {
    const binary = atob(base64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      out[i] = binary.charCodeAt(i);
    }
    return out;
  } catch {
    return null;
  }
};

const decodeInviteCodeParts = (inviteCode) => {
  if (typeof inviteCode !== 'string') return null;
  const raw = inviteCode.trim();
  const code = raw.startsWith('TCINV-') ? raw.slice(6) : raw;
  const [payloadB64, sigB64] = code.split('.');
  if (!payloadB64 || !sigB64) return null;

  const payloadBytes = base64UrlToBytes(payloadB64);
  if (!payloadBytes) return null;

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch {
    return null;
  }

  return { payloadB64, sigB64, payload, normalizedCode: `TCINV-${payloadB64}.${sigB64}` };
};

const MAX_OFFLINE_QUEUE_SIZE = 200; // 每个设备最大离线消息数
const LONG_POLL_TIMEOUT_MS = 25000; // 长轮询超时时间

export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
    this.inviteKeyPromise = null;
    this.dmLastSender = new Map();
    this.dmUnlocked = new Set();
    this.dmPairByGroup = new Map();
    this.deviceSessions = new Map();
    this.contactRequests = new Map();
    this.contactsSchemaReady = false;
    this.offlineSchemaReady = false;
    this.offlineLoaded = false;
    this.pubKeySchemaReady = false;
    this.groupMetaById = new Map();
    this.groupMetaLoaded = false;
    this.inviteRecordsById = new Map();
    this.inviteRecordsLoaded = false;
    this.groupInviteApprovals = new Map();
    this.groupJoinApprovals = new Map();
    this.directRequests = new Map();
    // 离线消息队列：deviceFingerprint -> [{ id, data, ts }]
    this.offlineQueues = new Map();
    // HTTP 长轮询等待队列：sessionId -> { resolve, timer, fingerprint }
    this.pollWaiters = new Map();
    // HTTP 会话映射：sessionId -> { fingerprint, uid }
    this.httpSessions = new Map();
    // 全局消息序列号
    this.globalMsgSeq = 0;
  }

  async fetch(request) {
    const url = new URL(request.url);

    // DO 唤醒时从 D1 加载离线消息（仅首次）
    if (!this.offlineLoaded) {
      this.offlineLoaded = true;
      this.loadOfflineMessagesFromD1().catch(() => {});
    }

    // 短邀请码解析
    if (url.pathname === '/api/invite-resolve') {
      const shortCode = sanitizeShortInviteCode(url.searchParams.get('code') || url.searchParams.get('s'));
      if (!shortCode) {
        return new Response(JSON.stringify({ ok: false, error: 'INVALID_SHORT_CODE' }), { status: 400, headers: jsonHeaders });
      }
      const resolved = await this.resolveShortInvite(shortCode);
      if (!resolved) {
        return new Response(JSON.stringify({ ok: false, error: 'INVITE_NOT_FOUND' }), { status: 404, headers: jsonHeaders });
      }
      return new Response(JSON.stringify({ ok: true, ...resolved }), { status: 200, headers: jsonHeaders });
    }

    // HTTP 长轮询接收端点
    if (url.pathname === '/api/poll' && request.method === 'GET') {
      return this.handleLongPoll(request);
    }

    // HTTP 发送端点（长轮询模式下发送消息）
    if (url.pathname === '/api/send' && request.method === 'POST') {
      return this.handleHttpSend(request);
    }

    // 查询群组成员公钥（支持离线成员消息加密）
    if (url.pathname === '/api/group-public-keys' && request.method === 'GET') {
      const groupId = sanitizeGroupId(url.searchParams.get('groupId'));
      if (!groupId) {
        return new Response(JSON.stringify({ ok: false, error: 'MISSING_GROUP_ID' }), { status: 400, headers: jsonHeaders });
      }
      const publicKeys = await this.getGroupPublicKeys(groupId);
      return new Response(JSON.stringify({ ok: true, groupId, publicKeys }), { status: 200, headers: jsonHeaders });
    }

    // WebSocket 连接
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected websocket', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    await this.handleSession(server, request);
    return new Response(null, { status: 101, webSocket: client });
  }

  /**
   * HTTP 长轮询接收端点
   * 客户端发送 GET /api/poll?sid=xxx&after=lastMsgId
   * 服务端持有连接直到有新消息或超时
   */
  async handleLongPoll(request) {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sid') || '';
    const afterMsgId = url.searchParams.get('after') || '';

    // 生成或恢复 session
    let sessionInfo = sessionId ? this.httpSessions.get(sessionId) : null;
    let sid = sessionId;

    if (!sessionInfo) {
      // 新的 HTTP 会话，需要创建绑定身份
      sid = randomHex(16);
      const uid = crypto.randomUUID().split('-')[0];
      const powNonce = randomHex(10);

      sessionInfo = {
        uid,
        fingerprint: '',
        verified: false,
        pow: {
          uid,
          nonce: powNonce,
          difficulty: POW_DIFFICULTY,
          verified: false,
        },
        groups: new Set([SYSTEM_GROUP, SYSTEM_NOTICE_GROUP]),
        nickname: '',
        identitySign: '',
        identityDh: '',
        identitySig: '',
        publicKey: null,
        ip: request.headers.get('cf-connecting-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || '',
        os: getOsFromUserAgent(request.headers.get('user-agent') || ''),
        location: formatLocation(request.cf),
        dmContactsOnly: true,
        rateBuckets: { chat: [], image: [], join: [], invite: [], invalid: [] },
        deviceFingerprint: '',
        deviceBound: false,
      };

      this.httpSessions.set(sid, sessionInfo);

      // 发送身份信息
      return new Response(JSON.stringify({
        sessionId: sid,
        messages: [{
          id: String(++this.globalMsgSeq),
          data: {
            type: 'identity',
            uid,
            powUid: uid,
            powNonce,
            powDifficulty: POW_DIFFICULTY,
            httpMode: true,
          },
        }],
      }), { status: 200, headers: jsonHeaders });
    }

    // 检查离线队列中是否有待发消息
    const fingerprint = sessionInfo.fingerprint;
    const pending = fingerprint ? this.getQueuedMessages(fingerprint, afterMsgId) : [];

    if (pending.length > 0) {
      return new Response(JSON.stringify({
        sessionId: sid,
        messages: pending,
      }), { status: 200, headers: jsonHeaders });
    }

    // 没有待发消息，进入长轮询等待
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pollWaiters.delete(sid);
        resolve(new Response(JSON.stringify({
          sessionId: sid,
          messages: [],
        }), { status: 200, headers: jsonHeaders }));
      }, LONG_POLL_TIMEOUT_MS);

      this.pollWaiters.set(sid, {
        resolve: (messages) => {
          clearTimeout(timer);
          this.pollWaiters.delete(sid);
          resolve(new Response(JSON.stringify({
            sessionId: sid,
            messages,
          }), { status: 200, headers: jsonHeaders }));
        },
        timer,
        fingerprint,
      });
    });
  }

  /**
   * HTTP 发送端点
   * 客户端发送 POST /api/send { sessionId, data }
   */
  async handleHttpSend(request) {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'INVALID_JSON' }), { status: 400, headers: jsonHeaders });
    }

    const sessionId = body.sessionId;
    const data = body.data;

    if (!sessionId || !data || typeof data !== 'object') {
      return new Response(JSON.stringify({ ok: false, error: 'MISSING_FIELDS' }), { status: 400, headers: jsonHeaders });
    }

    const sessionInfo = this.httpSessions.get(sessionId);
    if (!sessionInfo) {
      return new Response(JSON.stringify({ ok: false, error: 'SESSION_EXPIRED' }), { status: 401, headers: jsonHeaders });
    }

    // 创建一个伪 WebSocket 对象来复用现有的消息处理逻辑
    const mockWs = {
      _httpSession: true,
      _sessionId: sessionId,
      _messages: [],
      send: (msg) => {
        // 将响应消息加入长轮询等待者或离线队列
        const parsed = typeof msg === 'string' ? JSON.parse(msg) : msg;
        this.deliverToHttpSession(sessionId, parsed);
      },
      close: () => {
        this.httpSessions.delete(sessionId);
        const waiter = this.pollWaiters.get(sessionId);
        if (waiter) {
          clearTimeout(waiter.timer);
          waiter.resolve([]);
        }
      },
    };

    // 将 sessionInfo 注册为 "session" 以便 handleMessage 处理
    const wsKey = `http:${sessionId}`;
    if (!this.sessions.has(wsKey)) {
      this.sessions.set(wsKey, sessionInfo);
    }

    try {
      await this.handleMessage(wsKey, data);
    } catch (e) {
      // no-op
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: jsonHeaders });
  }

  /**
   * 将消息投递到 HTTP 会话
   */
  deliverToHttpSession(sessionId, message) {
    const msgEntry = {
      id: String(++this.globalMsgSeq),
      data: message,
    };

    const waiter = this.pollWaiters.get(sessionId);
    if (waiter) {
      waiter.resolve([msgEntry]);
      return;
    }

    // 没有等待的长轮询，加入离线队列
    const sessionInfo = this.httpSessions.get(sessionId);
    if (sessionInfo && sessionInfo.fingerprint) {
      this.enqueueOfflineMessage(sessionInfo.fingerprint, msgEntry);
    }
  }

  /**
   * 将消息加入离线队列（内存 + D1 持久化）
   */
  enqueueOfflineMessage(fingerprint, msgEntry) {
    if (!fingerprint) return;
    let queue = this.offlineQueues.get(fingerprint);
    if (!queue) {
      queue = [];
      this.offlineQueues.set(fingerprint, queue);
    }
    queue.push(msgEntry);
    // 限制队列大小
    if (queue.length > MAX_OFFLINE_QUEUE_SIZE) {
      queue.splice(0, queue.length - MAX_OFFLINE_QUEUE_SIZE);
    }
    // D1 持久化（fire-and-forget，不阻塞调用链）
    this._persistOfflineMessage(fingerprint, msgEntry);
  }

  /**
   * 将离线消息写入 D1
   */
  async _persistOfflineMessage(fingerprint, msgEntry) {
    if (!this.env.DB || typeof this.env.DB.prepare !== 'function') return;
    try {
      await this.ensureOfflineSchema();
      await this.env.DB.prepare(
        'INSERT INTO offline_messages (target_fp, msg_id, payload, created_at) VALUES (?, ?, ?, ?)'
      ).bind(fingerprint, msgEntry.id, JSON.stringify(msgEntry.data), Date.now()).run();
    } catch (e) {
      console.warn('[OfflineQueue] D1 persist failed:', e.message);
    }
  }

  /**
   * 获取离线队列中 afterMsgId 之后的消息（内存 + D1 清理）
   */
  getQueuedMessages(fingerprint, afterMsgId) {
    if (!fingerprint) return [];
    const queue = this.offlineQueues.get(fingerprint);
    if (!queue || queue.length === 0) return [];

    let msgs;
    if (!afterMsgId) {
      msgs = [...queue];
      queue.length = 0;
    } else {
      const idx = queue.findIndex((m) => m.id > afterMsgId);
      if (idx === -1) return [];
      msgs = queue.slice(idx);
      queue.splice(0, idx + msgs.length);
    }

    // D1 清理已投递的消息（fire-and-forget）
    if (msgs.length > 0) {
      this._deleteDeliveredMessages(fingerprint, msgs);
    }
    return msgs;
  }

  /**
   * 从 D1 删除已投递的离线消息
   */
  async _deleteDeliveredMessages(fingerprint, msgs) {
    if (!this.env.DB || typeof this.env.DB.prepare !== 'function') return;
    try {
      await this.ensureOfflineSchema();
      const msgIds = msgs.map(m => m.id);
      // D1 不支持 IN (?) 数组绑定，逐条删除（批量通常 < 200）
      for (const msgId of msgIds) {
        await this.env.DB.prepare(
          'DELETE FROM offline_messages WHERE target_fp = ? AND msg_id = ?'
        ).bind(fingerprint, msgId).run();
      }
    } catch (e) {
      console.warn('[OfflineQueue] D1 delete failed:', e.message);
    }
  }

  async handleSession(ws, request) {
    ws.accept();

    const uid = crypto.randomUUID().split('-')[0];
    const powNonce = randomHex(10);

    this.sessions.set(ws, {
      uid,
      ip: request.headers.get('cf-connecting-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || '',
      publicKey: null,
      identitySign: '',
      identityDh: '',
      identitySig: '',
      deviceFingerprint: '',
      deviceBound: false,
      nickname: '',
      dmContactsOnly: true,
      os: getOsFromUserAgent(request.headers.get('user-agent') || ''),
      location: formatLocation(request.cf),
      groups: new Set([SYSTEM_GROUP, SYSTEM_NOTICE_GROUP]),
      rateBuckets: {
        chat: [],
        image: [],
        join: [],
        invite: [],
        invalid: [],
      },
      pow: {
        uid,
        nonce: powNonce,
        difficulty: POW_DIFFICULTY,
        verified: false,
      },
    });

    this.sendTo(ws, {
      type: 'identity',
      uid,
      powUid: uid,
      powNonce,
      powDifficulty: POW_DIFFICULTY,
    });

    this.broadcastSystemStatus();
    void this.logAction('CONNECT', `uid=${uid}`);

    ws.onmessage = async (msg) => {
      const data = safeParseJson(msg?.data);
      if (!data || typeof data.type !== 'string') {
        this.handleInvalidAction(ws, 'INVALID_JSON', 'Invalid websocket payload');
        return;
      }
      await this.handleMessage(ws, data);
    };

    ws.onclose = () => {
      const session = this.sessions.get(ws);
      if (session) {
        void this.logAction('DISCONNECT', `uid=${session.uid}`);
        if (session.deviceFingerprint && this.deviceSessions.get(session.deviceFingerprint) === ws) {
          this.deviceSessions.delete(session.deviceFingerprint);
        }
      }
      this.sessions.delete(ws);
      this.broadcastSystemStatus();
    };
  }

  sendTo(ws, payload) {
    // 处理 HTTP 会话的响应
    if (ws && ws._httpSession) {
      this.deliverToHttpSession(ws._sessionId, payload);
      return;
    }
    // 处理 HTTP session key 格式 "http:xxx"
    if (typeof ws === 'string' && ws.startsWith('http:')) {
      const sessionId = ws.slice(5);
      this.deliverToHttpSession(sessionId, payload);
      return;
    }
    try {
      ws.send(JSON.stringify(payload));
    } catch {
      // no-op — 可能连接已断开
    }
  }

  /**
   * 发送消息到指定用户，支持离线投递
   */
  sendToUser(targetUid, payload, targetFingerprint) {
    // 先尝试找到在线 WebSocket 连接
    const targetWs = this.findWsByUid(targetUid);
    if (targetWs) {
      this.sendTo(targetWs, payload);
      return true;
    }

    // 用户不在线，尝试 HTTP 长轮询投递
    for (const [sid, info] of this.httpSessions.entries()) {
      if (info.uid === targetUid || info.fingerprint === targetFingerprint) {
        this.deliverToHttpSession(sid, {
          id: String(++this.globalMsgSeq),
          data: payload,
        });
        return true;
      }
    }

    // 最后加入离线队列
    if (targetFingerprint) {
      this.enqueueOfflineMessage(targetFingerprint, {
        id: String(++this.globalMsgSeq),
        data: payload,
      });
    }
    return false;
  }

  sendError(ws, code, message, reqId = null) {
    this.sendTo(ws, { type: 'error', code, message, reqId });
  }

  getWindowConfig(kind) {
    switch (kind) {
      case 'chat':
        return { windowMs: 10_000, maxCount: MAX_CHAT_PER_10S };
      case 'image':
        return { windowMs: 60_000, maxCount: MAX_IMAGE_PER_60S };
      case 'join':
        return { windowMs: 60_000, maxCount: MAX_JOIN_PER_MIN };
      case 'invite':
        return { windowMs: 60_000, maxCount: MAX_INVITE_PER_MIN };
      default:
        return { windowMs: 60_000, maxCount: MAX_INVALID_ACTION_PER_MIN };
    }
  }

  allowRate(session, kind) {
    const now = Date.now();
    const bucket = session.rateBuckets[kind] || session.rateBuckets.invalid;
    const { windowMs, maxCount } = this.getWindowConfig(kind);

    while (bucket.length && now - bucket[0] > windowMs) {
      bucket.shift();
    }
    if (bucket.length >= maxCount) {
      return false;
    }

    bucket.push(now);
    return true;
  }

  handleInvalidAction(ws, code, message, reqId = null) {
    const session = this.sessions.get(ws);
    if (!session) return;

    const allowed = this.allowRate(session, 'invalid');
    this.sendError(ws, code, message, reqId);

    if (!allowed) {
      this.sendError(ws, 'ANTI_BOT_BLOCK', 'Too many invalid actions, connection closed');
      try {
        ws.close(1008, 'Policy violation');
      } catch {
        // no-op
      }
      this.sessions.delete(ws);
      this.broadcastSystemStatus();
    }
  }

  findWsByUid(uid) {
    for (const [ws, info] of this.sessions.entries()) {
      if (info.uid === uid) return ws;
    }
    return null;
  }

  findSessionByFingerprint(fingerprint) {
    if (!fingerprint) return null;
    for (const info of this.sessions.values()) {
      if (info.deviceFingerprint === fingerprint && info.deviceBound) return info;
    }
    return null;
  }

  findWsByFingerprint(fingerprint) {
    if (!fingerprint) return null;
    for (const [ws, info] of this.sessions.entries()) {
      if (info.deviceFingerprint === fingerprint && info.deviceBound) return ws;
    }
    return null;
  }

  requireDeviceBound(ws, sender, reqId) {
    if (!sender.deviceBound || !sender.deviceFingerprint) {
      this.sendError(ws, 'DEVICE_BIND_REQUIRED', 'Bind device before using contacts', reqId);
      return false;
    }
    return true;
  }

  async ensureContactsSchema() {
    if (this.contactsSchemaReady || !this.env.DB || typeof this.env.DB.prepare !== 'function') return;
    try {
      await this.env.DB.prepare(
        'CREATE TABLE IF NOT EXISTS contacts (device_fp TEXT NOT NULL, contact_fp TEXT NOT NULL, alias TEXT DEFAULT \'\', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (device_fp, contact_fp))'
      ).run();
      await this.env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_contacts_device ON contacts (device_fp)'
      ).run();
      await this.env.DB.prepare(
        'CREATE TABLE IF NOT EXISTS contact_migrations (code TEXT PRIMARY KEY, new_device_fp TEXT NOT NULL, old_device_fp TEXT, created_at INTEGER NOT NULL, status TEXT NOT NULL, transfer_nickname INTEGER NOT NULL DEFAULT 1)'
      ).run();
      await this.env.DB.prepare(
        'CREATE TABLE IF NOT EXISTS device_nicknames (nickname TEXT PRIMARY KEY, device_fp TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)'
      ).run();
      await this.env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_device_nicknames_fp ON device_nicknames (device_fp)'
      ).run();
      await this.env.DB.prepare(
        'CREATE TABLE IF NOT EXISTS group_memberships (device_fp TEXT NOT NULL, group_id TEXT NOT NULL, joined_at INTEGER NOT NULL, PRIMARY KEY (device_fp, group_id))'
      ).run();
      await this.env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_group_memberships_group ON group_memberships (group_id)'
      ).run();
      try {
        await this.env.DB.prepare(
          'ALTER TABLE contact_migrations ADD COLUMN transfer_nickname INTEGER NOT NULL DEFAULT 1'
        ).run();
      } catch {
        // old schema already has this column
      }
      this.contactsSchemaReady = true;
    } catch {
      // no-op
    }
  }

  /**
   * 确保离线消息 D1 表存在
   */
  async ensureOfflineSchema() {
    if (this.offlineSchemaReady || !this.env.DB || typeof this.env.DB.prepare !== 'function') return;
    try {
      await this.env.DB.prepare(
        'CREATE TABLE IF NOT EXISTS offline_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, target_fp TEXT NOT NULL, msg_id TEXT NOT NULL, payload TEXT NOT NULL, created_at INTEGER NOT NULL)'
      ).run();
      await this.env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_offline_msgs_target ON offline_messages (target_fp, msg_id)'
      ).run();
      await this.env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_offline_msgs_created ON offline_messages (created_at)'
      ).run();
      this.offlineSchemaReady = true;
    } catch {
      // no-op
    }
  }

  /**
   * 从 D1 加载离线消息到内存队列（DO 唤醒时调用）
   */
  async loadOfflineMessagesFromD1() {
    if (!this.env.DB || typeof this.env.DB.prepare !== 'function') return;
    await this.ensureOfflineSchema();
    try {
      const rows = await this.env.DB.prepare(
        'SELECT id, target_fp, msg_id, payload FROM offline_messages ORDER BY target_fp, msg_id ASC'
      ).all();
      if (!rows.results || rows.results.length === 0) return;
      for (const row of rows.results) {
        let data;
        try { data = JSON.parse(row.payload); } catch { continue; }
        let queue = this.offlineQueues.get(row.target_fp);
        if (!queue) { queue = []; this.offlineQueues.set(row.target_fp, queue); }
        // 避免重复（基于 msg_id）
        if (!queue.some(m => m.id === row.msg_id)) {
          queue.push({ id: row.msg_id, data, _d1Id: row.id });
        }
      }
      // 清理 7 天前的过期消息
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      await this.env.DB.prepare(
        'DELETE FROM offline_messages WHERE created_at < ?'
      ).bind(cutoff).run();
    } catch (e) {
      console.warn('[OfflineQueue] Failed to load from D1:', e.message);
    }
  }

  /**
   * 确保公钥 D1 表存在
   */
  async ensurePublicKeysSchema() {
    if (this.pubKeySchemaReady || !this.env.DB || typeof this.env.DB.prepare !== 'function') return;
    try {
      await this.env.DB.prepare(
        'CREATE TABLE IF NOT EXISTS device_public_keys (device_fp TEXT PRIMARY KEY, public_key TEXT NOT NULL, updated_at INTEGER NOT NULL)'
      ).run();
      this.pubKeySchemaReady = true;
    } catch {
      // no-op
    }
  }

  /**
   * 持久化设备公钥到 D1
   */
  async persistPublicKey(deviceFp, publicKey) {
    if (!deviceFp || !publicKey || !this.env.DB || typeof this.env.DB.prepare !== 'function') return;
    try {
      await this.ensurePublicKeysSchema();
      await this.env.DB.prepare(
        'INSERT INTO device_public_keys (device_fp, public_key, updated_at) VALUES (?, ?, ?) ON CONFLICT(device_fp) DO UPDATE SET public_key = excluded.public_key, updated_at = excluded.updated_at'
      ).bind(deviceFp, publicKey, Date.now()).run();
    } catch (e) {
      console.warn('[PublicKeys] D1 persist failed:', e.message);
    }
  }

  /**
   * 获取群组所有成员的公钥（在线从内存，离线从 D1）
   */
  async getGroupPublicKeys(groupId) {
    const result = {};
    // 在线成员：直接从 session 取
    for (const session of this.sessions.values()) {
      if (session.groups?.has(groupId) && session.publicKey && session.uid) {
        result[session.uid] = session.publicKey;
      }
    }
    // 全量成员（含离线）：从 D1 取
    if (!this.env.DB || typeof this.env.DB.prepare !== 'function') return result;
    try {
      await this.ensureContactsSchema();
      await this.ensurePublicKeysSchema();
      const fps = await this.getPersistedGroupMemberIds(groupId);
      if (!fps.length) return result;
      for (const fp of fps) {
        if (Object.values(result).length > 0) {
          // 跳过已有在线公钥的
          const onlineFp = [...this.sessions.values()].find(s => s.deviceFingerprint === fp);
          if (onlineFp) continue;
        }
        const row = await this.env.DB.prepare(
          'SELECT public_key FROM device_public_keys WHERE device_fp = ?'
        ).bind(fp).first();
        if (row?.public_key) {
          // 用 deviceFp 作为 uid（离线成员的 uid 即其 deviceFingerprint）
          result[fp] = row.public_key;
        }
      }
    } catch (e) {
      console.warn('[PublicKeys] getGroupPublicKeys failed:', e.message);
    }
    return result;
  }

  async hasContactEntry(deviceFp, contactFp) {
    if (!deviceFp || !contactFp) return false;
    if (!this.env.DB || typeof this.env.DB.prepare !== 'function') return false;
    await this.ensureContactsSchema();
    try {
      const row = await this.env.DB.prepare(
        'SELECT 1 AS ok FROM contacts WHERE device_fp = ? AND contact_fp = ? LIMIT 1'
      )
        .bind(deviceFp, contactFp)
        .first();
      return Boolean(row && row.ok === 1);
    } catch {
      return false;
    }
  }

  async getContactFingerprintSet(deviceFp) {
    if (!deviceFp) return new Set();
    if (!this.env.DB || typeof this.env.DB.prepare !== 'function') return new Set();
    await this.ensureContactsSchema();
    try {
      const res = await this.env.DB.prepare(
        'SELECT contact_fp FROM contacts WHERE device_fp = ?'
      )
        .bind(deviceFp)
        .all();
      return new Set((res.results || []).map((row) => row.contact_fp).filter(Boolean));
    } catch {
      return new Set();
    }
  }

  async getContactMapForDevices(deviceFps) {
    const valid = Array.from(new Set((deviceFps || []).filter(Boolean)));
    const out = new Map();
    for (const fp of valid) out.set(fp, new Set());
    if (!valid.length || !this.env.DB || typeof this.env.DB.prepare !== 'function') {
      return out;
    }
    await this.ensureContactsSchema();
    try {
      const placeholders = valid.map(() => '?').join(',');
      const res = await this.env.DB.prepare(
        `SELECT device_fp, contact_fp FROM contacts WHERE device_fp IN (${placeholders})`
      )
        .bind(...valid)
        .all();
      for (const row of res.results || []) {
        const deviceFp = row.device_fp;
        const contactFp = row.contact_fp;
        if (!deviceFp || !contactFp) continue;
        if (!out.has(deviceFp)) out.set(deviceFp, new Set());
        out.get(deviceFp).add(contactFp);
      }
    } catch {
      // no-op
    }
    return out;
  }

  async getDmPreference(deviceFp) {
    if (!deviceFp) return { contactsOnly: true };
    try {
      const raw = await this.state.storage.get(`dm_pref:${deviceFp}`);
      return { contactsOnly: raw?.contactsOnly !== false };
    } catch {
      return { contactsOnly: true };
    }
  }

  async saveDmPreference(deviceFp, pref) {
    if (!deviceFp) return { contactsOnly: true };
    const normalized = { contactsOnly: pref?.contactsOnly !== false };
    try {
      await this.state.storage.put(`dm_pref:${deviceFp}`, normalized);
    } catch {
      // no-op
    }
    return normalized;
  }

  sendDmPreferenceState(ws, contactsOnly = true, reqId = null) {
    this.sendTo(ws, {
      type: 'dm_pref_state',
      contactsOnly: contactsOnly !== false,
      reqId,
    });
  }

  async getDeviceNickname(deviceFp) {
    if (!deviceFp) return '';
    if (!this.env.DB || typeof this.env.DB.prepare !== 'function') return '';
    await this.ensureContactsSchema();
    try {
      const row = await this.env.DB.prepare(
        'SELECT nickname FROM device_nicknames WHERE device_fp = ? LIMIT 1'
      )
        .bind(deviceFp)
        .first();
      return typeof row?.nickname === 'string' ? row.nickname : '';
    } catch {
      return '';
    }
  }

  async getDeviceNicknames(deviceFps = []) {
    const fps = Array.from(new Set((Array.isArray(deviceFps) ? deviceFps : []).filter(Boolean)));
    const out = new Map();
    if (!fps.length) return out;
    if (!this.env.DB || typeof this.env.DB.prepare !== 'function') return out;
    await this.ensureContactsSchema();
    try {
      const placeholders = fps.map(() => '?').join(',');
      const res = await this.env.DB.prepare(
        `SELECT device_fp, nickname FROM device_nicknames WHERE device_fp IN (${placeholders})`
      )
        .bind(...fps)
        .all();
      for (const row of res.results || []) {
        if (row?.device_fp && typeof row.nickname === 'string') {
          out.set(row.device_fp, row.nickname);
        }
      }
    } catch {
      return out;
    }
    return out;
  }

  sendNicknameState(ws, nickname = '', reqId = null) {
    this.sendTo(ws, {
      type: 'nickname_state',
      nickname: typeof nickname === 'string' ? nickname : '',
      reqId,
    });
  }

  async ensureDeviceNickname(deviceFp) {
    if (!deviceFp) return '';
    if (!this.env.DB || typeof this.env.DB.prepare !== 'function') return '';
    await this.ensureContactsSchema();

    const existing = await this.getDeviceNickname(deviceFp);
    if (existing) return existing;

    const now = Date.now();
    for (let attempt = 0; attempt < 32; attempt += 1) {
      const nickname = createFriendlyNicknameCandidate();
      try {
        await this.env.DB.prepare(
          'INSERT INTO device_nicknames (nickname, device_fp, created_at, updated_at) VALUES (?, ?, ?, ?)'
        )
          .bind(nickname, deviceFp, now, now)
          .run();
        return nickname;
      } catch {
        // Retry on nickname collision.
      }
    }

    return '';
  }

  async transferDeviceNickname(oldDeviceFp, newDeviceFp) {
    if (!oldDeviceFp || !newDeviceFp) return '';
    if (!this.env.DB || typeof this.env.DB.prepare !== 'function') return '';
    await this.ensureContactsSchema();
    try {
      const row = await this.env.DB.prepare(
        'SELECT nickname FROM device_nicknames WHERE device_fp = ? LIMIT 1'
      )
        .bind(oldDeviceFp)
        .first();
      const nickname = typeof row?.nickname === 'string' ? row.nickname : '';
      if (!nickname) return '';

      await this.env.DB.prepare('DELETE FROM device_nicknames WHERE device_fp = ?')
        .bind(newDeviceFp)
        .run();
      await this.env.DB.prepare(
        'UPDATE device_nicknames SET device_fp = ?, updated_at = ? WHERE device_fp = ?'
      )
        .bind(newDeviceFp, Date.now(), oldDeviceFp)
        .run();
      return nickname;
    } catch {
      return '';
    }
  }

  async ensureGroupMetaLoaded() {
    if (this.groupMetaLoaded) return;
    try {
      const raw = await this.state.storage.get('group_meta_v1');
      if (raw && typeof raw === 'object') {
        for (const [groupId, meta] of Object.entries(raw)) {
          const gid = sanitizeGroupId(groupId);
          if (!gid || !meta || typeof meta !== 'object') continue;
          this.groupMetaById.set(gid, {
            groupId: gid,
            name: sanitizeGroupName(meta.name) || gid,
            ownerUid: sanitizeDeviceFingerprint(meta.ownerUid) || '',
            announcement: sanitizeOptionalText(meta.announcement, GROUP_ANNOUNCEMENT_MAX),
            inviteApprovalRequired: meta.inviteApprovalRequired !== false,
            createdAt: Number(meta.createdAt) || Date.now(),
            updatedAt: Number(meta.updatedAt) || Date.now(),
          });
        }
      }
    } catch {
      // no-op
    } finally {
      this.groupMetaLoaded = true;
    }
  }

  async persistGroupMeta() {
    const out = {};
    for (const [groupId, meta] of this.groupMetaById.entries()) {
      out[groupId] = {
        name: meta.name || groupId,
        ownerUid: meta.ownerUid || '',
        announcement: sanitizeOptionalText(meta.announcement, GROUP_ANNOUNCEMENT_MAX),
        inviteApprovalRequired: meta.inviteApprovalRequired !== false,
        createdAt: meta.createdAt || Date.now(),
        updatedAt: meta.updatedAt || Date.now(),
      };
    }
    try {
      await this.state.storage.put('group_meta_v1', out);
    } catch {
      // no-op
    }
  }

  async getOrInitGroupMeta(groupId, sender, preferredName = '') {
    await this.ensureGroupMetaLoaded();
    let meta = this.groupMetaById.get(groupId);
    if (!meta) {
      const now = Date.now();
      const fallback = defaultGroupNameForSender(sender, groupId);
      meta = {
        groupId,
        name: sanitizeGroupName(preferredName) || fallback,
        ownerUid: sender?.uid || '',
        announcement: '',
        inviteApprovalRequired: true,
        createdAt: now,
        updatedAt: now,
      };
      this.groupMetaById.set(groupId, meta);
      await this.persistGroupMeta();
    }
    return meta;
  }

  async getGroupMeta(groupId) {
    await this.ensureGroupMetaLoaded();
    return this.groupMetaById.get(groupId) || null;
  }

  async ensureInviteRecordsLoaded() {
    if (this.inviteRecordsLoaded) return;
    try {
      const raw = await this.state.storage.get('group_invites_v1');
      if (raw && typeof raw === 'object') {
        for (const [inviteId, record] of Object.entries(raw)) {
          const groupId = sanitizeGroupId(record?.groupId);
          const shortCode = sanitizeShortInviteCode(record?.shortCode);
          if (!inviteId || !groupId || !shortCode) continue;
          this.inviteRecordsById.set(inviteId, {
            inviteId,
            groupId,
            inviteCode: typeof record?.inviteCode === 'string' ? record.inviteCode : '',
            shortCode,
            creatorUid: sanitizeText(record?.creatorUid, 80) || '',
            creatorNickname: sanitizeOptionalText(record?.creatorNickname, NICKNAME_MAX),
            creatorStatement: sanitizeOptionalText(record?.creatorStatement, 180),
            createdAt: Number(record?.createdAt) || Date.now(),
            updatedAt: Number(record?.updatedAt) || Date.now(),
            expiresAt: Number(record?.expiresAt) || 0,
            maxUses: sanitizeInviteMaxUses(record?.maxUses),
            usedCount: Math.max(0, Math.floor(Number(record?.usedCount) || 0)),
            pendingCount: Math.max(0, Math.floor(Number(record?.pendingCount) || 0)),
            revokedAt: Math.max(0, Math.floor(Number(record?.revokedAt) || 0)),
          });
        }
      }
    } catch {
      // no-op
    } finally {
      this.inviteRecordsLoaded = true;
    }
  }

  async persistInviteRecords() {
    const out = {};
    for (const [inviteId, record] of this.inviteRecordsById.entries()) {
      out[inviteId] = {
        inviteId,
        groupId: record.groupId || '',
        inviteCode: record.inviteCode || '',
        shortCode: record.shortCode || '',
        creatorUid: record.creatorUid || '',
        creatorNickname: record.creatorNickname || '',
        creatorStatement: record.creatorStatement || '',
        createdAt: record.createdAt || Date.now(),
        updatedAt: record.updatedAt || Date.now(),
        expiresAt: record.expiresAt || 0,
        maxUses: sanitizeInviteMaxUses(record.maxUses),
        usedCount: Math.max(0, Math.floor(Number(record.usedCount) || 0)),
        pendingCount: Math.max(0, Math.floor(Number(record.pendingCount) || 0)),
        revokedAt: Math.max(0, Math.floor(Number(record.revokedAt) || 0)),
      };
    }
    try {
      await this.state.storage.put('group_invites_v1', out);
    } catch {
      // no-op
    }
  }

  isInviteRecordActive(record, now = Date.now()) {
    return Boolean(record && !record.revokedAt && record.expiresAt > now);
  }

  async getInviteRecordById(inviteId) {
    await this.ensureInviteRecordsLoaded();
    return this.inviteRecordsById.get(inviteId) || null;
  }

  async getInviteRecordByShortCode(shortCode) {
    const code = sanitizeShortInviteCode(shortCode);
    if (!code) return null;
    await this.ensureInviteRecordsLoaded();
    for (const record of this.inviteRecordsById.values()) {
      if (record.shortCode === code) return record;
    }
    return null;
  }

  async listGroupInviteRecords(groupId) {
    await this.ensureInviteRecordsLoaded();
    const out = [];
    for (const record of this.inviteRecordsById.values()) {
      if (!record || record.groupId !== groupId) continue;
      out.push(record);
    }
    out.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return out;
  }

  async generateUniqueInviteShortCode() {
    await this.ensureInviteRecordsLoaded();
    for (let attempt = 0; attempt < 32; attempt += 1) {
      const code = randomShortCode();
      if (!Array.from(this.inviteRecordsById.values()).some((record) => record.shortCode === code)) {
        return code;
      }
    }
    return `${randomShortCode(6)}${Date.now().toString(36).slice(-2)}`;
  }

  async reserveInviteUse(inviteId) {
    const record = await this.getInviteRecordById(inviteId);
    if (!record || !this.isInviteRecordActive(record)) return null;
    if (record.maxUses > 0 && (record.usedCount + record.pendingCount) >= record.maxUses) return null;
    record.pendingCount += 1;
    record.updatedAt = Date.now();
    await this.persistInviteRecords();
    return record;
  }

  async releaseInviteReservation(inviteId) {
    const record = await this.getInviteRecordById(inviteId);
    if (!record) return;
    if (record.pendingCount > 0) {
      record.pendingCount -= 1;
      record.updatedAt = Date.now();
      await this.persistInviteRecords();
    }
  }

  async consumeReservedInviteUse(inviteId) {
    const record = await this.getInviteRecordById(inviteId);
    if (!record || !this.isInviteRecordActive(record)) return null;
    if (record.pendingCount > 0) {
      record.pendingCount -= 1;
    }
    if (record.maxUses > 0 && record.usedCount >= record.maxUses) {
      await this.persistInviteRecords();
      return null;
    }
    record.usedCount += 1;
    record.updatedAt = Date.now();
    await this.persistInviteRecords();
    return record;
  }

  async consumeInviteUse(inviteId) {
    const record = await this.getInviteRecordById(inviteId);
    if (!record || !this.isInviteRecordActive(record)) return null;
    if (record.maxUses > 0 && (record.usedCount + record.pendingCount) >= record.maxUses) return null;
    record.usedCount += 1;
    record.updatedAt = Date.now();
    await this.persistInviteRecords();
    return record;
  }

  async revokeInviteRecord(inviteId) {
    const record = await this.getInviteRecordById(inviteId);
    if (!record) return null;
    record.revokedAt = Date.now();
    record.pendingCount = 0;
    record.updatedAt = Date.now();
    await this.persistInviteRecords();
    return record;
  }

  async saveGroupMembership(deviceFp, groupId) {
    if (!deviceFp || !groupId || !this.env.DB || typeof this.env.DB.prepare !== 'function') return;
    if (groupId === SYSTEM_GROUP || groupId === SYSTEM_NOTICE_GROUP || isDirectGroupId(groupId)) return;
    await this.ensureContactsSchema();
    try {
      await this.env.DB.prepare(
        'INSERT INTO group_memberships (device_fp, group_id, joined_at) VALUES (?, ?, ?) ON CONFLICT(device_fp, group_id) DO UPDATE SET joined_at = excluded.joined_at'
      )
        .bind(deviceFp, groupId, Date.now())
        .run();
    } catch {
      // no-op
    }
  }

  async removeGroupMembership(deviceFp, groupId) {
    if (!deviceFp || !groupId || !this.env.DB || typeof this.env.DB.prepare !== 'function') return;
    await this.ensureContactsSchema();
    try {
      await this.env.DB.prepare(
        'DELETE FROM group_memberships WHERE device_fp = ? AND group_id = ?'
      )
        .bind(deviceFp, groupId)
        .run();
    } catch {
      // no-op
    }
  }

  async getPersistedGroupIds(deviceFp) {
    if (!deviceFp || !this.env.DB || typeof this.env.DB.prepare !== 'function') return [];
    await this.ensureContactsSchema();
    try {
      const res = await this.env.DB.prepare(
        'SELECT group_id FROM group_memberships WHERE device_fp = ? ORDER BY joined_at ASC'
      )
        .bind(deviceFp)
        .all();
      return (res.results || [])
        .map((row) => sanitizeGroupId(row.group_id))
        .filter((gid) => gid && gid !== SYSTEM_GROUP && gid !== SYSTEM_NOTICE_GROUP && !isDirectGroupId(gid));
    } catch {
      return [];
    }
  }

  async getPersistedGroupMemberIds(groupId) {
    if (!groupId || !this.env.DB || typeof this.env.DB.prepare !== 'function') return [];
    await this.ensureContactsSchema();
    try {
      const res = await this.env.DB.prepare(
        'SELECT device_fp FROM group_memberships WHERE group_id = ? ORDER BY joined_at ASC'
      )
        .bind(groupId)
        .all();
      return (res.results || [])
        .map((row) => sanitizeDeviceFingerprint(row.device_fp))
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  async removeAllGroupMemberships(groupId) {
    if (!groupId || !this.env.DB || typeof this.env.DB.prepare !== 'function') return;
    await this.ensureContactsSchema();
    try {
      await this.env.DB.prepare(
        'DELETE FROM group_memberships WHERE group_id = ?'
      )
        .bind(groupId)
        .run();
    } catch {
      // no-op
    }
  }

  async getOwnedGroupIds(ownerUid) {
    if (!ownerUid) return [];
    await this.ensureGroupMetaLoaded();
    return Array.from(this.groupMetaById.values())
      .map((meta) => {
        if (!meta || meta.ownerUid !== ownerUid) return null;
        return sanitizeGroupId(meta.groupId);
      })
      .filter((gid) => gid && gid !== SYSTEM_GROUP && gid !== SYSTEM_NOTICE_GROUP && !isDirectGroupId(gid));
  }

  async removeInviteRecordsForGroup(groupId) {
    if (!groupId) return;
    await this.ensureInviteRecordsLoaded();
    let changed = false;
    for (const [inviteId, record] of this.inviteRecordsById.entries()) {
      if (!record || record.groupId !== groupId) continue;
      this.inviteRecordsById.delete(inviteId);
      changed = true;
    }
    if (changed) {
      await this.persistInviteRecords();
    }
  }

  async cleanupJoinApprovalsForGroup(groupId) {
    if (!groupId) return;
    for (const [requestId, req] of this.groupJoinApprovals.entries()) {
      if (!req || req.groupId !== groupId) continue;
      if (req.inviteId) {
        await this.releaseInviteReservation(req.inviteId);
      }
      this.groupJoinApprovals.delete(requestId);
    }
  }

  async chooseNextGroupOwner(groupId, currentOwnerUid) {
    const persisted = await this.getPersistedGroupMemberIds(groupId);
    for (const uid of persisted) {
      if (uid && uid !== currentOwnerUid) return uid;
    }
    const online = this.getGroupMembers(groupId)
      .map(({ session }) => sanitizeDeviceFingerprint(session?.uid))
      .filter((uid) => uid && uid !== currentOwnerUid);
    online.sort();
    return online[0] || '';
  }

  buildPendingJoinResultKey(deviceFp, requestId) {
    return `pending_join_result:${deviceFp}:${requestId}`;
  }

  async savePendingJoinResult(deviceFp, payload) {
    const requestId = sanitizeText(payload?.requestId, 80);
    if (!deviceFp || !requestId) return;
    try {
      await this.state.storage.put(
        this.buildPendingJoinResultKey(deviceFp, requestId),
        {
          requestId,
          groupId: sanitizeGroupId(payload?.groupId) || '',
          approved: payload?.approved === true,
          createdAt: Number(payload?.createdAt) || Date.now(),
        }
      );
    } catch {
      // no-op
    }
  }

  async consumePendingJoinResults(deviceFp) {
    if (!deviceFp) return [];
    try {
      const prefix = this.buildPendingJoinResultKey(deviceFp, '');
      const stored = await this.state.storage.list({ prefix });
      const out = [];
      for (const [key, value] of stored.entries()) {
        if (value && typeof value === 'object') {
          out.push({
            requestId: sanitizeText(value.requestId, 80) || '',
            groupId: sanitizeGroupId(value.groupId) || '',
            approved: value.approved === true,
            createdAt: Number(value.createdAt) || 0,
          });
        }
        await this.state.storage.delete(key);
      }
      return out.sort((a, b) => a.createdAt - b.createdAt);
    } catch {
      return [];
    }
  }

  getGroupMembers(groupId) {
    const members = [];
    for (const [ws, session] of this.sessions.entries()) {
      if (!session?.groups?.has(groupId)) continue;
      members.push({ ws, session });
    }
    return members;
  }

  cleanupInviteApprovals() {
    const now = Date.now();
    for (const [requestId, req] of this.groupInviteApprovals.entries()) {
      if (!req || now - req.createdAt > GROUP_INVITE_APPROVAL_TTL_MS) {
        this.groupInviteApprovals.delete(requestId);
      }
    }
  }

  async cleanupJoinApprovals() {
    const now = Date.now();
    for (const [requestId, req] of this.groupJoinApprovals.entries()) {
      if (!req || now - req.createdAt > GROUP_INVITE_APPROVAL_TTL_MS) {
        if (req?.inviteId) {
          await this.releaseInviteReservation(req.inviteId);
        }
        this.groupJoinApprovals.delete(requestId);
      }
    }
  }

  cleanupDirectRequests() {
    const now = Date.now();
    for (const [requestId, req] of this.directRequests.entries()) {
      if (!req || now - req.createdAt > DIRECT_REQUEST_TTL_MS) {
        this.directRequests.delete(requestId);
      }
    }
  }

  notifyPendingDirectRequests(ws, sender) {
    if (!sender?.uid) return;
    this.cleanupDirectRequests();
    for (const req of this.directRequests.values()) {
      if (!req || req.targetUid !== sender.uid) continue;
      this.sendTo(ws, {
        type: 'direct_request',
        requestId: req.requestId,
        groupId: req.groupId,
        fromUid: req.fromUid,
        fromNickname: req.fromNickname || '',
      });
    }
  }

  sendGroupSystemNotice(groupId, payload) {
    const members = this.getGroupMembers(groupId);
    for (const { ws } of members) {
      this.sendTo(ws, { type: 'system_notice', groupId, ...payload });
    }
  }

  sendGroupNoticeToOwner(groupId, ownerUid, payload) {
    if (!groupId || !ownerUid) return;
    const ownerWs = this.findWsByUid(ownerUid);
    if (!ownerWs) return;
    this.sendTo(ownerWs, { type: 'system_notice', groupId, ...payload });
  }

  sendGroupJoined(ws, groupId, meta, reqId = null) {
    const groupName = meta?.name || groupId;
    const ownerUid = meta?.ownerUid || '';
    this.sendTo(ws, {
      type: 'group_joined',
      groupId,
      groupName,
      ownerUid,
      announcement: sanitizeOptionalText(meta?.announcement, GROUP_ANNOUNCEMENT_MAX),
      inviteApprovalRequired: meta?.inviteApprovalRequired === true,
      reqId,
    });
  }

  serializeInviteRecord(record) {
    if (!record) return null;
    return {
      inviteId: record.inviteId || '',
      groupId: record.groupId || '',
      inviteCode: record.inviteCode || '',
      shortCode: record.shortCode || '',
      creatorUid: record.creatorUid || '',
      creatorNickname: record.creatorNickname || '',
      creatorStatement: record.creatorStatement || '',
      createdAt: record.createdAt || 0,
      updatedAt: record.updatedAt || 0,
      expiresAt: record.expiresAt || 0,
      maxUses: record.maxUses || DEFAULT_INVITE_MAX_USES,
      usedCount: record.usedCount || 0,
      pendingCount: record.pendingCount || 0,
      revokedAt: record.revokedAt || 0,
    };
  }

  filterInviteRecordsForViewer(records, viewerUid = '', ownerUid = '') {
    const list = Array.isArray(records) ? records : [];
    if (!viewerUid) return [];
    if (ownerUid && viewerUid === ownerUid) return list;
    return list.filter((record) => record && record.creatorUid === viewerUid);
  }

  sendFirstDeviceGuide(ws, sender) {
    const fpShort = sender?.deviceFingerprint ? sender.deviceFingerprint.slice(0, 10) : '';
    const notices = [
      {
        title: '欢迎来到 LINKCONNECT',
        text: `嗨，${sender?.nickname || `设备 ${fpShort || '新设备'}`}。这里是临时隐私聊天：身份绑定设备，消息默认端到端加密。`,
        actions: [
          { action: 'open_home', label: '去首页' },
          { action: 'open_contacts', label: '看通讯录' },
        ],
      },
      {
        title: '先做这 3 件事',
        text: '1) 调整昵称到你喜欢的样子；2) 加几个联系人避免失联；3) 开启系统通知，消息不漏看。',
        actions: [
          { action: 'open_settings', label: '去设置' },
          { action: 'create_group_modal', label: '创建群聊' },
        ],
      },
    ];
    for (const item of notices) {
      this.sendTo(ws, {
        type: 'system_notice',
        title: item.title,
        text: item.text,
        action: item.action || '',
        actionLabel: item.actionLabel || '',
        actions: Array.isArray(item.actions) ? item.actions : [],
      });
    }
  }


  async groupHasMembers(groupId) {
    for (const session of this.sessions.values()) {
      if (session.groups.has(groupId)) return true;
    }
    if (!groupId || !this.env.DB || typeof this.env.DB.prepare !== 'function') return false;
    await this.ensureContactsSchema();
    try {
      const row = await this.env.DB.prepare(
        'SELECT 1 AS ok FROM group_memberships WHERE group_id = ? LIMIT 1'
      )
        .bind(groupId)
        .first();
      return Boolean(row && row.ok === 1);
    } catch {
      return false;
    }
  }

  async restorePersistedGroupsForSession(ws, sender) {
    if (!ws || !sender?.deviceBound || !sender?.deviceFingerprint) return;
    const persisted = await this.getPersistedGroupIds(sender.deviceFingerprint);
    const owned = await this.getOwnedGroupIds(sender.uid || '');
    const restored = Array.from(new Set([...persisted, ...owned]));
    if (!restored.length) return;
    const persistedSet = new Set(persisted);
    for (const groupId of restored) {
      if (sender.groups.has(groupId)) continue;
      sender.groups.add(groupId);
      if (!persistedSet.has(groupId)) {
        await this.saveGroupMembership(sender.deviceFingerprint, groupId);
        persistedSet.add(groupId);
      }
      const meta = await this.getGroupMeta(groupId);
      this.sendTo(ws, {
        type: 'group_joined',
        groupId,
        groupName: meta?.name || groupId,
        ownerUid: meta?.ownerUid || '',
        reqId: 'restore_group',
        silent: true,
      });
    }
  }

  async broadcastSystemStatus() {
    const sessions = Array.from(this.sessions.values());
    const onlineFps = sessions
      .map((session) => (session.deviceBound && session.deviceFingerprint ? session.deviceFingerprint : ''))
      .filter(Boolean);
    const contactMap = await this.getContactMapForDevices(onlineFps);

    const groupCounts = {};
    for (const session of sessions) {
      for (const groupId of session.groups) {
        groupCounts[groupId] = (groupCounts[groupId] || 0) + 1;
      }
    }

    for (const [ws, viewer] of this.sessions.entries()) {
      const viewerFp = viewer.deviceBound && viewer.deviceFingerprint ? viewer.deviceFingerprint : '';
      const viewerContacts = viewerFp ? (contactMap.get(viewerFp) || new Set()) : new Set();

      const users = sessions.map((session) => {
        const targetFp = session.deviceBound && session.deviceFingerprint ? session.deviceFingerprint : '';
        const isSelf = Boolean(viewerFp && targetFp && viewerFp === targetFp);
        const inContacts = Boolean(viewerFp && targetFp && viewerContacts.has(targetFp));
        const targetContacts = targetFp ? (contactMap.get(targetFp) || new Set()) : new Set();
        const targetKnowsViewer = Boolean(viewerFp && targetFp && targetContacts.has(viewerFp));
        const allowRequest = Boolean(targetFp) && (targetKnowsViewer || session.dmContactsOnly === false);

        return {
          uid: session.deviceBound && session.deviceFingerprint ? session.deviceFingerprint : '',
          nickname: session.deviceBound && session.deviceFingerprint ? session.nickname || '' : '',
          publicKey: session.publicKey,
          identitySign: session.identitySign,
          identityDh: session.identityDh,
          identitySig: session.identitySig,
          os: isSelf || inContacts ? session.os : '',
          location: isSelf || inContacts ? session.location : '',
          deviceFingerprint: isSelf || inContacts ? targetFp.slice(0, 10) : '',
          deviceFingerprintFull: isSelf || inContacts ? targetFp : '',
          inContacts,
          canDirectRequest: !isSelf && allowRequest,
          dmContactsOnly: session.dmContactsOnly !== false,
        };
      });

      const payload = JSON.stringify({
        type: 'status',
        users,
        onlineCount: sessions.length,
        groupCounts,
      });

      try {
        ws.send(payload);
      } catch {
        // no-op
      }
    }
  }

  async getInviteKey() {
    if (!this.inviteKeyPromise) {
      const secret = getConfiguredSecret(this.env.INVITE_SIGNING_SECRET, MIN_INVITE_SIGNING_SECRET_LENGTH);
      if (!secret) {
        throw new Error('INVITE_SIGNING_SECRET_MISSING');
      }
      this.inviteKeyPromise = crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
      );
    }
    return this.inviteKeyPromise;
  }

  async signPayload(payloadB64) {
    const key = await this.getInviteKey();
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));
    return base64UrlEncodeBytes(new Uint8Array(sig));
  }

  async verifyInviteCode(inviteCode, groupId) {
    const parsed = decodeInviteCodeParts(inviteCode);
    if (!parsed) return null;

    const { payloadB64, sigB64, payload } = parsed;
    if (!payload || payload.g !== groupId || typeof payload.e !== 'number' || payload.e < Date.now()) {
      return null;
    }

    const key = await this.getInviteKey();
    const sigBytes = base64UrlToBytes(sigB64);
    if (!sigBytes) return null;

    try {
      const valid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(payloadB64));
      if (!valid) return null;
      const inviteId = sanitizeText(payload.i, 80);
      if (!inviteId) return null;
      const record = await this.getInviteRecordById(inviteId);
      if (!record || record.groupId !== groupId || record.inviteCode !== parsed.normalizedCode) return null;
      if (!this.isInviteRecordActive(record)) return null;
      if (record.maxUses > 0 && record.usedCount >= record.maxUses) return null;
      return { ...payload, inviteId, record };
    } catch {
      return null;
    }
  }

  isInviteSigningConfigured() {
    return Boolean(getConfiguredSecret(this.env.INVITE_SIGNING_SECRET, MIN_INVITE_SIGNING_SECRET_LENGTH));
  }

  async makeInviteCode(groupId, ttlSec, options = {}) {
    await this.ensureInviteRecordsLoaded();
    const ttl = Number.isFinite(ttlSec) ? ttlSec : INVITE_TTL_DEFAULT_SECONDS;
    const boundedTtl = Math.max(60, Math.min(INVITE_TTL_MAX_SECONDS, Math.floor(ttl)));
    const creatorUid = sanitizeText(options.creatorUid, 80) || '';
    const creatorNickname = sanitizeOptionalText(options.creatorNickname, NICKNAME_MAX);
    const creatorStatement = sanitizeOptionalText(options.creatorStatement, 180);
    const maxUses = sanitizeInviteMaxUses(options.maxUses);
    const inviteId = `ginv-${randomHex(8)}`;
    const shortCode = await this.generateUniqueInviteShortCode();
    const payload = {
      i: inviteId,
      g: groupId,
      e: Date.now() + boundedTtl * 1000,
      n: randomHex(6),
      c: creatorUid,
      cn: creatorNickname,
      cs: creatorStatement,
    };

    const payloadB64 = base64UrlEncodeText(JSON.stringify(payload));
    const sigB64 = await this.signPayload(payloadB64);
    const inviteCode = `TCINV-${payloadB64}.${sigB64}`;
    const record = {
      inviteId,
      groupId,
      inviteCode,
      shortCode,
      creatorUid,
      creatorNickname,
      creatorStatement,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: payload.e,
      maxUses,
      usedCount: 0,
      pendingCount: 0,
      revokedAt: 0,
    };
    const activeInviteCount = Array.from(this.inviteRecordsById.values()).filter(
      (item) => item.groupId === groupId && this.isInviteRecordActive(item)
    ).length;
    if (activeInviteCount >= MAX_ACTIVE_INVITES_PER_GROUP) {
      throw new Error('INVITE_LIMIT_REACHED');
    }
    if (creatorUid) {
      const existingActive = Array.from(this.inviteRecordsById.values()).find(
        (item) => item.groupId === groupId && item.creatorUid === creatorUid && this.isInviteRecordActive(item)
      );
      if (existingActive) {
        throw new Error('INVITE_ALREADY_EXISTS');
      }
    }
    this.inviteRecordsById.set(inviteId, record);
    await this.persistInviteRecords();
    return {
      inviteId,
      inviteCode,
      shortCode,
      expiresAt: payload.e,
      maxUses,
    };
  }

  async resolveShortInvite(shortCode) {
    const record = await this.getInviteRecordByShortCode(shortCode);
    if (!record || !this.isInviteRecordActive(record)) return null;
    if (record.maxUses > 0 && record.usedCount >= record.maxUses) return null;
    return {
      inviteId: record.inviteId,
      inviteCode: record.inviteCode,
      groupId: record.groupId,
      shortCode: record.shortCode,
      expiresAt: record.expiresAt,
      maxUses: record.maxUses,
      usedCount: record.usedCount,
      pendingCount: record.pendingCount,
    };
  }

  async verifyPow(uid, nonce, answer, difficulty) {
    const answerText = sanitizeText(String(answer), 40);
    if (!answerText) return false;

    const input = `${uid}:${nonce}:${answerText}`;
    const digest = await crypto.subtle.digest('SHA-256', enc.encode(input));
    const bytes = new Uint8Array(digest);
    let hex = '';
    for (let i = 0; i < bytes.length; i += 1) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex.startsWith('0'.repeat(difficulty));
  }

  async handleMessage(ws, data) {
    const sender = this.sessions.get(ws);
    if (!sender) return;

    const reqId = sanitizeText(data.reqId, 80);

    switch (data.type) {
      case 'set_public_key':
        this.handleSetPublicKey(ws, sender, data, reqId);
        return;
      case 'set_identity':
        this.handleSetIdentity(ws, sender, data, reqId);
        return;
      case 'set_device_fingerprint':
        await this.handleSetDeviceFingerprint(ws, sender, data, reqId);
        return;
      case 'solve_pow':
        await this.handleSolvePow(ws, sender, data, reqId);
        return;
      case 'ping':
        this.sendTo(ws, { type: 'pong', ts: Date.now(), reqId });
        return;
      default:
        break;
    }

    if (!sender.pow.verified) {
      this.sendError(ws, 'POW_REQUIRED', 'Complete anti-bot verification first', reqId);
      return;
    }

    switch (data.type) {
      case 'join_group':
        await this.handleJoinGroup(ws, sender, data, reqId);
        break;
      case 'create_invite':
        await this.handleCreateInvite(ws, sender, data, reqId);
        break;
      case 'group_invite_settings':
        await this.handleGroupInviteSettings(ws, sender, data, reqId);
        break;
      case 'group_invite_policy_update':
        await this.handleGroupInvitePolicyUpdate(ws, sender, data, reqId);
        break;
      case 'group_invite_revoke':
        await this.handleGroupInviteRevoke(ws, sender, data, reqId);
        break;
      case 'group_invite_approve':
        await this.handleGroupInviteApprove(ws, sender, data, reqId);
        break;
      case 'group_rename':
        await this.handleGroupRename(ws, sender, data, reqId);
        break;
      case 'group_announcement_update':
        await this.handleGroupAnnouncementUpdate(ws, sender, data, reqId);
        break;
      case 'group_members':
        await this.handleGroupMembers(ws, sender, data, reqId);
        break;
      case 'group_kick':
        await this.handleGroupKick(ws, sender, data, reqId);
        break;
      case 'leave_group':
        await this.handleLeaveGroup(ws, sender, data, reqId);
        break;
      case 'direct_start':
        await this.handleDirectStart(ws, sender, data, reqId);
        break;
      case 'direct_request_accept':
        await this.handleDirectRequestDecision(ws, sender, data, reqId, true);
        break;
      case 'direct_request_decline':
        await this.handleDirectRequestDecision(ws, sender, data, reqId, false);
        break;
      case 'pair_accept':
        await this.handlePairAccept(ws, sender, data, reqId);
        break;
      case 'pair_decline':
        await this.handlePairDecline(ws, sender, data, reqId);
        break;
      case 'contacts_list':
        await this.handleContactsList(ws, sender, reqId);
        break;
      case 'contacts_add':
        await this.handleContactsRequest(ws, sender, data, reqId);
        break;
      case 'contacts_remove':
        await this.handleContactsRemove(ws, sender, data, reqId);
        break;
      case 'contacts_accept':
        await this.handleContactsAccept(ws, sender, data, reqId);
        break;
      case 'contacts_decline':
        await this.handleContactsDecline(ws, sender, data, reqId);
        break;
      case 'contacts_migrate_init':
        await this.handleContactsMigrateInit(ws, sender, reqId);
        break;
      case 'contacts_migrate_approve':
        await this.handleContactsMigrateApprove(ws, sender, data, reqId);
        break;
      case 'contacts_migrate_confirm':
        await this.handleContactsMigrateConfirm(ws, sender, data, reqId);
        break;
      case 'set_nickname':
        await this.handleSetNickname(ws, sender, data, reqId);
        break;
      case 'set_dm_pref':
        await this.handleSetDmPreference(ws, sender, data, reqId);
        break;
      case 'chat':
        await this.handleChat(ws, sender, data, reqId);
        break;
      case 'read_receipt':
        this.handleReadReceipt(ws, sender, data, reqId);
        break;
      default:
        this.handleInvalidAction(ws, 'UNKNOWN_TYPE', 'Unsupported message type', reqId);
        break;
    }
  }

  handleSetPublicKey(ws, sender, data, reqId) {
    if (!isBase64(data.publicKey, 4096)) {
      this.handleInvalidAction(ws, 'INVALID_PUBLIC_KEY', 'publicKey must be base64', reqId);
      return;
    }

    sender.publicKey = data.publicKey;
    // 持久化到 D1（支持离线成员消息加密）
    if (sender.deviceFingerprint) {
      this.persistPublicKey(sender.deviceFingerprint, data.publicKey).catch(() => {});
    }
    this.sendTo(ws, { type: 'key_registered', reqId });
    this.broadcastSystemStatus();
  }

  handleSetIdentity(ws, sender, data, reqId) {
    if (!isBase64(data.identitySign, MAX_IDENTITY_KEY_LENGTH)) {
      this.handleInvalidAction(ws, 'INVALID_IDENTITY_SIGN', 'identitySign must be base64', reqId);
      return;
    }
    if (!isBase64(data.identityDh, MAX_IDENTITY_KEY_LENGTH)) {
      this.handleInvalidAction(ws, 'INVALID_IDENTITY_DH', 'identityDh must be base64', reqId);
      return;
    }
    if (!isBase64(data.identitySig, MAX_IDENTITY_KEY_LENGTH)) {
      this.handleInvalidAction(ws, 'INVALID_IDENTITY_SIG', 'identitySig must be base64', reqId);
      return;
    }

    sender.identitySign = data.identitySign;
    sender.identityDh = data.identityDh;
    sender.identitySig = data.identitySig;
    this.sendTo(ws, { type: 'identity_registered', reqId });
    this.broadcastSystemStatus();
  }

  async handleSetDeviceFingerprint(ws, sender, data, reqId) {
    const deviceSecret = sanitizeDeviceSecret(data.deviceSecret);
    if (!deviceSecret) {
      this.handleInvalidAction(ws, 'INVALID_DEVICE_FINGERPRINT', 'deviceSecret must be base64url', reqId);
      return;
    }
    const fingerprint = await deriveDeviceFingerprint(deviceSecret);
    const derivedToken = deriveDeviceBindingToken(deviceSecret);

    const token = sanitizeDeviceToken(data.deviceToken);
    const profile = sanitizeDeviceProfile(data.deviceProfile);
    const storageKey = `device:${fingerprint}`;
    const stored = await this.state.storage.get(storageKey);

    let isFirstBind = false;
    if (stored && stored.token) {
      const tokenMatchesStored = Boolean(token && token === stored.token);
      const tokenMatchesDerived = Boolean(derivedToken && token && token === derivedToken);
      if (!tokenMatchesStored && !tokenMatchesDerived) {
        this.sendError(ws, 'DEVICE_AUTH_REQUIRED', 'Device binding token required', reqId);
        sender.deviceBound = false;
        return;
      }
    } else {
      isFirstBind = true;
      await this.state.storage.put(storageKey, { token: derivedToken, createdAt: Date.now(), profile });
      this.sendTo(ws, { type: 'device_bound', deviceToken: derivedToken, fingerprint, firstBind: true, reqId });
    }

    if (stored) {
      const nextProfile = profile && JSON.stringify(profile) !== JSON.stringify(stored.profile || {}) ? profile : (stored.profile || {});
      const nextToken = derivedToken || stored.token;
      if (nextToken !== stored.token || nextProfile !== (stored.profile || {})) {
        await this.state.storage.put(storageKey, {
          ...stored,
          token: nextToken,
          createdAt: stored.createdAt || Date.now(),
          profile: nextProfile,
        });
      }
      if (derivedToken && stored.token !== derivedToken) {
        this.sendTo(ws, { type: 'device_token_synced', deviceToken: derivedToken, reqId });
      }
    }

    if (sender.deviceFingerprint && sender.deviceFingerprint !== fingerprint) {
      if (this.deviceSessions.get(sender.deviceFingerprint) === ws) {
        this.deviceSessions.delete(sender.deviceFingerprint);
      }
    }

    const existingWs = this.deviceSessions.get(fingerprint);
    if (existingWs && existingWs !== ws) {
      try {
        this.sendTo(existingWs, { type: 'device_kicked', reason: 'Device signed in elsewhere' });
        existingWs.close(1008, 'Device re-bound');
      } catch {
        // no-op
      }
      this.sessions.delete(existingWs);
    }

    sender.deviceFingerprint = fingerprint;
    sender.uid = fingerprint;
    sender.deviceBound = true;
    sender.nickname = await this.ensureDeviceNickname(fingerprint);
    const dmPref = await this.getDmPreference(fingerprint);
    sender.dmContactsOnly = dmPref.contactsOnly !== false;
    this.deviceSessions.set(fingerprint, ws);
    await this.restorePersistedGroupsForSession(ws, sender);
    this.restoreDirectGroupsForSession(ws, sender);
    this.sendTo(ws, { type: 'device_fingerprint_registered', fingerprint, reqId });
    this.sendNicknameState(ws, sender.nickname, reqId);
    this.sendDmPreferenceState(ws, sender.dmContactsOnly, reqId);
    if (isFirstBind) {
      this.sendFirstDeviceGuide(ws, sender);
    }
    this.broadcastSystemStatus();
    void this.notifyPendingMigration(ws, sender);
    this.notifyPendingContactRequests(ws, sender);
    void this.notifyPendingInviteApprovals(ws, sender);
    void this.notifyPendingJoinResults(ws, sender);
    this.notifyPendingDirectRequests(ws, sender);
  }

  async handleSetNickname(ws, sender, data, reqId) {
    if (!this.requireDeviceBound(ws, sender, reqId)) return;
    if (!this.env.DB || typeof this.env.DB.prepare !== 'function') {
      this.sendError(ws, 'DB_NOT_READY', 'Contacts database unavailable', reqId);
      return;
    }

    const nickname = sanitizeNickname(data.nickname);
    if (!nickname) {
      this.sendError(ws, 'NICKNAME_INVALID', `Nickname must be 1-${NICKNAME_MAX} chars`, reqId);
      return;
    }

    await this.ensureContactsSchema();
    try {
      const owner = await this.env.DB.prepare(
        'SELECT device_fp FROM device_nicknames WHERE nickname = ? LIMIT 1'
      )
        .bind(nickname)
        .first();
      if (owner && owner.device_fp !== sender.deviceFingerprint) {
        this.sendError(ws, 'NICKNAME_TAKEN', 'Nickname already taken', reqId);
        return;
      }

      const now = Date.now();
      const current = await this.env.DB.prepare(
        'SELECT nickname FROM device_nicknames WHERE device_fp = ? LIMIT 1'
      )
        .bind(sender.deviceFingerprint)
        .first();
      if (current && current.nickname) {
        await this.env.DB.prepare(
          'UPDATE device_nicknames SET nickname = ?, updated_at = ? WHERE device_fp = ?'
        )
          .bind(nickname, now, sender.deviceFingerprint)
          .run();
      } else {
        await this.env.DB.prepare(
          'INSERT INTO device_nicknames (nickname, device_fp, created_at, updated_at) VALUES (?, ?, ?, ?)'
        )
          .bind(nickname, sender.deviceFingerprint, now, now)
          .run();
      }

      sender.nickname = nickname;
      this.sendTo(ws, { type: 'nickname_updated', nickname, reqId });
      this.broadcastSystemStatus();
    } catch {
      this.sendError(ws, 'NICKNAME_TAKEN', 'Nickname already taken', reqId);
    }
  }

  async handleSetDmPreference(ws, sender, data, reqId) {
    if (!this.requireDeviceBound(ws, sender, reqId)) return;
    const contactsOnly = data.contactsOnly !== false;
    const saved = await this.saveDmPreference(sender.deviceFingerprint, { contactsOnly });
    sender.dmContactsOnly = saved.contactsOnly !== false;
    this.sendDmPreferenceState(ws, sender.dmContactsOnly, reqId);
    this.broadcastSystemStatus();
  }

  notifyPendingContactRequests(ws, sender) {
    this.cleanupContactRequests();
    for (const request of this.contactRequests.values()) {
      if (!request || request.toFingerprint !== sender.deviceFingerprint) continue;
      this.sendTo(ws, {
        type: 'contacts_request',
        requestId: request.requestId,
        fromUid: request.fromUid,
        fromFingerprintShort: request.fromFingerprint ? request.fromFingerprint.slice(0, 10) : '',
        fromOs: request.fromOs || '',
        fromLocation: request.fromLocation || '',
      });
    }
  }

  async notifyPendingMigration(ws, sender) {
    if (!this.env.DB || typeof this.env.DB.prepare !== 'function') return;
    await this.ensureContactsSchema();
    try {
      const row = await this.env.DB.prepare(
        'SELECT code, old_device_fp, created_at, transfer_nickname FROM contact_migrations WHERE new_device_fp = ? AND status = ? ORDER BY created_at DESC LIMIT 1'
      )
        .bind(sender.deviceFingerprint, 'approved')
        .first();

      if (!row) return;

      if (Date.now() - row.created_at > MIGRATION_TTL_MS) {
        await this.env.DB.prepare('DELETE FROM contact_migrations WHERE code = ?').bind(row.code).run();
        return;
      }

      const transferNickname = Number(row.transfer_nickname) === 1;
      const oldNickname = transferNickname && row.old_device_fp
        ? await this.getDeviceNickname(row.old_device_fp)
        : '';
      this.sendTo(ws, {
        type: 'contacts_migrate_request',
        code: row.code,
        fromFingerprintShort: row.old_device_fp ? row.old_device_fp.slice(0, 10) : '',
        transferNickname,
        oldNickname,
      });
    } catch {
      // no-op
    }
  }

  async notifyPendingInviteApprovals(ws, sender) {
    if (!sender?.uid) return;
    await this.cleanupJoinApprovals();
    for (const req of this.groupJoinApprovals.values()) {
      if (!req || !req.groupId) continue;
      const meta = await this.getGroupMeta(req.groupId);
      if (!meta || meta.ownerUid !== sender.uid) continue;
      this.sendTo(ws, {
        type: 'invite_approval_request',
        requestId: req.requestId,
        groupId: req.groupId,
        groupName: meta.name || req.groupId,
        requesterUid: req.requesterUid || '',
        requesterNickname: req.requesterNickname || '',
        requesterStatement: req.requesterStatement || '',
        inviterUid: req.inviterUid || '',
        inviterNickname: req.inviterNickname || '',
        inviterStatement: req.inviterStatement || '',
      });
    }
  }

  async notifyPendingJoinResults(ws, sender) {
    if (!ws || !sender?.deviceFingerprint) return;
    const pending = await this.consumePendingJoinResults(sender.deviceFingerprint);
    for (const item of pending) {
      this.sendTo(ws, {
        type: 'invite_approval_result',
        requestId: item.requestId,
        groupId: item.groupId,
        approved: item.approved,
      });
    }
  }

  async handleSolvePow(ws, sender, data, reqId) {
    if (sender.pow.verified) {
      this.sendTo(ws, { type: 'pow_verified', reqId });
      return;
    }

    const answer = sanitizeText(data.answer, 40);
    if (!answer) {
      this.handleInvalidAction(ws, 'INVALID_POW', 'answer required', reqId);
      return;
    }

    const powUid = sender.pow?.uid || sender.uid;
    const ok = await this.verifyPow(powUid, sender.pow.nonce, answer, sender.pow.difficulty);
    if (!ok) {
      this.handleInvalidAction(ws, 'POW_FAILED', 'anti-bot verification failed', reqId);
      return;
    }

    sender.pow.verified = true;
    this.sendTo(ws, { type: 'pow_verified', reqId });
  }

  async handleJoinGroup(ws, sender, data, reqId) {
    if (!this.allowRate(sender, 'join')) {
      this.sendError(ws, 'JOIN_RATE_LIMIT', 'Too many group joins, try again later', reqId);
      return;
    }

    const groupId = sanitizeGroupId(data.groupId);
    if (!groupId) {
      this.handleInvalidAction(ws, 'INVALID_GROUP', 'Invalid groupId', reqId);
      return;
    }
    const preferredGroupName = sanitizeGroupName(data.groupName);

    let meta = null;
    if (!sender.groups.has(groupId)) {
      if (isDirectGroupId(groupId)) {
        this.sendError(ws, 'FORBIDDEN_GROUP', 'Direct group cannot be joined', reqId);
        return;
      }
      if (groupId === SYSTEM_NOTICE_GROUP) {
        this.sendError(ws, 'FORBIDDEN_GROUP', 'System notice group cannot be joined', reqId);
        return;
      }
      if (sender.groups.size >= MAX_GROUPS_PER_USER) {
        this.sendError(ws, 'GROUP_LIMIT', `Maximum ${MAX_GROUPS_PER_USER} groups`, reqId);
        return;
      }

      const hasExistingMembers = await this.groupHasMembers(groupId);
      if (groupId !== SYSTEM_GROUP && hasExistingMembers && !isDirectGroupId(groupId)) {
        meta = await this.getGroupMeta(groupId);
        const ownerUid = meta?.ownerUid || '';
        const ownerRejoin = Boolean(ownerUid && ownerUid === sender.uid);
        if (!ownerRejoin) {
          const inviteCode = sanitizeText(data.inviteCode, 700);
          let invite = null;
          try {
            invite = inviteCode ? await this.verifyInviteCode(inviteCode, groupId) : null;
          } catch (error) {
            if (error instanceof Error && error.message === 'INVITE_SIGNING_SECRET_MISSING') {
              this.sendError(ws, 'SERVER_CONFIG_ERROR', 'Invite signing secret missing', reqId);
              return;
            }
            throw error;
          }
          if (!invite) {
            this.sendError(ws, 'INVITE_REQUIRED', 'Valid invite code required for this group', reqId);
            return;
          }
          const inviterUid = sanitizeText(invite.c, 80) || '';
          const inviterNickname = sanitizeOptionalText(invite.cn, NICKNAME_MAX);
          const inviterStatement = sanitizeOptionalText(invite.cs, 180);
          const requesterStatement = sanitizeOptionalText(data.joinStatement, 180);
          const inviteId = invite.inviteId || invite.record?.inviteId || '';
          const approvalRequired = meta?.inviteApprovalRequired === true;
          const creatorNeedsApproval = Boolean(ownerUid && inviterUid && inviterUid !== ownerUid && sender.uid !== ownerUid);
          const needsApproval = approvalRequired || creatorNeedsApproval;
          if (needsApproval) {
            await this.cleanupJoinApprovals();
            const reserved = inviteId ? await this.reserveInviteUse(inviteId) : null;
            if (inviteId && !reserved) {
              this.sendError(ws, 'INVITE_EXHAUSTED', 'Invite link usage limit reached', reqId);
              return;
            }
            let requestId = `gjr-${randomHex(6)}`;
            while (this.groupJoinApprovals.has(requestId)) {
              requestId = `gjr-${randomHex(6)}`;
            }
            this.groupJoinApprovals.set(requestId, {
              requestId,
              groupId,
              groupName: meta?.name || groupId,
              requesterUid: sender.uid,
              requesterFingerprint: sender.deviceFingerprint || '',
              requesterNickname: sender.nickname || '',
              requesterStatement,
              inviteId,
              inviterUid,
              inviterNickname,
              inviterStatement,
              createdAt: Date.now(),
              reqId: reqId || '',
            });
            this.sendTo(ws, {
              type: 'invite_join_approval_pending',
              requestId,
              groupId,
              groupName: meta?.name || groupId,
              ownerUid,
              reqId,
            });
            this.sendGroupNoticeToOwner(groupId, ownerUid, {
              title: '入群待审批',
              text: `${sender.nickname || `用户 ${sender.uid.slice(0, 6)}`} 想通过成员邀请加入“${meta?.name || groupId}”。`,
              actions: [
                { action: 'approve_group_join', label: '同意', requestId },
                { action: 'reject_group_join', label: '拒绝', requestId },
              ],
              meta: {
                kind: 'group_join_request',
                requestId,
                groupId,
                groupName: meta?.name || groupId,
                requesterUid: sender.uid,
                requesterNickname: sender.nickname || '',
                requesterStatement,
                inviterUid,
                inviterNickname,
                inviterStatement,
              },
            });
            return;
          }

          if (inviteId) {
            const consumed = await this.consumeInviteUse(inviteId);
            if (!consumed) {
              this.sendError(ws, 'INVITE_EXHAUSTED', 'Invite link usage limit reached', reqId);
              return;
            }
          }
        }
      }

      sender.groups.add(groupId);
      await this.saveGroupMembership(sender.deviceFingerprint, groupId);
      void this.logAction('JOIN_GROUP', `uid=${sender.uid},group=${groupId}`);

      if (groupId !== SYSTEM_GROUP && !isDirectGroupId(groupId)) {
        meta = await this.getGroupMeta(groupId);
        if (!meta) {
          meta = await this.getOrInitGroupMeta(groupId, sender, preferredGroupName);
          this.sendGroupSystemNotice(groupId, {
            title: '群聊已创建',
            text: `${sender.nickname || `用户 ${sender.uid.slice(0, 6)}`} 创建了群聊“${meta.name}”。`,
            actions: [{ action: 'open_related_group', label: '进入群聊', groupId }],
            meta: {
              kind: 'group_created',
              groupId,
              groupName: meta.name || groupId,
              ownerUid: sender.uid,
              ownerNickname: sender.nickname || '',
            },
          });
        } else {
          this.sendGroupSystemNotice(groupId, {
            title: '新成员加入',
            text: `${sender.nickname || `用户 ${sender.uid.slice(0, 6)}`} 加入了群聊。`,
            meta: {
              kind: 'group_member_joined',
              groupId,
              groupName: meta.name || groupId,
              peerUid: sender.uid,
              peerNickname: sender.nickname || '',
            },
          });
        }
      }
    } else if (groupId !== SYSTEM_GROUP && !isDirectGroupId(groupId)) {
      meta = await this.getGroupMeta(groupId);
    }

    if (!meta && groupId !== SYSTEM_GROUP && !isDirectGroupId(groupId)) {
      meta = await this.getOrInitGroupMeta(groupId, sender, preferredGroupName);
    }

    if (groupId !== SYSTEM_GROUP && !isDirectGroupId(groupId)) {
      this.sendGroupJoined(ws, groupId, meta, reqId);
    } else {
      this.sendTo(ws, { type: 'group_joined', groupId, reqId });
    }
    this.broadcastSystemStatus();
  }

  async handleCreateInvite(ws, sender, data, reqId) {
    if (!this.allowRate(sender, 'invite')) {
      this.sendError(ws, 'INVITE_RATE_LIMIT', 'Too many invite requests', reqId);
      return;
    }

    const groupId = sanitizeGroupId(data.groupId);
    if (!groupId) {
      this.handleInvalidAction(ws, 'INVALID_GROUP', 'Invalid groupId', reqId);
      return;
    }

    if (!sender.groups.has(groupId)) {
      this.sendError(ws, 'NOT_IN_GROUP', 'Join group before creating invite', reqId);
      return;
    }
    if (groupId === SYSTEM_NOTICE_GROUP || isDirectGroupId(groupId)) {
      this.sendError(ws, 'INVITE_FORBIDDEN_GROUP', 'Cannot create invite for this group', reqId);
      return;
    }

    const meta = await this.getGroupMeta(groupId);
    const ttlSec = Number(data.ttlSec);
    const creatorStatement = sanitizeOptionalText(data.inviteStatement, 180);
    const maxUses = sanitizeInviteMaxUses(data.maxUses);
    let invite;
    try {
      invite = await this.makeInviteCode(
        groupId,
        Number.isFinite(ttlSec) ? ttlSec : INVITE_TTL_DEFAULT_SECONDS,
        {
          creatorUid: sender.uid,
          creatorNickname: sender.nickname || '',
          creatorStatement,
          maxUses,
        }
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'INVITE_SIGNING_SECRET_MISSING') {
        this.sendError(ws, 'SERVER_CONFIG_ERROR', 'Invite signing secret missing', reqId);
        return;
      }
      if (error instanceof Error && error.message === 'INVITE_LIMIT_REACHED') {
        this.sendError(ws, 'INVITE_LIMIT_REACHED', 'Too many active invite links', reqId);
        return;
      }
      if (error instanceof Error && error.message === 'INVITE_ALREADY_EXISTS') {
        this.sendError(ws, 'INVITE_ALREADY_EXISTS', 'You already have an active invite link for this group', reqId);
        return;
      }
      throw error;
    }

    this.sendTo(ws, {
      type: 'invite_created',
      groupId,
      inviteId: invite.inviteId,
      inviteCode: invite.inviteCode,
      shortCode: invite.shortCode,
      expiresAt: invite.expiresAt,
      maxUses: invite.maxUses,
      reqId,
    });
    const invites = await this.listGroupInviteRecords(groupId);
    const members = this.getGroupMembers(groupId);
    for (const { ws: memberWs } of members) {
      const member = this.sessions.get(memberWs);
      const visibleInvites = this.filterInviteRecordsForViewer(
        invites,
        member?.uid || '',
        meta?.ownerUid || ''
      );
      this.sendTo(memberWs, {
        type: 'group_invite_settings',
        groupId,
        ownerUid: meta?.ownerUid || '',
        announcement: sanitizeOptionalText(meta?.announcement, GROUP_ANNOUNCEMENT_MAX),
        inviteApprovalRequired: meta?.inviteApprovalRequired === true,
        invites: visibleInvites.map((item) => this.serializeInviteRecord(item)).filter(Boolean),
        reqId,
      });
    }

    if (meta && meta.ownerUid && meta.ownerUid !== sender.uid) {
      this.sendGroupNoticeToOwner(groupId, meta.ownerUid, {
        title: '成员生成了邀请链接',
        text: `${sender.nickname || `用户 ${sender.uid.slice(0, 6)}`} 为“${meta.name || groupId}”生成了一条邀请链接。${creatorStatement ? ` 说明：${creatorStatement}` : ''}`,
        meta: {
          kind: 'group_invite_created',
          groupId,
          groupName: meta.name || groupId,
          requesterUid: sender.uid,
          requesterNickname: sender.nickname || '',
          requesterStatement: creatorStatement,
        },
      });
    } else {
      this.sendGroupSystemNotice(groupId, {
        title: '群邀请已生成',
        text: `${sender.nickname || `用户 ${sender.uid.slice(0, 6)}`} 生成了一条新的群邀请链接。${creatorStatement ? ` 说明：${creatorStatement}` : ''}`,
        meta: {
          kind: 'group_invite_created',
          groupId,
          groupName: meta?.name || groupId,
          requesterUid: sender.uid,
          requesterNickname: sender.nickname || '',
          requesterStatement: creatorStatement,
        },
      });
    }
  }

  async handleGroupInviteSettings(ws, sender, data, reqId) {
    const groupId = sanitizeGroupId(data.groupId);
    if (!groupId) {
      this.handleInvalidAction(ws, 'INVALID_GROUP', 'Invalid groupId', reqId);
      return;
    }
    if (!sender.groups.has(groupId)) {
      this.sendError(ws, 'NOT_IN_GROUP', 'Join group before reading invite settings', reqId);
      return;
    }
    const meta = await this.getGroupMeta(groupId);
    const invites = this.filterInviteRecordsForViewer(
      await this.listGroupInviteRecords(groupId),
      sender.uid,
      meta?.ownerUid || ''
    );
    this.sendTo(ws, {
      type: 'group_invite_settings',
      groupId,
      ownerUid: meta?.ownerUid || '',
      announcement: sanitizeOptionalText(meta?.announcement, GROUP_ANNOUNCEMENT_MAX),
      inviteApprovalRequired: meta?.inviteApprovalRequired === true,
      invites: invites.map((item) => this.serializeInviteRecord(item)).filter(Boolean),
      reqId,
    });
  }

  async handleGroupInvitePolicyUpdate(ws, sender, data, reqId) {
    const groupId = sanitizeGroupId(data.groupId);
    if (!groupId) {
      this.handleInvalidAction(ws, 'INVALID_GROUP', 'Invalid groupId', reqId);
      return;
    }
    const meta = await this.getGroupMeta(groupId);
    if (!meta || meta.ownerUid !== sender.uid) {
      this.sendError(ws, 'GROUP_OWNER_REQUIRED', 'Only group owner can update invite settings', reqId);
      return;
    }
    meta.inviteApprovalRequired = data.inviteApprovalRequired === true;
    meta.updatedAt = Date.now();
    await this.persistGroupMeta();
    this.sendGroupSystemNotice(groupId, {
      title: '邀请策略已更新',
      text: `${sender.nickname || `用户 ${sender.uid.slice(0, 6)}`} 将分享链接审批改为${meta.inviteApprovalRequired ? '需要群主确认' : '直接可加入'}。`,
      meta: {
        kind: 'group_invite_policy_updated',
        groupId,
        groupName: meta.name || groupId,
        ownerUid: sender.uid,
        ownerNickname: sender.nickname || '',
        inviteApprovalRequired: meta.inviteApprovalRequired === true,
      },
    });
    const invites = await this.listGroupInviteRecords(groupId);
    const members = this.getGroupMembers(groupId);
    for (const { ws: memberWs } of members) {
      const member = this.sessions.get(memberWs);
      const visibleInvites = this.filterInviteRecordsForViewer(
        invites,
        member?.uid || '',
        meta?.ownerUid || ''
      );
      this.sendTo(memberWs, {
        type: 'group_meta_updated',
        groupId,
        groupName: meta.name || groupId,
        ownerUid: meta.ownerUid || '',
        announcement: sanitizeOptionalText(meta.announcement, GROUP_ANNOUNCEMENT_MAX),
        inviteApprovalRequired: meta.inviteApprovalRequired === true,
        reqId,
      });
      this.sendTo(memberWs, {
        type: 'group_invite_settings',
        groupId,
        ownerUid: meta.ownerUid || '',
        announcement: sanitizeOptionalText(meta.announcement, GROUP_ANNOUNCEMENT_MAX),
        inviteApprovalRequired: meta.inviteApprovalRequired === true,
        invites: visibleInvites.map((item) => this.serializeInviteRecord(item)).filter(Boolean),
        reqId,
      });
    }
  }

  async handleGroupInviteRevoke(ws, sender, data, reqId) {
    const groupId = sanitizeGroupId(data.groupId);
    const inviteId = sanitizeText(data.inviteId, 80);
    if (!groupId || !inviteId) {
      this.handleInvalidAction(ws, 'INVALID_GROUP_INVITE_REVOKE', 'groupId and inviteId required', reqId);
      return;
    }
    const meta = await this.getGroupMeta(groupId);
    if (!meta) {
      this.sendError(ws, 'GROUP_NOT_FOUND', 'Group not found', reqId);
      return;
    }
    const record = await this.getInviteRecordById(inviteId);
    if (!record || record.groupId !== groupId) {
      this.sendError(ws, 'INVITE_INVALID', 'Invite link not found', reqId);
      return;
    }
    const isOwner = meta.ownerUid === sender.uid;
    const isCreator = record.creatorUid === sender.uid;
    if (!isOwner && !isCreator) {
      this.sendError(ws, 'FORBIDDEN', 'Only group owner or link creator can revoke invite links', reqId);
      return;
    }
    await this.revokeInviteRecord(inviteId);
    const invites = await this.listGroupInviteRecords(groupId);
    const members = this.getGroupMembers(groupId);
    for (const { ws: memberWs } of members) {
      const member = this.sessions.get(memberWs);
      const visibleInvites = this.filterInviteRecordsForViewer(
        invites,
        member?.uid || '',
        meta?.ownerUid || ''
      );
      this.sendTo(memberWs, {
        type: 'group_invite_settings',
        groupId,
        ownerUid: meta.ownerUid || '',
        announcement: sanitizeOptionalText(meta.announcement, GROUP_ANNOUNCEMENT_MAX),
        inviteApprovalRequired: meta.inviteApprovalRequired === true,
        invites: visibleInvites.map((item) => this.serializeInviteRecord(item)).filter(Boolean),
        reqId,
      });
    }
    this.sendGroupSystemNotice(groupId, {
      title: '邀请链接已吊销',
      text: `${sender.nickname || `用户 ${sender.uid.slice(0, 6)}`} 吊销了一条群邀请链接。`,
      meta: {
        kind: 'group_invite_revoked',
        groupId,
        groupName: meta.name || groupId,
        ownerUid: sender.uid,
        ownerNickname: sender.nickname || '',
      },
    });
  }

  async handleGroupInviteApprove(ws, sender, data, reqId) {
    const requestId = sanitizeText(data.requestId, 80);
    if (!requestId) {
      this.handleInvalidAction(ws, 'INVALID_INVITE_APPROVAL', 'requestId required', reqId);
      return;
    }
    await this.cleanupJoinApprovals();
    const pending = this.groupJoinApprovals.get(requestId);
    if (!pending) {
      this.sendError(ws, 'INVITE_APPROVAL_INVALID', 'Invite approval request not found', reqId);
      return;
    }

    const meta = await this.getGroupMeta(pending.groupId);
    if (!meta || meta.ownerUid !== sender.uid) {
      this.sendError(ws, 'GROUP_OWNER_REQUIRED', 'Only group owner can approve invite', reqId);
      return;
    }

    const approve = data.approve === true;
    const requesterWs = this.findWsByUid(pending.requesterUid);
    this.groupJoinApprovals.delete(requestId);

    if (!approve) {
      if (pending.inviteId) {
        await this.releaseInviteReservation(pending.inviteId);
      }
      if (requesterWs) {
        this.sendTo(requesterWs, {
          type: 'invite_approval_result',
          requestId,
          groupId: pending.groupId,
          approved: false,
          reqId: pending.reqId || reqId,
        });
      } else if (pending.requesterFingerprint) {
        await this.savePendingJoinResult(pending.requesterFingerprint, {
          requestId,
          groupId: pending.groupId,
          approved: false,
          createdAt: Date.now(),
        });
      }
      this.sendTo(ws, {
        type: 'invite_approval_result',
        requestId,
        groupId: pending.groupId,
        approved: false,
        reqId,
      });
      this.sendGroupSystemNotice(pending.groupId, {
        title: '入群审批被拒绝',
        text: `${pending.requesterNickname || `用户 ${pending.requesterUid.slice(0, 6)}`} 的入群申请未通过。`,
        meta: {
          kind: 'group_join_rejected',
          groupId: pending.groupId,
          groupName: meta?.name || pending.groupId,
          requesterUid: pending.requesterUid,
          requesterNickname: pending.requesterNickname || '',
        },
      });
      return;
    }

    if (requesterWs) {
      const requester = this.sessions.get(requesterWs);
      if (requester && !requester.groups.has(pending.groupId)) {
        if (pending.inviteId) {
          const consumed = await this.consumeReservedInviteUse(pending.inviteId);
          if (!consumed) {
            this.sendError(ws, 'INVITE_EXHAUSTED', 'Invite link usage limit reached', reqId);
            this.sendTo(requesterWs, {
              type: 'invite_approval_result',
              requestId,
              groupId: pending.groupId,
              approved: false,
              reqId: pending.reqId || reqId,
            });
            return;
          }
        }
        requester.groups.add(pending.groupId);
        await this.saveGroupMembership(requester.deviceFingerprint, pending.groupId);
        this.sendGroupJoined(requesterWs, pending.groupId, meta, pending.reqId || reqId);
      } else if (pending.inviteId) {
        await this.releaseInviteReservation(pending.inviteId);
      }
    } else if (pending.requesterFingerprint) {
      if (pending.inviteId) {
        const consumed = await this.consumeReservedInviteUse(pending.inviteId);
        if (!consumed) {
          this.sendError(ws, 'INVITE_EXHAUSTED', 'Invite link usage limit reached', reqId);
          return;
        }
      }
      await this.saveGroupMembership(pending.requesterFingerprint, pending.groupId);
      await this.savePendingJoinResult(pending.requesterFingerprint, {
        requestId,
        groupId: pending.groupId,
        approved: true,
        createdAt: Date.now(),
      });
    }
    if (requesterWs) {
      this.sendTo(requesterWs, {
        type: 'invite_approval_result',
        requestId,
        groupId: pending.groupId,
        approved: true,
        reqId: pending.reqId || reqId,
      });
    }
    this.sendTo(ws, {
      type: 'invite_approval_result',
      requestId,
      groupId: pending.groupId,
      approved: true,
      reqId,
    });
    this.sendGroupSystemNotice(pending.groupId, {
      title: '新成员加入',
      text: `${pending.requesterNickname || `用户 ${pending.requesterUid.slice(0, 6)}`} 已通过群主审批加入群聊。`,
      meta: {
        kind: 'group_member_joined',
        groupId: pending.groupId,
        groupName: meta?.name || pending.groupId,
        peerUid: pending.requesterUid,
        peerNickname: pending.requesterNickname || '',
      },
    });
    this.broadcastSystemStatus();
  }

  async handleGroupRename(ws, sender, data, reqId) {
    const groupId = sanitizeGroupId(data.groupId);
    const groupName = sanitizeGroupName(data.groupName);
    if (!groupId || !groupName) {
      this.handleInvalidAction(ws, 'INVALID_GROUP_RENAME', 'groupId and groupName required', reqId);
      return;
    }
    if (groupId === SYSTEM_GROUP || groupId === SYSTEM_NOTICE_GROUP || isDirectGroupId(groupId)) {
      this.sendError(ws, 'GROUP_RENAME_FORBIDDEN', 'Cannot rename this group', reqId);
      return;
    }
    if (!sender.groups.has(groupId)) {
      this.sendError(ws, 'NOT_IN_GROUP', 'Join group before rename', reqId);
      return;
    }

    const meta = await this.getOrInitGroupMeta(groupId, sender);
    if (meta.ownerUid !== sender.uid) {
      this.sendError(ws, 'GROUP_OWNER_REQUIRED', 'Only group owner can rename', reqId);
      return;
    }

    const oldName = meta.name || groupId;
    if (oldName === groupName) {
      this.sendTo(ws, {
        type: 'group_meta_updated',
        groupId,
        groupName,
        ownerUid: meta.ownerUid,
        announcement: sanitizeOptionalText(meta.announcement, GROUP_ANNOUNCEMENT_MAX),
        inviteApprovalRequired: meta.inviteApprovalRequired === true,
        reqId,
      });
      return;
    }

    meta.name = groupName;
    meta.updatedAt = Date.now();
    await this.persistGroupMeta();

    const members = this.getGroupMembers(groupId);
    for (const { ws: memberWs } of members) {
      this.sendTo(memberWs, {
        type: 'group_meta_updated',
        groupId,
        groupName,
        ownerUid: meta.ownerUid || '',
        announcement: sanitizeOptionalText(meta.announcement, GROUP_ANNOUNCEMENT_MAX),
        inviteApprovalRequired: meta.inviteApprovalRequired === true,
        reqId,
      });
    }
    this.sendGroupSystemNotice(groupId, {
      title: '群名称已更新',
      text: `${sender.nickname || `用户 ${sender.uid.slice(0, 6)}`} 将群名从“${oldName}”改为“${groupName}”。`,
      actions: [{ action: 'open_related_group', label: '查看群聊', groupId }],
      meta: {
        kind: 'group_updated',
        groupId,
        groupName,
        ownerUid: sender.uid,
        ownerNickname: sender.nickname || '',
      },
    });
  }

  async handleGroupAnnouncementUpdate(ws, sender, data, reqId) {
    const groupId = sanitizeGroupId(data.groupId);
    if (!groupId) {
      this.handleInvalidAction(ws, 'INVALID_GROUP_ANNOUNCEMENT', 'groupId required', reqId);
      return;
    }
    if (groupId === SYSTEM_GROUP || groupId === SYSTEM_NOTICE_GROUP || isDirectGroupId(groupId)) {
      this.sendError(ws, 'GROUP_ANNOUNCEMENT_FORBIDDEN', 'Cannot update announcement for this group', reqId);
      return;
    }
    if (!sender.groups.has(groupId)) {
      this.sendError(ws, 'NOT_IN_GROUP', 'Join group before updating announcement', reqId);
      return;
    }

    const meta = await this.getOrInitGroupMeta(groupId, sender);
    if (meta.ownerUid !== sender.uid) {
      this.sendError(ws, 'GROUP_OWNER_REQUIRED', 'Only group owner can update announcement', reqId);
      return;
    }

    const announcement = sanitizeOptionalText(data.announcement, GROUP_ANNOUNCEMENT_MAX);
    const oldAnnouncement = sanitizeOptionalText(meta.announcement, GROUP_ANNOUNCEMENT_MAX);
    if (announcement === oldAnnouncement) {
      this.sendTo(ws, {
        type: 'group_meta_updated',
        groupId,
        groupName: meta.name || groupId,
        ownerUid: meta.ownerUid || '',
        announcement,
        inviteApprovalRequired: meta.inviteApprovalRequired === true,
        reqId,
      });
      return;
    }

    meta.announcement = announcement;
    meta.updatedAt = Date.now();
    await this.persistGroupMeta();

    const members = this.getGroupMembers(groupId);
    for (const { ws: memberWs } of members) {
      this.sendTo(memberWs, {
        type: 'group_meta_updated',
        groupId,
        groupName: meta.name || groupId,
        ownerUid: meta.ownerUid || '',
        announcement,
        inviteApprovalRequired: meta.inviteApprovalRequired === true,
        reqId,
      });
    }

    this.sendGroupSystemNotice(groupId, {
      title: announcement ? '群公告已更新' : '群公告已清空',
      text: announcement
        ? `${sender.nickname || `用户 ${sender.uid.slice(0, 6)}`} 更新了群公告。`
        : `${sender.nickname || `用户 ${sender.uid.slice(0, 6)}`} 清空了群公告。`,
      meta: {
        kind: 'group_announcement_updated',
        groupId,
        groupName: meta.name || groupId,
        ownerUid: sender.uid,
        ownerNickname: sender.nickname || '',
        announcement,
      },
    });
  }

  async handleGroupMembers(ws, sender, data, reqId) {
    const groupId = sanitizeGroupId(data.groupId);
    if (!groupId) {
      this.handleInvalidAction(ws, 'INVALID_GROUP_MEMBERS', 'groupId required', reqId);
      return;
    }
    if (groupId === SYSTEM_GROUP || groupId === SYSTEM_NOTICE_GROUP || isDirectGroupId(groupId)) {
      this.sendError(ws, 'GROUP_MEMBERS_FORBIDDEN', 'Members list unavailable for this group', reqId);
      return;
    }
    if (!sender.groups.has(groupId)) {
      this.sendError(ws, 'NOT_IN_GROUP', 'Join group before reading members', reqId);
      return;
    }
    const meta = await this.getGroupMeta(groupId);
    const ownerUid = meta?.ownerUid || '';
    const groupName = meta?.name || groupId;
    const successorUid = ownerUid ? await this.chooseNextGroupOwner(groupId, ownerUid) : '';
    const successorNickname = successorUid ? await this.getDeviceNickname(successorUid) : '';
    const members = this.getGroupMembers(groupId).map(({ session }) => ({
      uid: session.uid,
      nickname: session.nickname || '',
      os: session.os || '',
      location: session.location || '',
      isOwner: ownerUid ? session.uid === ownerUid : false,
    }));
    this.sendTo(ws, {
      type: 'group_members',
      groupId,
      groupName,
      ownerUid,
      successorUid,
      successorNickname,
      announcement: sanitizeOptionalText(meta?.announcement, GROUP_ANNOUNCEMENT_MAX),
      inviteApprovalRequired: meta?.inviteApprovalRequired === true,
      members,
      reqId,
    });
  }

  async handleGroupKick(ws, sender, data, reqId) {
    const groupId = sanitizeGroupId(data.groupId);
    const targetUid = sanitizeText(data.targetUid, 80);
    if (!groupId || !targetUid) {
      this.handleInvalidAction(ws, 'INVALID_GROUP_KICK', 'groupId and targetUid required', reqId);
      return;
    }
    if (!sender.groups.has(groupId)) {
      this.sendError(ws, 'NOT_IN_GROUP', 'Join group before kicking', reqId);
      return;
    }
    if (groupId === SYSTEM_GROUP || groupId === SYSTEM_NOTICE_GROUP || isDirectGroupId(groupId)) {
      this.sendError(ws, 'GROUP_KICK_FORBIDDEN', 'Cannot kick in this group type', reqId);
      return;
    }
    const meta = await this.getGroupMeta(groupId);
    if (!meta || meta.ownerUid !== sender.uid) {
      this.sendError(ws, 'GROUP_OWNER_REQUIRED', 'Only group owner can kick members', reqId);
      return;
    }
    if (targetUid === sender.uid) {
      this.sendError(ws, 'GROUP_KICK_SELF', 'Owner cannot kick self', reqId);
      return;
    }

    const targetWs = this.findWsByUid(targetUid);
    const target = targetWs ? this.sessions.get(targetWs) : null;
    if (!targetWs || !target || !target.groups.has(groupId)) {
      this.sendError(ws, 'GROUP_KICK_TARGET_MISSING', 'Target is not in group', reqId);
      return;
    }

    target.groups.delete(groupId);
    await this.removeGroupMembership(target.deviceFingerprint, groupId);
    this.sendTo(targetWs, {
      type: 'group_kicked',
      groupId,
      byUid: sender.uid,
      byNickname: sender.nickname || '',
      reqId,
    });
    this.sendTo(ws, {
      type: 'group_kick_result',
      groupId,
      targetUid,
      success: true,
      reqId,
    });
    this.sendGroupSystemNotice(groupId, {
      title: '成员已移出',
      text: `${target.nickname || `用户 ${target.uid.slice(0, 6)}`} 已被群主移出群聊。`,
      actions: [{ action: 'open_related_group', label: '查看群聊', groupId }],
      meta: {
        kind: 'group_member_removed',
        groupId,
        groupName: meta?.name || groupId,
        peerUid: target.uid,
        peerNickname: target.nickname || '',
      },
    });
    this.broadcastSystemStatus();
  }

  async syncGroupMetaAndInvites(groupId, meta, reqId = null) {
    const invites = await this.listGroupInviteRecords(groupId);
    const members = this.getGroupMembers(groupId);
    for (const { ws: memberWs } of members) {
      const member = this.sessions.get(memberWs);
      const visibleInvites = this.filterInviteRecordsForViewer(
        invites,
        member?.uid || '',
        meta?.ownerUid || ''
      );
      this.sendTo(memberWs, {
        type: 'group_meta_updated',
        groupId,
        groupName: meta?.name || groupId,
        ownerUid: meta?.ownerUid || '',
        announcement: sanitizeOptionalText(meta?.announcement, GROUP_ANNOUNCEMENT_MAX),
        inviteApprovalRequired: meta?.inviteApprovalRequired === true,
        reqId,
      });
      this.sendTo(memberWs, {
        type: 'group_invite_settings',
        groupId,
        ownerUid: meta?.ownerUid || '',
        announcement: sanitizeOptionalText(meta?.announcement, GROUP_ANNOUNCEMENT_MAX),
        inviteApprovalRequired: meta?.inviteApprovalRequired === true,
        invites: visibleInvites.map((item) => this.serializeInviteRecord(item)).filter(Boolean),
        reqId,
      });
    }
  }

  async handleOwnerLeaveByInheritance(ws, sender, meta, groupId, reqId) {
    const nextOwnerUid = await this.chooseNextGroupOwner(groupId, sender.uid);
    if (!nextOwnerUid) {
      this.sendError(ws, 'GROUP_OWNER_INHERIT_NO_SUCCESSOR', 'No successor available for ownership transfer', reqId);
      return;
    }

    sender.groups.delete(groupId);
    await this.removeGroupMembership(sender.deviceFingerprint, groupId);

    meta.ownerUid = nextOwnerUid;
    meta.updatedAt = Date.now();
    await this.persistGroupMeta();

    const nextOwnerWs = this.findWsByUid(nextOwnerUid);
    const nextOwner = nextOwnerWs ? this.sessions.get(nextOwnerWs) : null;
    const nextOwnerNickname = nextOwner?.nickname || await this.getDeviceNickname(nextOwnerUid);

    this.sendTo(ws, { type: 'group_left', groupId, reqId });
    await this.syncGroupMetaAndInvites(groupId, meta, reqId);
    this.sendGroupSystemNotice(groupId, {
      title: '群主已变更',
      text: `${sender.nickname || `用户 ${sender.uid.slice(0, 6)}`} 退出了群聊，群主已顺位继承给 ${nextOwnerNickname || `用户 ${nextOwnerUid.slice(0, 6)}`}。`,
      actions: [{ action: 'open_related_group', label: '查看群聊', groupId }],
      meta: {
        kind: 'group_owner_transferred',
        groupId,
        groupName: meta?.name || groupId,
        ownerUid: nextOwnerUid,
        ownerNickname: nextOwnerNickname || '',
        previousOwnerUid: sender.uid,
        previousOwnerNickname: sender.nickname || '',
      },
    });
    this.broadcastSystemStatus();
  }

  async handleOwnerLeaveByDissolve(sender, meta, groupId, reqId) {
    const members = this.getGroupMembers(groupId);
    for (const { session } of members) {
      session.groups.delete(groupId);
    }
    await this.removeAllGroupMemberships(groupId);
    await this.cleanupJoinApprovalsForGroup(groupId);
    await this.removeInviteRecordsForGroup(groupId);
    await this.ensureGroupMetaLoaded();
    this.groupMetaById.delete(groupId);
    await this.persistGroupMeta();

    for (const { ws: memberWs } of members) {
      this.sendTo(memberWs, {
        type: 'group_dissolved',
        groupId,
        groupName: meta?.name || groupId,
        byUid: sender.uid,
        byNickname: sender.nickname || '',
        reqId,
      });
    }
    this.broadcastSystemStatus();
  }

  async handleLeaveGroup(ws, sender, data, reqId) {
    const groupId = sanitizeGroupId(data.groupId);
    const ownerAction = data.ownerAction === 'dissolve'
      ? 'dissolve'
      : data.ownerAction === 'inherit'
        ? 'inherit'
        : '';
    if (!groupId) {
      this.handleInvalidAction(ws, 'INVALID_GROUP_LEAVE', 'groupId required', reqId);
      return;
    }
    if (groupId === SYSTEM_GROUP || groupId === SYSTEM_NOTICE_GROUP || isDirectGroupId(groupId)) {
      this.sendError(ws, 'GROUP_LEAVE_FORBIDDEN', 'Cannot leave this group type', reqId);
      return;
    }
    if (!sender.groups.has(groupId)) {
      this.sendError(ws, 'NOT_IN_GROUP', 'Join group before leaving', reqId);
      return;
    }
    const meta = await this.getGroupMeta(groupId);
    if (meta?.ownerUid === sender.uid) {
      if (!ownerAction) {
        this.sendError(ws, 'GROUP_OWNER_LEAVE_MODE_REQUIRED', 'Owner leave mode required', reqId);
        return;
      }
      if (ownerAction === 'dissolve') {
        await this.handleOwnerLeaveByDissolve(sender, meta, groupId, reqId);
        return;
      }
      await this.handleOwnerLeaveByInheritance(ws, sender, meta, groupId, reqId);
      return;
    }

    sender.groups.delete(groupId);
    await this.removeGroupMembership(sender.deviceFingerprint, groupId);
    this.sendTo(ws, { type: 'group_left', groupId, reqId });
    this.sendGroupSystemNotice(groupId, {
      title: '成员已退出',
      text: `${sender.nickname || `用户 ${sender.uid.slice(0, 6)}`} 退出了群聊。`,
      meta: {
        kind: 'group_member_left',
        groupId,
        groupName: meta?.name || groupId,
        peerUid: sender.uid,
        peerNickname: sender.nickname || '',
      },
    });
    this.broadcastSystemStatus();
  }

  activateDirectGroup(senderWs, sender, targetWs, target, groupId, reqId = null) {
    if (!sender || !target || !groupId) return false;
    const pairKey = buildDmPairKey(sender.deviceFingerprint, target.deviceFingerprint);
    if (pairKey) {
      this.dmPairByGroup.set(groupId, pairKey);
    }

    sender.groups.add(groupId);
    target.groups.add(groupId);

    this.sendTo(senderWs, { type: 'group_joined', groupId, reqId });
    this.sendTo(targetWs, { type: 'group_joined', groupId, reqId });
    this.broadcastSystemStatus();
    return true;
  }

  restoreDirectGroupsForSession(ws, sender) {
    if (!ws || !sender?.deviceBound || !sender?.deviceFingerprint || !sender?.uid) return;
    const restored = [];
    for (const [otherWs, other] of this.sessions.entries()) {
      if (otherWs === ws || !other?.uid) continue;
      for (const groupId of other.groups || []) {
        if (!isDirectGroupId(groupId) || sender.groups.has(groupId)) continue;
        const participants = parseDirectGroupId(groupId);
        if (!participants || !participants.includes(sender.uid)) continue;
        const peerUid = participants[0] === sender.uid ? participants[1] : participants[0];
        const peerFingerprint = sanitizeDeviceFingerprint(peerUid);
        if (!peerFingerprint) continue;
        sender.groups.add(groupId);
        const pairKey = buildDmPairKey(sender.deviceFingerprint, peerFingerprint);
        if (pairKey) {
          this.dmPairByGroup.set(groupId, pairKey);
        }
        restored.push(groupId);
      }
    }
    for (const groupId of restored) {
      this.sendTo(ws, { type: 'group_joined', groupId, reqId: 'restore_dm', silent: true });
      const participants = parseDirectGroupId(groupId);
      if (!participants) continue;
      const peerUid = participants[0] === sender.uid ? participants[1] : participants[0];
      for (const [targetWs, target] of this.sessions.entries()) {
        if (targetWs === ws || !target?.uid || target.uid !== peerUid) continue;
        if (!target.groups?.has(groupId)) continue;
        this.sendTo(targetWs, {
          type: 'dm_resync',
          groupId,
          peerUid: sender.uid,
          reason: 'peer_reconnected',
        });
      }
    }
    if (restored.length) {
      this.broadcastSystemStatus();
    }
  }

  async handleDirectStart(ws, sender, data, reqId) {
    if (!this.allowRate(sender, 'join')) {
      this.sendError(ws, 'JOIN_RATE_LIMIT', 'Too many group joins, try again later', reqId);
      return;
    }

    const groupId = sanitizeGroupId(data.groupId);
    const targetUid = sanitizeText(data.targetUid, 80);
    if (!groupId || !targetUid) {
      this.handleInvalidAction(ws, 'INVALID_DIRECT_START', 'groupId and targetUid required', reqId);
      return;
    }
    if (!isDirectGroupId(groupId)) {
      this.handleInvalidAction(ws, 'INVALID_DIRECT_START', 'direct_start only allowed for dm groups', reqId);
      return;
    }
    if (targetUid === sender.uid) {
      this.handleInvalidAction(ws, 'INVALID_DIRECT_START', 'targetUid cannot be self', reqId);
      return;
    }
    const expectedGroupId = buildDirectGroupId(sender.uid, targetUid);
    if (!expectedGroupId || expectedGroupId !== groupId) {
      this.handleInvalidAction(ws, 'INVALID_DIRECT_START', 'groupId does not match participants', reqId);
      return;
    }
    if (!sender.deviceBound || !sender.deviceFingerprint) {
      this.sendError(ws, 'DEVICE_BIND_REQUIRED', 'Bind device before DM', reqId);
      return;
    }

    const targetWs = this.findWsByUid(targetUid);
    if (!targetWs) {
      this.sendError(ws, 'USER_OFFLINE', 'Target user is offline', reqId);
      return;
    }

    const target = this.sessions.get(targetWs);
    if (!target) {
      this.sendError(ws, 'USER_OFFLINE', 'Target user is offline', reqId);
      return;
    }

    if (sender.groups.size >= MAX_GROUPS_PER_USER || target.groups.size >= MAX_GROUPS_PER_USER) {
      this.sendError(ws, 'GROUP_LIMIT', `Maximum ${MAX_GROUPS_PER_USER} groups`, reqId);
      return;
    }

    for (const session of this.sessions.values()) {
      if (!session.groups.has(groupId)) continue;
      if (session.uid !== sender.uid && session.uid !== target.uid) {
        this.sendError(ws, 'DM_THIRD_PARTY', 'Direct group is restricted to two users', reqId);
        return;
      }
    }

    const targetHasSender = await this.hasContactEntry(target.deviceFingerprint, sender.deviceFingerprint);
    if (targetHasSender) {
      this.activateDirectGroup(ws, sender, targetWs, target, groupId, reqId);
      void this.logAction('DIRECT_START', `from=${sender.uid},to=${target.uid},group=${groupId}`);
      return;
    }

    if (target.dmContactsOnly !== false) {
      this.sendError(ws, 'DM_CONTACTS_ONLY', 'Target only accepts DMs from contacts', reqId);
      return;
    }

    this.cleanupDirectRequests();
    let existing = null;
    for (const req of this.directRequests.values()) {
      if (!req) continue;
      if (req.fromUid === sender.uid && req.targetUid === target.uid && req.groupId === groupId) {
        existing = req;
        break;
      }
    }
    if (!existing) {
      let requestId = `dr-${randomHex(6)}`;
      while (this.directRequests.has(requestId)) {
        requestId = `dr-${randomHex(6)}`;
      }
      existing = {
        requestId,
        groupId,
        fromUid: sender.uid,
        fromNickname: sender.nickname || '',
        fromFingerprint: sender.deviceFingerprint,
        targetUid: target.uid,
        targetFingerprint: target.deviceFingerprint,
        createdAt: Date.now(),
      };
      this.directRequests.set(requestId, existing);
    }

    this.sendTo(ws, {
      type: 'direct_request_pending',
      requestId: existing.requestId,
      groupId,
      targetUid: target.uid,
      reqId,
    });
    this.sendTo(targetWs, {
      type: 'direct_request',
      requestId: existing.requestId,
      groupId,
      fromUid: sender.uid,
      fromNickname: sender.nickname || '',
      reqId,
    });
    void this.logAction('DIRECT_REQUEST', `from=${sender.uid},to=${target.uid},group=${groupId}`);
  }

  async handleDirectRequestDecision(ws, sender, data, reqId, approve) {
    if (!this.requireDeviceBound(ws, sender, reqId)) return;
    const requestId = sanitizeText(data.requestId, 80);
    if (!requestId) {
      this.handleInvalidAction(ws, 'INVALID_DIRECT_REQUEST', 'requestId required', reqId);
      return;
    }

    this.cleanupDirectRequests();
    const request = this.directRequests.get(requestId);
    if (!request) {
      this.sendError(ws, 'DIRECT_REQUEST_EXPIRED', 'Direct request expired', reqId);
      return;
    }
    if (request.targetUid !== sender.uid || request.targetFingerprint !== sender.deviceFingerprint) {
      this.sendError(ws, 'DIRECT_REQUEST_FORBIDDEN', 'Request does not belong to this user', reqId);
      return;
    }

    this.directRequests.delete(requestId);
    const requesterWs = this.findWsByUid(request.fromUid);
    const requester = requesterWs ? this.sessions.get(requesterWs) : null;

    if (!approve) {
      if (requesterWs) {
        this.sendTo(requesterWs, {
          type: 'direct_request_result',
          requestId,
          groupId: request.groupId,
          approved: false,
          targetUid: sender.uid,
          reqId,
        });
      }
      return;
    }

    if (!requesterWs || !requester) {
      this.sendError(ws, 'USER_OFFLINE', 'Requester is offline', reqId);
      return;
    }
    if (requester.groups.size >= MAX_GROUPS_PER_USER || sender.groups.size >= MAX_GROUPS_PER_USER) {
      this.sendError(ws, 'GROUP_LIMIT', `Maximum ${MAX_GROUPS_PER_USER} groups`, reqId);
      return;
    }

    this.activateDirectGroup(requesterWs, requester, ws, sender, request.groupId, reqId);
    this.sendTo(requesterWs, {
      type: 'direct_request_result',
      requestId,
      groupId: request.groupId,
      approved: true,
      targetUid: sender.uid,
      reqId,
    });
    this.sendTo(ws, {
      type: 'direct_request_result',
      requestId,
      groupId: request.groupId,
      approved: true,
      targetUid: requester.uid,
      reqId,
    });
  }

  async handlePairAccept(ws, sender, data, reqId) {
    const dmGroupId = sanitizeGroupId(data.dmGroupId);
    const groupId = sanitizeGroupId(data.groupId);
    const inviteCode = sanitizeText(data.inviteCode, 700);
    const targetUid = sanitizeText(data.targetUid, 80);
    if (!dmGroupId || !groupId || !inviteCode || !targetUid) {
      this.handleInvalidAction(ws, 'INVALID_PAIR_ACCEPT', 'dmGroupId, groupId, inviteCode, targetUid required', reqId);
      return;
    }
    if (!isDirectGroupId(dmGroupId)) {
      this.handleInvalidAction(ws, 'INVALID_PAIR_ACCEPT', 'dmGroupId must be dm-*', reqId);
      return;
    }
    if (!sender.groups.has(dmGroupId)) {
      this.sendError(ws, 'NOT_IN_GROUP', 'Join dm group before accepting', reqId);
      return;
    }

    const targetWs = this.findWsByUid(targetUid);
    if (!targetWs) {
      this.sendError(ws, 'USER_OFFLINE', 'Target user is offline', reqId);
      return;
    }
    const target = this.sessions.get(targetWs);
    if (!target || !target.groups.has(dmGroupId)) {
      this.sendError(ws, 'NOT_IN_GROUP', 'Target not in dm group', reqId);
      return;
    }

    let invite;
    try {
      invite = await this.verifyInviteCode(inviteCode, groupId);
    } catch (error) {
      if (error instanceof Error && error.message === 'INVITE_SIGNING_SECRET_MISSING') {
        this.sendError(ws, 'SERVER_CONFIG_ERROR', 'Invite signing secret missing', reqId);
        return;
      }
      throw error;
    }
    if (!invite) {
      this.sendError(ws, 'INVITE_INVALID', 'Invite code invalid', reqId);
      return;
    }

    this.sendTo(ws, {
      type: 'pair_accepted',
      dmGroupId,
      groupId,
      inviteCode,
      from: sender.uid,
      to: targetUid,
      reqId,
    });
    this.sendTo(targetWs, {
      type: 'pair_accepted',
      dmGroupId,
      groupId,
      inviteCode,
      from: sender.uid,
      to: targetUid,
      reqId,
    });
  }

  async handlePairDecline(ws, sender, data, reqId) {
    const dmGroupId = sanitizeGroupId(data.dmGroupId);
    const groupId = sanitizeGroupId(data.groupId);
    const targetUid = sanitizeText(data.targetUid, 80);
    if (!dmGroupId || !groupId || !targetUid) {
      this.handleInvalidAction(ws, 'INVALID_PAIR_DECLINE', 'dmGroupId, groupId, targetUid required', reqId);
      return;
    }
    if (!isDirectGroupId(dmGroupId)) {
      this.handleInvalidAction(ws, 'INVALID_PAIR_DECLINE', 'dmGroupId must be dm-*', reqId);
      return;
    }
    if (!sender.groups.has(dmGroupId)) {
      this.sendError(ws, 'NOT_IN_GROUP', 'Join dm group before declining', reqId);
      return;
    }

    const targetWs = this.findWsByUid(targetUid);
    if (!targetWs) {
      this.sendError(ws, 'USER_OFFLINE', 'Target user is offline', reqId);
      return;
    }
    const target = this.sessions.get(targetWs);
    if (!target || !target.groups.has(dmGroupId)) {
      this.sendError(ws, 'NOT_IN_GROUP', 'Target not in dm group', reqId);
      return;
    }

    this.sendTo(ws, {
      type: 'pair_declined',
      dmGroupId,
      groupId,
      from: sender.uid,
      to: targetUid,
      reqId,
    });
    this.sendTo(targetWs, {
      type: 'pair_declined',
      dmGroupId,
      groupId,
      from: sender.uid,
      to: targetUid,
      reqId,
    });
  }

  async handleContactsList(ws, sender, reqId) {
    if (!this.requireDeviceBound(ws, sender, reqId)) return;
    if (!this.env.DB || typeof this.env.DB.prepare !== 'function') {
      this.sendError(ws, 'DB_NOT_READY', 'Contacts database unavailable', reqId);
      return;
    }

    await this.ensureContactsSchema();
    const deviceFp = sender.deviceFingerprint;
    try {
      const res = await this.env.DB.prepare(
        'SELECT contact_fp, alias, created_at, updated_at FROM contacts WHERE device_fp = ? ORDER BY updated_at DESC'
      )
        .bind(deviceFp)
        .all();

      const rows = res.results || [];
      const contactFps = rows.map((row) => row.contact_fp).filter(Boolean);
      const nicknameMap = await this.getDeviceNicknames(contactFps);
      let mutualSet = new Set();
      if (contactFps.length) {
        const placeholders = contactFps.map(() => '?').join(',');
        const mutualRes = await this.env.DB.prepare(
          `SELECT device_fp FROM contacts WHERE contact_fp = ? AND device_fp IN (${placeholders})`
        )
          .bind(deviceFp, ...contactFps)
          .all();
        mutualSet = new Set((mutualRes.results || []).map((row) => row.device_fp));
      }

      const contacts = rows.map((row) => {
        const contactFp = row.contact_fp;
        const online = this.findSessionByFingerprint(contactFp);
        return {
          contactFingerprint: contactFp,
          alias: row.alias || '',
          nickname: (online && online.nickname) || nicknameMap.get(contactFp) || '',
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          onlineUid: online ? online.uid : '',
          os: online ? online.os : '',
          location: online ? online.location : '',
          mutual: mutualSet.has(contactFp),
        };
      });

      this.sendTo(ws, { type: 'contacts_list', contacts, reqId });
    } catch {
      this.sendError(ws, 'DB_ERROR', 'Failed to load contacts', reqId);
    }
  }

  cleanupContactRequests() {
    const now = Date.now();
    for (const [requestId, request] of this.contactRequests.entries()) {
      if (!request || now - request.createdAt > CONTACT_REQUEST_TTL_MS) {
        this.contactRequests.delete(requestId);
      }
    }
  }

  async handleContactsRequest(ws, sender, data, reqId) {
    if (!this.requireDeviceBound(ws, sender, reqId)) return;
    if (!this.env.DB || typeof this.env.DB.prepare !== 'function') {
      this.sendError(ws, 'DB_NOT_READY', 'Contacts database unavailable', reqId);
      return;
    }

    const targetUid = sanitizeText(data.targetUid, 80);
    if (!targetUid) {
      this.handleInvalidAction(ws, 'INVALID_CONTACT_ADD', 'targetUid required', reqId);
      return;
    }

    const targetWs = this.findWsByUid(targetUid);
    if (!targetWs) {
      this.sendError(ws, 'CONTACT_TARGET_OFFLINE', 'Target user is offline', reqId);
      return;
    }
    const target = this.sessions.get(targetWs);
    if (!target || !target.deviceBound || !target.deviceFingerprint) {
      this.sendError(ws, 'CONTACT_TARGET_UNBOUND', 'Target device not bound', reqId);
      return;
    }
    if (target.deviceFingerprint === sender.deviceFingerprint) {
      this.sendError(ws, 'CONTACT_SELF', 'Cannot add your own device', reqId);
      return;
    }

    await this.ensureContactsSchema();
    const senderHasTarget = await this.hasContactEntry(sender.deviceFingerprint, target.deviceFingerprint);
    const targetHasSender = await this.hasContactEntry(target.deviceFingerprint, sender.deviceFingerprint);

    if (senderHasTarget && targetHasSender) {
      this.cleanupContactRequests();
      for (const [rid, existing] of this.contactRequests.entries()) {
        if (!existing) continue;
        const samePair =
          (existing.fromFingerprint === sender.deviceFingerprint &&
            existing.toFingerprint === target.deviceFingerprint) ||
          (existing.fromFingerprint === target.deviceFingerprint &&
            existing.toFingerprint === sender.deviceFingerprint);
        if (samePair) {
          this.contactRequests.delete(rid);
        }
      }
      this.sendError(ws, 'CONTACT_ALREADY_MUTUAL', 'Already in mutual contacts', reqId);
      return;
    }

    if (targetHasSender) {
      this.cleanupContactRequests();
      for (const [rid, existing] of this.contactRequests.entries()) {
        if (!existing) continue;
        const samePair =
          (existing.fromFingerprint === sender.deviceFingerprint &&
            existing.toFingerprint === target.deviceFingerprint) ||
          (existing.fromFingerprint === target.deviceFingerprint &&
            existing.toFingerprint === sender.deviceFingerprint);
        if (samePair) {
          this.contactRequests.delete(rid);
        }
      }
      const now = Date.now();
      const alias = resolveContactAlias(data.alias, target, target.uid);
      try {
        await this.env.DB.prepare(
          'INSERT INTO contacts (device_fp, contact_fp, alias, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(device_fp, contact_fp) DO UPDATE SET alias = excluded.alias, updated_at = excluded.updated_at'
        )
          .bind(sender.deviceFingerprint, target.deviceFingerprint, alias, now, now)
          .run();

        const targetSideRow = await this.env.DB.prepare(
          'SELECT alias, created_at, updated_at FROM contacts WHERE device_fp = ? AND contact_fp = ? LIMIT 1'
        )
          .bind(target.deviceFingerprint, sender.deviceFingerprint)
          .first();

        this.sendTo(ws, {
          type: 'contacts_saved',
          contact: {
            contactFingerprint: target.deviceFingerprint,
            alias,
            nickname: target.nickname || '',
            createdAt: now,
            updatedAt: now,
            onlineUid: target.uid,
            os: target.os,
            location: target.location,
            mutual: true,
          },
          reqId,
        });

        this.sendTo(targetWs, {
          type: 'contacts_saved',
          contact: {
            contactFingerprint: sender.deviceFingerprint,
            alias: targetSideRow?.alias || `用户 ${sender.uid}`,
            nickname: sender.nickname || '',
            createdAt: targetSideRow?.created_at || now,
            updatedAt: now,
            onlineUid: sender.uid,
            os: sender.os,
            location: sender.location,
            mutual: true,
          },
          reqId,
        });
      } catch {
        this.sendError(ws, 'DB_ERROR', 'Failed to save contact', reqId);
      }
      return;
    }

    this.cleanupContactRequests();
    for (const existing of this.contactRequests.values()) {
      if (
        existing &&
        existing.fromFingerprint === sender.deviceFingerprint &&
        existing.toFingerprint === target.deviceFingerprint
      ) {
        this.sendError(ws, 'CONTACT_REQUEST_PENDING', 'Request already pending', reqId);
        return;
      }
    }

    let requestId = `cr-${randomHex(6)}`;
    while (this.contactRequests.has(requestId)) {
      requestId = `cr-${randomHex(6)}`;
    }

    const alias = resolveContactAlias(data.alias, target, target.uid);
    const now = Date.now();
    this.contactRequests.set(requestId, {
      requestId,
      fromUid: sender.uid,
      fromOs: sender.os || '',
      fromLocation: sender.location || '',
      fromFingerprint: sender.deviceFingerprint,
      toUid: target.uid,
      toFingerprint: target.deviceFingerprint,
      alias,
      createdAt: now,
    });

    this.sendTo(ws, {
      type: 'contacts_request_sent',
      requestId,
      targetUid: target.uid,
      reqId,
    });

    this.sendTo(targetWs, {
      type: 'contacts_request',
      requestId,
      fromUid: sender.uid,
      fromFingerprintShort: sender.deviceFingerprint.slice(0, 10),
      fromOs: sender.os || '',
      fromLocation: sender.location || '',
      reqId,
    });
  }

  async handleContactsRemove(ws, sender, data, reqId) {
    if (!this.requireDeviceBound(ws, sender, reqId)) return;
    if (!this.env.DB || typeof this.env.DB.prepare !== 'function') {
      this.sendError(ws, 'DB_NOT_READY', 'Contacts database unavailable', reqId);
      return;
    }

    const contactFp = sanitizeDeviceFingerprint(data.contactFingerprint);
    if (!contactFp) {
      this.handleInvalidAction(ws, 'INVALID_CONTACT_REMOVE', 'contactFingerprint required', reqId);
      return;
    }

    await this.ensureContactsSchema();
    try {
      await this.env.DB.prepare('DELETE FROM contacts WHERE device_fp = ? AND contact_fp = ?')
        .bind(sender.deviceFingerprint, contactFp)
        .run();
      this.sendTo(ws, { type: 'contacts_removed', contactFingerprint: contactFp, reqId });
    } catch {
      this.sendError(ws, 'DB_ERROR', 'Failed to remove contact', reqId);
    }
  }

  async handleContactsAccept(ws, sender, data, reqId) {
    if (!this.requireDeviceBound(ws, sender, reqId)) return;
    if (!this.env.DB || typeof this.env.DB.prepare !== 'function') {
      this.sendError(ws, 'DB_NOT_READY', 'Contacts database unavailable', reqId);
      return;
    }

    const requestId = sanitizeText(data.requestId, 80);
    if (!requestId) {
      this.handleInvalidAction(ws, 'INVALID_CONTACT_REQUEST', 'requestId required', reqId);
      return;
    }

    this.cleanupContactRequests();
    const request = this.contactRequests.get(requestId);
    if (!request || request.toFingerprint !== sender.deviceFingerprint) {
      this.sendError(ws, 'CONTACT_REQUEST_INVALID', 'Request not found', reqId);
      return;
    }

    if (Date.now() - request.createdAt > CONTACT_REQUEST_TTL_MS) {
      this.contactRequests.delete(requestId);
      this.sendError(ws, 'CONTACT_REQUEST_EXPIRED', 'Request expired', reqId);
      return;
    }

    const now = Date.now();
    await this.ensureContactsSchema();
    try {
      const requesterWs = this.deviceSessions.get(request.fromFingerprint);
      const requester = requesterWs ? this.sessions.get(requesterWs) : null;
      const requesterUid = requester?.uid || request.fromUid || '';
      const requesterNickname = requester?.nickname || await this.getDeviceNickname(request.fromFingerprint);
      const senderNickname = sender.nickname || await this.getDeviceNickname(sender.deviceFingerprint);
      const reverseAlias = defaultContactAliasForSession(
        requester ? { ...requester, nickname: requesterNickname } : { uid: requesterUid, nickname: requesterNickname },
        requesterUid
      );
      await this.env.DB.prepare(
        'INSERT INTO contacts (device_fp, contact_fp, alias, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(device_fp, contact_fp) DO UPDATE SET alias = excluded.alias, updated_at = excluded.updated_at'
      )
        .bind(request.fromFingerprint, request.toFingerprint, request.alias, now, now)
        .run();
      await this.env.DB.prepare(
        'INSERT INTO contacts (device_fp, contact_fp, alias, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(device_fp, contact_fp) DO UPDATE SET alias = excluded.alias, updated_at = excluded.updated_at'
      )
        .bind(request.toFingerprint, request.fromFingerprint, reverseAlias, now, now)
        .run();

      this.sendTo(ws, {
        type: 'contacts_saved',
        contact: {
          contactFingerprint: request.fromFingerprint,
          alias: reverseAlias,
          nickname: requesterNickname || '',
          createdAt: now,
          updatedAt: now,
          onlineUid: requesterUid,
          os: requester ? requester.os : '',
          location: requester ? requester.location : '',
          mutual: true,
        },
        reqId,
      });

      if (requesterWs) {
        this.sendTo(requesterWs, {
          type: 'contacts_saved',
          contact: {
            contactFingerprint: request.toFingerprint,
            alias: request.alias,
            nickname: senderNickname || '',
            createdAt: now,
            updatedAt: now,
            onlineUid: sender.uid,
            os: sender.os,
            location: sender.location,
            mutual: true,
          },
          reqId,
        });
      }

      this.sendTo(ws, {
        type: 'contacts_request_result',
        requestId,
        status: 'accepted',
        forRequester: false,
        peerUid: request.fromUid || '',
        ts: now,
        reqId,
      });
      if (requesterWs) {
        this.sendTo(requesterWs, {
          type: 'contacts_request_result',
          requestId,
          status: 'accepted',
          forRequester: true,
          peerUid: request.toUid || '',
          ts: now,
          reqId,
        });
      }
      this.contactRequests.delete(requestId);
    } catch {
      this.sendError(ws, 'DB_ERROR', 'Failed to save contact', reqId);
      return;
    }
  }

  async handleContactsDecline(ws, sender, data, reqId) {
    if (!this.requireDeviceBound(ws, sender, reqId)) return;

    const requestId = sanitizeText(data.requestId, 80);
    if (!requestId) {
      this.handleInvalidAction(ws, 'INVALID_CONTACT_REQUEST', 'requestId required', reqId);
      return;
    }

    this.cleanupContactRequests();
    const request = this.contactRequests.get(requestId);
    if (!request || request.toFingerprint !== sender.deviceFingerprint) {
      this.sendError(ws, 'CONTACT_REQUEST_INVALID', 'Request not found', reqId);
      return;
    }

    const now = Date.now();
    this.contactRequests.delete(requestId);
    this.sendTo(ws, {
      type: 'contacts_request_result',
      requestId,
      status: 'declined',
      forRequester: false,
      peerUid: request.fromUid || '',
      ts: now,
      reqId,
    });
    const requesterWs = this.deviceSessions.get(request.fromFingerprint);
    if (requesterWs) {
      this.sendTo(requesterWs, {
        type: 'contacts_request_result',
        requestId,
        status: 'declined',
        forRequester: true,
        peerUid: request.toUid || '',
        ts: now,
        reqId,
      });
    }
  }

  async handleContactsMigrateInit(ws, sender, reqId) {
    if (!this.requireDeviceBound(ws, sender, reqId)) return;
    if (!this.env.DB || typeof this.env.DB.prepare !== 'function') {
      this.sendError(ws, 'DB_NOT_READY', 'Contacts database unavailable', reqId);
      return;
    }

    await this.ensureContactsSchema();
    const code = `MC-${randomHex(3)}`.toUpperCase();
    const now = Date.now();
    try {
      await this.env.DB.prepare('DELETE FROM contact_migrations WHERE new_device_fp = ?')
        .bind(sender.deviceFingerprint)
        .run();
      await this.env.DB.prepare(
        'INSERT INTO contact_migrations (code, new_device_fp, created_at, status, transfer_nickname) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(code, sender.deviceFingerprint, now, 'pending', 1)
        .run();
      this.sendTo(ws, { type: 'contacts_migrate_code', code, expiresAt: now + MIGRATION_TTL_MS, reqId });
    } catch {
      this.sendError(ws, 'DB_ERROR', 'Failed to create migration code', reqId);
    }
  }

  async handleContactsMigrateApprove(ws, sender, data, reqId) {
    if (!this.requireDeviceBound(ws, sender, reqId)) return;
    if (!this.env.DB || typeof this.env.DB.prepare !== 'function') {
      this.sendError(ws, 'DB_NOT_READY', 'Contacts database unavailable', reqId);
      return;
    }

    const rawCode = sanitizeText(data.code, 32);
    if (!rawCode) {
      this.handleInvalidAction(ws, 'INVALID_MIGRATION_CODE', 'code required', reqId);
      return;
    }
    const code = rawCode.toUpperCase();
    const transferNickname = data.transferNickname !== false;

    await this.ensureContactsSchema();
    try {
      const row = await this.env.DB.prepare(
        'SELECT code, new_device_fp, created_at, status, transfer_nickname FROM contact_migrations WHERE code = ?'
      )
        .bind(code)
        .first();

      if (!row || row.status !== 'pending') {
        this.sendError(ws, 'MIGRATION_INVALID', 'Migration code invalid', reqId);
        return;
      }

      if (Date.now() - row.created_at > MIGRATION_TTL_MS) {
        await this.env.DB.prepare('DELETE FROM contact_migrations WHERE code = ?').bind(code).run();
        this.sendError(ws, 'MIGRATION_EXPIRED', 'Migration code expired', reqId);
        return;
      }

      if (row.new_device_fp === sender.deviceFingerprint) {
        this.sendError(ws, 'MIGRATION_SAME_DEVICE', 'New and old device cannot be the same', reqId);
        return;
      }

      await this.env.DB.prepare(
        'UPDATE contact_migrations SET old_device_fp = ?, status = ?, transfer_nickname = ? WHERE code = ?'
      )
        .bind(sender.deviceFingerprint, 'approved', transferNickname ? 1 : 0, code)
        .run();

      this.sendTo(ws, { type: 'contacts_migrate_waiting', code, transferNickname, reqId });
      const newWs = this.findWsByFingerprint(row.new_device_fp);
      if (newWs) {
        this.sendTo(newWs, {
          type: 'contacts_migrate_request',
          code,
          fromFingerprintShort: sender.deviceFingerprint.slice(0, 10),
          fromOs: sender.os || '',
          fromLocation: sender.location || '',
          transferNickname,
          oldNickname: sender.nickname || '',
        });
      }
    } catch {
      this.sendError(ws, 'DB_ERROR', 'Failed to migrate contacts', reqId);
    }
  }

  async handleContactsMigrateConfirm(ws, sender, data, reqId) {
    if (!this.requireDeviceBound(ws, sender, reqId)) return;
    if (!this.env.DB || typeof this.env.DB.prepare !== 'function') {
      this.sendError(ws, 'DB_NOT_READY', 'Contacts database unavailable', reqId);
      return;
    }

    const rawCode = sanitizeText(data.code, 32);
    if (!rawCode) {
      this.handleInvalidAction(ws, 'INVALID_MIGRATION_CODE', 'code required', reqId);
      return;
    }
    const code = rawCode.toUpperCase();

    await this.ensureContactsSchema();
    try {
      const row = await this.env.DB.prepare(
        'SELECT code, new_device_fp, old_device_fp, created_at, status, transfer_nickname FROM contact_migrations WHERE code = ?'
      )
        .bind(code)
        .first();

      if (!row || row.status !== 'approved') {
        this.sendError(ws, 'MIGRATION_NOT_APPROVED', 'Migration not approved yet', reqId);
        return;
      }

      if (Date.now() - row.created_at > MIGRATION_TTL_MS) {
        await this.env.DB.prepare('DELETE FROM contact_migrations WHERE code = ?').bind(code).run();
        this.sendError(ws, 'MIGRATION_EXPIRED', 'Migration code expired', reqId);
        return;
      }

      if (row.new_device_fp !== sender.deviceFingerprint) {
        this.sendError(ws, 'MIGRATION_NOT_NEW_DEVICE', 'Only new device can confirm migration', reqId);
        return;
      }

      if (!row.old_device_fp) {
        this.sendError(ws, 'MIGRATION_INVALID', 'Old device not set', reqId);
        return;
      }

      await this.env.DB.prepare(
        'INSERT INTO contacts (device_fp, contact_fp, alias, created_at, updated_at) SELECT ?, contact_fp, alias, created_at, updated_at FROM contacts WHERE device_fp = ? ON CONFLICT(device_fp, contact_fp) DO UPDATE SET alias = excluded.alias, updated_at = excluded.updated_at'
      )
        .bind(row.new_device_fp, row.old_device_fp)
        .run();
      await this.env.DB.prepare(
        'INSERT INTO group_memberships (device_fp, group_id, joined_at) SELECT ?, group_id, joined_at FROM group_memberships WHERE device_fp = ? ON CONFLICT(device_fp, group_id) DO UPDATE SET joined_at = excluded.joined_at'
      )
        .bind(row.new_device_fp, row.old_device_fp)
        .run();

      let transferredNickname = '';
      if (Number(row.transfer_nickname) === 1) {
        transferredNickname = await this.transferDeviceNickname(row.old_device_fp, row.new_device_fp);
      }

      const countRow = await this.env.DB.prepare(
        'SELECT COUNT(*) as cnt FROM contacts WHERE device_fp = ?'
      )
        .bind(row.new_device_fp)
        .first();
      const count = countRow?.cnt || 0;

      await this.env.DB.prepare('DELETE FROM contact_migrations WHERE code = ?').bind(code).run();

      sender.nickname = await this.ensureDeviceNickname(sender.deviceFingerprint);
      this.sendNicknameState(ws, sender.nickname);
      this.sendTo(ws, { type: 'contacts_migrate_done', code, count, transferredNickname, reqId });
      const oldWs = this.findWsByFingerprint(row.old_device_fp);
      if (oldWs) {
        const oldSession = this.sessions.get(oldWs);
        if (oldSession) {
          oldSession.nickname = await this.ensureDeviceNickname(oldSession.deviceFingerprint);
          this.sendNicknameState(oldWs, oldSession.nickname);
        }
        this.sendTo(oldWs, { type: 'contacts_migrate_done', code, count, transferredNickname });
      }
      this.broadcastSystemStatus();
    } catch {
      this.sendError(ws, 'DB_ERROR', 'Failed to migrate contacts', reqId);
    }
  }

  async handleChat(ws, sender, data, reqId) {
    const groupId = sanitizeGroupId(data.groupId) || SYSTEM_GROUP;
    if (!sender.groups.has(groupId)) {
      this.sendError(ws, 'NOT_IN_GROUP', 'Join group before sending', reqId);
      return;
    }

    const payloadType =
      data.payloadType === 'image'
        ? 'image'
        : data.payloadType === 'audio'
          ? 'audio'
          : data.payloadType === 'text'
            ? 'text'
            : null;
    if (!payloadType) {
      this.handleInvalidAction(ws, 'INVALID_PAYLOAD_TYPE', 'payloadType must be text, image or audio', reqId);
      return;
    }

    const encType = data.encType === 'dm' ? 'dm' : '';
    if (encType === 'dm' && !isDirectGroupId(groupId)) {
      this.handleInvalidAction(ws, 'INVALID_ENCTYPE', 'encType dm is only allowed for dm groups', reqId);
      return;
    }

    let dmPairKey = '';
    let dmRestricted = false;
    if (isDirectGroupId(groupId)) {
      if (!sender.deviceBound || !sender.deviceFingerprint) {
        this.sendError(ws, 'DEVICE_BIND_REQUIRED', 'Bind device before DM', reqId);
        return;
      }
      if (encType !== 'dm') {
        this.handleInvalidAction(ws, 'INVALID_ENCTYPE', 'DM requires encType dm', reqId);
        return;
      }
      const participants = parseDirectGroupId(groupId);
      if (!participants || !participants.includes(sender.uid)) {
        this.handleInvalidAction(ws, 'INVALID_DIRECT_GROUP', 'Invalid dm group participants', reqId);
        return;
      }
      const peerUid = participants[0] === sender.uid ? participants[1] : participants[0];
      const peerFingerprint = sanitizeDeviceFingerprint(peerUid);
      if (!peerFingerprint) {
        this.handleInvalidAction(ws, 'INVALID_DIRECT_GROUP', 'Invalid dm peer fingerprint', reqId);
        return;
      }

      dmPairKey = this.dmPairByGroup.get(groupId) || buildDmPairKey(sender.deviceFingerprint, peerFingerprint);
      if (dmPairKey) {
        this.dmPairByGroup.set(groupId, dmPairKey);
      }

      const pairUnlocked = dmPairKey ? this.dmUnlocked.has(dmPairKey) : false;
      const inPeerContacts = await this.hasContactEntry(peerFingerprint, sender.deviceFingerprint);
      dmRestricted = !pairUnlocked && !inPeerContacts;

      if (dmRestricted && dmPairKey) {
        const lastSender = this.dmLastSender.get(dmPairKey);
        if (lastSender && lastSender === sender.deviceFingerprint) {
          this.sendError(ws, 'DM_WAIT_REPLY', 'Wait for reply before sending again', reqId);
          return;
        }
      }
    }

    const allowed = this.allowRate(sender, payloadType === 'image' ? 'image' : 'chat');
    if (!allowed) {
      this.sendError(ws, 'RATE_LIMIT', payloadType === 'image' ? 'Too many images' : 'Too many messages', reqId);
      return;
    }

    if (!isBase64(data.ciphertext) || !isBase64(data.iv, 256)) {
      this.handleInvalidAction(ws, 'INVALID_CIPHERTEXT', 'ciphertext/iv must be base64', reqId);
      return;
    }

    if (!data.keys || typeof data.keys !== 'object') {
      this.handleInvalidAction(ws, 'INVALID_KEYS', 'keys map is required', reqId);
      return;
    }

    const msgId = sanitizeText(data.msgId, 80) || crypto.randomUUID();
    const ts = Date.now();
    const mimeType = typeof data.mimeType === 'string' ? data.mimeType.slice(0, 80) : null;
    const name = typeof data.name === 'string' ? data.name.slice(0, 120) : null;
    const burnAfterRead = data.burnAfterRead === true;
    const burnAfterMs = Number.isFinite(Number(data.burnAfterMs))
      ? Math.max(0, Math.min(120_000, Math.floor(Number(data.burnAfterMs))))
      : 0;

    let delivered = 0;
    for (const [targetWs, target] of this.sessions.entries()) {
      if (target.uid === sender.uid) continue;
      if (!target.groups.has(groupId)) continue;

      const encryptedKey = data.keys[target.uid];
      if (!isBase64(encryptedKey, MAX_ENCRYPTED_KEY_LENGTH)) continue;

      this.sendTo(targetWs, {
        type: 'chat',
        msgId,
        groupId,
        sender: sender.uid,
        senderIdentitySign: encType === 'dm' ? sender.identitySign || '' : undefined,
        senderIdentityDh: encType === 'dm' ? sender.identityDh || '' : undefined,
        senderIdentitySig: encType === 'dm' ? sender.identitySig || '' : undefined,
        ts,
        payloadType,
        iv: data.iv,
        ciphertext: data.ciphertext,
        encryptedKey,
        encType: encType || undefined,
        mimeType,
        name,
        burnAfterRead,
        burnAfterMs,
      });
      delivered += 1;
    }

    // 立即回 ack（不等离线队列），客户端秒级响应
    this.sendTo(ws, {
      type: 'sent_ack',
      msgId,
      groupId,
      ts,
      delivered,
      dmRestricted: isDirectGroupId(groupId) ? dmRestricted : undefined,
      reqId,
    });

    if (!delivered) {
      this.sendError(ws, 'NO_RECIPIENT', 'No available recipients in this group', reqId);
    } else if (isDirectGroupId(groupId)) {
      if (dmPairKey && !this.dmUnlocked.has(dmPairKey)) {
        const lastSender = this.dmLastSender.get(dmPairKey);
        if (lastSender && lastSender !== sender.deviceFingerprint) {
          this.dmUnlocked.add(dmPairKey);
          this.dmLastSender.delete(dmPairKey);
        } else {
          this.dmLastSender.set(dmPairKey, sender.deviceFingerprint);
        }
      }
    }

    // 离线队列投递：异步执行，D1 持久化失败由服务端内部重试，客户端不感知
    void this.queueOfflineDeliveries(groupId, sender, data, msgId, ts, payloadType, encType, mimeType, name, burnAfterRead, burnAfterMs);

    void this.logAction(
      'CHAT',
      `uid=${sender.uid},group=${groupId},kind=${payloadType},delivered=${delivered}`
    );
  }

  /**
   * 异步为离线成员入队消息（D1 持久化失败由服务端内部重试）
   */
  async queueOfflineDeliveries(groupId, sender, data, msgId, ts, payloadType, encType, mimeType, name, burnAfterRead, burnAfterMs) {
    try {
      if (!isDirectGroupId(groupId)) {
        const memberFps = await this.getPersistedGroupMemberIds(groupId);
        const onlineFps = new Set();
        for (const session of this.sessions.values()) {
          if (session.deviceFingerprint) onlineFps.add(session.deviceFingerprint);
        }
        for (const fp of memberFps) {
          if (fp === sender.deviceFingerprint) continue;
          if (onlineFps.has(fp)) continue;
          const encryptedKey = data.keys[fp];
          if (!isBase64(encryptedKey, MAX_ENCRYPTED_KEY_LENGTH)) continue;
          this.enqueueOfflineMessage(fp, {
            id: String(++this.globalMsgSeq),
            data: {
              type: 'chat', msgId, groupId, sender: sender.uid, ts, payloadType,
              iv: data.iv, ciphertext: data.ciphertext, encryptedKey,
              encType: encType || undefined, mimeType, name, burnAfterRead, burnAfterMs,
            },
          });
        }
      } else {
        const participants = parseDirectGroupId(groupId);
        if (participants) {
          const peerUid = participants[0] === sender.uid ? participants[1] : participants[0];
          const peerFp = sanitizeDeviceFingerprint(peerUid);
          const peerOnline = [...this.sessions.values()].some(s => s.uid === peerUid);
          if (!peerOnline && peerFp) {
            const encryptedKey = data.keys[peerUid];
            if (isBase64(encryptedKey, MAX_ENCRYPTED_KEY_LENGTH)) {
              this.enqueueOfflineMessage(peerFp, {
                id: String(++this.globalMsgSeq),
                data: {
                  type: 'chat', msgId, groupId, sender: sender.uid,
                  senderIdentitySign: sender.identitySign || '',
                  senderIdentityDh: sender.identityDh || '',
                  senderIdentitySig: sender.identitySig || '',
                  ts, payloadType, iv: data.iv, ciphertext: data.ciphertext,
                  encryptedKey, encType: 'dm', mimeType, name, burnAfterRead, burnAfterMs,
                },
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('[OfflineQueue] queueOfflineDeliveries failed:', e.message);
    }
  }

  handleReadReceipt(ws, sender, data, reqId) {
    const toUid = sanitizeText(data.to, 80);
    const targetMsgId = sanitizeText(data.targetMsgId, 80);
    const groupId = sanitizeGroupId(data.groupId) || SYSTEM_GROUP;
    if (!toUid || !targetMsgId) {
      this.handleInvalidAction(ws, 'INVALID_READ_RECEIPT', 'to and targetMsgId are required', reqId);
      return;
    }

    const targetWs = this.findWsByUid(toUid);
    if (!targetWs) return;

    const target = this.sessions.get(targetWs);
    if (!target) return;

    if (!sender.groups.has(groupId) || !target.groups.has(groupId)) return;

    this.sendTo(targetWs, {
      type: 'read_receipt',
      sender: sender.uid,
      groupId,
      targetMsgId,
      ts: Date.now(),
      reqId,
    });
  }

  async logAction(action, details) {
    if (!this.env.DB || typeof this.env.DB.prepare !== 'function') return;

    try {
      await this.env.DB.prepare('INSERT INTO logs (action, details, created_at) VALUES (?, ?, ?)')
        .bind(action, details, Date.now())
        .run();
    } catch {
      // no-op
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/check') {
      const inviteSigningSecretConfigured = Boolean(
        getConfiguredSecret(env.INVITE_SIGNING_SECRET, MIN_INVITE_SIGNING_SECRET_LENGTH)
      );
      return new Response(
        JSON.stringify({
          status: inviteSigningSecretConfigured ? 'ok' : 'degraded',
          service: 'LINKCONNECT-backend',
          date: new Date().toISOString(),
          config: {
            inviteSigningSecretConfigured,
          },
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    if (url.pathname === '/api/invite-resolve') {
      const id = env.CHAT_ROOM.idFromName('global-room');
      const obj = env.CHAT_ROOM.get(id);
      return obj.fetch(request);
    }

    if (request.headers.get('Upgrade') === 'websocket') {
      const origin = request.headers.get('Origin');
      if (origin) {
        try {
          const originUrl = new URL(origin);
          if (originUrl.host !== url.host) {
            return new Response('Forbidden origin', { status: 403 });
          }
        } catch {
          return new Response('Invalid origin', { status: 400 });
        }
      }

      const id = env.CHAT_ROOM.idFromName('global-room');
      const obj = env.CHAT_ROOM.get(id);
      return obj.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};

