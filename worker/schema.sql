CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('zibal', 'stripe')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  provider_ref TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  paid_at TEXT
);
CREATE INDEX IF NOT EXISTS payments_status_created ON payments(status, created_at);
