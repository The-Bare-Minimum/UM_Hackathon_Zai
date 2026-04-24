import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rows, mapping, business_id } = body as {
      rows: Record<string, any>[]
      mapping: Record<string, string>
      business_id: string
    }

    if (!rows || !mapping || !business_id) {
      return NextResponse.json(
        { error: 'Missing required fields: rows, mapping, or business_id' },
        { status: 400 }
      )
    }

    // Verify business ownership
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', business_id)
      .eq('user_id', user.id)
      .single()

    if (bizError || !business) {
      return NextResponse.json(
        { error: 'Business not found or unauthorized' },
        { status: 403 }
      )
    }

    let imported = 0
    let skipped = 0
    const errors: string[] = []
    const mappedRecords: any[] = []

    // Process and validate rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      
      try {
        const itemNameRaw = row[mapping.item_name]
        const unitPriceRaw = row[mapping.unit_price]
        const dateRaw = row[mapping.sale_date]
        
        if (!itemNameRaw) {
          skipped++
          errors.push(`Row ${i + 1}: Missing item name`)
          continue
        }

        const unitPrice = parseFloat(String(unitPriceRaw).replace(/[^0-9.-]+/g, ''))
        if (isNaN(unitPrice)) {
          skipped++
          errors.push(`Row ${i + 1}: Invalid unit price`)
          continue
        }

        let dateStr = ''
        if (dateRaw) {
          const d = new Date(dateRaw)
          if (!isNaN(d.getTime())) {
            dateStr = d.toISOString().split('T')[0]
          }
        }
        
        if (!dateStr) {
          // Fallback to today if date is missing or invalid
          dateStr = new Date().toISOString().split('T')[0]
        }

        const quantityRaw = mapping.quantity_sold ? row[mapping.quantity_sold] : 1
        let quantity = parseFloat(String(quantityRaw).replace(/[^0-9.-]+/g, ''))
        if (isNaN(quantity)) quantity = 1

        const revenueRaw = mapping.total_revenue ? row[mapping.total_revenue] : null
        let totalRevenue = parseFloat(String(revenueRaw).replace(/[^0-9.-]+/g, ''))
        
        if (isNaN(totalRevenue)) {
          totalRevenue = quantity * unitPrice
        }

        mappedRecords.push({
          business_id,
          item_name: String(itemNameRaw).trim(),
          category: 'Uncategorized', // Can be enhanced to detect categories or use a mapped column
          quantity_sold: quantity,
          unit_price: unitPrice,
          total_revenue: totalRevenue,
          sale_date: dateStr,
        })

      } catch (err) {
        skipped++
        errors.push(`Row ${i + 1}: Unexpected error parsing row data`)
      }
    }

    if (mappedRecords.length === 0) {
      return NextResponse.json(
        { error: 'No valid records to import', skipped, errors },
        { status: 400 }
      )
    }

    // Batch insert into supabase (chunks of 100)
    const CHUNK_SIZE = 100
    for (let i = 0; i < mappedRecords.length; i += CHUNK_SIZE) {
      const chunk = mappedRecords.slice(i, i + CHUNK_SIZE)
      const { error: insertError } = await supabase
        .from('sales_records')
        .insert(chunk)
      
      if (insertError) {
        console.error('Insert chunk error:', insertError)
        return NextResponse.json(
          { error: 'Database error during insertion', imported, skipped: skipped + (mappedRecords.length - imported) },
          { status: 500 }
        )
      }
      imported += chunk.length
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.slice(0, 10), // Return only first 10 errors to avoid huge payloads
    })
  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json(
      { error: 'Failed to import CSV data' },
      { status: 500 }
    )
  }
}
