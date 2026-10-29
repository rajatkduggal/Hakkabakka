CREATE TABLE IF NOT EXISTS admin_sessions (
 token_hash TEXT PRIMARY KEY,
 expires_at INTEGER NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry ON admin_sessions(expires_at);
CREATE TABLE IF NOT EXISTS menu_items (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 category TEXT NOT NULL,
 price REAL NOT NULL CHECK(price >= 0),
 available INTEGER NOT NULL DEFAULT 1,
 updated_at INTEGER NOT NULL,
 image_url TEXT NOT NULL DEFAULT '',
 is_published INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS offers (
 id TEXT PRIMARY KEY,
 title TEXT NOT NULL,
 details TEXT NOT NULL DEFAULT '',
 active INTEGER NOT NULL DEFAULT 1,
 updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS app_content (
 key TEXT PRIMARY KEY,
 value TEXT NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
 id TEXT PRIMARY KEY,
 order_ref TEXT NOT NULL UNIQUE,
 status TEXT NOT NULL,
 total REAL NOT NULL CHECK(total >= 0),
 payment_status TEXT NOT NULL,
 payload TEXT NOT NULL DEFAULT '{}',
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
