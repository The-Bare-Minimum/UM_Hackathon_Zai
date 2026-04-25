-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Businesses
CREATE TABLE businesses (
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
CREATE TABLE inventory_items (
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

-- Inventory logs (every stock change)
CREATE TABLE inventory_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('add','deduct','adjust','invoice')),
  quantity_change DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sales records
CREATE TABLE sales_records (
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
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Staff
CREATE TABLE staff_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  salary DECIMAL(10,2) DEFAULT 0,
  hire_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI briefings cache
CREATE TABLE ai_briefings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  briefing_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, briefing_date)
);

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_briefings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for businesses
CREATE POLICY "Users manage own business"
ON businesses FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for all other tables (via business ownership)
CREATE POLICY "Users manage own inventory"
ON inventory_items FOR ALL
USING (business_id IN (
  SELECT id FROM businesses WHERE user_id = auth.uid()
));

CREATE POLICY "Users manage own inventory logs"
ON inventory_logs FOR ALL
USING (business_id IN (
  SELECT id FROM businesses WHERE user_id = auth.uid()
));

CREATE POLICY "Users manage own sales"
ON sales_records FOR ALL
USING (business_id IN (
  SELECT id FROM businesses WHERE user_id = auth.uid()
));

CREATE POLICY "Users manage own expenses"
ON expenses FOR ALL
USING (business_id IN (
  SELECT id FROM businesses WHERE user_id = auth.uid()
));

CREATE POLICY "Users manage own staff"
ON staff_members FOR ALL
USING (business_id IN (
  SELECT id FROM businesses WHERE user_id = auth.uid()
));

CREATE POLICY "Users manage own briefings"
ON ai_briefings FOR ALL
USING (business_id IN (
  SELECT id FROM businesses WHERE user_id = auth.uid()
));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON businesses
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON inventory_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
