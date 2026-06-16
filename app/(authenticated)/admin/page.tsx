'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase/client'
import { Avatar } from '../../../components/Avatar'
import { Mail, Plus, Trash2, AlertCircle, Trophy, Users, ShieldCheck, List, Activity, Zap, ChevronRight, Search, MoreVertical, Edit2 } from 'lucide-react'

interface TeamMember {
  id: string
  email: string
  full_name: string
  initials: string
  role: 'admin' | 'member'
  active: boolean
  created_at: string
  user_id?: string
  last_sign_in_at?: string | null
}

interface DashboardMetrics {
  totalMembers: number
  totalAdmins: number
  totalLeads: number
}


interface DuplicateGroup {
  youtube_channel_id: string
  lead_name: string
  count: number
  leads: Array<{
    id: string
    created_at: string
    user_id: string
    memberName: string
  }>
}



// Lead Management Interfaces
interface Lead {
  id: string
  lead_name: string
  youtube_channel_id: string
  user_id: string
  assigned_to_member: string
  lead_score_total: number | null
  draft: boolean
  status: string
  created_at: string
  category?: string
  subscriber_count?: number
  channel_thumbnail_url?: string | null
  found_by?: string
  youtube_handle?: string
  avg_views_last_10?: number
  total_views?: number
  video_count?: number
  channel_created_at?: string
  last_upload_at?: string
  s2v_ratio_pct?: number
  posting_frequency_30d?: number
  email?: string | null
  website?: string | null
  instagram?: string | null
  twitter?: string | null
  content_style?: string
  posting_pattern?: string
  monetization?: string
  strengths?: string[]
  concerns?: string[]
  data_gaps?: string[]
  remarks_ai_draft?: string
  remarks_final?: string
  yt_score_factor?: number
  sub_range_factor?: number
  s2v_factor?: number
  g_factor_normalized?: number
  ai_confidence?: number
  raw_youtube_data?: Record<string, any>
  raw_ai_response?: Record<string, any>
}

interface LeadManagementState {
  allLeads: Lead[]
  searchQuery: string
  selectedLeads: Set<string>
}

interface LeadAuditLog {
  id: string
  lead_id: string
  action: string
  previous_assignee: string | null
  new_assignee: string
  changed_by: string
  changed_at: string
}

interface EnrichedLeadDetails {
  id: string
  lead_name: string
  youtube_channel_id: string
  user_id: string
  assigned_to_member: string
  lead_score_total: number | null
  draft: boolean
  status: string
  created_at: string
  category?: string
  notes?: string
  enrichment_data?: Record<string, any>
}

interface APIStatus {
  id: string
  name: string
  displayName: string
  statusColor: 'green' | 'yellow' | 'red'
  dailyQuotaUsed: number
  dailyQuotaMax: number
  monthlyQuotaUsed: number
  monthlyQuotaMax: number
  percentUsed: number
  lastUsedBy: string | null
  lastUsedTimestamp: string | null
  estimatedMonthlyCost: string
}

interface APIUsageData {
  summary: {
    totalCalls: number
    totalCost: string
    period: string
  }
  byTeamMember: Array<{
    memberId: string
    name: string
    totalCalls: number
    apiBreakdown: Record<string, number>
    totalCost: string
    lastUsed: string
  }>
  byApi: Array<{
    apiName: string
    displayName: string
    calls: number
    cost: string
    percentOfTotal: number
  }>
}

