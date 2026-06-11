-- Saraport Health Dashboard - Initial Schema
-- Tables: profiles, goals, daily_logs, food_logs, coach_messages
-- RLS policies: users can only access their own rows

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  age INT,
  gender TEXT,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  waist_cm NUMERIC,
  activity_level TEXT,
  diet_preferences TEXT,
  limitations TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL,
  target_weight_kg NUMERIC,
  target_waist_cm NUMERIC,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Daily logs table
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE DEFAULT CURRENT_DATE,
  weight_kg NUMERIC,
  waist_cm NUMERIC,
  steps INT,
  water_l NUMERIC,
  sleep_h NUMERIC,
  calories INT,
  protein_g NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Food logs table
CREATE TABLE IF NOT EXISTS food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE DEFAULT CURRENT_DATE,
  image_url TEXT,
  note TEXT,
  foods_detected JSONB,
  calories INT,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Coach messages table
CREATE TABLE IF NOT EXISTS coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Enable Row Level Security on all tables
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies: profiles (auth.uid() = id)
-- ============================================================
CREATE POLICY "Users can select own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- RLS Policies: goals (auth.uid() = user_id)
-- ============================================================
CREATE POLICY "Users can select own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- RLS Policies: daily_logs
-- ============================================================
CREATE POLICY "Users can select own daily_logs"
  ON daily_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily_logs"
  ON daily_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily_logs"
  ON daily_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily_logs"
  ON daily_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- RLS Policies: food_logs
-- ============================================================
CREATE POLICY "Users can select own food_logs"
  ON food_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food_logs"
  ON food_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food_logs"
  ON food_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food_logs"
  ON food_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- RLS Policies: coach_messages
-- ============================================================
CREATE POLICY "Users can select own coach_messages"
  ON coach_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coach_messages"
  ON coach_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_coach_messages_user_date ON coach_messages(user_id, created_at DESC);