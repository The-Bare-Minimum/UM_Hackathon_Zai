import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('business_id')

    if (!businessId) {
      return NextResponse.json({ error: 'Missing business_id' }, { status: 400 })
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

    // Delete all chat messages for this business
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('business_id', businessId)

    if (error) {
      console.error('[Chat Clear] DB Error:', error)
      return NextResponse.json({ error: 'Failed to clear messages' }, { status: 500 })
    }

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('[Chat Clear] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
