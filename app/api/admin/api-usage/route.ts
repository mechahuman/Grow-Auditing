import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: memberData } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (memberData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Get days parameter (default 30)
    const daysParam = request.nextUrl.searchParams.get('days')
    const days = daysParam ? parseInt(daysParam) : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString()

    // Get all team members and API keys
    const [{ data: teamMembers }, { data: apiKeys }, { data: logs }] = await Promise.all([
      supabase.from('team_members').select('id, user_id, full_name').order('full_name'),
      supabase.from('api_keys').select('id, api_name, display_name'),
      supabase
        .from('api_usage_logs')
        .select('id, api_key_id, user_id, status, quota_units_used, cost_cents, created_at')
        .gte('created_at', startDateStr)
    ])

    // Create lookup maps
    const memberMap = new Map(teamMembers?.map((m) => [m.user_id, m]) || [])
    const apiMap = new Map(apiKeys?.map((a) => [a.id, a]) || [])

    // Group logs by team member and API
    const byTeamMemberMap = new Map<string, any>()
    const byApiMap = new Map<string, any>()
    let totalCalls = 0
    let totalCostCents = 0

    ;(logs || []).forEach((log) => {
      const member = memberMap.get(log.user_id)
      const api = apiMap.get(log.api_key_id)

      if (member && api) {
        // Track by team member
        const memberKey = log.user_id
        if (!byTeamMemberMap.has(memberKey)) {
          byTeamMemberMap.set(memberKey, {
            memberId: member.user_id,
            name: member.full_name,
            totalCalls: 0,
            apiBreakdown: {} as Record<string, number>,
            totalCostCents: 0,
            lastUsed: null,
          })
        }

        const memberData = byTeamMemberMap.get(memberKey)
        memberData.totalCalls += 1
        memberData.apiBreakdown[api.api_name] = (memberData.apiBreakdown[api.api_name] || 0) + 1
        memberData.totalCostCents += log.cost_cents || 0
        if (!memberData.lastUsed || new Date(log.created_at) > new Date(memberData.lastUsed)) {
          memberData.lastUsed = log.created_at
        }

        // Track by API
        const apiKey = api.api_name
        if (!byApiMap.has(apiKey)) {
          byApiMap.set(apiKey, {
            apiName: api.api_name,
            displayName: api.display_name,
            calls: 0,
            costCents: 0,
          })
        }

        const apiData = byApiMap.get(apiKey)
        apiData.calls += 1
        apiData.costCents += log.cost_cents || 0

        totalCalls += 1
        totalCostCents += log.cost_cents || 0
      }
    })

    // Convert to arrays and format costs
    const byTeamMember = Array.from(byTeamMemberMap.values())
      .sort((a, b) => b.totalCalls - a.totalCalls)
      .map((m) => ({
        ...m,
        totalCost: `$${(m.totalCostCents / 100).toFixed(2)}`,
      }))

    const byApi = Array.from(byApiMap.values())
      .sort((a, b) => b.calls - a.calls)
      .map((a) => {
        const percentOfTotal = totalCalls > 0 ? Math.round((a.calls / totalCalls) * 100) : 0
        return {
          ...a,
          cost: `$${(a.costCents / 100).toFixed(2)}`,
          percentOfTotal,
        }
      })

    return NextResponse.json(
      {
        summary: {
          totalCalls,
          totalCost: `$${(totalCostCents / 100).toFixed(2)}`,
          period: `Last ${days} days`,
        },
        byTeamMember,
        byApi,
        lastUpdated: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching API usage:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch API usage' },
      { status: 500 }
    )
  }
}
