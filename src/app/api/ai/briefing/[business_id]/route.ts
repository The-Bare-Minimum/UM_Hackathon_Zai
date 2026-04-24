import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMalaysiaDateString } from '@/lib/utils'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ business_id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { business_id } = await params

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

    const today = getMalaysiaDateString()

    const { error } = await supabase
      .from('ai_briefings')
      .delete()
      .eq('business_id', business_id)
      .eq('briefing_date', today)

    if (error) {
      console.error('[Briefing] Delete error:', error)
      return NextResponse.json({ error: 'Failed to delete briefing' }, { status: 500 })
    }

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('[Briefing] Delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
