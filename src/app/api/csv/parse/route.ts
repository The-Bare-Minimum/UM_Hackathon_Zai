import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Papa from 'papaparse'

// Column mapping detection patterns
const COLUMN_PATTERNS: Record<string, string[]> = {
  item_name: ['item', 'product', 'name', 'item_name', 'product_name', 'menu item', 'description', 'item name', 'product name'],
  quantity_sold: ['qty', 'quantity', 'amount sold', 'quantity_sold', 'qty sold', 'units', 'count', 'quantity sold', 'no.'],
  unit_price: ['price', 'unit price', 'rate', 'unit_price', 'selling price', 'item price', 'cost', 'price per unit'],
  total_revenue: ['total', 'revenue', 'sales', 'total_revenue', 'amount', 'total price', 'subtotal', 'total amount', 'net amount', 'gross sales'],
  sale_date: ['date', 'sale date', 'transaction date', 'sale_date', 'order date', 'trans date', 'created', 'transaction_date', 'order_date'],
}

function detectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}

  for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
    for (const header of headers) {
      const normalizedHeader = header.toLowerCase().trim()
      if (patterns.some((p) => normalizedHeader === p || normalizedHeader.includes(p))) {
        mapping[field] = header
        break
      }
    }
  }

  return mapping
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    }

    // Check file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Only CSV files are supported.' }, { status: 400 })
    }

    const text = await file.text()

    // Parse CSV
    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    })

    if (result.errors.length > 0 && result.data.length === 0) {
      return NextResponse.json(
        { error: `CSV parsing error: ${result.errors[0].message}` },
        { status: 400 }
      )
    }

    const headers = result.meta.fields || []
    const mapping = detectColumnMapping(headers)
    const preview = result.data.slice(0, 5)

    return NextResponse.json({
      mapping,
      preview,
      totalRows: result.data.length,
      detectedColumns: headers,
    })
  } catch (error) {
    console.error('CSV parse error:', error)
    return NextResponse.json(
      { error: 'Failed to parse CSV file' },
      { status: 500 }
    )
  }
}
