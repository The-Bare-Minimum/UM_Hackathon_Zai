import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's business
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 })
    }

    const bid = business.id

    // Check if sales already exist
    const { count } = await supabase
      .from('sales_records')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', bid)

    if ((count || 0) > 0) {
      return NextResponse.json({ error: 'Demo data already loaded' }, { status: 409 })
    }

    const now = new Date()

    // Helper to get date N days ago as YYYY-MM-DD
    const daysAgo = (n: number) => {
      const d = new Date(now)
      d.setDate(d.getDate() - n)
      return d.toISOString().split('T')[0]
    }

    // ─── SALES RECORDS (14 days) ─────────────────────────
    const menuItems = [
      { name: 'Nasi Lemak', price: 12, category: 'Main Course' },
      { name: 'Mee Goreng', price: 10, category: 'Main Course' },
      { name: 'Teh Tarik', price: 3.5, category: 'Drinks' },
      { name: 'Ayam Goreng Set', price: 15, category: 'Main Course' },
      { name: 'Roti Canai', price: 3, category: 'Breakfast' },
      { name: 'Nasi Goreng', price: 11, category: 'Main Course' },
      { name: 'Cendol', price: 5, category: 'Desserts' },
      { name: 'Milo Ais', price: 3.5, category: 'Drinks' },
    ]

    const salesRecords: Array<{
      business_id: string
      item_name: string
      category: string
      quantity_sold: number
      unit_price: number
      total_revenue: number
      sale_date: string
    }> = []

    for (let day = 1; day <= 14; day++) {
      const date = daysAgo(day)
      const d = new Date(date)
      const isWeekend = d.getDay() === 0 || d.getDay() === 6

      // 8-15 transactions on weekdays, 20-30% more on weekends
      const baseCount = 8 + Math.floor(Math.random() * 8)
      const txCount = isWeekend
        ? Math.floor(baseCount * (1.2 + Math.random() * 0.1))
        : baseCount

      for (let t = 0; t < txCount; t++) {
        const item = menuItems[Math.floor(Math.random() * menuItems.length)]
        const qty = item.category === 'Drinks' || item.category === 'Desserts'
          ? 1 + Math.floor(Math.random() * 3)
          : 1 + Math.floor(Math.random() * 2)

        salesRecords.push({
          business_id: bid,
          item_name: item.name,
          category: item.category,
          quantity_sold: qty,
          unit_price: item.price,
          total_revenue: item.price * qty,
          sale_date: date,
        })
      }
    }

    const { error: salesError } = await supabase
      .from('sales_records')
      .insert(salesRecords)

    if (salesError) throw salesError

    // ─── INVENTORY ITEMS ─────────────────────────────────
    const inventoryItems = [
      { name: 'Rice (Beras)', category: 'Dry Goods', quantity: 15, unit: 'kg', reorder_level: 5, cost_per_unit: 2.5, status: 'ok' },
      { name: 'Chicken (Ayam)', category: 'Protein', quantity: 8, unit: 'kg', reorder_level: 3, cost_per_unit: 9, status: 'ok' },
      { name: 'Cooking Oil', category: 'Cooking', quantity: 5, unit: 'L', reorder_level: 2, cost_per_unit: 7, status: 'ok' },
      { name: 'Eggs (Telur)', category: 'Protein', quantity: 60, unit: 'units', reorder_level: 20, cost_per_unit: 0.45, status: 'ok' },
      { name: 'Flour (Tepung)', category: 'Dry Goods', quantity: 10, unit: 'kg', reorder_level: 3, cost_per_unit: 1.8, status: 'ok' },
      { name: 'Coconut Milk (Santan)', category: 'Cooking', quantity: 2.5, unit: 'L', reorder_level: 2, cost_per_unit: 6, status: 'low' },
      { name: 'Teh Tarik Powder', category: 'Drinks', quantity: 0.4, unit: 'kg', reorder_level: 0.5, cost_per_unit: 18, status: 'critical' },
      { name: 'Milo Powder', category: 'Drinks', quantity: 0.8, unit: 'kg', reorder_level: 0.5, cost_per_unit: 22, status: 'low' },
      { name: 'Vegetables (Sayur)', category: 'Fresh', quantity: 1.2, unit: 'kg', reorder_level: 1, cost_per_unit: 4, status: 'low' },
      { name: 'Chilli Paste (Sambal)', category: 'Condiments', quantity: 2, unit: 'kg', reorder_level: 0.5, cost_per_unit: 8, status: 'ok' },
      { name: 'Salt', category: 'Condiments', quantity: 1, unit: 'kg', reorder_level: 0.3, cost_per_unit: 1.2, status: 'ok' },
      { name: 'Sugar', category: 'Dry Goods', quantity: 2, unit: 'kg', reorder_level: 0.5, cost_per_unit: 2, status: 'ok' },
    ]

    const { error: invError } = await supabase
      .from('inventory_items')
      .insert(inventoryItems.map((item) => ({ ...item, business_id: bid })))

    if (invError) throw invError

    // ─── EXPENSES ────────────────────────────────────────
    const expenseRecords = [
      { description: 'Monthly Rent - April', category: 'Rent', amount: 3500, expense_date: daysAgo(14) },
      { description: 'Staff Salary - Week 2', category: 'Staff Salary', amount: 4200, expense_date: daysAgo(7) },
      { description: 'Chicken & Meat Restock', category: 'Ingredients', amount: 480, expense_date: daysAgo(12) },
      { description: 'Vegetables & Fresh Produce', category: 'Ingredients', amount: 320, expense_date: daysAgo(9) },
      { description: 'Dry Goods Restock', category: 'Ingredients', amount: 250, expense_date: daysAgo(5) },
      { description: 'Drinks Supplies Restock', category: 'Ingredients', amount: 580, expense_date: daysAgo(3) },
      { description: 'Electricity & Water Bill', category: 'Utilities', amount: 280, expense_date: daysAgo(10) },
    ]

    const { error: expError } = await supabase
      .from('expenses')
      .insert(expenseRecords.map((e) => ({ ...e, business_id: bid })))

    if (expError) throw expError

    // ─── STAFF MEMBERS ───────────────────────────────────
    const staffRecords = [
      { name: 'Ahmad', role: 'Head Chef', salary: 2200, hire_date: '2024-01-15' },
      { name: 'Siti', role: 'Cashier', salary: 1400, hire_date: '2024-03-01' },
      { name: 'Kumar', role: 'Kitchen Helper', salary: 1200, hire_date: '2024-06-15' },
      { name: 'Lee', role: 'Waiter', salary: 1300, hire_date: '2024-08-01' },
    ]

    const { error: staffError } = await supabase
      .from('staff_members')
      .insert(staffRecords.map((s) => ({ ...s, business_id: bid })))

    if (staffError) throw staffError

    return NextResponse.json({
      success: true,
      counts: {
        sales: salesRecords.length,
        inventory: inventoryItems.length,
        expenses: expenseRecords.length,
        staff: staffRecords.length,
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to seed data' },
      { status: 500 }
    )
  }
}
