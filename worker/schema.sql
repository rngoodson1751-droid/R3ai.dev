-- Post requests sent from /request/. Already applied to the r3ai-requests database.
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  side TEXT NOT NULL,            -- work, home or either
  about TEXT,                    -- the project or post it relates to, if any
  message TEXT NOT NULL,
  name TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'new',  -- new and declined stay private; asked, writing and posted show on /request/
  public_title TEXT,             -- the topic in Robert's own words; the only text ever shown publicly
  post_url TEXT,                 -- the finished post, once status is posted
  ip_hash TEXT                   -- a one-day hash of the sender's address, used only to slow down spam
);
CREATE INDEX IF NOT EXISTS requests_created ON requests (created_at);

-- Page views: one row per page per day. Nothing about the visitor is kept.
CREATE TABLE IF NOT EXISTS hits (
  day TEXT NOT NULL,
  path TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path)
);

-- Questions typed into /ask/, and which posts were used to answer. ip_hash is only for the hourly limit.
CREATE TABLE IF NOT EXISTS asks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  question TEXT NOT NULL,
  posts TEXT,
  ip_hash TEXT
);
CREATE INDEX IF NOT EXISTS asks_created ON asks (created_at);
