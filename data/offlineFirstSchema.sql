-- Offline-First Travel Pack SQLite Schema
-- Optimized for voice queries and fast local search
-- Designed for offline-first functionality

-- Main entries table
CREATE TABLE IF NOT EXISTS pack_entries (
    id TEXT PRIMARY KEY,
    city TEXT NOT NULL,
    country TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    problem_it_solves TEXT NOT NULL,
    urgency TEXT NOT NULL CHECK(urgency IN ('emergency', 'urgent', 'important', 'helpful')),
    priority_score INTEGER NOT NULL CHECK(priority_score >= 1 AND priority_score <= 100),
    neighborhood TEXT,
    area TEXT,
    cost_range TEXT CHECK(cost_range IN ('free', 'budget', 'moderate', 'expensive')),
    version TEXT NOT NULL,
    last_updated TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Tags table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS entry_tags (
    entry_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    PRIMARY KEY (entry_id, tag),
    FOREIGN KEY (entry_id) REFERENCES pack_entries(id) ON DELETE CASCADE
);

-- Time of day relevance (many-to-many)
CREATE TABLE IF NOT EXISTS entry_time_of_day (
    entry_id TEXT NOT NULL,
    time_of_day TEXT NOT NULL CHECK(time_of_day IN ('early_morning', 'morning', 'afternoon', 'evening', 'late_night', 'night', 'anytime')),
    PRIMARY KEY (entry_id, time_of_day),
    FOREIGN KEY (entry_id) REFERENCES pack_entries(id) ON DELETE CASCADE
);

-- Spoken phrases for voice matching
CREATE TABLE IF NOT EXISTS entry_spoken_phrases (
    entry_id TEXT NOT NULL,
    phrase TEXT NOT NULL,
    PRIMARY KEY (entry_id, phrase),
    FOREIGN KEY (entry_id) REFERENCES pack_entries(id) ON DELETE CASCADE
);

-- Keywords for fuzzy matching
CREATE TABLE IF NOT EXISTS entry_keywords (
    entry_id TEXT NOT NULL,
    keyword TEXT NOT NULL,
    PRIMARY KEY (entry_id, keyword),
    FOREIGN KEY (entry_id) REFERENCES pack_entries(id) ON DELETE CASCADE
);

-- Alternatives (optional solutions)
CREATE TABLE IF NOT EXISTS entry_alternatives (
    entry_id TEXT NOT NULL,
    alternative TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    PRIMARY KEY (entry_id, sequence),
    FOREIGN KEY (entry_id) REFERENCES pack_entries(id) ON DELETE CASCADE
);

-- Warnings (things to avoid)
CREATE TABLE IF NOT EXISTS entry_warnings (
    entry_id TEXT NOT NULL,
    warning TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    PRIMARY KEY (entry_id, sequence),
    FOREIGN KEY (entry_id) REFERENCES pack_entries(id) ON DELETE CASCADE
);

-- Accessibility notes
CREATE TABLE IF NOT EXISTS entry_accessibility (
    entry_id TEXT NOT NULL,
    note TEXT NOT NULL,
    PRIMARY KEY (entry_id, note),
    FOREIGN KEY (entry_id) REFERENCES pack_entries(id) ON DELETE CASCADE
);

-- Indexes for fast search
CREATE INDEX IF NOT EXISTS idx_entries_city ON pack_entries(city);
CREATE INDEX IF NOT EXISTS idx_entries_urgency ON pack_entries(urgency);
CREATE INDEX IF NOT EXISTS idx_entries_priority ON pack_entries(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_entries_neighborhood ON pack_entries(neighborhood);
CREATE INDEX IF NOT EXISTS idx_entries_area ON pack_entries(area);
CREATE INDEX IF NOT EXISTS idx_tags_entry ON entry_tags(entry_id);
CREATE INDEX IF NOT EXISTS idx_tags_tag ON entry_tags(tag);
CREATE INDEX IF NOT EXISTS idx_time_entry ON entry_time_of_day(entry_id);
CREATE INDEX IF NOT EXISTS idx_time_day ON entry_time_of_day(time_of_day);
CREATE INDEX IF NOT EXISTS idx_spoken_entry ON entry_spoken_phrases(entry_id);
CREATE INDEX IF NOT EXISTS idx_keywords_entry ON entry_keywords(entry_id);
CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON entry_keywords(keyword);

-- Full-text search index for content and title (SQLite FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
    entry_id,
    title,
    content,
    problem_it_solves,
    spoken_phrases,
    keywords,
    content='pack_entries',
    content_rowid='rowid'
);

-- Trigger to keep FTS index updated
CREATE TRIGGER IF NOT EXISTS entries_fts_insert AFTER INSERT ON pack_entries BEGIN
    INSERT INTO entries_fts(rowid, entry_id, title, content, problem_it_solves, spoken_phrases, keywords)
    VALUES (
        new.rowid,
        new.id,
        new.title,
        new.content,
        new.problem_it_solves,
        (SELECT GROUP_CONCAT(phrase, ' ') FROM entry_spoken_phrases WHERE entry_id = new.id),
        (SELECT GROUP_CONCAT(keyword, ' ') FROM entry_keywords WHERE entry_id = new.id)
    );
END;

CREATE TRIGGER IF NOT EXISTS entries_fts_delete AFTER DELETE ON pack_entries BEGIN
    DELETE FROM entries_fts WHERE entry_id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS entries_fts_update AFTER UPDATE ON pack_entries BEGIN
    DELETE FROM entries_fts WHERE entry_id = old.id;
    INSERT INTO entries_fts(rowid, entry_id, title, content, problem_it_solves, spoken_phrases, keywords)
    VALUES (
        new.rowid,
        new.id,
        new.title,
        new.content,
        new.problem_it_solves,
        (SELECT GROUP_CONCAT(phrase, ' ') FROM entry_spoken_phrases WHERE entry_id = new.id),
        (SELECT GROUP_CONCAT(keyword, ' ') FROM entry_keywords WHERE entry_id = new.id)
    );
END;

-- Example query: Search by voice query
-- SELECT e.*, 
--        GROUP_CONCAT(DISTINCT t.tag) as tags,
--        GROUP_CONCAT(DISTINCT tod.time_of_day) as times,
--        GROUP_CONCAT(DISTINCT sp.phrase) as spoken_phrases,
--        GROUP_CONCAT(DISTINCT k.keyword) as keywords
-- FROM pack_entries e
-- LEFT JOIN entry_tags t ON e.id = t.entry_id
-- LEFT JOIN entry_time_of_day tod ON e.id = tod.entry_id
-- LEFT JOIN entry_spoken_phrases sp ON e.id = sp.entry_id
-- LEFT JOIN entry_keywords k ON e.id = k.entry_id
-- WHERE e.city = 'Paris'
--   AND (
--     e.title LIKE '%late night%' OR
--     e.content LIKE '%late night%' OR
--     sp.phrase LIKE '%late night%' OR
--     k.keyword LIKE '%late night%'
--   )
--   AND (tod.time_of_day = 'late_night' OR tod.time_of_day = 'anytime')
-- GROUP BY e.id
-- ORDER BY e.priority_score DESC, e.urgency DESC
-- LIMIT 10;
