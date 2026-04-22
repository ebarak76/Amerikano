-- Amerikano - Supabase Table Setup
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Create the seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  players JSONB NOT NULL DEFAULT '[]',
  matches JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security (required by Supabase)
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- 3. Allow public read/write (no auth needed for this family app)
CREATE POLICY "Allow public read" ON seasons FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON seasons FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON seasons FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON seasons FOR DELETE USING (true);

-- 4. Enable realtime (optional, for multi-device sync)
ALTER PUBLICATION supabase_realtime ADD TABLE seasons;
