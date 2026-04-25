import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRuleViolations } from '@/lib/data/rules'

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ violations: [] })
    }

    const violations = await checkRuleViolations(business.id)
    return NextResponse.json({ violations })
  } catch (error) {
    console.error('[Rules Violations] Error:', error)
    return NextResponse.json({ violations: [] })
  }
}
