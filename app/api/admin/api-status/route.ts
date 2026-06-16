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

    // Get all API keys
    const { data: apiKeys } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: true })

    if (!apiKeys || apiKeys.length === 0) {
      return NextResponse.json({
        apis: [],
        totalMonthlyCost: '$0.00',
        allSystemsHealthy: true,
        lastUpdated: new Date().toISOString()
      })
    }

    // Get today's start and end times
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = today.toISOString()

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

    // Get usage logs for today and this month
    const { data: logs } = await supabase
      .from('api_usage_logs')
      .select('*, team_members(full_name), api_keys(cost_per_unit)')
      .gte('created_at', monthStart)

    // Process each API
    const apis = apiKeys.map((apiKey) => {
      const apiLogs = (logs || []).filter((log) => log.api_key_id === apiKey.id)
      const todayLogs = apiLogs.filter(
        (log) => new Date(log.created_at) >= today
      )

      // Calculate totals
      const dailyQuotaUsed = todayLogs.reduce((sum, log) => sum + (log.quota_units_used || 1), 0)
      const monthlyQuotaUsed = apiLogs.reduce((sum, log) => sum + (log.quota_units_used || 1), 0)
      const monthlyCost = apiLogs.reduce((sum, log) => sum + (log.cost_cents || 0), 0) / 100

      // Get last usage
      const lastLog = apiLogs[apiLogs.length - 1]
      const lastUsedBy = lastLog ? (lastLog.team_members as any)?.full_name || 'Unknown' : null
      const lastUsedTimestamp = lastLog?.created_at || null

      // Calculate health status
      const percentUsed = apiKey.max_quota_daily
        ? (dailyQuotaUsed / apiKey.max_quota_daily) * 100
        : (monthlyQuotaUsed / (apiKey.max_quota_monthly || 100000)) * 100

      let statusColor = 'green'
      if (percentUsed >= 100) {
        statusColor = 'red'
      } else if (percentUsed >= 80) {
        statusColor = 'yellow'
      }

      return {
        id: apiKey.id,
        name: apiKey.api_name,
        displayName: apiKey.display_name,
        serviceType: apiKey.service_type,
        status: statusColor === 'red' ? 'exceeded' : statusColor === 'yellow' ? 'warning' : 'healthy',
        statusColor,
        dailyQuotaUsed,
        dailyQuotaMax: apiKey.max_quota_daily || 0,
        monthlyQuotaUsed,
        monthlyQuotaMax: apiKey.max_quota_monthly || 0,
        percentUsed: Math.round(percentUsed * 10) / 10,
        lastUsedBy,
        lastUsedTimestamp,
        estimatedMonthlyCost: `$${monthlyCost.toFixed(2)}`,
        monthlyCostCents: Math.round(monthlyCost * 100),
        quotaResetDate: apiKey.quota_reset_date,
        quotaResetType: apiKey.quota_reset_type,
      }
    })

    // Calculate total monthly cost
    const totalMonthlyCostCents = apis.reduce((sum, api) => sum + api.monthlyCostCents, 0)
    const totalMonthlyCost = `$${(totalMonthlyCostCents / 100).toFixed(2)}`

    // Check if all systems healthy
    const allSystemsHealthy = apis.every((api) => api.statusColor === 'green')

    return NextResponse.json({
      apis,
      totalMonthlyCost,
      allSystemsHealthy,
      lastUpdated: new Date().toISOString(),
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching API status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch API status' },
      { status: 500 }
    )
  }
}
