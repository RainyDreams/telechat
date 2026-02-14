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
  status TEXT NOT NULL
);
