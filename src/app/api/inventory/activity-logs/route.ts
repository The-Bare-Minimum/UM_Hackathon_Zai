import { createClient } from '@/lib/supabase/server'
import { getInventoryLogsPaginated } from '@/lib/data/inventory'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's business
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json(
        { error: 'No business found' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 50
    const changeType = (searchParams.get('changeType') as 'all' | 'add' | 'deduct' | 'adjust' | 'invoice') || 'all'
    const dateRange = (searchParams.get('dateRange') as 'all' | 'today' | 'week' | 'month' | 'custom') || 'all'
    const customStartDate = searchParams.get('customStartDate') || undefined
    const customEndDate = searchParams.get('customEndDate') || undefined
    const itemName = searchParams.get('itemName') || ''
    const sortBy = (searchParams.get('sortBy') as 'newest' | 'oldest') || 'newest'

    // Fetch paginated logs
    const result = await getInventoryLogsPaginated(business.id, {
      page,
      limit,
      changeType,
      dateRange,
      customStartDate,
      customEndDate,
      itemName,
      sortBy,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in activity-logs API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
