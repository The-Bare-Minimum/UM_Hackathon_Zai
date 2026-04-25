import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/inventory?business_id=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = request.nextUrl.searchParams.get('business_id')
    if (!businessId) {
      return NextResponse.json({ error: 'business_id is required' }, { status: 400 })
    }

    // Verify ownership
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const { data: items, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('business_id', businessId)
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: items })
  } catch (err) {
    console.error('GET /api/inventory error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/inventory — create new item
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      business_id,
      name,
      category,
      quantity,
      unit,
      reorder_level,
      cost_per_unit,
      supplier,
      expiry_date,
    } = body

    // Validate required fields
    if (!name || !category || !unit || !business_id) {
      return NextResponse.json(
        { error: 'name, category, unit, and business_id are required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', business_id)
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const qty = Number(quantity) || 0
    const reorder = Number(reorder_level) || 0
    const cost = Number(cost_per_unit) || 0

    // Calculate initial status
    let status: 'ok' | 'low' | 'critical' = 'ok'
    if (qty <= 0) status = 'critical'
    else if (qty <= reorder) status = 'low'

    // Insert inventory item
    const { data: newItem, error: insertError } = await supabase
      .from('inventory_items')
      .insert({
        business_id,
        name,
        category,
        quantity: qty,
        unit,
        reorder_level: reorder,
        cost_per_unit: cost,
        supplier: supplier || null,
        expiry_date: expiry_date || null,
        status,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Log the initial stock entry
    await supabase.from('inventory_logs').insert({
      inventory_item_id: newItem.id,
      business_id,
      change_type: 'add',
      quantity_change: qty,
      notes: 'Initial stock entry',
    })

    return NextResponse.json({ data: newItem }, { status: 201 })
  } catch (err) {
    console.error('POST /api/inventory error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
