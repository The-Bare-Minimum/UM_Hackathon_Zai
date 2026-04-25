-- Phase 5.6: Financial Monitor Schema Migration
-- Run this in Supabase SQL Editor

-- 1. Add new columns to expenses table
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_period text CHECK (recurrence_period IN ('weekly', 'monthly', 'yearly')),
  ADD COLUMN IF NOT EXISTS subscription_name text,
  ADD COLUMN IF NOT EXISTS vendor text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS payment_method text CHECK (payment_method IN ('cash', 'bank_transfer', 'card', 'ewallet', 'other')),
  ADD COLUMN IF NOT EXISTS receipt_url text;

-- 2. Create finance_anomalies table
CREATE TABLE IF NOT EXISTS finance_anomalies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  anomaly_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  affected_category text,
  current_value numeric,
  baseline_value numeric,
  deviation_pct numeric,
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'danger')),
  detected_at timestamptz DEFAULT now(),
  is_dismissed boolean DEFAULT false,
  dismissed_at timestamptz
);

-- 3. Create finance_snapshots table
CREATE TABLE IF NOT EXISTS finance_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  daily_revenue numeric DEFAULT 0,
  daily_expenses numeric DEFAULT 0,
  daily_profit numeric DEFAULT 0,
  cumulative_month_revenue numeric DEFAULT 0,
  cumulative_month_expenses numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, snapshot_date)
);

-- 4. Add indexes
CREATE INDEX IF NOT EXISTS idx_finance_anomalies_business_id ON finance_anomalies(business_id);
CREATE INDEX IF NOT EXISTS idx_finance_anomalies_severity ON finance_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_finance_anomalies_detected_at ON finance_anomalies(detected_at);
CREATE INDEX IF NOT EXISTS idx_finance_snapshots_business_date ON finance_snapshots(business_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_expenses_is_recurring ON expenses(is_recurring);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_method ON expenses(payment_method);

-- 5. Enable RLS on new tables
ALTER TABLE finance_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_snapshots ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for finance_anomalies
CREATE POLICY "Users can view own business anomalies" ON finance_anomalies
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert anomalies for own business" ON finance_anomalies
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own business anomalies" ON finance_anomalies
  FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own business anomalies" ON finance_anomalies
  FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- 7. RLS policies for finance_snapshots
CREATE POLICY "Users can view own business snapshots" ON finance_snapshots
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert snapshots for own business" ON finance_snapshots
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own business snapshots" ON finance_snapshots
  FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );
