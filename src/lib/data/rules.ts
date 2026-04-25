import { createClient } from '@/lib/supabase/server'
import type { BusinessRules, RuleViolation } from '@/types'

// ─── Fetch Business Rules ────────────────────────────────
export async function getBusinessRules(
  business_id: string
): Promise<BusinessRules | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('business_rules')
    .select('*')
    .eq('business_id', business_id)
    .single()

  if (error || !data) return null
  return data as BusinessRules
}

// ─── Upsert Business Rules ──────────────────────────────
export async function upsertBusinessRules(
  business_id: string,
  rules: Partial<BusinessRules>
): Promise<BusinessRules | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('business_rules')
    .upsert(
      {
        business_id,
        ...rules,
        is_configured: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'business_id',
      }
    )
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as BusinessRules
}

// ─── Build Rules Context for AI Prompts ─────────────────
export function buildRulesContext(
  rules: BusinessRules | null
): string {
  if (!rules || !rules.is_configured) return ''

  return `
=== OWNER-DEFINED BUSINESS RULES ===
These are the owner's constraints. You MUST respect all of them in every recommendation.
Never suggest actions that violate these rules.
If a situation conflicts with a rule, flag the conflict explicitly and suggest the best alternative within the constraint.

FINANCIAL CONSTRAINTS:
- Weekly ingredient budget: ${
    rules.weekly_ingredient_budget
      ? `RM${rules.weekly_ingredient_budget}`
      : 'not set'
  }
- Monthly revenue target: ${
    rules.monthly_revenue_target
      ? `RM${rules.monthly_revenue_target}`
      : 'not set'
  }
- Target food cost: max ${rules.target_food_cost_pct}% of revenue
- Target labor cost: max ${rules.target_labor_cost_pct}% of revenue
- Target profit margin: min ${rules.target_profit_margin_pct}%
- Acceptable weekly waste: max RM${rules.waste_tolerance_rm}

INVENTORY CONSTRAINTS:
- Reorder lead time: ${rules.reorder_lead_days} days (order this many days before running out)
- Minimum stock buffer: ${rules.min_stock_buffer_days} days
- Preferred restock day: ${rules.preferred_restock_day}
- Auto reorder: ${rules.auto_reorder_enabled ? 'enabled' : 'disabled'}

STAFF CONSTRAINTS:
- Max weekly hours per staff: ${rules.max_weekly_staff_hours} hours
- Max overtime per week: ${rules.max_overtime_hours} hours
- Minimum staff per shift: ${rules.min_staff_per_shift}

OPERATIONAL CONTEXT:
- Peak days: ${rules.peak_days?.join(', ') || 'not set'} (expect higher demand, ensure full stock)
- Slow days: ${rules.slow_days?.join(', ') || 'not set'} (reduce prep, consider promotions)
- Pre-opening buffer: ${rules.opening_buffer_mins} mins
- Post-closing buffer: ${rules.closing_buffer_mins} mins

AI BEHAVIOUR SETTINGS:
- Advice style: ${rules.ai_tone} ${
    rules.ai_tone === 'conservative'
      ? '(only flag serious issues)'
      : rules.ai_tone === 'aggressive'
        ? '(proactively suggest improvements)'
        : '(balanced and practical)'
  }
- Alert sensitivity: ${rules.alert_sensitivity} ${
    rules.alert_sensitivity === 'high'
      ? '(flag all potential issues)'
      : rules.alert_sensitivity === 'low'
        ? '(only flag critical issues)'
        : '(flag important issues only)'
  }
${
  rules.custom_rules
    ? `\nCUSTOM RULES (follow exactly):\n${rules.custom_rules}`
    : ''
}
`.trim()
}

