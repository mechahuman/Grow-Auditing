import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      apiName,
      userId,
      endpoint,
      status,
      errorMessage,
      quotaUnitsUsed = 1,
      responseTimeMs,
    } = body

    // Validate required fields
    if (!apiName || !userId) {
      return NextResponse.json(
        { error: 'apiName and userId are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get the API key
    const { data: apiKey } = await supabase
      .from('api_keys')
      .select('id, cost_per_unit')
      .eq('api_name', apiName)
      .single()

    if (!apiKey) {
      return NextResponse.json(
        { error: `API key not found for ${apiName}` },
        { status: 404 }
      )
    }

    // Calculate cost in cents
    const costCents = Math.round(quotaUnitsUsed * (apiKey.cost_per_unit || 0) * 100)

    // Insert usage log
    const { error } = await supabase.from('api_usage_logs').insert({
      api_key_id: apiKey.id,
      user_id: userId,
      endpoint,
      status,
      error_message: errorMessage || null,
      quota_units_used: quotaUnitsUsed,
      response_time_ms: responseTimeMs || 0,
      cost_cents: costCents,
    })

    if (error) {
      console.error('Error logging API usage:', error)
      // Don't fail the request if logging fails
      return NextResponse.json(
        { warning: 'Logged API call but failed to record usage' },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'API usage logged successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in track-api-usage:', error)
    // Don't fail the request - logging is non-critical
    return NextResponse.json(
      { warning: 'Failed to log API usage', details: error.message },
      { status: 200 }
    )
  }
}
