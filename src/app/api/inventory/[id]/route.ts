import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/inventory/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: item, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Verify ownership
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', item.business_id)
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    return NextResponse.json({ data: item })
  } catch (err) {
    console.error('GET /api/inventory/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/inventory/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get existing item
    const { data: existingItem, error: fetchError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Verify ownership
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', existingItem.business_id)
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const updates: Record<string, any> = {}

    // Apply partial updates
    if (body.name !== undefined) updates.name = body.name
    if (body.category !== undefined) updates.category = body.category
    if (body.unit !== undefined) updates.unit = body.unit
    if (body.reorder_level !== undefined) updates.reorder_level = Number(body.reorder_level)
    if (body.cost_per_unit !== undefined) updates.cost_per_unit = Number(body.cost_per_unit)
    if (body.supplier !== undefined) updates.supplier = body.supplier
    if (body.expiry_date !== undefined) updates.expiry_date = body.expiry_date

    // Handle quantity change with logging
    if (body.quantity !== undefined) {
      const newQty = Number(body.quantity)
      const oldQty = Number(existingItem.quantity)
      const quantityChange = newQty - oldQty

      updates.quantity = newQty

      if (quantityChange !== 0) {
        await supabase.from('inventory_logs').insert({
          inventory_item_id: id,
          business_id: existingItem.business_id,
          change_type: 'adjust',
          quantity_change: quantityChange,
          notes: body.notes || 'Manual adjustment',
        })
      }
    }

    // Recalculate status
    const finalQty = updates.quantity ?? Number(existingItem.quantity)
    const finalReorder = updates.reorder_level ?? Number(existingItem.reorder_level)
    const finalExpiry = updates.expiry_date ?? existingItem.expiry_date

    if (finalExpiry && new Date(finalExpiry) < new Date()) {
      updates.status = 'expired'
    } else if (finalQty <= 0) {
      updates.status = 'critical'
    } else if (finalQty <= finalReorder) {
      updates.status = 'low'
    } else {
      updates.status = 'ok'
    }

    updates.updated_at = new Date().toISOString()

    const { data: updatedItem, error: updateError } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ data: updatedItem })
  } catch (err) {
    console.error('PATCH /api/inventory/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/inventory/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get existing item
    const { data: existingItem } = await supabase
      .from('inventory_items')
      .select('business_id')
      .eq('id', id)
      .single()

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Verify ownership
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', existingItem.business_id)
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Delete related logs first
    await supabase
      .from('inventory_logs')
      .delete()
      .eq('inventory_item_id', id)

    // Delete the item
    const { error: deleteError } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ deleted: true })
  } catch (err) {
    console.error('DELETE /api/inventory/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
