'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { Mail, Plus, Trash2, Users, BarChart3, AlertCircle, Home, List, LogOut, Menu, X, ArrowLeft, Settings } from 'lucide-react'
import Link from 'next/link'

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
  totalLeads: number
  completedLeads: number
  inProgressLeads: number
  draftLeads: number
  activeToday: number
}

export default function AdminPage() {
  const supabase = createClient()
  const [currentSection, setCurrentSection] = useState<'dashboard' | 'members' | 'leads'>('dashboard')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'member' | 'admin'>('member')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    fetchAdminData()
  }, [])

  async function fetchAdminData() {
    setLoading(true)
    try {
      const [membersRes, leadsRes] = await Promise.all([
        supabase.from('team_members').select('id, email, full_name, initials, role, active, created_at').order('full_name'),
        supabase.from('leads').select('id, draft, status'),
      ])

      if (membersRes.error) throw membersRes.error
      if (leadsRes.error) throw leadsRes.error

      setTeamMembers(membersRes.data || [])

      const leads = leadsRes.data || []
      const completedLeads = leads.filter((l) => l.draft === false && l.status !== 'new').length
      const inProgressLeads = leads.filter((l) => l.draft === false && l.status === 'new').length
      const draftLeads = leads.filter((l) => l.draft === true).length

      setMetrics({
        totalMembers: membersRes.data?.length || 0,
        totalLeads: leads.length,
        completedLeads,
        inProgressLeads,
        draftLeads,
        activeToday: membersRes.data?.filter((m) => m.active).length || 0,
      })

      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admin data')
      setLoading(false)
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!newEmail.trim()) {
      setError('Please enter an email address')
      return
    }

    try {
      const existing = teamMembers.find((m) => m.email === newEmail.toLowerCase())
      if (existing) {
        setError('This email is already whitelisted')
        return
      }

      const initials = newEmail.split('@')[0].substring(0, 2).toUpperCase()

      const { error: insertError } = await supabase.from('team_members').insert({
        email: newEmail.toLowerCase(),
        full_name: newEmail.split('@')[0],
        initials,
        role: newRole,
        active: true,
      })

      if (insertError) {
        setError(insertError.message.includes('unique') ? 'This email is already in the system' : insertError.message)
        return
      }

      setSuccess(`${newEmail} has been whitelisted as ${newRole}`)
      setNewEmail('')
      await fetchAdminData()
    } catch (err: any) {
      setError(err.message || 'Failed to add member')
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!window.confirm('Deactivate this member?')) return

    try {
      const { error } = await supabase.from('team_members').update({ active: false }).eq('id', memberId)
      if (error) throw error
      setSuccess('Member deactivated')
      await fetchAdminData()
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate member')
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-page">
        <div className="m-auto text-center">
          <div className="inline-block mb-4 w-8 h-8 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-page overflow-hidden">
      {/* Left Sidebar - Retractable */}
      <div
        className={`border-r flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}
        style={{
          borderColor: 'var(--border-subtle)',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        {/* Sidebar Header */}
        <div className="px-4 py-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
          {sidebarOpen && (
            <div>
              <h1 className="text-sm font-bold text-gradient-primary">GROW</h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Admin
              </p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-lg transition-colors hover:bg-opacity-50"
            style={{ color: 'var(--text-secondary)' }}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'members', label: 'Team Members', icon: Users },
            { id: 'leads', label: 'Lead Management', icon: List },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentSection(id as any)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{
                background: currentSection === id ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                color: currentSection === id ? '#a855f7' : 'var(--text-secondary)',
              }}
              title={!sidebarOpen ? label : ''}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-2 border-t space-y-1" style={{ borderColor: 'var(--border-subtle)' }}>
          <Link
            href="/leads"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
            style={{
              color: 'var(--text-secondary)',
            }}
            title="Back to Leads"
          >
            <ArrowLeft size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Back to Leads</span>}
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
            style={{
              color: 'var(--text-secondary)',
            }}
            title="Sign Out"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Alerts */}
          {error && (
            <div
              className="flex gap-3 px-4 py-3 rounded-lg border mb-6"
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
              className="flex gap-3 px-4 py-3 rounded-lg border mb-6"
              style={{
                background: 'rgba(76, 175, 80, 0.12)',
                borderColor: 'rgba(76, 175, 80, 0.3)',
                color: '#4caf50',
              }}
            >
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Dashboard Section */}
          {currentSection === 'dashboard' && metrics && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)' }}>System overview and key metrics</p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Total Team Members', value: metrics.totalMembers, subtext: 'Active members' },
                  { label: 'Total Leads', value: metrics.totalLeads, subtext: 'All leads' },
                  { label: 'Completed Leads', value: metrics.completedLeads, subtext: 'Published' },
                  { label: 'In Progress', value: metrics.inProgressLeads, subtext: 'Being reviewed' },
                  { label: 'Draft Leads', value: metrics.draftLeads, subtext: 'Not published' },
                  { label: 'Active Today', value: metrics.activeToday, subtext: 'Logged in' },
                ].map((metric, i) => (
                  <div
                    key={i}
                    className="glass-card p-6 rounded-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {metric.label}
                    </p>
                    <p className="text-3xl font-bold mt-2 text-gradient-primary">{metric.value}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {metric.subtext}
                    </p>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-lg font-bold">Quick Actions</h2>
                <div className="flex gap-4 flex-wrap">
                  <button
                    onClick={() => setCurrentSection('members')}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: 'rgba(168, 85, 247, 0.15)',
                      color: '#a855f7',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                    }}
                  >
                    Manage Team Members
                  </button>
                  <button
                    onClick={() => setCurrentSection('leads')}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: 'rgba(168, 85, 247, 0.15)',
                      color: '#a855f7',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                    }}
                  >
                    View All Leads
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Team Members Section */}
          {currentSection === 'members' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Team Members</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage access and roles</p>
              </div>

              {/* Add Member Form */}
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-lg font-bold">Add New Member</h2>
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Google Email
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="member@gmail.com"
                          className="input-field pl-9 w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Role
                      </label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as 'member' | 'admin')}
                        className="input-field w-full appearance-none"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn-primary px-6 py-2 flex items-center gap-2">
                    <Plus size={16} />
                    Add Member
                  </button>
                </form>
              </div>

              {/* Members List */}
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-lg font-bold">Active Members ({teamMembers.filter((m) => m.active).length})</h2>
                <div className="space-y-3">
                  {teamMembers.filter((m) => m.active).length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      No team members yet. Add one to get started.
                    </p>
                  ) : (
                    teamMembers
                      .filter((m) => m.active)
                      .map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 rounded-lg border"
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderColor: 'var(--border-subtle)',
                          }}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{member.full_name}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                              {member.email}
                            </p>
                            <div className="flex gap-2 mt-2">
                              {member.role === 'admin' && (
                                <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }}>
                                  Admin
                                </span>
                              )}
                              {!member.active && (
                                <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(255, 107, 107, 0.2)', color: '#ff6b6b' }}>
                                  Inactive
                                </span>
                              )}
                            </div>
                          </div>
                          {member.role !== 'admin' && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="px-3 py-2 rounded text-xs transition-colors"
                              style={{
                                color: '#ff6b6b',
                              }}
                            >
                              <Trash2 size={16} />
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
          {currentSection === 'leads' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Lead Management</h1>
                <p style={{ color: 'var(--text-secondary)' }}>View and manage all leads</p>
              </div>

              <div className="glass-card p-6">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Lead management interface coming in Phase 2. View detailed lead information, reassign leads, and manage quality.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
