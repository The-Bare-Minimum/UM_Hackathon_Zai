import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const business_id = searchParams.get('business_id')
    const period = searchParams.get('period') || 'month'
    const category = searchParams.get('category')

    if (!business_id) return NextResponse.json({ error: 'Missing business_id' }, { status: 400 })

    const now = new Date()
    const periodDays = period === 'week' ? 7 : period === 'quarter' ? 90 : 30
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - periodDays)
    const startStr = startDate.toISOString().split('T')[0]

    let query = supabase
      .from('expenses')
      .select('*')
      .eq('business_id', business_id)
      .gte('expense_date', startStr)
      .order('expense_date', { ascending: false })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data: expenses, error } = await query
    if (error) throw error

    const total = (expenses || []).reduce((s, e) => s + Number(e.amount), 0)
    const recurringTotal = (expenses || [])
      .filter((e: any) => e.is_recurring)
      .reduce((s, e) => s + Number(e.amount), 0)

    return NextResponse.json({
      expenses: expenses || [],
      summary: {
        total: Math.round(total * 100) / 100,
        count: (expenses || []).length,
        recurringTotal: Math.round(recurringTotal * 100) / 100,
      },
    })
  } catch (error) {
    console.error('[Expenses GET] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      business_id, description, category, amount, expense_date,
      is_recurring, recurrence_period, subscription_name,
      vendor, notes, payment_method,
    } = body

    if (!business_id || !description || !category || !amount || !expense_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (Number(amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    }
    if (is_recurring && !recurrence_period) {
      return NextResponse.json({ error: 'Recurring expenses need a period' }, { status: 400 })
    }

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        business_id,
        description,
        category,
        amount: Number(amount),
        expense_date,
        is_recurring: is_recurring || false,
        recurrence_period: recurrence_period || null,
        subscription_name: subscription_name || null,
        vendor: vendor || null,
        notes: notes || null,
        payment_method: payment_method || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ expense }, { status: 201 })
  } catch (error) {
    console.error('[Expenses POST] Error:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}
