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

-- The bus tracker (worker/transit/). Already applied to the r3ai-requests database.
-- transit_state: the route matcher's memory between requests, one row holding every bus's recent trail.
CREATE TABLE IF NOT EXISTS transit_state (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL,
  t INTEGER NOT NULL
);
-- transit_alerts: rider alerts and notices shown on the tracker. Times are UTC, as datetime('now') writes them.
CREATE TABLE IF NOT EXISTS transit_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL DEFAULT 'alert',   -- alert: the banner across the top. notice: the lobby panel and the ticker
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  title_es TEXT,                        -- Spanish wording; the English shows when these are empty
  body_es TEXT,
  routes TEXT NOT NULL DEFAULT '',      -- route numbers it affects, such as '3' or '1,4'; empty for all
  starts_at TEXT,                       -- empty = now
  ends_at TEXT,                         -- empty = until it is deleted
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- transit_overrides: "bus 14 is on Route 2 today", for when dispatch knows better than the matcher. day is YYYYMMDD.
CREATE TABLE IF NOT EXISTS transit_overrides (
  bus TEXT NOT NULL,
  day TEXT NOT NULL,
  route TEXT NOT NULL,
  PRIMARY KEY (bus, day)
);
