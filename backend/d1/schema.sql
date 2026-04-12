CREATE TABLE IF NOT EXISTS contacts (
  device_fp TEXT NOT NULL,
  contact_fp TEXT NOT NULL,
  alias TEXT DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (device_fp, contact_fp)
);

CREATE INDEX IF NOT EXISTS idx_contacts_device ON contacts (device_fp);

CREATE TABLE IF NOT EXISTS contact_migrations (
  code TEXT PRIMARY KEY,
  new_device_fp TEXT NOT NULL,
  old_device_fp TEXT,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL,
  transfer_nickname INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS device_nicknames (
  nickname TEXT PRIMARY KEY,
  device_fp TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_device_nicknames_fp ON device_nicknames (device_fp);

-- 离线消息队列（服务端持久化）
CREATE TABLE IF NOT EXISTS offline_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_fp TEXT NOT NULL,
  msg_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_offline_msgs_target ON offline_messages (target_fp, msg_id);
CREATE INDEX IF NOT EXISTS idx_offline_msgs_created ON offline_messages (created_at);

-- 设备公钥持久化（支持离线成员消息加密）
CREATE TABLE IF NOT EXISTS device_public_keys (
  device_fp TEXT PRIMARY KEY,
  public_key TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
