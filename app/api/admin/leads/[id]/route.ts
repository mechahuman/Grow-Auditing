import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Fetch complete lead details with all enriched data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        id,
        lead_name,
        youtube_channel_id,
        youtube_handle,
        youtube_url,
        user_id,
        lead_score_total,
        draft,
        status,
        created_at,
        updated_at,
        category,
        found_by,
        g_factor,
        subscriber_count,
        total_views,
        video_count,
        channel_created_at,
        last_upload_at,
        avg_views_last_10,
        s2v_ratio_pct,
        posting_frequency_30d,
        email,
        website,
        instagram,
        twitter,
        content_style,
        posting_pattern,
        monetization,
        strengths,
        concerns,
        data_gaps,
        remarks_ai_draft,
        remarks_final,
        yt_score_factor,
        sub_range_factor,
        s2v_factor,
        g_factor_normalized,
        ai_confidence,
        channel_thumbnail_url,
        raw_youtube_data,
        raw_ai_response
      `)
      .eq('id', params.id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Get assigned team member
    const { data: member } = await supabase
      .from('team_members')
      .select('full_name, email')
      .eq('user_id', lead.user_id)
      .single()

    const response = {
      ...lead,
      assigned_to_member: member?.full_name || 'Unassigned',
    }

    console.log('Admin API returning lead data:', response)

    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lead' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { new_assignee_id } = await request.json()

    if (!new_assignee_id) {
      return NextResponse.json(
        { error: 'new_assignee_id is required' },
        { status: 400 }
      )
    }

    // Get current lead
    const { data: currentLead, error: leadError } = await supabase
      .from('leads')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (leadError || !currentLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Update lead assignment
    const { error: updateError } = await supabase
      .from('leads')
      .update({ user_id: new_assignee_id })
      .eq('id', params.id)

    if (updateError) throw updateError

    // Create audit log entry
    const { error: auditError } = await supabase
      .from('lead_reassignment_audit')
      .insert({
        lead_id: params.id,
        previous_assignee_id: currentLead.user_id,
        new_assignee_id: new_assignee_id,
        changed_by_id: user.id,
        action: 'Reassigned',
      })

    if (auditError) {
      console.error('Warning: Failed to create audit log:', auditError)
      // Don't fail the reassignment if audit fails, just log it
    }

    return NextResponse.json(
      { success: true, message: 'Lead reassigned successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error reassigning lead:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reassign lead' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Permanently delete the lead from database
    const { error: deleteError } = await supabase
      .from('leads')
      .delete()
      .eq('id', params.id)

    if (deleteError) throw deleteError

    return NextResponse.json(
      { success: true, message: 'Lead deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete lead' },
      { status: 500 }
    )
  }
}
