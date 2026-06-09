'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase/client'
import { Mail, Plus, Trash2, AlertCircle, Trophy, Users, ShieldCheck, List, Activity, Zap, ChevronRight } from 'lucide-react'

interface TeamMember {
  id: string
  email: string
  full_name: string
  initials: string
  role: 'admin' | 'member'
  active: boolean
  created_at: string
}

interface DashboardMetrics {
  totalMembers: number
  totalAdmins: number
  totalLeads: number
}

interface PerformanceData {
  memberId: string
  memberName: string
  email: string
  totalLeads: number
  completedLeads: number
  avgScore: number
  completionRate: number
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

interface TrendData {
  date: string
  avgScore: number
  leadsCount: number
}

interface CategoryTrend {
  category: string
  avgScore: number
  count: number
}

interface AdminNote {
  id: string
  lead_id: string
  lead_name: string
  admin_id: string
  admin_email: string
  content: string
  created_at: string
  updated_at: string
}

interface LowScoringLead {
  id: string
  lead_name: string
  lead_score_total: number
  user_id: string
  memberName: string
  created_at: string
  flagged: boolean
}

export default function AdminPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const section = searchParams.get('section') || 'dashboard'

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([])
  const [trends, setTrends] = useState<TrendData[]>([])
  const [categoryTrends, setCategoryTrends] = useState<CategoryTrend[]>([])
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([])
  const [lowScoringLeads, setLowScoringLeads] = useState<LowScoringLead[]>([])
  const [newFullName, setNewFullName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'member' | 'admin'>('member')
  const [newNote, setNewNote] = useState('')
  const [selectedLeadForNote, setSelectedLeadForNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'score' | 'leads' | 'completion'>('score')
  const [sortDesc, setSortDesc] = useState(true)

  useEffect(() => {
    fetchAdminData()
  }, [])

  async function fetchAdminData() {
    setLoading(true)
    try {
      const [membersRes, leadsRes] = await Promise.all([
        supabase.from('team_members').select('id, user_id, email, full_name, initials, role, active, created_at').order('full_name'),
        supabase.from('leads').select('id, user_id, draft, status, lead_score_total'),
      ])

      if (membersRes.error) throw membersRes.error
      if (leadsRes.error) throw leadsRes.error

      setTeamMembers(membersRes.data || [])

      const members = membersRes.data || []
      const leads = leadsRes.data || []

      setMetrics({
        totalMembers: members.filter((m) => m.active && m.role !== 'admin').length,
        totalAdmins: members.filter((m) => m.active && m.role === 'admin').length,
        totalLeads: leads.length,
      })

      // Calculate performance data
      const performance: Record<string, PerformanceData & { scoreSum: number; scoreCount: number }> = {}

      ;(membersRes.data || []).forEach((member) => {
        if (!member.active) return
        if (!member.email || member.email.trim() === '') return
        if (member.role === 'admin') return

        const key = member.user_id || member.id
        performance[key] = {
          memberId: member.id,
          memberName: member.full_name,
          email: member.email,
          totalLeads: 0,
          completedLeads: 0,
          avgScore: 0,
          completionRate: 0,
          scoreSum: 0,
          scoreCount: 0,
        }
      })

      leads.forEach((lead) => {
        if (performance[lead.user_id]) {
          performance[lead.user_id].totalLeads++
          if (lead.draft === false && lead.status !== 'new') {
            performance[lead.user_id].completedLeads++
          }
          if (lead.lead_score_total) {
            performance[lead.user_id].scoreSum += lead.lead_score_total
            performance[lead.user_id].scoreCount++
          }
        }
      })

      // Calculate averages
      Object.values(performance).forEach((perf) => {
        perf.completionRate = perf.totalLeads > 0 ? (perf.completedLeads / perf.totalLeads) * 100 : 0
        perf.avgScore = perf.scoreCount > 0 ? perf.scoreSum / perf.scoreCount : 0
      })

      setPerformanceData(
        Object.values(performance).map(({ scoreSum, scoreCount, ...p }) => p)
      )

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

      // Calculate lead scoring trends (last 30 days by week)
      const leadsWithScore = allLeads.filter((l) => l.lead_score_total !== null && l.lead_score_total !== undefined)
      const trendMap: Record<string, { scores: number[]; count: number }> = {}

      leadsWithScore.forEach((lead) => {
        const date = new Date(lead.created_at)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekKey = weekStart.toISOString().split('T')[0]

        if (!trendMap[weekKey]) {
          trendMap[weekKey] = { scores: [], count: 0 }
        }
        trendMap[weekKey].scores.push(lead.lead_score_total || 0)
        trendMap[weekKey].count++
      })

      const trendList = Object.entries(trendMap)
        .map(([date, data]) => ({
          date,
          avgScore: data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0,
          leadsCount: data.count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-4) // Last 4 weeks

      setTrends(trendList)

      // Calculate category trends
      const categoryMap: Record<string, { scores: number[]; count: number }> = {}

      leadsWithScore.forEach((lead) => {
        const category = (lead.category as string) || 'Uncategorized'
        if (!categoryMap[category]) {
          categoryMap[category] = { scores: [], count: 0 }
        }
        categoryMap[category].scores.push(lead.lead_score_total || 0)
        categoryMap[category].count++
      })

      const categoryList = Object.entries(categoryMap)
        .map(([category, data]) => ({
          category,
          avgScore: data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0,
          count: data.count,
        }))
        .sort((a, b) => b.avgScore - a.avgScore)

      setCategoryTrends(categoryList)

      // Fetch admin notes (Phase 5)
      const notesRes = await supabase
        .from('lead_admin_notes')
        .select('id, lead_id, admin_id, content, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (notesRes.error) throw notesRes.error

      const notesWithDetails = (notesRes.data || []).map((note) => {
        const lead = allLeads.find((l) => l.id === note.lead_id)
        const member = membersRes.data?.find((m) => (m.user_id || m.id) === note.admin_id)
        return {
          ...note,
          lead_name: lead?.lead_name || 'Unknown Lead',
          admin_email: member?.email || 'Unknown Admin',
        }
      })

      setAdminNotes(notesWithDetails)

      // Calculate low-scoring leads (Phase 6)
      const lowScores = allLeads
        .filter((l) => l.lead_score_total && l.lead_score_total < 2.5)
        .map((l) => {
          const member = membersRes.data?.find((m) => (m.user_id || m.id) === l.user_id)
          return {
            id: l.id,
            lead_name: l.lead_name,
            lead_score_total: l.lead_score_total || 0,
            user_id: l.user_id,
            memberName: member?.full_name || 'Unknown',
            created_at: l.created_at,
            flagged: false, // Would check from a flagged_for_review status
          }
        })
        .sort((a, b) => a.lead_score_total - b.lead_score_total)

      setLowScoringLeads(lowScores)
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admin data')
      setLoading(false)
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!newNote.trim()) {
      setError('Please enter a note')
      return
    }

    if (!selectedLeadForNote) {
      setError('Please select a lead')
      return
    }

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase.from('lead_admin_notes').insert({
        lead_id: selectedLeadForNote,
        admin_id: user.user?.id,
        content: newNote,
      })

      if (insertError) throw insertError

      setSuccess('Note added successfully')
      setNewNote('')
      setSelectedLeadForNote('')
      await fetchAdminData()
    } catch (err: any) {
      setError(err.message || 'Failed to add note')
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!window.confirm('Delete this note?')) return

    try {
      const { error } = await supabase.from('lead_admin_notes').delete().eq('id', noteId)
      if (error) throw error
      setSuccess('Note deleted')
      await fetchAdminData()
    } catch (err: any) {
      setError(err.message || 'Failed to delete note')
    }
  }

  function handleExportCSV() {
    try {
      const leadsRes = supabase.from('leads').select('*')

      const allLeadsData = teamMembers.map((member) => ({
        'Member': member.full_name,
        'Email': member.email,
        'Leads Added': performanceData.find((p) => p.memberId === member.id)?.totalLeads || 0,
        'Completed': performanceData.find((p) => p.memberId === member.id)?.completedLeads || 0,
        'Avg Score': performanceData.find((p) => p.memberId === member.id)?.avgScore.toFixed(2) || 0,
        'Completion %': performanceData.find((p) => p.memberId === member.id)?.completionRate.toFixed(0) || 0,
      }))

      const csv = [
        Object.keys(allLeadsData[0]).join(','),
        ...allLeadsData.map((row) => Object.values(row).join(',')),
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads-report-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      setSuccess('Report exported successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to export report')
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

          {/* Bottom Two-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Performance Table */}
            <div 
              className="glass-card rounded-2xl p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(168,85,247,0.12)]" 
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)'
              }}
            >
              <div className="mb-6">
                <h3 className="text-xl font-semibold">Team Performance</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Leads contributed by members</p>
              </div>
              <div className="space-y-2.5">
                {performanceData.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No team members yet</p>
                ) : (
                  performanceData
                    .sort((a, b) => b.totalLeads - a.totalLeads)
                    .map((perf) => {
                      const member = teamMembers.find((m) => m.id === perf.memberId)
                      return (
                        <Link key={perf.memberId} href="/admin?section=leads">
                          <div
                            className="group flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                              e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                              e.currentTarget.style.borderColor = 'var(--border-subtle)'
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(168,85,247,0.15)' }}>
                                  <span className="text-xs font-bold" style={{ color: '#a855f7' }}>{perf.memberName.charAt(0)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{perf.memberName}</p>
                                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{perf.email}</p>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(168,85,247,0.1)' }}>
                                <span className="text-sm font-bold" style={{ color: '#a855f7' }}>{perf.totalLeads}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })
                )}
              </div>
            </div>

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
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Team Members</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage access and roles</p>
          </div>

          {/* Add Member Form */}
          <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-sm font-bold mb-4">Add New Member</h3>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                  <input type="text" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} placeholder="John Doe" className="input-field w-full text-sm h-10" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>Gmail</label>
                  <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="john@gmail.com" className="input-field w-full text-sm h-10" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>Role</label>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)} className="input-field w-full text-sm h-10" style={{ paddingRight: '1.5rem' }}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary px-4 py-2 flex items-center gap-1.5 text-sm">
                <Plus size={14} />
                Add Member
              </button>
            </form>
          </div>

          {/* Members List */}
          <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-sm font-bold mb-4">Active Members ({teamMembers.filter((m) => m.active).length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {teamMembers.filter((m) => m.active).length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No members yet.</p>
              ) : (
                teamMembers
                  .filter((m) => m.active)
                  .map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ background: 'rgba(255, 255, 255, 0.03)', borderColor: 'var(--border-subtle)' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{member.full_name}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {member.email}
                        </p>
                        {member.role === 'admin' && (
                          <span className="inline-block text-xs px-2 py-0.5 mt-1 rounded" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }}>
                            Admin
                          </span>
                        )}
                      </div>
                      {member.role !== 'admin' && (
                        <button onClick={() => handleRemoveMember(member.id)} className="p-1.5 flex-shrink-0 hover:opacity-80 ml-4" style={{ color: '#ff6b6b' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lead Management Section */}
      {section === 'leads' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Lead Management</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>View and manage all leads</p>
          </div>
          <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Lead management interface coming soon.</p>
          </div>
        </div>
      )}

      {/* Performance Insights Section */}
      {section === 'performance' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Lead Performance Insights</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Team member performance based on lead quality</p>
          </div>
          <div className="glass-card p-8 rounded-lg text-center" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-lg font-semibold">🚀 Feature Coming Soon</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>We're building this feature. Stay tuned!</p>
          </div>
        </div>
      )}

      {/* Placeholder for the rest of performance section — kept for future */}
      {false && section === 'performance' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Lead Performance Insights</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Team member performance based on lead quality</p>
          </div>

          {/* Top Performers Cards */}
          {performanceData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {performanceData
                .sort((a, b) => b.avgScore - a.avgScore)
                .slice(0, 3)
                .map((perf, idx) => (
                  <div key={perf.memberId} className="glass-card p-5 rounded-lg relative overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
                    {idx === 0 && (
                      <div className="absolute top-3 right-3 p-1.5 rounded-lg" style={{ background: 'rgba(255, 215, 0, 0.2)' }}>
                        <Trophy size={16} style={{ color: '#ffd700' }} />
                      </div>
                    )}
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {idx === 0 ? '🥇 Top Performer' : idx === 1 ? '🥈 2nd Place' : '🥉 3rd Place'}
                    </p>
                    <p className="text-sm font-bold mt-2">{perf.memberName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {perf.email}
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Score</span>
                        <span className="text-lg font-bold text-gradient-primary">{perf.avgScore.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Leads</span>
                        <span className="text-sm font-medium">{perf.totalLeads}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Performance Leaderboard */}
          <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">Performance Leaderboard</h3>
              <div className="flex gap-2">
                {[
                  { value: 'score', label: 'Score' },
                  { value: 'leads', label: 'Leads' },
                  { value: 'completion', label: 'Completion' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      if (sortBy === option.value) {
                        setSortDesc(!sortDesc)
                      } else {
                        setSortBy(option.value as any)
                        setSortDesc(true)
                      }
                    }}
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      background: sortBy === option.value ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                      color: sortBy === option.value ? '#a855f7' : 'var(--text-secondary)',
                      border: `1px solid ${sortBy === option.value ? 'rgba(168, 85, 247, 0.3)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {performanceData
                .sort((a, b) => {
                  let compareVal = 0
                  if (sortBy === 'score') {
                    compareVal = a.avgScore - b.avgScore
                  } else if (sortBy === 'leads') {
                    compareVal = a.totalLeads - b.totalLeads
                  } else if (sortBy === 'completion') {
                    compareVal = a.completionRate - b.completionRate
                  }
                  return sortDesc ? -compareVal : compareVal
                })
                .map((perf, idx) => (
                  <div key={perf.memberId} className="flex items-center justify-between p-3 rounded-lg border" style={{ background: 'rgba(255, 255, 255, 0.03)', borderColor: 'var(--border-subtle)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{perf.memberName}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {perf.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-6 ml-4 flex-shrink-0 text-right">
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Score</p>
                        <p className="text-sm font-bold text-gradient-primary">{perf.avgScore.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Leads</p>
                        <p className="text-sm font-bold">{perf.totalLeads}</p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Completion</p>
                        <p className="text-sm font-bold">{perf.completionRate.toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Detection Section */}
      {section === 'duplicates' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Duplicate Detection</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Identify and manage duplicate YouTube channels</p>
          </div>
          <div className="glass-card p-8 rounded-lg text-center" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-lg font-semibold">🚀 Feature Coming Soon</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>We're building this feature. Stay tuned!</p>
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

      {/* Lead Scoring Trends Section */}
      {section === 'trends' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Lead Scoring Trends</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Analyze team performance over time</p>
          </div>
          <div className="glass-card p-8 rounded-lg text-center" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-lg font-semibold">🚀 Feature Coming Soon</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>We're building this feature. Stay tuned!</p>
          </div>
        </div>
      )}

      {/* Placeholder — kept for future */}
      {false && section === 'trends' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Lead Scoring Trends</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Analyze team performance over time</p>
          </div>

          {/* Weekly Trend Data */}
          <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-sm font-bold mb-4">Weekly Average Scores (Last 4 Weeks)</h3>
            {trends.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No trend data available yet.</p>
            ) : (
              <div className="space-y-3">
                {trends.map((trend) => (
                  <div key={trend.date} className="flex items-center justify-between p-3 rounded-lg border" style={{ background: 'rgba(255, 255, 255, 0.03)', borderColor: 'var(--border-subtle)' }}>
                    <div>
                      <p className="text-sm font-medium">Week of {new Date(trend.date).toLocaleDateString()}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{trend.leadsCount} leads added</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gradient-primary">{trend.avgScore.toFixed(2)}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Score</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-sm font-bold mb-4">Category Performance</h3>
            {categoryTrends.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No category data available yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryTrends.map((cat) => (
                  <div key={cat.category} className="p-4 rounded-lg border" style={{ background: 'rgba(255, 255, 255, 0.03)', borderColor: 'var(--border-subtle)' }}>
                    <p className="text-sm font-medium mb-2">{cat.category}</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Score</p>
                        <p className="text-lg font-bold text-gradient-primary">{cat.avgScore.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Leads</p>
                        <p className="text-lg font-bold">{cat.count}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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

      {/* Placeholder — kept for future */}
      {false && section === 'notes' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Internal Notes</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Admin-only notes on leads</p>
          </div>

          {/* Add Note Form */}
          <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-sm font-bold mb-4">Add Note to Lead</h3>
            <form onSubmit={handleAddNote} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>Select Lead</label>
                <select
                  value={selectedLeadForNote}
                  onChange={(e) => setSelectedLeadForNote(e.target.value)}
                  className="input-field w-full text-sm h-9"
                >
                  <option value="">Choose a lead...</option>
                  {teamMembers.length > 0 && (
                    <optgroup label="Available Leads">
                      {/* Would populate from actual leads list */}
                    </optgroup>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>Note</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add internal note..."
                  className="input-field w-full text-sm p-2 rounded"
                  rows={3}
                />
              </div>
              <button type="submit" className="btn-primary px-4 py-2 text-sm">
                Add Note
              </button>
            </form>
          </div>

          {/* Recent Notes */}
          <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-sm font-bold mb-4">Recent Notes ({adminNotes.length})</h3>
            {adminNotes.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notes yet.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {adminNotes.map((note) => (
                  <div key={note.id} className="p-3 rounded-lg border" style={{ background: 'rgba(255, 255, 255, 0.03)', borderColor: 'var(--border-subtle)' }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">{note.lead_name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>By {note.admin_email}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-xs px-2 py-1 rounded hover:opacity-80"
                        style={{ background: 'rgba(255, 107, 107, 0.2)', color: '#ff6b6b' }}
                      >
                        Delete
                      </button>
                    </div>
                    <p className="text-sm mb-2">{note.content}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(note.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lead Scoring Audit Section */}
      {section === 'audit' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Lead Scoring Audit</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Review low-scoring leads for quality assurance</p>
          </div>
          <div className="glass-card p-8 rounded-lg text-center" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-lg font-semibold">🚀 Feature Coming Soon</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>We're building this feature. Stay tuned!</p>
          </div>
        </div>
      )}

      {/* Placeholder — kept for future */}
      {false && section === 'audit' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Lead Scoring Audit</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Review low-scoring leads for quality assurance</p>
          </div>

          {lowScoringLeads.length === 0 ? (
            <div className="glass-card p-8 rounded-lg text-center" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All leads are of good quality! No leads scoring below 2.5</p>
            </div>
          ) : (
            <div className="glass-card p-5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
              <h3 className="text-sm font-bold mb-4">Low-Scoring Leads ({lowScoringLeads.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {lowScoringLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ background: 'rgba(255, 107, 107, 0.08)', borderColor: 'rgba(255, 107, 107, 0.3)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{lead.lead_name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Added by {lead.memberName} • {new Date(lead.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Score</p>
                        <p className="text-lg font-bold" style={{ color: '#ff6b6b' }}>
                          {lead.lead_score_total.toFixed(2)}
                        </p>
                      </div>
                      <button
                        className="px-2 py-1 rounded text-xs hover:opacity-80"
                        style={{ background: 'rgba(255, 107, 107, 0.2)', color: '#ff6b6b' }}
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
      {section === 'api' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">API Integration Status</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Monitor system health and API usage</p>
          </div>
          <div className="glass-card p-8 rounded-lg text-center" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-lg font-semibold">🚀 Feature Coming Soon</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>We're building this feature. Stay tuned!</p>
          </div>
        </div>
      )}

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
    </div>
  )
}