// ─── Check Rule Violations ──────────────────────────────
export async function checkRuleViolations(
  business_id: string
): Promise<RuleViolation[]> {
  const supabase = await createClient()
  const rules = await getBusinessRules(business_id)

  if (!rules || !rules.is_configured) return []

  const violations: RuleViolation[] = []
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]
  const monthAgoStr = new Date(now.getTime() - 30 * 86400000)
    .toISOString()
    .split('T')[0]

  // Fetch data in parallel
  const [
    { data: weekSales },
    { data: monthSales },
    { data: monthExpenses },
    { data: inventoryItems },
  ] = await Promise.all([
    supabase
      .from('sales_records')
      .select('total_revenue')
      .eq('business_id', business_id)
      .gte('sale_date', weekAgoStr),
    supabase
      .from('sales_records')
      .select('total_revenue')
      .eq('business_id', business_id)
      .gte('sale_date', monthAgoStr),
    supabase
      .from('expenses')
      .select('amount, category')
      .eq('business_id', business_id)
      .gte('expense_date', monthAgoStr),
    supabase
      .from('inventory_items')
      .select('name, quantity, cost_per_unit, status, expiry_date')
      .eq('business_id', business_id),
  ])

  const monthRevenue = (monthSales || []).reduce(
    (s, r) => s + Number(r.total_revenue),
    0
  )
  const weekRevenue = (weekSales || []).reduce(
    (s, r) => s + Number(r.total_revenue),
    0
  )

  // Food cost check
  const ingredientExpenses = (monthExpenses || [])
    .filter((e) => e.category === 'Ingredients')
    .reduce((s, e) => s + Number(e.amount), 0)
  const foodCostRatio =
    monthRevenue > 0 ? (ingredientExpenses / monthRevenue) * 100 : 0

  if (foodCostRatio > rules.target_food_cost_pct * 1.1) {
    violations.push({
      rule: 'Food Cost',
      current: `${foodCostRatio.toFixed(1)}%`,
      limit: `${rules.target_food_cost_pct}%`,
      severity: 'danger',
      suggestion: `Food cost is significantly over target. Review ingredient prices or adjust menu pricing.`,
    })
  } else if (foodCostRatio > rules.target_food_cost_pct) {
    violations.push({
      rule: 'Food Cost',
      current: `${foodCostRatio.toFixed(1)}%`,
      limit: `${rules.target_food_cost_pct}%`,
      severity: 'warning',
      suggestion: `Food cost is slightly above target. Monitor closely this week.`,
    })
  }

  // Labor cost check
  const laborExpenses = (monthExpenses || [])
    .filter((e) => e.category === 'Staff Salary')
    .reduce((s, e) => s + Number(e.amount), 0)
  const laborCostRatio =
    monthRevenue > 0 ? (laborExpenses / monthRevenue) * 100 : 0

  if (laborCostRatio > rules.target_labor_cost_pct * 1.1) {
    violations.push({
      rule: 'Labor Cost',
      current: `${laborCostRatio.toFixed(1)}%`,
      limit: `${rules.target_labor_cost_pct}%`,
      severity: 'danger',
      suggestion: `Labor cost exceeds target. Consider adjusting shifts on slow days.`,
    })
  } else if (laborCostRatio > rules.target_labor_cost_pct) {
    violations.push({
      rule: 'Labor Cost',
      current: `${laborCostRatio.toFixed(1)}%`,
      limit: `${rules.target_labor_cost_pct}%`,
      severity: 'warning',
      suggestion: `Labor cost is above target. Review staffing schedules.`,
    })
  }

  // Waste check — estimated from expired/critical items
  const wasteItems = (inventoryItems || []).filter(
    (i: any) =>
      i.status === 'expired' ||
      i.status === 'critical' ||
      (i.expiry_date && new Date(i.expiry_date) < now)
  )
  const wasteValue = wasteItems.reduce(
    (s: number, i: any) => s + Number(i.quantity) * Number(i.cost_per_unit),
    0
  )

  if (wasteValue > rules.waste_tolerance_rm) {
    violations.push({
      rule: 'Waste Tolerance',
      current: `RM${wasteValue.toFixed(2)}`,
      limit: `RM${rules.waste_tolerance_rm}`,
      severity: 'danger',
      suggestion: `Waste value exceeds tolerance. Check expiring items and reduce over-ordering.`,
    })
  }

  // Weekly budget check
  if (rules.weekly_ingredient_budget) {
    const weekIngredientExpenses = (monthExpenses || [])
      .filter((e) => e.category === 'Ingredients')
      .reduce((s, e) => s + Number(e.amount), 0)
    // Approximate weekly from monthly
    const weeklyApprox = weekIngredientExpenses / 4

    if (weeklyApprox > rules.weekly_ingredient_budget) {
      violations.push({
        rule: 'Weekly Ingredient Budget',
        current: `RM${weeklyApprox.toFixed(2)}/week (est.)`,
        limit: `RM${rules.weekly_ingredient_budget}`,
        severity: 'danger',
        suggestion: `Ingredient spending exceeds weekly budget. Review purchase orders.`,
      })
    } else if (weeklyApprox > rules.weekly_ingredient_budget * 0.9) {
      violations.push({
        rule: 'Weekly Ingredient Budget',
        current: `RM${weeklyApprox.toFixed(2)}/week (est.)`,
        limit: `RM${rules.weekly_ingredient_budget}`,
        severity: 'warning',
        suggestion: `Approaching weekly ingredient budget limit. Monitor remaining purchases.`,
      })
    }
  }

  return violations
}
