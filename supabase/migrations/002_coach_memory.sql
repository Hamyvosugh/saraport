-- Coach Memory table — key-value store for coach agent long-term memory

CREATE TABLE IF NOT EXISTS coach_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, key)
);

ALTER TABLE coach_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own coach_memory"
  ON coach_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coach_memory"
  ON coach_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coach_memory"
  ON coach_memory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_coach_memory_user_key ON coach_memory(user_id, key);