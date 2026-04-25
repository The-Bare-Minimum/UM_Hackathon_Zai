import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const business_id = formData.get('business_id') as string

    if (!file || !business_id) {
      return NextResponse.json({ error: 'Missing file or business_id' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must have a header row and at least one data row' }, { status: 400 })
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const dateIdx = headers.findIndex(h => h.includes('date'))
    const descIdx = headers.findIndex(h => h.includes('desc'))
    const catIdx = headers.findIndex(h => h.includes('cat'))
    const amtIdx = headers.findIndex(h => h.includes('amount') || h.includes('amt'))

    if (dateIdx === -1 || descIdx === -1 || amtIdx === -1) {
      return NextResponse.json({ error: 'CSV must have date, description, and amount columns' }, { status: 400 })
    }

    const expenses: any[] = []
    const errors: string[] = []
    let skipped = 0

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim())
      const date = cols[dateIdx]
      const desc = cols[descIdx]
      const category = catIdx >= 0 ? cols[catIdx] : 'Other'
      const amount = parseFloat(cols[amtIdx])

      if (!date || !desc || isNaN(amount) || amount <= 0) {
        errors.push(`Row ${i + 1}: invalid data`)
        skipped++
        continue
      }

      expenses.push({
        business_id,
        description: desc,
        category: category || 'Other',
        amount,
        expense_date: date,
        is_recurring: false,
      })
    }

    if (expenses.length > 0) {
      const { error } = await supabase.from('expenses').insert(expenses)
      if (error) throw error
    }

    return NextResponse.json({
      imported: expenses.length,
      skipped,
      errors,
    })
  } catch (error) {
    console.error('[Bulk Import] Error:', error)
    return NextResponse.json({ error: 'Failed to import expenses' }, { status: 500 })
  }
}
