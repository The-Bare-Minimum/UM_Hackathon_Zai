import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data, error: authError } = await supabase.auth.getUser()
    const user = data?.user
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, type, staff_count, operating_hours, currency, menu_categories, address } = body

    // Validate required fields
    if (!name || !type || !currency) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, currency' },
        { status: 400 }
      )
    }

    // Check if business already exists for this user
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Business already exists' },
        { status: 409 }
      )
    }

    // Insert new business
    const { data: business, error: insertError } = await supabase
      .from('businesses')
      .insert({
        user_id: user.id,
        name,
        type,
        staff_count: staff_count || 1,
        operating_hours: operating_hours || null,
        currency,
        menu_categories: menu_categories || [],
        address: address || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Business creation error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create business' },
        { status: 500 }
      )
    }

    return NextResponse.json(business, { status: 201 })
  } catch (error) {
    console.error('Business create route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
