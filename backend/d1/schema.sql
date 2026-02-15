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
