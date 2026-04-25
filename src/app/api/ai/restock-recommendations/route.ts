import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini } from '@/lib/gemini/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { business_id } = body

    if (!business_id) {
      return NextResponse.json({ error: 'business_id is required' }, { status: 400 })
    }

    // Verify ownership
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, type')
      .eq('id', business_id)
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get all inventory items
    const { data: inventoryItems } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('business_id', business_id)

    const items = inventoryItems || []

    // Get recent sales for context
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { data: salesData } = await supabase
      .from('sales_records')
      .select('item_name, quantity_sold')
      .eq('business_id', business_id)
      .gte('sale_date', weekAgo.toISOString().split('T')[0])

    const sales = salesData || []
    const salesMap = new Map<string, number>()
    for (const sale of sales) {
      salesMap.set(
        sale.item_name,
        (salesMap.get(sale.item_name) || 0) + Number(sale.quantity_sold)
      )
    }

    const topSelling = Array.from(salesMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, qty]) => `${name}: ${qty} units/week`)
      .join('\n')

    const inventoryList = items
      .map(
        (i: any) =>
          `- ${i.name}: ${i.quantity} ${i.unit}, reorder at ${i.reorder_level}, status: ${i.status}, cost: RM${i.cost_per_unit}/${i.unit}`
      )
      .join('\n')

    const prompt = `You are a procurement advisor for a Malaysian F&B restaurant called "${business.name}".
Return ONLY a valid JSON array. No explanation. No markdown. Raw JSON only.

Each recommendation object:
{
  "item_name": string,
  "current_quantity": number,
  "current_unit": string,
  "recommended_order_quantity": number,
  "reason": string (max 15 words),
  "estimated_cost": number,
  "urgency": "immediate" | "this_week" | "next_week",
  "supplier_tip": string (optional, max 10 words)
}

Current inventory:
${inventoryList}

Recent sales (last 7 days):
${topSelling || 'No recent sales data'}

Generate recommendations for ALL low and critical items.
Also include items that will likely run out within 3 days based on sales velocity.
Sort by urgency (immediate first).
If all items are well stocked, return an empty array [].`

    const rawResponse = await callGemini(
      [
        { role: 'system', content: prompt },
        { role: 'user', content: 'Generate restock recommendations based on the inventory data above.' },
      ],
      { temperature: 0.3, max_tokens: 2000 }
    )

    // Parse response
    let recommendations: any[] = []
    try {
      let cleaned = rawResponse.trim()
      if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
      else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
      if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
      cleaned = cleaned.trim()

      recommendations = JSON.parse(cleaned)
      if (!Array.isArray(recommendations)) {
        recommendations = []
      }
    } catch (parseErr) {
      console.error('Restock parse error:', parseErr)
      recommendations = []
    }

    // Validate and clean recommendations
    recommendations = recommendations.map((rec: any) => ({
      item_name: String(rec.item_name || ''),
      current_quantity: Number(rec.current_quantity) || 0,
      current_unit: String(rec.current_unit || 'pcs'),
      recommended_order_quantity: Number(rec.recommended_order_quantity) || 0,
      reason: String(rec.reason || '').slice(0, 100),
      estimated_cost: Number(rec.estimated_cost) || 0,
      urgency: ['immediate', 'this_week', 'next_week'].includes(rec.urgency)
        ? rec.urgency
        : 'this_week',
      supplier_tip: rec.supplier_tip ? String(rec.supplier_tip).slice(0, 60) : undefined,
    }))

    return NextResponse.json({ recommendations })
  } catch (err) {
    console.error('POST /api/ai/restock-recommendations error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
