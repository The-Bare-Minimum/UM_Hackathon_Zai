-- IMPORTANT: Replace 'YOUR_BUSINESS_ID_HERE' with your actual business ID from the businesses table
-- You can find your business ID by running: SELECT id, name FROM businesses;

DO $$ 
DECLARE
  v_business_id UUID := 'YOUR_BUSINESS_ID_HERE'; -- <--- UPDATE THIS LINE
  v_date DATE;
  i INT;
  j INT;
BEGIN

  -- Verify business exists
  IF NOT EXISTS (SELECT 1 FROM businesses WHERE id = v_business_id) THEN
    RAISE EXCEPTION 'Business ID % not found. Please update the v_business_id variable.', v_business_id;
  END IF;

  -- 1. Insert Inventory Items
  INSERT INTO inventory_items (business_id, name, category, quantity, unit, reorder_level, cost_per_unit, status) VALUES
  (v_business_id, 'Rice (Beras)', 'Dry Goods', 15, 'kg', 5, 2.50, 'ok'),
  (v_business_id, 'Chicken (Ayam)', 'Protein', 8, 'kg', 3, 9.00, 'ok'),
  (v_business_id, 'Cooking Oil', 'Cooking', 5, 'L', 2, 7.00, 'ok'),
  (v_business_id, 'Eggs (Telur)', 'Protein', 60, 'units', 20, 0.45, 'ok'),
  (v_business_id, 'Flour (Tepung)', 'Dry Goods', 10, 'kg', 3, 1.80, 'ok'),
  (v_business_id, 'Coconut Milk (Santan)', 'Cooking', 2.5, 'L', 2, 6.00, 'low'),
  (v_business_id, 'Teh Tarik Powder', 'Drinks', 0.4, 'kg', 0.5, 18.00, 'critical'),
  (v_business_id, 'Milo Powder', 'Drinks', 0.8, 'kg', 0.5, 22.00, 'low'),
  (v_business_id, 'Vegetables (Sayur)', 'Fresh', 1.2, 'kg', 1, 4.00, 'low'),
  (v_business_id, 'Chilli Paste (Sambal)', 'Condiments', 2, 'kg', 0.5, 8.00, 'ok'),
  (v_business_id, 'Salt', 'Condiments', 1, 'kg', 0.3, 1.20, 'ok'),
  (v_business_id, 'Sugar', 'Dry Goods', 2, 'kg', 0.5, 2.00, 'ok');

  -- 2. Insert Expenses
  INSERT INTO expenses (business_id, description, category, amount, expense_date) VALUES
  (v_business_id, 'Monthly Rent - April', 'Rent', 3500.00, CURRENT_DATE - INTERVAL '14 days'),
  (v_business_id, 'Staff Salary - Week 2', 'Staff Salary', 4200.00, CURRENT_DATE - INTERVAL '7 days'),
  (v_business_id, 'Chicken & Meat Restock', 'Ingredients', 480.00, CURRENT_DATE - INTERVAL '12 days'),
  (v_business_id, 'Vegetables & Fresh Produce', 'Ingredients', 320.00, CURRENT_DATE - INTERVAL '9 days'),
  (v_business_id, 'Dry Goods Restock', 'Ingredients', 250.00, CURRENT_DATE - INTERVAL '5 days'),
  (v_business_id, 'Drinks Supplies Restock', 'Ingredients', 580.00, CURRENT_DATE - INTERVAL '3 days'),
  (v_business_id, 'Electricity & Water Bill', 'Utilities', 280.00, CURRENT_DATE - INTERVAL '10 days');

  -- 3. Insert Staff Members
  INSERT INTO staff_members (business_id, name, role, salary, hire_date) VALUES
  (v_business_id, 'Ahmad', 'Head Chef', 2200.00, '2024-01-15'),
  (v_business_id, 'Siti', 'Cashier', 1400.00, '2024-03-01'),
  (v_business_id, 'Kumar', 'Kitchen Helper', 1200.00, '2024-06-15'),
  (v_business_id, 'Lee', 'Waiter', 1300.00, '2024-08-01');

  -- 4. Generate random sales data for the last 14 days
  FOR i IN 1..14 LOOP
    v_date := CURRENT_DATE - CAST(i || ' days' AS INTERVAL);
    
    -- Nasi Lemak
    FOR j IN 1..(floor(random() * 5 + 3)) LOOP
      INSERT INTO sales_records (business_id, item_name, category, quantity_sold, unit_price, total_revenue, sale_date)
      VALUES (v_business_id, 'Nasi Lemak', 'Main Course', 1 + floor(random() * 2), 12.00, (1 + floor(random() * 2)) * 12.00, v_date);
    END LOOP;
    
    -- Mee Goreng
    FOR j IN 1..(floor(random() * 4 + 2)) LOOP
      INSERT INTO sales_records (business_id, item_name, category, quantity_sold, unit_price, total_revenue, sale_date)
      VALUES (v_business_id, 'Mee Goreng', 'Main Course', 1 + floor(random() * 2), 10.00, (1 + floor(random() * 2)) * 10.00, v_date);
    END LOOP;

    -- Ayam Goreng Set
    FOR j IN 1..(floor(random() * 3 + 1)) LOOP
      INSERT INTO sales_records (business_id, item_name, category, quantity_sold, unit_price, total_revenue, sale_date)
      VALUES (v_business_id, 'Ayam Goreng Set', 'Main Course', 1, 15.00, 15.00, v_date);
    END LOOP;

    -- Drinks & Extras
    FOR j IN 1..(floor(random() * 8 + 4)) LOOP
      INSERT INTO sales_records (business_id, item_name, category, quantity_sold, unit_price, total_revenue, sale_date)
      VALUES (v_business_id, 'Teh Tarik', 'Drinks', 1 + floor(random() * 3), 3.50, (1 + floor(random() * 3)) * 3.50, v_date);
    END LOOP;
    
    FOR j IN 1..(floor(random() * 6 + 3)) LOOP
      INSERT INTO sales_records (business_id, item_name, category, quantity_sold, unit_price, total_revenue, sale_date)
      VALUES (v_business_id, 'Milo Ais', 'Drinks', 1 + floor(random() * 2), 3.50, (1 + floor(random() * 2)) * 3.50, v_date);
    END LOOP;

  END LOOP;

END $$;
