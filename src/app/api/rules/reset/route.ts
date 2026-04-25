import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { upsertBusinessRules } from '@/lib/data/rules'
import { DEFAULT_RULES } from '@/lib/constants'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const resetRules = {
      ...DEFAULT_RULES,
      weekly_ingredient_budget: null,
      monthly_revenue_target: null,
      custom_rules: null,
      is_configured: true,
    }

    const rules = await upsertBusinessRules(business.id, resetRules)
    return NextResponse.json({ rules })
  } catch (error) {
    console.error('[Rules] Reset error:', error)
    return NextResponse.json({ error: 'Failed to reset rules' }, { status: 500 })
  }
}
