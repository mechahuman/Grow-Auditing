import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch audit logs for the lead
    const { data: auditLogs, error: auditError } = await supabase
      .from('lead_reassignment_audit')
      .select(`
        id,
        lead_id,
        previous_assignee_id,
        new_assignee_id,
        changed_by_id,
        action,
        created_at
      `)
      .eq('lead_id', params.id)
      .order('created_at', { ascending: false })

    // If audit table doesn't exist or there's an error, return empty array
    if (auditError) {
      console.warn('Audit log query error (may be expected if table not migrated):', auditError.message)
      return NextResponse.json([], { status: 200 })
    }

    // Enrich with team member names
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('user_id, full_name, email')

    const enrichedLogs = (auditLogs || []).map(log => {
      const previousMember = teamMembers?.find(m => m.user_id === log.previous_assignee_id)
      const newMember = teamMembers?.find(m => m.user_id === log.new_assignee_id)
      const changedByMember = teamMembers?.find(m => m.user_id === log.changed_by_id)

      return {
        ...log,
        previous_assignee: previousMember?.full_name || null,
        new_assignee: newMember?.full_name || 'Unknown',
        changed_by: changedByMember?.full_name || 'System',
      }
    })

    return NextResponse.json(enrichedLogs, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    // Return empty array instead of 500 error so modal can still display lead details
    return NextResponse.json([], { status: 200 })
  }
}
