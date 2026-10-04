-- Post requests sent from /request/. Already applied to the r3ai-requests database.
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  side TEXT NOT NULL,            -- work, home or either
  about TEXT,                    -- the project or post it relates to, if any
  message TEXT NOT NULL,
  name TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  ip_hash TEXT                   -- a one-day hash of the sender's address, used only to slow down spam
);
CREATE INDEX IF NOT EXISTS requests_created ON requests (created_at);
