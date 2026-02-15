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
const MIGRATION_TTL_MS = 10 * 60 * 1000;
const CONTACT_REQUEST_TTL_MS = 10 * 60 * 1000;
const GROUP_INVITE_APPROVAL_TTL_MS = 10 * 60 * 1000;

const MAX_BASE64_FIELD_LENGTH = 1_500_000;
const MAX_ENCRYPTED_KEY_LENGTH = 4096;
const MAX_IDENTITY_KEY_LENGTH = 8192;
const MAX_DEVICE_FINGERPRINT_LENGTH = 128;
const MAX_DEVICE_TOKEN_LENGTH = 128;

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

const enc = new TextEncoder();

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

const sanitizeDeviceToken = (value) => {
  if (typeof value !== 'string') return null;
  const token = value.trim();
  if (!token || token.length > MAX_DEVICE_TOKEN_LENGTH) return null;
  if (!/^[a-f0-9]+$/i.test(token)) return null;
  return token;
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
    this.groupMetaById = new Map();
    this.groupMetaLoaded = false;
    this.groupInviteApprovals = new Map();
  }

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected websocket', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    await this.handleSession(server, request);
    return new Response(null, { status: 101, webSocket: client });
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
    try {
      ws.send(JSON.stringify(payload));
    } catch {
      // no-op
    }
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

  sendNicknameState(ws, nickname = '', reqId = null) {
    this.sendTo(ws, {
      type: 'nickname_state',
      nickname: typeof nickname === 'string' ? nickname : '',
      reqId,
    });
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
      const fallback = groupId.startsWith('grp-') ? `群聊 ${groupId.slice(-6)}` : groupId;
      meta = {
        groupId,
        name: sanitizeGroupName(preferredName) || fallback,
        ownerUid: sender?.uid || '',
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

  sendGroupSystemNotice(groupId, payload) {
    const members = this.getGroupMembers(groupId);
    for (const { ws } of members) {
      this.sendTo(ws, { type: 'system_notice', ...payload });
    }
  }

  sendGroupJoined(ws, groupId, meta, reqId = null) {
    const groupName = meta?.name || groupId;
    const ownerUid = meta?.ownerUid || '';
    this.sendTo(ws, {
      type: 'group_joined',
      groupId,
      groupName,
      ownerUid,
      reqId,
    });
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
        text: '1) 给自己设置昵称和头像；2) 加几个联系人避免失联；3) 开启系统通知，消息不漏看。',
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


  groupHasMembers(groupId) {
    for (const session of this.sessions.values()) {
      if (session.groups.has(groupId)) return true;
    }
    return false;
  }

  broadcastSystemStatus() {
    const users = Array.from(this.sessions.values()).map((u) => ({
      uid: u.deviceBound && u.deviceFingerprint ? u.deviceFingerprint : '',
      nickname: u.deviceBound && u.deviceFingerprint ? u.nickname || '' : '',
      publicKey: u.publicKey,
      identitySign: u.identitySign,
      identityDh: u.identityDh,
      identitySig: u.identitySig,
      os: u.os,
      location: u.location,
      deviceFingerprint: u.deviceBound && u.deviceFingerprint ? u.deviceFingerprint.slice(0, 10) : '',
      deviceFingerprintFull: u.deviceBound && u.deviceFingerprint ? u.deviceFingerprint : '',
    }));

    const groupCounts = {};
    for (const session of this.sessions.values()) {
      for (const groupId of session.groups) {
        groupCounts[groupId] = (groupCounts[groupId] || 0) + 1;
      }
    }

    const payload = JSON.stringify({
      type: 'status',
      users,
      onlineCount: users.length,
      groupCounts,
    });

    for (const [ws] of this.sessions.entries()) {
      try {
        ws.send(payload);
      } catch {
        // no-op
      }
    }
  }

  async getInviteKey() {
    if (!this.inviteKeyPromise) {
      const secret = this.env.INVITE_SIGNING_SECRET || 'change-me-invite-secret';
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
    if (!parsed) return false;

    const { payloadB64, sigB64, payload } = parsed;
    if (!payload || payload.g !== groupId || typeof payload.e !== 'number' || payload.e < Date.now()) {
      return false;
    }

    const key = await this.getInviteKey();
    const sigBytes = base64UrlToBytes(sigB64);
    if (!sigBytes) return false;

    try {
      return await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(payloadB64));
    } catch {
      return false;
    }
  }

  async makeInviteCode(groupId, ttlSec) {
    const ttl = Number.isFinite(ttlSec) ? ttlSec : INVITE_TTL_DEFAULT_SECONDS;
    const boundedTtl = Math.max(60, Math.min(INVITE_TTL_MAX_SECONDS, Math.floor(ttl)));
    const payload = {
      g: groupId,
      e: Date.now() + boundedTtl * 1000,
      n: randomHex(6),
    };

    const payloadB64 = base64UrlEncodeText(JSON.stringify(payload));
    const sigB64 = await this.signPayload(payloadB64);
    return {
      inviteCode: `TCINV-${payloadB64}.${sigB64}`,
      expiresAt: payload.e,
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
      case 'group_invite_approve':
        await this.handleGroupInviteApprove(ws, sender, data, reqId);
        break;
      case 'group_rename':
        await this.handleGroupRename(ws, sender, data, reqId);
        break;
      case 'group_members':
        await this.handleGroupMembers(ws, sender, data, reqId);
        break;
      case 'group_kick':
        await this.handleGroupKick(ws, sender, data, reqId);
        break;
      case 'direct_start':
        await this.handleDirectStart(ws, sender, data, reqId);
        break;
      case 'pair_accept':
        await this.handlePairAccept(ws, sender, data, reqId);
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
    const fingerprint = sanitizeDeviceFingerprint(data.fingerprint);
    if (!fingerprint) {
      this.handleInvalidAction(ws, 'INVALID_DEVICE_FINGERPRINT', 'fingerprint must be base64url', reqId);
      return;
    }

    const token = sanitizeDeviceToken(data.deviceToken);
    const storageKey = `device:${fingerprint}`;
    const stored = await this.state.storage.get(storageKey);

    let isFirstBind = false;
    if (stored && stored.token) {
      if (!token || token !== stored.token) {
        this.sendError(ws, 'DEVICE_AUTH_REQUIRED', 'Device binding token required', reqId);
        sender.deviceBound = false;
        return;
      }
    } else {
      isFirstBind = true;
      const newToken = randomHex(24);
      await this.state.storage.put(storageKey, { token: newToken, createdAt: Date.now() });
      this.sendTo(ws, { type: 'device_bound', deviceToken: newToken, reqId });
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
    sender.nickname = await this.getDeviceNickname(fingerprint);
    this.deviceSessions.set(fingerprint, ws);
    this.sendTo(ws, { type: 'device_fingerprint_registered', reqId });
    this.sendNicknameState(ws, sender.nickname, reqId);
    if (isFirstBind) {
      this.sendFirstDeviceGuide(ws, sender);
    }
    this.broadcastSystemStatus();
    void this.notifyPendingMigration(ws, sender);
    this.notifyPendingContactRequests(ws, sender);
    void this.notifyPendingInviteApprovals(ws, sender);
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
    this.cleanupInviteApprovals();
    for (const req of this.groupInviteApprovals.values()) {
      if (!req || !req.groupId) continue;
      const meta = await this.getGroupMeta(req.groupId);
      if (!meta || meta.ownerUid !== sender.uid) continue;
      this.sendTo(ws, {
        type: 'invite_approval_request',
        requestId: req.requestId,
        groupId: req.groupId,
        groupName: meta.name || req.groupId,
        requesterUid: req.requesterUid || '',
        requesterNickname: '',
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

      const hasExistingMembers = this.groupHasMembers(groupId);
      if (groupId !== SYSTEM_GROUP && hasExistingMembers && !isDirectGroupId(groupId)) {
        const inviteCode = sanitizeText(data.inviteCode, 700);
        const valid = inviteCode ? await this.verifyInviteCode(inviteCode, groupId) : false;
        if (!valid) {
          this.sendError(ws, 'INVITE_REQUIRED', 'Valid invite code required for this group', reqId);
          return;
        }
      }

      sender.groups.add(groupId);
      void this.logAction('JOIN_GROUP', `uid=${sender.uid},group=${groupId}`);

      if (groupId !== SYSTEM_GROUP && !isDirectGroupId(groupId)) {
        meta = await this.getGroupMeta(groupId);
        if (!meta) {
          meta = await this.getOrInitGroupMeta(groupId, sender, preferredGroupName);
          this.sendGroupSystemNotice(groupId, {
            title: '群聊已创建',
            text: `${sender.nickname || `用户 ${sender.uid.slice(0, 6)}`} 创建了群聊“${meta.name}”。`,
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
    if (meta && meta.ownerUid && meta.ownerUid !== sender.uid) {
      this.cleanupInviteApprovals();
      let requestId = `gir-${randomHex(6)}`;
      while (this.groupInviteApprovals.has(requestId)) {
        requestId = `gir-${randomHex(6)}`;
      }
      this.groupInviteApprovals.set(requestId, {
        requestId,
        groupId,
        requesterUid: sender.uid,
        requesterFingerprint: sender.deviceFingerprint || '',
        createdAt: Date.now(),
        ttlSec: Number(data.ttlSec),
        reqId: reqId || '',
      });
      this.sendTo(ws, { type: 'invite_approval_pending', groupId, requestId, reqId });

      const ownerWs = this.findWsByUid(meta.ownerUid);
      if (ownerWs) {
        this.sendTo(ownerWs, {
          type: 'invite_approval_request',
          requestId,
          groupId,
          groupName: meta.name || groupId,
          requesterUid: sender.uid,
          requesterNickname: sender.nickname || '',
          reqId,
        });
        this.sendTo(ownerWs, {
          type: 'system_notice',
          title: '有新的邀请审批',
          text: `${sender.nickname || `用户 ${sender.uid.slice(0, 6)}`} 申请为群聊“${meta.name || groupId}”生成邀请链接。`,
          actions: [
            { action: 'approve_group_invite', label: '同意', requestId },
            { action: 'reject_group_invite', label: '拒绝', requestId },
          ],
        });
      }

      this.sendTo(ws, {
        type: 'system_notice',
        title: '已提交邀请审批',
        text: `你不是群主，邀请请求已提交，等待群主确认。`,
        actions: [{ action: 'open_system_notice', label: '查看系统消息' }],
      });
      return;
    }

    const ttlSec = Number(data.ttlSec);
    const invite = await this.makeInviteCode(groupId, Number.isFinite(ttlSec) ? ttlSec : INVITE_TTL_DEFAULT_SECONDS);

    this.sendTo(ws, {
      type: 'invite_created',
      groupId,
      inviteCode: invite.inviteCode,
      expiresAt: invite.expiresAt,
      reqId,
    });
  }

  async handleGroupInviteApprove(ws, sender, data, reqId) {
    const requestId = sanitizeText(data.requestId, 80);
    if (!requestId) {
      this.handleInvalidAction(ws, 'INVALID_INVITE_APPROVAL', 'requestId required', reqId);
      return;
    }
    this.cleanupInviteApprovals();
    const pending = this.groupInviteApprovals.get(requestId);
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
    this.groupInviteApprovals.delete(requestId);

    if (!approve) {
      if (requesterWs) {
        this.sendTo(requesterWs, {
          type: 'invite_approval_result',
          requestId,
          groupId: pending.groupId,
          approved: false,
          reqId: pending.reqId || reqId,
        });
        this.sendTo(requesterWs, {
          type: 'system_notice',
          title: '邀请审批被拒绝',
          text: `群主拒绝了你为群聊“${meta.name || pending.groupId}”生成邀请链接的请求。`,
        });
      }
      this.sendTo(ws, {
        type: 'invite_approval_result',
        requestId,
        groupId: pending.groupId,
        approved: false,
        reqId,
      });
      return;
    }

    const invite = await this.makeInviteCode(
      pending.groupId,
      Number.isFinite(pending.ttlSec) ? pending.ttlSec : INVITE_TTL_DEFAULT_SECONDS
    );
    if (requesterWs) {
      this.sendTo(requesterWs, {
        type: 'invite_created',
        groupId: pending.groupId,
        inviteCode: invite.inviteCode,
        expiresAt: invite.expiresAt,
        reqId: pending.reqId || reqId,
      });
      this.sendTo(requesterWs, {
        type: 'invite_approval_result',
        requestId,
        groupId: pending.groupId,
        approved: true,
        reqId: pending.reqId || reqId,
      });
      this.sendTo(requesterWs, {
        type: 'system_notice',
        title: '邀请审批已通过',
        text: `群主已同意，你可以分享群聊“${meta.name || pending.groupId}”邀请。`,
      });
    }
    this.sendTo(ws, {
      type: 'invite_approval_result',
      requestId,
      groupId: pending.groupId,
      approved: true,
      reqId,
    });
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
      this.sendTo(ws, { type: 'group_meta_updated', groupId, groupName, ownerUid: meta.ownerUid, reqId });
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
        reqId,
      });
    }
    this.sendGroupSystemNotice(groupId, {
      title: '群名称已更新',
      text: `${sender.nickname || `用户 ${sender.uid.slice(0, 6)}`} 将群名从“${oldName}”改为“${groupName}”。`,
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
    this.sendTo(targetWs, {
      type: 'group_kicked',
      groupId,
      byUid: sender.uid,
      byNickname: sender.nickname || '',
      reqId,
    });
    this.sendTo(targetWs, {
      type: 'system_notice',
      title: '你已被移出群聊',
      text: `你被群主移出了“${meta.name || groupId}”。`,
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
    });
    this.broadcastSystemStatus();
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

    const pairKey = buildDmPairKey(sender.deviceFingerprint, target.deviceFingerprint);
    if (pairKey) {
      this.dmPairByGroup.set(groupId, pairKey);
    }

    sender.groups.add(groupId);
    target.groups.add(groupId);

    this.sendTo(ws, { type: 'group_joined', groupId, reqId });
    this.sendTo(targetWs, { type: 'group_joined', groupId, reqId });
    this.broadcastSystemStatus();

    void this.logAction('DIRECT_START', `from=${sender.uid},to=${target.uid},group=${groupId}`);
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

    const valid = await this.verifyInviteCode(inviteCode, groupId);
    if (!valid) {
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
      const alias = sanitizeOptionalText(data.alias, CONTACT_ALIAS_MAX) || `用户 ${target.uid}`;
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

    const alias = sanitizeOptionalText(data.alias, CONTACT_ALIAS_MAX) || `用户 ${target.uid}`;
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
      await this.env.DB.prepare(
        'INSERT INTO contacts (device_fp, contact_fp, alias, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(device_fp, contact_fp) DO UPDATE SET alias = excluded.alias, updated_at = excluded.updated_at'
      )
        .bind(request.fromFingerprint, request.toFingerprint, request.alias, now, now)
        .run();
      await this.env.DB.prepare(
        'INSERT INTO contacts (device_fp, contact_fp, alias, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(device_fp, contact_fp) DO UPDATE SET alias = excluded.alias, updated_at = excluded.updated_at'
      )
        .bind(request.toFingerprint, request.fromFingerprint, `用户 ${request.fromUid}`, now, now)
        .run();

      const requesterWs = this.deviceSessions.get(request.fromFingerprint);
      const requester = requesterWs ? this.sessions.get(requesterWs) : null;
      const requesterUid = requester?.uid || request.fromUid || '';

      this.sendTo(ws, {
        type: 'contacts_saved',
        contact: {
          contactFingerprint: request.fromFingerprint,
          alias: requesterUid ? `用户 ${requesterUid}` : '用户',
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

      sender.nickname = await this.getDeviceNickname(sender.deviceFingerprint);
      this.sendNicknameState(ws, sender.nickname);
      this.sendTo(ws, { type: 'contacts_migrate_done', code, count, transferredNickname, reqId });
      const oldWs = this.findWsByFingerprint(row.old_device_fp);
      if (oldWs) {
        const oldSession = this.sessions.get(oldWs);
        if (oldSession) {
          oldSession.nickname = await this.getDeviceNickname(oldSession.deviceFingerprint);
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

    const payloadType = data.payloadType === 'image' ? 'image' : data.payloadType === 'text' ? 'text' : null;
    if (!payloadType) {
      this.handleInvalidAction(ws, 'INVALID_PAYLOAD_TYPE', 'payloadType must be text or image', reqId);
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
        ts,
        payloadType,
        iv: data.iv,
        ciphertext: data.ciphertext,
        encryptedKey,
        encType: encType || undefined,
        mimeType,
        name,
      });
      delivered += 1;
    }

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

    void this.logAction(
      'CHAT',
      `uid=${sender.uid},group=${groupId},kind=${payloadType},delivered=${delivered}`
    );
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
      return new Response(
        JSON.stringify({ status: 'ok', service: 'LINKCONNECT-backend', date: new Date().toISOString() }),
        { status: 200, headers: jsonHeaders }
      );
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

