import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessRules, upsertBusinessRules } from '@/lib/data/rules'
import { DEFAULT_RULES } from '@/lib/constants'
import type { BusinessRulesFormData } from '@/types'

// ─── GET: Fetch business rules ──────────────────────────
export async function GET() {
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

    const rules = await getBusinessRules(business.id)

    if (!rules) {
      return NextResponse.json({
        rules: {
          business_id: business.id,
          ...DEFAULT_RULES,
          weekly_ingredient_budget: null,
          monthly_revenue_target: null,
          custom_rules: null,
          is_configured: false,
        },
      })
    }

    return NextResponse.json({ rules })
  } catch (error) {
    console.error('[Rules] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST: Save/update business rules ───────────────────
export async function POST(request: NextRequest) {
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

    const body = await request.json() as BusinessRulesFormData
    const errors: string[] = []

    // Parse and validate
    const targetFoodCostPct = parseFloat(body.target_food_cost_pct)
    const targetLaborCostPct = parseFloat(body.target_labor_cost_pct)
    const targetProfitMarginPct = parseFloat(body.target_profit_margin_pct)
    const wasteToleranceRm = parseFloat(body.waste_tolerance_rm)
    const reorderLeadDays = parseInt(body.reorder_lead_days)
    const minStockBufferDays = parseInt(body.min_stock_buffer_days)
    const maxWeeklyStaffHours = parseInt(body.max_weekly_staff_hours)
    const maxOvertimeHours = parseInt(body.max_overtime_hours)
    const minStaffPerShift = parseInt(body.min_staff_per_shift)
    const openingBufferMins = parseInt(body.opening_buffer_mins)
    const closingBufferMins = parseInt(body.closing_buffer_mins)
    const weeklyBudget = body.weekly_ingredient_budget
      ? parseFloat(body.weekly_ingredient_budget)
      : null
    const monthlyTarget = body.monthly_revenue_target
      ? parseFloat(body.monthly_revenue_target)
      : null

    // Validate ranges
    if (isNaN(targetFoodCostPct) || targetFoodCostPct < 1 || targetFoodCostPct > 80)
      errors.push('Food cost target must be between 1-80%')
    if (isNaN(targetLaborCostPct) || targetLaborCostPct < 1 || targetLaborCostPct > 80)
      errors.push('Labor cost target must be between 1-80%')
    if (isNaN(targetProfitMarginPct) || targetProfitMarginPct < 0 || targetProfitMarginPct > 90)
      errors.push('Profit margin target must be between 0-90%')
    if (isNaN(reorderLeadDays) || reorderLeadDays < 1 || reorderLeadDays > 14)
      errors.push('Reorder lead days must be between 1-14')
    if (isNaN(minStockBufferDays) || minStockBufferDays < 1 || minStockBufferDays > 30)
      errors.push('Stock buffer days must be between 1-30')
    if (isNaN(maxWeeklyStaffHours) || maxWeeklyStaffHours < 20 || maxWeeklyStaffHours > 84)
      errors.push('Max weekly hours must be between 20-84')
    if (weeklyBudget !== null && weeklyBudget <= 0)
      errors.push('Weekly budget must be positive')
    if (monthlyTarget !== null && monthlyTarget <= 0)
      errors.push('Monthly target must be positive')

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('. ') }, { status: 400 })
    }

    const validated = {
      weekly_ingredient_budget: weeklyBudget,
      monthly_revenue_target: monthlyTarget,
      target_food_cost_pct: targetFoodCostPct,
      target_labor_cost_pct: targetLaborCostPct,
      target_profit_margin_pct: targetProfitMarginPct,
      waste_tolerance_rm: wasteToleranceRm,
      reorder_lead_days: reorderLeadDays,
      min_stock_buffer_days: minStockBufferDays,
      preferred_restock_day: body.preferred_restock_day,
      auto_reorder_enabled: body.auto_reorder_enabled,
      max_weekly_staff_hours: maxWeeklyStaffHours,
      max_overtime_hours: maxOvertimeHours,
      min_staff_per_shift: minStaffPerShift,
      peak_days: body.peak_days,
      slow_days: body.slow_days,
      opening_buffer_mins: openingBufferMins,
      closing_buffer_mins: closingBufferMins,
      ai_tone: body.ai_tone,
      alert_sensitivity: body.alert_sensitivity,
      custom_rules: body.custom_rules || null,
    }

    const updatedRules = await upsertBusinessRules(business.id, validated)
    return NextResponse.json({ rules: updatedRules })
  } catch (error) {
    console.error('[Rules] POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
