import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/inventory/bulk-update
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, source = 'manual', business_id } = body

    if (!items || !Array.isArray(items) || !business_id) {
      return NextResponse.json(
        { error: 'items array and business_id are required' },
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

    // Fetch existing inventory items for matching
    const { data: existingItems } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('business_id', business_id)

    const inventory = existingItems || []

    let updated = 0
    let created = 0
    const resultItems: any[] = []

    for (const item of items) {
      let matchedItem: any = null

      // If id provided, find by id
      if (item.id) {
        matchedItem = inventory.find((inv: any) => inv.id === item.id)
      }

      // If no match by id, try fuzzy name match
      if (!matchedItem && item.name) {
        const searchName = item.name.toLowerCase().trim()
        matchedItem = inventory.find((inv: any) => {
          const invName = inv.name.toLowerCase().trim()
          return (
            invName.includes(searchName) ||
            searchName.includes(invName) ||
            invName === searchName
          )
        })
      }

      if (matchedItem) {
        // Update existing item
        const newQty = Number(matchedItem.quantity) + Number(item.quantity_change || item.quantity || 0)
        let status: 'ok' | 'low' | 'critical' = 'ok'
        if (newQty <= 0) status = 'critical'
        else if (newQty <= Number(matchedItem.reorder_level)) status = 'low'

        const updateData: Record<string, any> = {
          quantity: newQty,
          status,
          updated_at: new Date().toISOString(),
        }

        // Update cost if provided
        if (item.cost_per_unit && Number(item.cost_per_unit) > 0) {
          updateData.cost_per_unit = Number(item.cost_per_unit)
        }

        const { data: updatedItem } = await supabase
          .from('inventory_items')
          .update(updateData)
          .eq('id', matchedItem.id)
          .select()
          .single()

        // Log the change
        await supabase.from('inventory_logs').insert({
          inventory_item_id: matchedItem.id,
          business_id,
          change_type: source === 'invoice' ? 'invoice' : 'add',
          quantity_change: Number(item.quantity_change || item.quantity || 0),
          notes: item.notes || `Bulk update from ${source}`,
        })

        updated++
        if (updatedItem) resultItems.push(updatedItem)
      } else {
        // Create new item
        const qty = Number(item.quantity_change || item.quantity || 0)
        const reorderLevel = Math.max(Math.round(qty * 0.3), 1)
        let status: 'ok' | 'low' | 'critical' = 'ok'
        if (qty <= 0) status = 'critical'
        else if (qty <= reorderLevel) status = 'low'

        const { data: newItem } = await supabase
          .from('inventory_items')
          .insert({
            business_id,
            name: item.name,
            category: item.category || 'Other',
            quantity: qty,
            unit: item.unit || 'pcs',
            reorder_level: reorderLevel,
            cost_per_unit: Number(item.cost_per_unit) || 0,
            supplier: null,
            expiry_date: null,
            status,
          })
          .select()
          .single()

        if (newItem) {
          // Log the creation
          await supabase.from('inventory_logs').insert({
            inventory_item_id: newItem.id,
            business_id,
            change_type: source === 'invoice' ? 'invoice' : 'add',
            quantity_change: qty,
            notes: item.notes || `New item from ${source}`,
          })

          created++
          resultItems.push(newItem)
        }
      }
    }

    return NextResponse.json({
      updated,
      created,
      items: resultItems,
    })
  } catch (err) {
    console.error('POST /api/inventory/bulk-update error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
