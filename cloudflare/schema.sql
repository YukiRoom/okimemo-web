CREATE TABLE IF NOT EXISTS notes (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL,
 text TEXT NOT NULL DEFAULT '',
 kind TEXT NOT NULL DEFAULT 'memo',
 layer TEXT NOT NULL DEFAULT 'memo',
 done INTEGER NOT NULL DEFAULT 0,
 important INTEGER NOT NULL DEFAULT 0,
 deadline TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_user_created ON notes(user_id,created_at DESC);