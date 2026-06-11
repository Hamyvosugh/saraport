-- Log Entries table - flexible daily log entries with categories
-- Replaces the rigid daily_logs table structure

CREATE TABLE IF NOT EXISTS log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('measurement', 'activity')),
  entry_type TEXT NOT NULL CHECK (
    entry_type IN (
      'morning_weight', 'evening_weight', 'morning_waist', 'evening_waist',
      'steps', 'exercise', 'elevation'
    )
  ),
  value NUMERIC NOT NULL,
  unit TEXT,
  log_date DATE DEFAULT CURRENT_DATE,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE log_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can select own log_entries"
  ON log_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own log_entries"
  ON log_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own log_entries"
  ON log_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own log_entries"
  ON log_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_log_entries_user_date ON log_entries(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_log_entries_category ON log_entries(user_id, category, log_date DESC);