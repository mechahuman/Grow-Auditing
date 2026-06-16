import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Test endpoint to verify delete is working
 * GET /api/test-delete?id=<lead_id>
 */
export async function GET(request: NextRequest) {
  try {
    const leadId = request.nextUrl.searchParams.get('id')
    if (!leadId) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Check if lead exists
    console.log(`[TEST] Checking if lead exists: ${leadId}`)
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('id, lead_name')
      .eq('id', leadId)
      .single()

    if (fetchError) {
      return NextResponse.json({
        error: 'Lead not found',
        details: fetchError,
        leadId
      }, { status: 404 })
    }

    console.log(`[TEST] Lead found:`, lead)

    // 2. Attempt delete
    console.log(`[TEST] Attempting to delete...`)
    const { error: deleteError, data: deleteResult, count } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId)

    console.log(`[TEST] Delete result:`, { deleteError, deleteResult, count })

    // 3. Verify it's deleted
    console.log(`[TEST] Verifying deletion...`)
    const { data: afterDelete, error: verifyError } = await supabase
      .from('leads')
      .select('id, lead_name')
      .eq('id', leadId)
      .single()

    console.log(`[TEST] After delete check:`, { afterDelete, verifyError })

    return NextResponse.json({
      leadId,
      leadBefore: lead,
      deleteError,
      deleteResult,
      count,
      verifyError,
      leadAfterDelete: afterDelete,
      status: afterDelete ? 'FAILED - Lead still exists!' : 'SUCCESS - Lead deleted'
    })
  } catch (error: any) {
    console.error('[TEST] Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
