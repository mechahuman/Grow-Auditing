'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { Mail, Plus, Trash2, Users, Shield, BarChart3, AlertCircle } from 'lucide-react'

interface TeamMember {
  id: string
  email: string
  full_name: string
  initials: string
  role: 'admin' | 'member'
  active: boolean
  created_at: string
}

interface LeadStats {
  memberId: string
  memberName: string
  totalLeads: number
  draftLeads: number
  completedLeads: number
}

export default function AdminPage() {
  const supabase = createClient()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [leadStats, setLeadStats] = useState<Map<string, LeadStats>>(new Map())
  const [newEmail, setNewEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [memberLeads, setMemberLeads] = useState<any[]>([])
  const [showLeadsModal, setShowLeadsModal] = useState(false)

  // Fetch team members and lead stats
  useEffect(() => {
    fetchTeamData()
  }, [])

  async function fetchTeamData() {
    setLoading(true)
    try {
      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('id, email, full_name, initials, role, active, created_at')
        .order('full_name')

      if (membersError) throw membersError
      setTeamMembers(members || [])

      // Fetch lead stats for each member
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('user_id, draft')

      if (leadsError) throw leadsError

      const stats = new Map<string, LeadStats>()
      leads?.forEach((lead) => {
        const member = members?.find((m) => m.id === lead.user_id)
        if (member) {
          if (!stats.has(member.id)) {
            stats.set(member.id, {
              memberId: member.id,
              memberName: member.full_name,
              totalLeads: 0,
              draftLeads: 0,
              completedLeads: 0,
            })
          }
          const stat = stats.get(member.id)!
          stat.totalLeads++
          if (lead.draft) {
            stat.draftLeads++
          } else {
            stat.completedLeads++
          }
        }
      })

      setLeadStats(stats)
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch team data')
      setLoading(false)
    }
  }

  async function handleAddEmail(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!newEmail.trim()) {
      setError('Please enter an email address')
      return
    }

    try {
      // Check if email already exists
      const existing = teamMembers.find((m) => m.email === newEmail)
      if (existing) {
        setError('This email is already whitelisted')
        return
      }

      // Insert into team_members table (pre-whitelist)
      const initials = newEmail
        .split('@')[0]
        .substring(0, 2)
        .toUpperCase()

      const { error: insertError } = await supabase
        .from('team_members')
        .insert({
          email: newEmail.toLowerCase(),
          full_name: newEmail.split('@')[0],
          initials,
          role: 'member',
          active: true,
        })

      if (insertError) {
        if (insertError.message.includes('unique')) {
          setError('This email is already in the system')
        } else {
          setError(insertError.message)
        }
        return
      }

      setSuccess(`${newEmail} has been whitelisted and can now sign up`)
      setNewEmail('')
      await fetchTeamData()
    } catch (err: any) {
      setError(err.message || 'Failed to add email')
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Are you sure? This will deactivate the member.')) return

    try {
      const { error } = await supabase
        .from('team_members')
        .update({ active: false })
        .eq('id', memberId)

      if (error) throw error
      setSuccess('Member deactivated')
      await fetchTeamData()
    } catch (err: any) {
      setError(err.message || 'Failed to remove member')
    }
  }

  async function handleViewMemberLeads(member: TeamMember) {
    setSelectedMember(member)
    setShowLeadsModal(true)

    try {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('id, lead_name, status, subscriber_count, lead_score_total, draft')
        .eq('user_id', member.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMemberLeads(leads || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch member leads')
    }
  }

  async function handleReassignLead(leadId: string, newMemberId: string) {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ user_id: newMemberId })
        .eq('id', leadId)

      if (error) throw error
      setSuccess('Lead reassigned successfully')
      if (selectedMember) {
        await handleViewMemberLeads(selectedMember)
      }
      await fetchTeamData()
    } catch (err: any) {
      setError(err.message || 'Failed to reassign lead')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div
              className="w-8 h-8 rounded-full border-4 border-transparent border-t-purple-500"
              style={{ borderTopColor: '#a855f7' }}
            ></div>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary mb-1 flex items-center gap-2">
          <Shield size={32} />
          Admin Panel
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Manage team members and leads
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-lg border"
          style={{
            background: 'rgba(255, 107, 107, 0.12)',
            borderColor: 'rgba(255, 107, 107, 0.3)',
            color: '#ff6b6b',
          }}
        >
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-lg border"
          style={{
            background: 'rgba(76, 175, 80, 0.12)',
            borderColor: 'rgba(76, 175, 80, 0.3)',
            color: '#4caf50',
          }}
        >
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Team Whitelist Section */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users size={20} />
          Add Team Member
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Enter a Google email to whitelist them. They'll be able to sign up immediately.
        </p>

        <form onSubmit={handleAddEmail} className="flex gap-2">
          <div className="relative flex-1">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="member@example.com"
              className="input-field pl-9 w-full"
            />
          </div>
          <button type="submit" className="btn-primary px-4 py-2 flex items-center gap-2 whitespace-nowrap">
            <Plus size={16} />
            Add
          </button>
        </form>
      </div>

      {/* Team Overview Section */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 size={20} />
          Team Overview
        </h2>

        {teamMembers.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No team members yet. Add one to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {teamMembers.map((member) => {
              const stats = leadStats.get(member.id) || {
                totalLeads: 0,
                draftLeads: 0,
                completedLeads: 0,
              }

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {member.full_name}
                      {member.role === 'admin' && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }}>
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {member.email}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {stats.totalLeads} leads • {stats.completedLeads} completed • {stats.draftLeads} draft
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewMemberLeads(member)}
                      className="px-3 py-1 rounded text-xs font-medium border transition-colors hover:opacity-80"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      View Leads
                    </button>
                    {member.active && member.role !== 'admin' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="px-3 py-1 rounded text-xs font-medium transition-colors hover:opacity-80"
                        style={{
                          color: '#ff6b6b',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Member Leads Modal */}
      {showLeadsModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                {selectedMember.full_name}'s Leads ({memberLeads.length})
              </h3>
              <button
                onClick={() => setShowLeadsModal(false)}
                className="text-2xl"
                style={{ color: 'var(--text-muted)' }}
              >
                ×
              </button>
            </div>

            {memberLeads.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No leads for this member yet.
              </p>
            ) : (
              <div className="space-y-2">
                {memberLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{lead.lead_name}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Score: {lead.lead_score_total} • Status: {lead.status}
                        {lead.draft && ' (Draft)'}
                      </p>
                    </div>

                    <select
                      defaultValue={selectedMember.id}
                      onChange={(e) => handleReassignLead(lead.id, e.target.value)}
                      className="input-field text-xs px-2 py-1"
                      style={{ maxWidth: '150px' }}
                    >
                      <option value="">Reassign to...</option>
                      {teamMembers
                        .filter((m) => m.id !== selectedMember.id && m.active)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.full_name}
                          </option>
                        ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