function APIStatusSection() {
  const [apiStatus, setApiStatus] = useState<APIStatus[]>([])
  const [usageData, setUsageData] = useState<APIUsageData | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'activity' | 'costs'>('overview')
  const [loading, setLoading] = useState(true)
  const [totalCost, setTotalCost] = useState('$0.00')
  const [allHealthy, setAllHealthy] = useState(true)

  useEffect(() => {
    const fetchAPIStatus = async () => {
      try {
        const [statusRes, usageRes] = await Promise.all([
          fetch('/api/admin/api-status'),
          fetch('/api/admin/api-usage?days=30')
        ])

        if (statusRes.ok) {
          const data = await statusRes.json()
          setApiStatus(data.apis || [])
          setTotalCost(data.totalMonthlyCost || '$0.00')
          setAllHealthy(data.allSystemsHealthy || true)
        }

        if (usageRes.ok) {
          const data = await usageRes.json()
          setUsageData(data)
        }
      } catch (err) {
        console.error('Error fetching API status:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAPIStatus()
    const interval = setInterval(fetchAPIStatus, 7000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (color: 'green' | 'yellow' | 'red') => {
    switch (color) {
      case 'green':
        return { bg: 'rgba(76, 175, 80, 0.2)', text: '#4caf50' }
      case 'yellow':
        return { bg: 'rgba(255, 193, 7, 0.2)', text: '#ffc107' }
      case 'red':
        return { bg: 'rgba(255, 107, 107, 0.2)', text: '#ff6b6b' }
    }
  }

  const getStatusIcon = (color: 'green' | 'yellow' | 'red') => {
    switch (color) {
      case 'green':
        return '🟢'
      case 'yellow':
        return '🟡'
      case 'red':
        return '🔴'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Integration Status</h1>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Real-time monitoring of API usage and quota management
          </p>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Monthly Cost</p>
            <p className="text-2xl font-bold" style={{ color: '#a855f7' }}>{totalCost}</p>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {!allHealthy && (
        <div
          className="p-4 rounded-lg border flex items-center gap-3"
          style={{ background: 'rgba(255, 193, 7, 0.1)', borderColor: 'rgba(255, 193, 7, 0.3)' }}
        >
          <AlertCircle size={20} style={{ color: '#ffc107' }} />
          <p className="text-sm">
            <span className="font-semibold">Warning:</span> One or more APIs are approaching quota limits
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        {(['overview', 'team', 'activity', 'costs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-sm font-medium transition-colors relative"
            style={{
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            {tab === 'overview' && 'Overview'}
            {tab === 'team' && 'Team Breakdown'}
            {tab === 'activity' && 'Activity'}
            {tab === 'costs' && 'Costs'}
            {activeTab === tab && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: 'linear-gradient(90deg, #a855f7, #d946ef)' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apiStatus.map((api) => {
            const colors = getStatusColor(api.statusColor)
            return (
              <div
                key={api.id}
                className="glass-card p-5 rounded-lg"
                style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold">{api.displayName}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {api.name === 'youtube' && 'Channel data enrichment'}
                      {api.name === 'groq' && 'AI analysis & insights'}
                      {api.name === 'google_sheets' && 'Data synchronization'}
                      {api.name === 'supabase' && 'Database operations'}
                    </p>
                  </div>
                  <span className="text-lg">{getStatusIcon(api.statusColor)}</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Daily Quota
                      </p>
                      <p className="text-xs font-semibold">
                        {api.dailyQuotaUsed.toLocaleString()} / {api.dailyQuotaMax.toLocaleString()}
                      </p>
                    </div>
                    <div
                      className="w-full h-2 rounded-full"
                      style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                    >
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(api.percentUsed, 100)}%`,
                          background: api.statusColor === 'red'
                            ? '#ff6b6b'
                            : api.statusColor === 'yellow'
                            ? '#ffc107'
                            : '#4caf50',
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Last used</p>
                    <p className="text-sm font-medium mt-1">
                      {api.lastUsedBy && api.lastUsedTimestamp
                        ? `${api.lastUsedBy} · ${new Date(api.lastUsedTimestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                        : 'Not used yet'}
                    </p>
                  </div>

                  <div className="pt-2 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Est. Monthly Cost</p>
                    <p className="text-lg font-bold mt-1">{api.estimatedMonthlyCost}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Team Breakdown Tab */}
      {activeTab === 'team' && usageData && (
        <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
          <h3 className="text-sm font-bold mb-4">API Usage by Team Member</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <th className="text-left py-2 px-2 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Member
                  </th>
                  <th className="text-right py-2 px-2 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Calls
                  </th>
                  <th className="text-right py-2 px-2 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Cost
                  </th>
                  <th className="text-left py-2 px-2 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Top API
                  </th>
                </tr>
              </thead>
              <tbody>
                {usageData.byTeamMember.map((member) => {
                  const topAPI = Object.entries(member.apiBreakdown).sort(
                    (a, b) => b[1] - a[1]
                  )[0]
                  return (
                    <tr
                      key={member.memberId}
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
                    >
                      <td className="py-3 px-2">{member.name}</td>
                      <td className="py-3 px-2 text-right">{member.totalCalls}</td>
                      <td className="py-3 px-2 text-right font-semibold">{member.totalCost}</td>
                      <td className="py-3 px-2">
                        <span
                          className="px-2 py-1 rounded text-xs"
                          style={{
                            background: 'rgba(168, 85, 247, 0.15)',
                            color: '#a855f7',
                          }}
                        >
                          {topAPI ? `${topAPI[0]} (${topAPI[1]})` : '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
          <h3 className="text-sm font-bold mb-4">Recent API Activity</h3>
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            API activity will appear here as team members enrich leads
          </p>
        </div>
      )}

      {/* Costs Tab */}
      {activeTab === 'costs' && usageData && (
        <div className="space-y-4">
          <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-sm font-bold mb-4">Cost Breakdown by API</h3>
            <div className="space-y-3">
              {usageData.byApi.map((api) => (
                <div key={api.apiName}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{api.displayName}</p>
                    <p className="text-sm font-bold">{api.cost}</p>
                  </div>
                  <div
                    className="w-full h-2 rounded-full"
                    style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${api.percentOfTotal}%`,
                        background: 'linear-gradient(90deg, #a855f7, #d946ef)',
                      }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {api.calls} calls · {api.percentOfTotal}% of total
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-sm font-bold mb-3">Monthly Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Calls</p>
                <p className="text-2xl font-bold mt-1">{usageData.summary.totalCalls}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Cost</p>
                <p className="text-2xl font-bold mt-1">{usageData.summary.totalCost}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const section = searchParams.get('section') || 'dashboard'

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([])
  const [newFullName, setNewFullName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'member' | 'admin'>('member')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeactivated, setShowDeactivated] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // Lead Management State
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [leadsSearchQuery, setLeadsSearchQuery] = useState('')
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [selectedLeadDetail, setSelectedLeadDetail] = useState<Lead | null>(null)
  const [leadAuditLog, setLeadAuditLog] = useState<LeadAuditLog[]>([])
  const [leadDetailsLoading, setLeadDetailsLoading] = useState(false)
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<string | null>(null)
  const [memberLeadsOpen, setMemberLeadsOpen] = useState<string | null>(null)
  const [reassignmentLoading, setReassignmentLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const leadsPerPage = 25

  // Duplicates State
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteSelectedLead, setDeleteSelectedLead] = useState<{ id: string; memberName: string; channelName: string } | null>(null)
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null)

  useEffect(() => {
    fetchAdminData()
    const closeDropdown = () => setOpenDropdown(null)
    window.addEventListener('click', closeDropdown)
    return () => window.removeEventListener('click', closeDropdown)
  }, [])

  useEffect(() => {
    if (teamMembers.length > 0 && section === 'leads') {
      fetchLeads()
    }
  }, [teamMembers, section])

  async function fetchLeads() {
    try {
      const response = await fetch('/api/admin/leads')
      if (!response.ok) {
        throw new Error(`Failed to fetch leads: ${response.statusText}`)
      }
      const leadsData = await response.json()
      setAllLeads(leadsData)
    } catch (err: any) {
      console.error('Error fetching leads:', err.message)
      setError(err.message || 'Failed to fetch leads')
    }
  }

  async function fetchLeadAuditLog(leadId: string) {
    try {
      setLeadDetailsLoading(true)
      // Fetch full lead details and audit log in parallel
      const [leadRes, auditRes] = await Promise.all([
        fetch(`/api/admin/leads/${leadId}`),
        fetch(`/api/admin/leads/${leadId}/audit`)
      ])

      if (!leadRes.ok || !auditRes.ok) {
        throw new Error('Failed to fetch lead details or audit log')
      }

      const fullLeadData = await leadRes.json()
      const auditData = await auditRes.json()

      console.log('Full lead data fetched:', fullLeadData)

      // Replace with complete lead data (not merge - we want all fields)
      setSelectedLeadDetail(fullLeadData)
      setLeadAuditLog(auditData)
    } catch (err: any) {
      console.error('Error fetching details:', err.message)
      setLeadAuditLog([])
    } finally {
      setLeadDetailsLoading(false)
    }
  }

  async function handleReassignLeads(newAssigneeId: string, leadIdsToReassign: string[]) {
    if (leadIdsToReassign.length === 0) return

    try {
      setReassignmentLoading(true)
      setError(null)
      setSuccess(null)

      // Get the new assignee info
      const newAssignee = teamMembers.find(m => m.id === newAssigneeId || m.user_id === newAssigneeId)
      if (!newAssignee) {
        setError('Selected team member not found')
        return
      }

      // Get the actual user ID (prefer user_id, fallback to id if it's a UUID)
      const newAssigneeUserId = newAssignee.user_id || newAssignee.id

      // Make API calls to reassign each lead
      const reassignmentPromises = leadIdsToReassign.map(leadId =>
        fetch(`/api/admin/leads/${leadId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ new_assignee_id: newAssigneeUserId }),
        })
      )

      const results = await Promise.all(reassignmentPromises)

      // Check if all requests succeeded
      const allSuccess = results.every(res => res.ok)
      if (!allSuccess) {
        const failedCount = results.filter(res => !res.ok).length
        throw new Error(`Failed to reassign ${failedCount} lead(s)`)
      }

      // Update local state to reflect the changes
      const updatedLeads = allLeads.map(lead => {
        if (leadIdsToReassign.includes(lead.id)) {
          return {
            ...lead,
            user_id: newAssigneeUserId,
            assigned_to_member: newAssignee.full_name,
          }
        }
        return lead
      })

      setAllLeads(updatedLeads)
      setSelectedLeads(new Set())
      setSuccess(`Successfully reassigned ${leadIdsToReassign.length} lead(s) to ${newAssignee.full_name}`)

      // If details view is open and was affected, refresh it
      if (selectedLeadDetail && leadIdsToReassign.includes(selectedLeadDetail.id)) {
        setSelectedLeadDetail({
          ...selectedLeadDetail,
          user_id: newAssigneeUserId,
          assigned_to_member: newAssignee.full_name,
        })
        // Refresh audit log to show the new entry
        await fetchLeadAuditLog(selectedLeadDetail.id)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reassign leads')
      console.error('Reassignment error:', err)
    } finally {
      setReassignmentLoading(false)
    }
  }

  async function fetchAdminData() {
    setLoading(true)
    try {
      const [membersRes, leadsRes, authUsersRes] = await Promise.all([
        supabase.from('team_members').select('id, user_id, email, full_name, initials, role, active, created_at').order('full_name'),
        supabase.from('leads').select('id, user_id, draft, status, lead_score_total'),
        fetch('/api/admin/users').then(res => res.json()).catch(() => [])
      ])

      if (membersRes.error) throw membersRes.error
      if (leadsRes.error) throw leadsRes.error

      const authUsersMap = new Map((Array.isArray(authUsersRes) ? authUsersRes : []).map((u: any) => [u.id, u.last_sign_in_at]))
      
      const mergedMembers = (membersRes.data || []).map(m => ({
        ...m,
        last_sign_in_at: m.user_id ? authUsersMap.get(m.user_id) : null
      }))

      setTeamMembers(mergedMembers)

      const members = mergedMembers
      const leads = leadsRes.data || []

      setMetrics({
        totalMembers: members.filter((m) => m.active && m.role !== 'admin').length,
        totalAdmins: members.filter((m) => m.active && m.role === 'admin').length,
        totalLeads: leads.length,
      })


      // Calculate duplicate detection
      const allLeadsRes = await supabase
        .from('leads')
        .select('id, lead_name, youtube_channel_id, user_id, created_at, lead_score_total, category')

      if (allLeadsRes.error) throw allLeadsRes.error

      const allLeads = allLeadsRes.data || []
      const duplicateMap: Record<string, DuplicateGroup> = {}

      allLeads.forEach((lead) => {
        if (lead.youtube_channel_id) {
          if (!duplicateMap[lead.youtube_channel_id]) {
            duplicateMap[lead.youtube_channel_id] = {
              youtube_channel_id: lead.youtube_channel_id,
              lead_name: lead.lead_name,
              count: 0,
              leads: [],
            }
          }
          duplicateMap[lead.youtube_channel_id].count++
          const member = membersRes.data?.find((m) => (m.user_id || m.id) === lead.user_id)
          duplicateMap[lead.youtube_channel_id].leads.push({
            id: lead.id,
            created_at: lead.created_at,
            user_id: lead.user_id,
            memberName: member?.full_name || 'Unknown',
          })
        }
      })

      // Filter only groups with more than 1 entry (actual duplicates)
      const duplicatesList = Object.values(duplicateMap)
        .filter((group) => group.count > 1)
        .sort((a, b) => b.count - a.count)

      setDuplicates(duplicatesList)


      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admin data')
      setLoading(false)
    }
  }

  async function handleDeleteLead(leadId: string) {
    try {
      setDeletingLeadId(leadId)
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete lead')
      }

      // Remove lead from duplicates state
      const updatedDuplicates = duplicates
        .map((group) => ({
          ...group,
          leads: group.leads.filter((l) => l.id !== leadId),
          count: group.leads.filter((l) => l.id !== leadId).length,
        }))
        .filter((group) => group.count > 1)

      setDuplicates(updatedDuplicates)

      setSuccess('Lead deleted successfully')
      setShowDeleteDialog(false)
      setDeleteSelectedLead(null)
      setDeletingLeadId(null)
    } catch (err: any) {
      setError(err.message || 'Failed to delete lead')
      setDeletingLeadId(null)
    }
  }

  async function handleDeleteLeadFromAdmin(leadId: string, leadName: string) {
    try {
      setDeletingLeadId(leadId)
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete lead')
      }

      // Remove from all leads state
      setAllLeads(prevLeads => prevLeads.filter(l => l.id !== leadId))

      // Show success message
      setSuccess(`Lead "${leadName}" deleted permanently`)

      setDeletingLeadId(null)
    } catch (err: any) {
      setError(err.message || `Failed to delete "${leadName}"`)
      setDeletingLeadId(null)
    }
  }




  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!newFullName.trim()) {
      setError('Please enter full name')
      return
    }

    if (!newEmail.trim()) {
      setError('Please enter an email address')
      return
    }

    try {
      const existing = teamMembers.find((m) => m.email === newEmail.toLowerCase())
      if (existing) {
        setError('This email is already registered')
        return
      }

      const words = newFullName.trim().split(' ')
      const initials = ((words[0]?.[0] || '') + (words[1]?.[0] || '')).toUpperCase()

      const { error: insertError } = await supabase.from('team_members').insert({
        email: newEmail.toLowerCase(),
        full_name: newFullName,
        initials: initials || 'XX',
        role: newRole,
        active: true,
      })

      if (insertError) {
        if (insertError.message.includes('team_members_email_key') || insertError.message.includes('email')) {
          setError('This email is already registered.')
        } else {
          setError(insertError.message)
        }
        return
      }

      setSuccess(`${newFullName} (${newEmail}) registered as ${newRole}`)
      setNewFullName('')
      setNewEmail('')
      await fetchAdminData()
    } catch (err: any) {
      setError(err.message || 'Failed to add member')
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!window.confirm('Delete this member permanently? This action cannot be undone.')) return

    try {
      const { data, error } = await supabase.from('team_members').delete().eq('id', memberId)
      if (error) {
        console.error('Delete error:', error)
        throw error
      }
      console.log('Delete response:', data)
      setSuccess('Member deleted successfully')
      await fetchAdminData()
    } catch (err: any) {
      console.error('Delete failed:', err)
      setError(err.message || 'Failed to delete member')
    }
  }

  async function handleToggleRole(memberId: string, currentRole: string) {
    try {
      const newRole = currentRole === 'admin' ? 'member' : 'admin'
      const { error } = await supabase.from('team_members').update({ role: newRole }).eq('id', memberId)
      if (error) throw error
      setSuccess(`Role updated to ${newRole}`)
      await fetchAdminData()
    } catch (err: any) {
      setError(err.message || 'Failed to update role')
    }
    setOpenDropdown(null)
  }

  async function handleToggleActive(memberId: string, currentActive: boolean) {
    try {
      const { error } = await supabase.from('team_members').update({ active: !currentActive }).eq('id', memberId)
      if (error) throw error
      setSuccess(`Member ${currentActive ? 'deactivated' : 'reactivated'}`)
      await fetchAdminData()
    } catch (err: any) {
      setError(err.message || 'Failed to update status')
    }
    setOpenDropdown(null)
  }

  function handleExportCSV() {
    if (teamMembers.length === 0) {
      setError('No team members to export')
      return
    }

    const headers = ['Name', 'Email', 'Role', 'Status', 'Leads Assigned', 'Joined Date']
    const rows = teamMembers.map(member => [
      member.full_name,
      member.email,
      member.role,
      member.active ? 'Active' : 'Inactive',
      allLeads.filter(l => l.assigned_to_member === member.id).length,
      new Date(member.created_at).toLocaleDateString()
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `team-performance-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
    setSuccess('CSV exported successfully')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block mb-4 w-8 h-8 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Alerts */}
      {error && (
        <div className="flex gap-3 px-4 py-3 rounded-lg border text-sm" style={{ background: 'rgba(255, 107, 107, 0.12)', borderColor: 'rgba(255, 107, 107, 0.3)', color: '#ff6b6b' }}>
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex gap-3 px-4 py-3 rounded-lg border text-sm" style={{ background: 'rgba(76, 175, 80, 0.12)', borderColor: 'rgba(76, 175, 80, 0.3)', color: '#4caf50' }}>
          <span>{success}</span>
        </div>
      )}

      {/* Dashboard Section — Premium Balanced Grid Layout */}
      {section === 'dashboard' && metrics && (
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Dashboard</h1>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Real-time insights into your team's performance</p>
          </div>

          {/* Top Metrics Row — Equal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Leads Card */}
            <Link href="/admin?section=leads">
              <div
                className="group glass-card relative overflow-hidden rounded-2xl p-7 cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(168,85,247,0.12)]"
                style={{
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(139,92,246,0.04) 100%), rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)'
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total Leads</p>
                    <p className="text-5xl font-bold mt-4 bg-gradient-to-r from-purple-300 to-purple-200 bg-clip-text text-transparent">{metrics.totalLeads}</p>
                    <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>Across all members</p>
                  </div>
                  <div className="p-3 rounded-xl opacity-30 group-hover:opacity-50 transition-opacity" style={{ background: 'rgba(168,85,247,0.1)' }}>
                    <List size={28} style={{ color: '#a855f7' }} />
                  </div>
                </div>
              </div>
            </Link>

            {/* Active Members Card */}
            <Link href="/admin?section=members">
              <div
                className="group glass-card relative overflow-hidden rounded-2xl p-7 cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(168,85,247,0.12)]"
                style={{
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(139,92,246,0.04) 100%), rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)'
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Active Members</p>
                    <p className="text-5xl font-bold mt-4 bg-gradient-to-r from-purple-300 to-purple-200 bg-clip-text text-transparent">{metrics.totalMembers}</p>
                    <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>Team members</p>
                  </div>
                  <div className="p-3 rounded-xl opacity-30 group-hover:opacity-50 transition-opacity" style={{ background: 'rgba(168,85,247,0.1)' }}>
                    <Users size={28} style={{ color: '#a855f7' }} />
                  </div>
                </div>
              </div>
            </Link>

            {/* Admins Card */}
            <Link href="/admin?section=members">
              <div
                className="group glass-card relative overflow-hidden rounded-2xl p-7 cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(168,85,247,0.12)]"
                style={{
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(139,92,246,0.04) 100%), rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)'
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Administrators</p>
                    <p className="text-5xl font-bold mt-4 bg-gradient-to-r from-purple-300 to-purple-200 bg-clip-text text-transparent">{metrics.totalAdmins}</p>
                    <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>Admin users</p>
                  </div>
                  <div className="p-3 rounded-xl opacity-30 group-hover:opacity-50 transition-opacity" style={{ background: 'rgba(168,85,247,0.1)' }}>
                    <ShieldCheck size={28} style={{ color: '#a855f7' }} />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 gap-6">
            {/* Right Column — Activity & API Status Stacked */}
            <div className="space-y-6">
              {/* Recent Activity */}
              <div 
                className="glass-card rounded-2xl p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(168,85,247,0.12)]" 
                style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.3)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)'
                }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(168,85,247,0.15)' }}>
                    <Activity size={18} style={{ color: '#a855f7' }} />
                  </div>
                  <h3 className="text-lg font-semibold">Recent Activity</h3>
                </div>
                <div className="space-y-2.5">
                  {teamMembers
                    .filter((m) => m.active)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 6)
                    .map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(168,85,247,0.15)' }}>
                          <span className="text-xs font-bold" style={{ color: '#a855f7' }}>
                            {member.initials}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{member.full_name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Joined {Math.floor((Date.now() - new Date(member.created_at).getTime()) / (1000 * 60 * 60 * 24))}d ago
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* API Status */}
              <Link href="/admin?section=api" className="block">
                <div
                  className="group glass-card relative overflow-hidden rounded-2xl p-7 cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(76,175,80,0.12)]"
                  style={{
                    background: 'rgba(76,175,80,0.05)',
                    border: '1px solid rgba(76,175,80,0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(76,175,80,0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(76,175,80,0.3)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 rounded-lg" style={{ background: 'rgba(168,85,247,0.1)' }}>
                      <Zap size={18} style={{ color: '#a855f7' }} />
                    </div>
                    <h3 className="text-lg font-semibold">API Status</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'YouTube Data API' },
                      { name: 'Groq AI' },
                      { name: 'Google Sheets Sync' },
                    ].map((api) => (
                      <div key={api.name} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            background: '#4caf50',
                            boxShadow: '0 0 8px rgba(76,175,80,0.6)',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                          }}
                        />
                        <p className="text-xs font-medium flex-1">{api.name}</p>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(76,175,80,0.15)', color: '#4caf50' }}>Live</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t flex items-center gap-2 text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'rgba(168,85,247,0.8)' }}>
                    <span>View details</span>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Pulse Animation Keyframes */}
          <style>{`
            @keyframes pulse {
              0%, 100% {
                box-shadow: 0 0 8px rgba(76,175,80,0.6);
              }
              50% {
                box-shadow: 0 0 16px rgba(76,175,80,0.9);
              }
            }
          `}</style>
        </div>
      )}

      {/* Team Members Section */}
      {section === 'members' && (
        <div className="flex flex-col gap-3">

          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold">Team Members</h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Manage access and roles</p>
            </div>
          </div>

          {/* Add Member Form — always visible, compact horizontal layout */}
          <div className="glass-card rounded-xl px-5 py-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>Add New Member</p>
            <form onSubmit={handleAddMember} className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[10px] font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                <input type="text" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} placeholder="John Doe" className="input-field w-full text-xs h-8" />
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-[10px] font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Gmail</label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="john@gmail.com" className="input-field w-full text-xs h-8" />
              </div>
              <div className="min-w-[110px]">
                <label className="block text-[10px] font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Role</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)} className="input-field w-full text-xs h-8">
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn-primary px-4 h-8 flex items-center gap-1.5 text-xs flex-shrink-0">
                <Plus size={12} />
                Add Member
              </button>
            </form>
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-8 h-8 text-xs w-44"
              />
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs whitespace-nowrap">
              <input
                type="checkbox"
                checked={showDeactivated}
                onChange={(e) => setShowDeactivated(e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
              />
              <span style={{ color: 'var(--text-secondary)' }}>Show Deactivated</span>
            </label>
          </div>

          {/* Members Grid by Role */}
          {['admin', 'member'].map((roleType) => {
            const filteredMembers = teamMembers.filter((m) => {
              if (m.role !== roleType) return false
              if (!showDeactivated && !m.active) return false
              if (searchQuery) {
                const query = searchQuery.toLowerCase()
                return m.full_name.toLowerCase().includes(query) || m.email.toLowerCase().includes(query)
              }
              return true
            })

            if (filteredMembers.length === 0) return null

            return (
              <div key={roleType} className="flex flex-col gap-2">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  {roleType === 'admin' ? <ShieldCheck size={15} style={{ color: '#a855f7' }} /> : <Users size={15} style={{ color: '#4caf50' }} />}
                  {roleType === 'admin' ? 'Administrators' : 'Team Members'}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}>
                    {filteredMembers.length}
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredMembers.map((member) => {
                    // Determine Status
                    let statusColor = '#ff6b6b'
                    let statusText = 'Deactivated'
                    if (member.active) {
                      if (member.last_sign_in_at) {
                        const hoursSince = (Date.now() - new Date(member.last_sign_in_at).getTime()) / (1000 * 60 * 60)
                        statusColor = hoursSince < 24 ? '#4caf50' : '#f5a623'
                        statusText = hoursSince < 24 ? 'Online' : 'Offline'
                      } else {
                        statusColor = '#f5a623'
                        statusText = 'Offline'
                      }
                    }

                    // Format relative time
                    const relativeTime = member.last_sign_in_at
                      ? (() => {
                          const hours = Math.floor((Date.now() - new Date(member.last_sign_in_at!).getTime()) / (1000 * 60 * 60))
                          if (hours < 1) return 'Just now'
                          if (hours < 24) return `${hours}h ago`
                          return `${Math.floor(hours / 24)}d ago`
                        })()
                      : 'Never'

                    const regDate = new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

                    return (
                      <div key={member.id} className="glass-card px-4 py-3 rounded-xl relative transition-all hover:-translate-y-0.5 hover:shadow-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative flex-shrink-0">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: roleType === 'admin' ? 'rgba(168,85,247,0.15)' : 'rgba(76,175,80,0.15)' }}>
                                <span className="text-xs font-bold" style={{ color: roleType === 'admin' ? '#a855f7' : '#4caf50' }}>{member.initials}</span>
                              </div>
                              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ background: statusColor, borderColor: '#0f0f1a' }} title={statusText} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-tight truncate max-w-[150px]">{member.full_name}</p>
                              <p className="text-[11px] truncate max-w-[150px]" style={{ color: 'var(--text-muted)' }}>{member.email}</p>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="relative flex-shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === member.id ? null : member.id) }}
                              className="p-1 rounded-md hover:bg-white/10 transition-colors"
                            >
                              <MoreVertical size={14} style={{ color: 'var(--text-secondary)' }} />
                            </button>
                            {openDropdown === member.id && (
                              <div className="absolute right-0 mt-1 w-36 rounded-lg shadow-xl overflow-hidden z-20" style={{ background: '#1e1e2d', border: '1px solid var(--border-subtle)' }}>
                                <button onClick={() => handleToggleRole(member.id, member.role)} className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2">
                                  <Edit2 size={11} /> Make {member.role === 'admin' ? 'Member' : 'Admin'}
                                </button>
                                <button onClick={() => handleToggleActive(member.id, member.active)} className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2" style={{ color: member.active ? '#ff6b6b' : '#4caf50' }}>
                                  <Activity size={11} /> {member.active ? 'Deactivate' : 'Reactivate'}
                                </button>
                                <button onClick={() => handleRemoveMember(member.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2" style={{ color: '#ff6b6b' }}>
                                  <Trash2 size={11} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Stats row */}
                        <div className="mt-3 pt-2.5 border-t flex items-center justify-between gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
                          <div>
                            <p className="text-[9px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Last Active</p>
                            <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{relativeTime}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Registered</p>
                            <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{regDate}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lead Management Section — Split Panel Layout */}
      {section === 'leads' && (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Lead Management</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage global leads and team assignments</p>
          </div>

          {/* Split Panel Layout */}
          <div className="flex flex-col gap-6">
            {/* TOP PANEL: Global Leads View (Full width) */}
            <div className="w-full">
              <div
                className="glass-card rounded-2xl p-6 h-full"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="space-y-4">
                  {/* Left Panel Header */}
                  <div>
                    <h2 className="text-xl font-semibold">Global Leads</h2>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>All leads in the system</p>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search leads by name..."
                      value={leadsSearchQuery}
                      onChange={(e) => {
                        setLeadsSearchQuery(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="input-field w-full pl-9 h-9 text-sm"
                    />
                  </div>

                  {/* Leads Count Badge */}
                  {allLeads.length > 0 && (
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Found {allLeads.filter(lead => {
                        const query = leadsSearchQuery.toLowerCase()
                        return lead.lead_name.toLowerCase().includes(query)
                      }).length} of {allLeads.length} leads
                    </div>
                  )}

                  {/* Leads List */}
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                          <th className="py-3 px-4 w-8">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedLeads.size === allLeads.filter(lead => lead.lead_name.toLowerCase().includes(leadsSearchQuery.toLowerCase())).length && allLeads.filter(lead => lead.lead_name.toLowerCase().includes(leadsSearchQuery.toLowerCase())).length > 0}
                                onChange={(e) => {
                                  const filteredLeads = allLeads.filter(lead => lead.lead_name.toLowerCase().includes(leadsSearchQuery.toLowerCase()))
                                  if (e.target.checked) {
                                    setSelectedLeads(new Set(filteredLeads.map(l => l.id)))
                                  } else {
                                    setSelectedLeads(new Set())
                                  }
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-5 h-5 rounded border-2 transition-all peer-checked:bg-gradient-to-br peer-checked:from-purple-500 peer-checked:to-purple-600 peer-checked:border-purple-500" style={{ borderColor: 'var(--border-subtle)', background: 'rgba(168,85,247,0.05)' }}>
                                <svg className="w-3.5 h-3.5 text-white absolute top-0.5 left-0.5 hidden peer-checked:block" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </label>
                          </th>
                          <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Lead</th>
                          <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Found By</th>
                          <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Subscribers</th>
                          <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Score</th>
                          <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                          <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Date Added</th>
                          <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-right" style={{ color: 'var(--text-muted)' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allLeads.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                              No leads found
                            </td>
                          </tr>
                        ) : (
                          allLeads
                            .filter(lead => {
                              const query = leadsSearchQuery.toLowerCase()
                              return lead.lead_name.toLowerCase().includes(query)
                            })
                            .slice((currentPage - 1) * leadsPerPage, currentPage * leadsPerPage)
                            .map(lead => (
                              <tr
                                key={lead.id}
                                className="border-b transition-all hover:bg-white/5 group"
                                style={{ borderColor: 'var(--border-subtle)' }}
                              >
                                {/* Checkbox */}
                                <td className="py-4 px-4">
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={selectedLeads.has(lead.id)}
                                      onChange={(e) => {
                                        e.stopPropagation()
                                        const newSelected = new Set(selectedLeads)
                                        if (e.target.checked) {
                                          newSelected.add(lead.id)
                                        } else {
                                          newSelected.delete(lead.id)
                                        }
                                        setSelectedLeads(newSelected)
                                      }}
                                      className="sr-only peer"
                                    />
                                    <div className="w-5 h-5 rounded border-2 transition-all peer-checked:bg-gradient-to-br peer-checked:from-purple-500 peer-checked:to-purple-600 peer-checked:border-purple-500" style={{ borderColor: 'var(--border-subtle)', background: 'rgba(168,85,247,0.05)' }}>
                                      <svg className="w-3.5 h-3.5 text-white absolute top-0.5 left-0.5 hidden peer-checked:block" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  </label>
                                </td>

                                {/* Lead */}
                                <td className="py-4 px-4 cursor-pointer" onClick={() => {setSelectedLeadDetail(lead); fetchLeadAuditLog(lead.id)}}>
                                  <div className="flex items-center gap-3">
                                    <Avatar
                                      thumbnailUrl={lead.channel_thumbnail_url ?? null}
                                      initials={lead.lead_name.substring(0, 2).toUpperCase()}
                                      name={lead.lead_name}
                                      size="md"
                                    />
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold truncate text-white">{lead.lead_name}</p>
                                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                                        {lead.youtube_channel_id && lead.youtube_channel_id.startsWith('@')
                                          ? lead.youtube_channel_id
                                          : lead.youtube_channel_id ? `@${lead.youtube_channel_id}` : `${lead.id.slice(0, 8)}...`}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                {/* Found By */}
                                <td className="py-4 px-4">
                                  <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)' }}>
                                    <span className="text-[11px] font-bold" style={{ color: '#a855f7' }}>{(lead.found_by || 'N').substring(0, 1).toUpperCase()}</span>
                                  </div>
                                </td>

                                {/* Subscribers */}
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-2">
                                    <Users size={14} style={{ color: 'var(--text-muted)' }} />
                                    <span className="text-sm font-bold text-white">
                                      {lead.subscriber_count ? 
                                        (lead.subscriber_count >= 1000000 
                                          ? (lead.subscriber_count / 1000000).toFixed(1) + 'M' 
                                          : lead.subscriber_count >= 1000 
                                            ? (lead.subscriber_count / 1000).toFixed(1) + 'K' 
                                            : lead.subscriber_count.toLocaleString())
                                        : 'N/A'}
                                    </span>
                                  </div>
                                </td>

                                {/* Score */}
                                <td className="py-4 px-4">
                                  {lead.lead_score_total !== null ? (
                                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#d8b4fe' }}>
                                      {lead.lead_score_total.toFixed(1)} • {lead.lead_score_total >= 4.5 ? 'Strong fit' : 'Fit'}
                                    </div>
                                  ) : (
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Not Scored</span>
                                  )}
                                </td>

                                {/* Status */}
                                <td className="py-4 px-4">
                                  <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium capitalize" style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', color: '#f472b6' }}>
                                    {lead.status === 'new' ? 'New' : lead.status}
                                  </div>
                                </td>

                                {/* Date Added */}
                                <td className="py-4 px-4">
                                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                    {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </td>

                                {/* Actions */}
                                <td className="py-4 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {/* Reassign Dropdown */}
                                    <div className="relative group/action">
                                      <button
                                        className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                                        style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#d8b4fe' }}
                                        onClick={(e) => { e.stopPropagation(); setMemberLeadsOpen(memberLeadsOpen === lead.id ? null : lead.id) }}
                                      >
                                        Reassign
                                      </button>
                                      {memberLeadsOpen === lead.id && (
                                        <div className="absolute right-0 top-full mt-2 w-40 rounded-lg shadow-xl overflow-hidden z-30 text-left" style={{ background: '#1e1e2d', border: '1px solid var(--border-subtle)' }}>
                                          <div className="max-h-48 overflow-y-auto">
                                            {teamMembers
                                              .filter(m => m.active && m.role !== 'admin')
                                              .map(member => (
                                                <button
                                                  key={member.id}
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleReassignLeads(member.id, [lead.id])
                                                    setMemberLeadsOpen(null)
                                                  }}
                                                  disabled={reassignmentLoading}
                                                  className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors disabled:opacity-50 border-b"
                                                  style={{ borderColor: 'var(--border-subtle)' }}
                                                >
                                                  <p className="font-medium text-white">{member.full_name}</p>
                                                  <p style={{ color: 'var(--text-muted)' }}>{member.email}</p>
                                                </button>
                                              ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* View Details Button */}
                                    <button
                                      className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                                      onClick={(e) => { e.stopPropagation(); setSelectedLeadDetail(lead); fetchLeadAuditLog(lead.id) }}
                                    >
                                      View
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                      className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:opacity-80"
                                      style={{ background: 'rgba(255, 107, 107, 0.15)', border: '1px solid rgba(255, 107, 107, 0.3)', color: '#ff6b6b' }}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (confirm(`Permanently delete "${lead.lead_name}"? This cannot be undone.`)) {
                                          handleDeleteLeadFromAdmin(lead.id, lead.lead_name)
                                        }
                                      }}
                                      disabled={deletingLeadId === lead.id}
                                    >
                                      {deletingLeadId === lead.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {allLeads.filter(lead => lead.lead_name.toLowerCase().includes(leadsSearchQuery.toLowerCase())).length > leadsPerPage && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Page {currentPage} of {Math.ceil(allLeads.filter(lead => lead.lead_name.toLowerCase().includes(leadsSearchQuery.toLowerCase())).length / leadsPerPage)}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)' }}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          disabled={currentPage >= Math.ceil(allLeads.filter(lead => lead.lead_name.toLowerCase().includes(leadsSearchQuery.toLowerCase())).length / leadsPerPage)}
                          className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)' }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BOTTOM PANEL: Team & Reassignment View */}
            <div className="w-full">
              <div
                className="glass-card rounded-2xl p-6 h-full"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="space-y-4">
                  {/* Right Panel Header */}
                  <div>
                    <h2 className="text-xl font-semibold">Team Members</h2>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Active team and workload</p>
                  </div>

                  {/* Bulk Reassignment Controls */}
                  {selectedLeads.size > 0 && (
                    <div className="p-3 rounded-lg border-2" style={{ background: 'rgba(168,85,247,0.1)', border: '2px solid rgba(168,85,247,0.4)' }}>
                      <p className="text-xs font-semibold mb-2">
                        {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''} selected
                      </p>
                      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Reassign to:</p>
                      <div className="space-y-1">
                        {teamMembers
                          .filter(m => m.active && m.role !== 'admin')
                          .map(member => (
                            <button
                              key={member.id}
                              onClick={() => handleReassignLeads(member.id, Array.from(selectedLeads))}
                              disabled={reassignmentLoading}
                              className="w-full text-left px-2 py-1 rounded text-xs transition-all hover:bg-white/10 disabled:opacity-50"
                              style={{ background: 'rgba(255,255,255,0.05)' }}
                            >
                              {member.full_name}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Team Members List */}
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {teamMembers.filter(m => m.active && m.role !== 'admin').length === 0 ? (
                      <div className="flex items-center justify-center py-16 text-center" style={{ color: 'var(--text-muted)' }}>
                        <p className="text-sm">No active team members</p>
                      </div>
                    ) : (
                      teamMembers
                        .filter(m => m.active && m.role !== 'admin')
                        .sort((a, b) => {
                          const aLeads = allLeads.filter(l => (l.user_id || '') === (a.user_id || a.id)).length
                          const bLeads = allLeads.filter(l => (l.user_id || '') === (b.user_id || b.id)).length
                          return bLeads - aLeads
                        })
                        .map(member => {
                          const memberLeads = allLeads.filter(l => (l.user_id || '') === (member.user_id || member.id))
                          const isExpanded = selectedTeamMemberId === member.id
                          return (
                            <div key={member.id} className="space-y-2">
                              <div
                                className="p-3 rounded-lg border cursor-pointer transition-all hover:bg-white/5"
                                style={{ background: isExpanded ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.03)', border: isExpanded ? '1px solid rgba(168,85,247,0.4)' : '1px solid var(--border-subtle)' }}
                                onClick={() => setSelectedTeamMemberId(isExpanded ? null : member.id)}
                                onMouseEnter={(e) => {
                                  if (!isExpanded) {
                                    e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isExpanded) {
                                    e.currentTarget.style.borderColor = 'var(--border-subtle)'
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                                  }
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(168,85,247,0.15)' }}>
                                    <span className="text-xs font-bold" style={{ color: '#a855f7' }}>{member.initials}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{member.full_name}</p>
                                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{member.email}</p>
                                  </div>
                                  <span className="px-2 py-1 rounded-full text-xs font-bold flex-shrink-0" style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>
                                    {memberLeads.length}
                                  </span>
                                </div>
                              </div>

                              {/* Member Lead Queue (Expanded) */}
                              {isExpanded && memberLeads.length > 0 && (
                                <div className="ml-2 space-y-1 pl-3 border-l" style={{ borderColor: 'rgba(168,85,247,0.3)' }}>
                                  {memberLeads.slice(0, 5).map(lead => (
                                    <div
                                      key={lead.id}
                                      className="p-2 rounded text-xs truncate cursor-pointer transition-all hover:bg-white/5"
                                      style={{ background: 'rgba(168,85,247,0.08)' }}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedLeadDetail(lead)
                                        fetchLeadAuditLog(lead.id)
                                      }}
                                      title={lead.lead_name}
                                    >
                                      <p className="truncate">{lead.lead_name}</p>
                                      {lead.lead_score_total !== null && (
                                        <p className="text-xs mt-0.5" style={{ color: '#a855f7' }}>Score: {lead.lead_score_total.toFixed(1)}</p>
                                      )}
                                    </div>
                                  ))}
                                  {memberLeads.length > 5 && (
                                    <p className="text-xs px-2 py-1" style={{ color: 'var(--text-muted)' }}>
                                      +{memberLeads.length - 5} more
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lead Details Modal — Professional Full View */}
          {selectedLeadDetail && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div
                className="rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
                style={{ background: '#0f0f1a', border: '1px solid rgba(168, 85, 247, 0.3)' }}
              >
                {/* Close Button */}
                <button
                  onClick={() => {
                    setSelectedLeadDetail(null)
                    setLeadAuditLog([])
                  }}
                  className="absolute top-4 right-4 text-2xl font-light hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  ×
                </button>

                {/* Header */}
                <div className="flex items-start gap-4 p-6 border-b" style={{ borderColor: 'rgba(168, 85, 247, 0.2)' }}>
                  <Avatar
                    thumbnailUrl={selectedLeadDetail.channel_thumbnail_url ?? null}
                    initials={selectedLeadDetail.lead_name.substring(0, 2).toUpperCase()}
                    name={selectedLeadDetail.lead_name}
                    size="lg"
                  />
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-2" style={{ color: '#c084fc' }}>{selectedLeadDetail.lead_name}</h1>
                    <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>@{selectedLeadDetail.youtube_channel_id?.replace('@', '') || 'N/A'}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
                        Status: {selectedLeadDetail.status || 'new'}
                      </span>
                      <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(241, 91, 181, 0.15)', color: '#f472b6' }}>
                        Assigned: {selectedLeadDetail.assigned_to_member}
                      </span>
                      <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                        Found by: {selectedLeadDetail.found_by || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Two-Column Layout */}
                <div className="grid grid-cols-2 gap-6 p-6">
                  {/* LEFT COLUMN */}
                  <div className="space-y-5">
                    {/* Score Card */}
                    <div style={{ background: '#1a1a2e', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '12px', padding: '16px' }}>
                      <p className="text-xs font-bold uppercase mb-4" style={{ color: '#a855f7', letterSpacing: '1px' }}>Lead Score</p>
                      <p className="text-5xl font-black mb-2" style={{ color: selectedLeadDetail.lead_score_total ? '#a855f7' : '#666' }}>
                        {selectedLeadDetail.lead_score_total?.toFixed(1) || '—'}
                      </p>
                      <p className="text-sm mb-4" style={{ color: selectedLeadDetail.lead_score_total ? '#a855f7' : '#666' }}>
                        {selectedLeadDetail.lead_score_total ? (selectedLeadDetail.lead_score_total >= 4 ? 'Strong Fit' : selectedLeadDetail.lead_score_total >= 3 ? 'Solid Fit' : 'Fit') : 'Not Scored'}
                      </p>
                      {selectedLeadDetail.lead_score_total && (
                        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${((selectedLeadDetail.lead_score_total - 1) / 4) * 100}%`,
                              background: 'linear-gradient(90deg, #a855f7, #c084fc)'
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Channel Stats */}
                    <div style={{ background: '#1a1a2e', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '12px', padding: '16px' }}>
                      <p className="text-xs font-bold uppercase mb-4" style={{ color: '#a855f7', letterSpacing: '1px' }}>Channel Stats</p>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          ['Subscribers', selectedLeadDetail.subscriber_count ? (selectedLeadDetail.subscriber_count >= 1000000 ? (selectedLeadDetail.subscriber_count / 1000000).toFixed(1) + 'M' : selectedLeadDetail.subscriber_count >= 1000 ? (selectedLeadDetail.subscriber_count / 1000).toFixed(1) + 'K' : selectedLeadDetail.subscriber_count) : '—'],
                          ['Total Views', selectedLeadDetail.total_views ? selectedLeadDetail.total_views.toLocaleString() : '—'],
                          ['Videos', selectedLeadDetail.video_count || '—'],
                          ['Channel Age', selectedLeadDetail.channel_created_at ? Math.floor((Date.now() - new Date(selectedLeadDetail.channel_created_at).getTime()) / (86400000 * 30.44)) + 'm' : '—'],
                          ['Last Upload', selectedLeadDetail.last_upload_at ? Math.floor((Date.now() - new Date(selectedLeadDetail.last_upload_at).getTime()) / 86400000) + 'd ago' : '—'],
                          ['S2V Ratio', selectedLeadDetail.s2v_ratio_pct ? selectedLeadDetail.s2v_ratio_pct + '%' : '—'],
                          ['Posts (30d)', selectedLeadDetail.posting_frequency_30d || '—'],
                          ['Avg Views (10)', selectedLeadDetail.avg_views_last_10 ? selectedLeadDetail.avg_views_last_10.toLocaleString() : '—']
                        ].map(([label, val]) => (
                          <div key={label}>
                            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                            <p className="text-sm font-bold">{val}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Videos */}
                    {selectedLeadDetail.raw_youtube_data?.recentVideos?.length > 0 && (
                      <div style={{ background: '#1a1a2e', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '12px', padding: '16px' }}>
                        <p className="text-xs font-bold uppercase mb-4" style={{ color: '#a855f7', letterSpacing: '1px' }}>Latest Content</p>
                        <ul className="space-y-3">
                          {(selectedLeadDetail.raw_youtube_data?.recentVideos || []).slice(0, 5).map((v: any, i: number) => (
                            <li key={i} className="flex items-center justify-between text-sm p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                              <span className="flex-1">{v.title}</span>
                              <span className="ml-2 font-semibold" style={{ color: '#a855f7' }}>{v.viewCount?.toLocaleString()}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="space-y-5">
                    {/* AI Analysis */}
                    <div style={{ background: '#1a1a2e', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '12px', padding: '16px' }}>
                      <p className="text-xs font-bold uppercase mb-4" style={{ color: '#a855f7', letterSpacing: '1px' }}>AI Analysis</p>
                      <div className="space-y-3">
                        {[
                          ['Category', selectedLeadDetail.category],
                          ['Content Style', selectedLeadDetail.content_style],
                          ['Monetization', selectedLeadDetail.monetization],
                          ['Posting Pattern', selectedLeadDetail.posting_pattern]
                        ].map(([label, val]) => (
                          <div key={label}>
                            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                            <p className="text-sm font-semibold">{val || '—'}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Confidence */}
                    <div style={{ background: '#1a1a2e', border: '1px solid rgba(241, 91, 181, 0.2)', borderRadius: '12px', padding: '16px' }}>
                      <p className="text-xs font-bold uppercase mb-3" style={{ color: '#f15bb5', letterSpacing: '1px' }}>AI Confidence</p>
                      <p className="text-sm font-semibold mb-3">{selectedLeadDetail.ai_confidence || 'Unknown'}</p>
                      <div className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
                        <p className="font-semibold mb-2">Data Gaps:</p>
                        {selectedLeadDetail.data_gaps ? (
                          <div>• {selectedLeadDetail.data_gaps}</div>
                        ) : (
                          <div>• None</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strengths & Considerations */}
                <div className="grid grid-cols-2 gap-6 px-6" style={{ marginBottom: '24px' }}>
                  <div style={{ background: '#1a1a2e', border: '1px solid rgba(164, 244, 201, 0.2)', borderRadius: '12px', padding: '16px' }}>
                    <p className="text-xs font-bold uppercase mb-3" style={{ color: '#A4F4C9', letterSpacing: '1px' }}>Strengths</p>
                    <ul className="text-sm space-y-2">
                      {(selectedLeadDetail.strengths?.length ?? 0) > 0 ? selectedLeadDetail.strengths?.slice(0, 4).map((s: string, i: number) => (
                        <li key={i} className="flex gap-2">
                          <span style={{ color: '#A4F4C9' }}>•</span>
                          <span>{s}</span>
                        </li>
                      )) : <li className="text-xs" style={{ color: 'var(--text-muted)' }}>—</li>}
                    </ul>
                  </div>
                  <div style={{ background: '#1a1a2e', border: '1px solid rgba(255, 107, 107, 0.2)', borderRadius: '12px', padding: '16px' }}>
                    <p className="text-xs font-bold uppercase mb-3" style={{ color: '#FF6B6B', letterSpacing: '1px' }}>Considerations</p>
                    <ul className="text-sm space-y-2">
                      {(selectedLeadDetail.concerns?.length ?? 0) > 0 ? selectedLeadDetail.concerns?.slice(0, 4).map((c: string, i: number) => (
                        <li key={i} className="flex gap-2">
                          <span style={{ color: '#FF6B6B' }}>•</span>
                          <span>{c}</span>
                        </li>
                      )) : <li className="text-xs" style={{ color: 'var(--text-muted)' }}>—</li>}
                    </ul>
                  </div>
                </div>

                {/* Final Notes */}
                <div className="px-6 mb-6">
                  <div style={{ background: '#1a1a2e', border: '1px solid rgba(241, 91, 181, 0.2)', borderRadius: '12px', padding: '16px' }}>
                    <p className="text-xs font-bold uppercase mb-4" style={{ color: '#f15bb5', letterSpacing: '1px' }}>Final Notes & Recommendations</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{selectedLeadDetail.remarks_final || '—'}</p>
                  </div>
                </div>

                {/* Reassignment History */}
                {!leadDetailsLoading && leadAuditLog.length > 0 && (
                  <div className="px-6 mb-6">
                    <div style={{ background: '#1a1a2e', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '12px', padding: '16px' }}>
                      <p className="text-xs font-bold uppercase mb-3" style={{ color: '#a855f7', letterSpacing: '1px' }}>Reassignment History</p>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {leadAuditLog.map((log) => (
                          <div key={log.id} className="text-sm p-2 rounded" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
                            <p style={{ color: '#c084fc' }}>
                              {log.previous_assignee ? `${log.previous_assignee} → ${log.new_assignee}` : `→ ${log.new_assignee}`}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                              {new Date(log.changed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })} by {log.changed_by}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: 'rgba(168, 85, 247, 0.2)' }}>
                  <button
                    onClick={() => {
                      setSelectedLeadDetail(null)
                      setLeadAuditLog([])
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/10"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Duplicate Detection Section */}
      {section === 'duplicates' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Duplicate Detection</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Identify and manage duplicate YouTube channels</p>
          </div>

          {duplicates.length === 0 ? (
            <div className="glass-card p-8 rounded-lg text-center" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No duplicates found. All channels are unique! ✨</p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th className="px-4 py-3 text-left font-semibold text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Channel Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Channel ID</th>
                      <th className="px-4 py-3 text-left font-semibold text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Count</th>
                      <th className="px-4 py-3 text-left font-semibold text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Members</th>
                      <th className="px-4 py-3 text-left font-semibold text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Added</th>
                      <th className="px-4 py-3 text-left font-semibold text-xs uppercase" style={{ color: 'var(--text-muted)' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {duplicates.map((group) => {
                      const isExpanded = expandedGroups.has(group.youtube_channel_id)
                      const uniqueMembers = Array.from(new Set(group.leads.map((l) => l.memberName))).join(', ')
                      const oldestDate = new Date(Math.min(...group.leads.map((l) => new Date(l.created_at).getTime())))
                      const daysAgo = Math.floor((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24))

                      return (
                        <tbody key={group.youtube_channel_id}>
                          {/* Parent Row - Channel Group */}
                          <tr
                            onClick={() => {
                              const newExpanded = new Set(expandedGroups)
                              if (isExpanded) {
                                newExpanded.delete(group.youtube_channel_id)
                              } else {
                                newExpanded.add(group.youtube_channel_id)
                              }
                              setExpandedGroups(newExpanded)
                            }}
                            className="cursor-pointer hover:bg-opacity-5 transition-colors"
                            style={{ background: 'rgba(168, 85, 247, 0.04)', borderBottom: '1px solid var(--border-subtle)' }}
                          >
                            <td className="px-4 py-3 flex items-center gap-2">
                              <span style={{ color: '#a855f7' }}>{isExpanded ? '▼' : '▶'}</span>
                              <span className="font-medium">{group.lead_name}</span>
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                              {group.youtube_channel_id}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className="px-2 py-1 rounded text-xs font-bold"
                                style={{ background: 'rgba(255, 107, 107, 0.2)', color: '#ff6b6b' }}
                              >
                                {group.count}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs">{uniqueMembers || 'Unknown'}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                              {daysAgo}d ago
                            </td>
                            <td></td>
                          </tr>

                          {/* Child Rows - Individual Leads */}
                          {isExpanded &&
                            group.leads.map((lead, idx) => {
                              const leadDate = new Date(lead.created_at)
                              const leadDaysAgo = Math.floor((Date.now() - leadDate.getTime()) / (1000 * 60 * 60 * 24))

                              return (
                                <tr
                                  key={lead.id}
                                  style={{ background: 'rgba(255, 255, 255, 0.01)', borderBottom: '1px solid var(--border-subtle)' }}
                                >
                                  <td className="px-4 py-3 pl-12 text-xs">
                                    <span style={{ color: 'var(--text-muted)' }}>Lead {idx + 1}</span>
                                  </td>
                                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {lead.id.substring(0, 8)}...
                                  </td>
                                  <td></td>
                                  <td className="px-4 py-3 text-xs">{lead.memberName}</td>
                                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {leadDaysAgo}d ago
                                  </td>
                                  <td className="px-4 py-3 flex items-center gap-2">
                                    <Link href={`/admin?section=leads`}>
                                      <button
                                        className="px-2 py-1 rounded text-xs hover:opacity-80 transition-opacity"
                                        style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        View
                                      </button>
                                    </Link>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setDeleteSelectedLead({
                                          id: lead.id,
                                          memberName: lead.memberName,
                                          channelName: group.lead_name,
                                        })
                                        setShowDeleteDialog(true)
                                      }}
                                      disabled={deletingLeadId === lead.id}
                                      className="px-2 py-1 rounded text-xs hover:opacity-80 transition-opacity disabled:opacity-50"
                                      style={{ background: 'rgba(255, 107, 107, 0.2)', color: '#ff6b6b' }}
                                    >
                                      {deletingLeadId === lead.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && deleteSelectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl w-full max-w-md p-6"
            style={{ background: '#0f0f1a', border: '1px solid rgba(255, 107, 107, 0.3)' }}
          >
            <h2 className="text-xl font-bold mb-2">Delete Lead Permanently?</h2>
            <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
              This action cannot be undone. The lead "<span className="font-semibold">{deleteSelectedLead.channelName}</span>" assigned to{' '}
              <span className="font-semibold">{deleteSelectedLead.memberName}</span> will be permanently removed from the database.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false)
                  setDeleteSelectedLead(null)
                }}
                disabled={deletingLeadId !== null}
                className="flex-1 px-4 py-2 rounded text-sm font-medium transition-colors hover:opacity-80 disabled:opacity-50"
                style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteLead(deleteSelectedLead.id)}
                disabled={deletingLeadId !== null}
                className="flex-1 px-4 py-2 rounded text-sm font-medium text-white transition-colors hover:opacity-80 disabled:opacity-50"
                style={{ background: '#ff6b6b' }}
              >
                {deletingLeadId ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder — kept for future */}
      {false && section === 'duplicates' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Duplicate Detection</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Identify and manage duplicate YouTube channels</p>
          </div>

          {duplicates.length === 0 ? (
            <div className="glass-card p-8 rounded-lg text-center" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No duplicates found. All channels are unique!</p>
            </div>
          ) : (
            <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
              <h3 className="text-sm font-bold mb-4">Found {duplicates.length} duplicate {duplicates.length === 1 ? 'channel' : 'channels'}</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {duplicates.map((dup) => (
                  <div key={dup.youtube_channel_id} className="p-4 rounded-lg border" style={{ background: 'rgba(255, 107, 107, 0.08)', borderColor: 'rgba(255, 107, 107, 0.3)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-sm">{dup.lead_name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>ID: {dup.youtube_channel_id}</p>
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: 'rgba(255, 107, 107, 0.2)', color: '#ff6b6b' }}>
                        {dup.count} entries
                      </span>
                    </div>
                    <div className="space-y-2">
                      {dup.leads.map((lead, idx) => (
                        <div key={lead.id} className="flex items-center justify-between text-xs p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                          <div>
                            <p className="font-medium">#{idx + 1} - {lead.memberName}</p>
                            <p style={{ color: 'var(--text-muted)' }}>Added: {new Date(lead.created_at).toLocaleDateString()}</p>
                          </div>
                          <button
                            className="px-2 py-1 rounded text-xs hover:opacity-80"
                            style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}


      {/* Internal Notes Section */}
      {section === 'notes' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Internal Notes</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Admin-only notes on leads</p>
          </div>
          <div className="glass-card p-8 rounded-lg text-center" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-lg font-semibold">🚀 Feature Coming Soon</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>We're building this feature. Stay tuned!</p>
          </div>
        </div>
      )}



      {/* Export & Reporting Section */}
      {section === 'export' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Export & Reporting</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Generate reports and export data</p>
          </div>
          <div className="glass-card p-8 rounded-lg text-center" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-lg font-semibold">🚀 Feature Coming Soon</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>We're building this feature. Stay tuned!</p>
          </div>
        </div>
      )}

      {/* Placeholder — kept for future */}
      {false && section === 'export' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Export & Reporting</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Generate reports and export data</p>
          </div>

          {/* Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* CSV Export */}
            <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
              <h3 className="text-sm font-bold mb-2">CSV Export</h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Export team performance data as CSV</p>
              <button onClick={handleExportCSV} className="btn-primary w-full px-3 py-2 text-sm">
                Download CSV
              </button>
            </div>

            {/* Monthly Summary */}
            <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
              <h3 className="text-sm font-bold mb-2">Monthly Summary</h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Performance summary for current month</p>
              <button
                disabled
                className="w-full px-3 py-2 text-sm rounded-lg"
                style={{ background: 'rgba(168, 85, 247, 0.1)', color: 'var(--text-muted)', opacity: 0.5 }}
              >
                Coming Soon
              </button>
            </div>

            {/* Scheduled Reports */}
            <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
              <h3 className="text-sm font-bold mb-2">Scheduled Reports</h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Email reports on schedule</p>
              <button
                disabled
                className="w-full px-3 py-2 text-sm rounded-lg"
                style={{ background: 'rgba(168, 85, 247, 0.1)', color: 'var(--text-muted)', opacity: 0.5 }}
              >
                Coming Soon
              </button>
            </div>
          </div>

          {/* Recent Exports */}
          <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-sm font-bold mb-4">Export Information</h3>
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <p>✓ CSV format supported</p>
              <p>✓ Includes team performance metrics</p>
              <p>✓ Timestamped downloads</p>
              <p>⚙ PDF and scheduled reports coming in Phase 7.2</p>
            </div>
          </div>
        </div>
      )}

      {/* API Integration Status Section */}
      {section === 'api' && <APIStatusSection />}

      {/* Placeholder — kept for future */}
      {false && section === 'api' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">API Integration Status</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Monitor system health and API usage</p>
          </div>

          {/* API Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* YouTube API */}
            <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-bold">YouTube API</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Channel data fetching</p>
                </div>
                <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: 'rgba(76, 175, 80, 0.2)', color: '#4caf50' }}>
                  ✓ Active
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Quota Usage</p>
                  <p className="text-lg font-bold">6,250 / 10,000</p>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-1" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                    <div
                      className="bg-gradient-to-r from-green-500 to-yellow-500 h-2 rounded-full"
                      style={{ width: '62.5%' }}
                    ></div>
                  </div>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Last sync: Today 2:30 PM</p>
              </div>
            </div>

            {/* Google Sheets */}
            <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-bold">Google Sheets</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Data synchronization</p>
                </div>
                <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: 'rgba(76, 175, 80, 0.2)', color: '#4caf50' }}>
                  ✓ Active
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Status: Connected</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Last sync: May 19, 10:45 AM</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Records synced: 847</p>
              </div>
            </div>

            {/* Claude API */}
            <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-bold">Claude API</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI enrichment</p>
                </div>
                <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: 'rgba(76, 175, 80, 0.2)', color: '#4caf50' }}>
                  ✓ Active
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-bold text-lg">$127.43</span> / month
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tokens used: 2.4M / 5M</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Requests today: 143</p>
              </div>
            </div>
          </div>

          {/* System Health Summary */}
          <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-sm font-bold mb-4">System Health</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Uptime', value: '99.9%', color: '#4caf50' },
                { label: 'Avg Response', value: '245ms', color: '#ffc107' },
                { label: 'API Health', value: 'Good', color: '#4caf50' },
                { label: 'Last Updated', value: '2 min ago', color: '#4caf50' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-3 rounded-lg border text-center"
                  style={{ background: 'rgba(255, 255, 255, 0.03)', borderColor: 'var(--border-subtle)' }}
                >
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {item.label}
                  </p>
                  <p className="text-sm font-bold mt-1" style={{ color: item.color }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-sm font-bold mb-3">Alerts</h3>
            <div className="space-y-2">
              <div className="p-3 rounded-lg border" style={{ background: 'rgba(76, 175, 80, 0.08)', borderColor: 'rgba(76, 175, 80, 0.3)' }}>
                <p className="text-sm text-green-400">✓ All systems operational</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Custom Checkbox Styling */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }

        label:has(input[type="checkbox"]:focus-visible) div {
          ring: 2px rgba(168, 85, 247, 0.5);
        }

        .peer:checked ~ div svg {
          display: block;
        }
      `}</style>
    </div>
  )
}
