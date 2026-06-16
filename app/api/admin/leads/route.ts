import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin role
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

    // Fetch all leads with team member info
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select(`
        id,
        lead_name,
        youtube_channel_id,
        user_id,
        lead_score_total,
        draft,
        status,
        created_at,
        category,
        found_by,
        g_factor,
        subscriber_count,
        channel_thumbnail_url
      `)
      .order('created_at', { ascending: false })

    if (leadsError) throw leadsError

    // Enrich leads with team member names
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('id, user_id, full_name')

    const enrichedLeads = (leads || []).map(lead => {
      const member = teamMembers?.find(m => (m.user_id || m.id) === lead.user_id)
      return {
        ...lead,
        assigned_to_member: member?.full_name || 'Unassigned',
      }
    })

    return NextResponse.json(enrichedLeads, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}
