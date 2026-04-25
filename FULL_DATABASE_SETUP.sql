-- FnB.ai Full Database Setup
-- UM Hackathon 2026

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES
-- Businesses
CREATE TABLE IF NOT EXISTS businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  staff_count INTEGER DEFAULT 1,
  operating_hours TEXT,
  currency TEXT DEFAULT 'MYR',
  menu_categories TEXT[] DEFAULT '{}',
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory items
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 0,
  unit TEXT NOT NULL,
  reorder_level DECIMAL(10,2) DEFAULT 0,
  cost_per_unit DECIMAL(10,2) DEFAULT 0,
  supplier TEXT,
  expiry_date DATE,
  status TEXT DEFAULT 'ok' CHECK (status IN ('ok','low','critical','expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory logs
CREATE TABLE IF NOT EXISTS inventory_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('add','deduct','adjust','invoice')),
  quantity_change DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sales records
CREATE TABLE IF NOT EXISTS sales_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT,
  quantity_sold DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_revenue DECIMAL(10,2) NOT NULL,
  sale_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  is_recurring boolean DEFAULT false,
  recurrence_period text CHECK (recurrence_period IN ('weekly', 'monthly', 'yearly')),
  subscription_name text,
  vendor text,
  notes text,
  payment_method text CHECK (payment_method IN ('cash', 'bank_transfer', 'card', 'ewallet', 'other')),
  receipt_url text,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Staff
CREATE TABLE IF NOT EXISTS staff_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  salary DECIMAL(10,2) DEFAULT 0,
  hire_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI briefings cache
CREATE TABLE IF NOT EXISTS ai_briefings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  briefing_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, briefing_date)
);

-- AI Chat messages
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Business Rules / Customization
CREATE TABLE IF NOT EXISTS business_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_configured BOOLEAN DEFAULT false,
  
  -- Financial
  weekly_ingredient_budget NUMERIC,
  monthly_revenue_target NUMERIC,
  target_food_cost_pct NUMERIC DEFAULT 30,
  target_labor_cost_pct NUMERIC DEFAULT 25,
  target_profit_margin_pct NUMERIC DEFAULT 15,
  waste_tolerance_rm NUMERIC DEFAULT 50,
  
  -- Inventory
  reorder_lead_days INTEGER DEFAULT 2,
  min_stock_buffer_days INTEGER DEFAULT 3,
  preferred_restock_day TEXT DEFAULT 'Monday',
  auto_reorder_enabled BOOLEAN DEFAULT false,
  
  -- Staff
  max_weekly_staff_hours INTEGER DEFAULT 48,
  max_overtime_hours INTEGER DEFAULT 10,
  min_staff_per_shift INTEGER DEFAULT 2,
  
  -- Operations
  peak_days TEXT[] DEFAULT '{Friday, Saturday, Sunday}',
  slow_days TEXT[] DEFAULT '{Monday, Tuesday}',
  opening_buffer_mins INTEGER DEFAULT 60,
  closing_buffer_mins INTEGER DEFAULT 60,
  
  -- AI
  ai_tone TEXT DEFAULT 'balanced',
  alert_sensitivity TEXT DEFAULT 'medium',
  custom_rules TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Finance Anomalies
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

-- 3. ROW LEVEL SECURITY
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_anomalies ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES
CREATE POLICY "Users manage own business" ON businesses FOR ALL USING (auth.uid() = user_id);

-- Helper for dependent tables
CREATE OR REPLACE FUNCTION auth_owns_business(bid UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM businesses WHERE id = bid AND user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Manage inventory" ON inventory_items FOR ALL USING (auth_owns_business(business_id));
CREATE POLICY "Manage inventory logs" ON inventory_logs FOR ALL USING (auth_owns_business(business_id));
CREATE POLICY "Manage sales" ON sales_records FOR ALL USING (auth_owns_business(business_id));
CREATE POLICY "Manage expenses" ON expenses FOR ALL USING (auth_owns_business(business_id));
CREATE POLICY "Manage staff" ON staff_members FOR ALL USING (auth_owns_business(business_id));
CREATE POLICY "Manage briefings" ON ai_briefings FOR ALL USING (auth_owns_business(business_id));
CREATE POLICY "Manage chat" ON ai_chat_messages FOR ALL USING (auth_owns_business(business_id));
CREATE POLICY "Manage rules" ON business_rules FOR ALL USING (auth_owns_business(business_id));
CREATE POLICY "Manage anomalies" ON finance_anomalies FOR ALL USING (auth_owns_business(business_id));

-- 5. TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON business_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
