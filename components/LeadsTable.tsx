'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, Users, Star, UserCheck, LayoutGrid, LayoutList,
  ExternalLink, Pencil, Trash2, ChevronDown, X, Play,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react'

interface Lead {
  id: string
  lead_name: string
  found_by: string
  subscriber_count: number | null
  lead_score_total: number | null
  status: string
  created_at: string
  youtube_handle: string | null
}

interface TeamMember {
  initials: string
  full_name: string
}

interface LeadsTableProps {
  leads: Lead[]
  teamMembers: TeamMember[]
  currentUserEmail: string
}

// ── Helpers ────────────────────────────────────────────────────
function getScoreMeta(score: number | null) {
  if (score == null) return { label: '—', badgeClass: 'badge badge-neutral', icon: null }
  if (score >= 4.0) return { label: 'Strong fit', badgeClass: 'badge badge-success', icon: <TrendingUp size={11} /> }
  if (score >= 3.0) return { label: 'Solid fit', badgeClass: 'badge', icon: <Minus size={11} />, style: { background: 'rgba(110,180,152,0.15)', color: '#6EB498', border: '1px solid rgba(110,180,152,0.3)' } }
  if (score >= 2.0) return { label: 'Weak fit', badgeClass: 'badge badge-warning', icon: <TrendingDown size={11} /> }
  return { label: 'Poor fit', badgeClass: 'badge badge-error', icon: <TrendingDown size={11} /> }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatSubs(count: number | null): string {
  if (count == null) return '—'
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return String(count)
}

// Avatar initials helper
function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

// ── ScoreBadge ─────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number | null }) {
  const meta = getScoreMeta(score)
  return (
    <span
      className={meta.badgeClass}
      // @ts-ignore – style override for "solid" tier
      style={(meta as any).style}
    >
      {meta.icon && <span className="mr-1">{meta.icon}</span>}
      {score != null ? `${score.toFixed(1)} · ` : ''}{meta.label}
    </span>
  )
}

// ── Main component ─────────────────────────────────────────────
export function LeadsTable({ leads, teamMembers, currentUserEmail }: LeadsTableProps) {
  const router = useRouter()

  const [view, setView] = useState<'table' | 'grid'>('table')
  const [searchName, setSearchName] = useState('')
  const [subRange, setSubRange] = useState<'all' | 'under1k' | '1k-5k' | '5k-10k' | '10k-50k' | 'over50k'>('all')
  const [scoreRange, setScoreRange] = useState<'all' | 'strong' | 'solid' | 'weak' | 'poor'>('all')
  const [foundBy, setFoundBy] = useState('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredLeads = useMemo(() => {
    let result = leads
    if (searchName) {
      const q = searchName.toLowerCase()
      result = result.filter((l) => l.lead_name.toLowerCase().includes(q))
    }
    if (subRange !== 'all') {
      result = result.filter((l) => {
        const c = l.subscriber_count ?? 0
        if (subRange === 'under1k') return c < 1000
        if (subRange === '1k-5k') return c >= 1000 && c < 5000
        if (subRange === '5k-10k') return c >= 5000 && c < 10000
        if (subRange === '10k-50k') return c >= 10000 && c < 50000
        if (subRange === 'over50k') return c >= 50000
        return true
      })
    }
    if (scoreRange !== 'all') {
      result = result.filter((l) => {
        const s = l.lead_score_total ?? 0
        if (scoreRange === 'strong') return s >= 4.0
        if (scoreRange === 'solid') return s >= 3.0 && s < 4.0
        if (scoreRange === 'weak') return s >= 2.0 && s < 3.0
        if (scoreRange === 'poor') return s < 2.0
        return true
      })
    }
    if (foundBy !== 'all') result = result.filter((l) => l.found_by === foundBy)
    return result
  }, [leads, searchName, subRange, scoreRange, foundBy])

  const hasActiveFilters = searchName || subRange !== 'all' || scoreRange !== 'all' || foundBy !== 'all'

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
      if (res.ok) router.refresh()
      else alert('Failed to delete lead')
    } catch {
      alert('Error deleting lead')
    } finally {
      setDeletingId(null)
    }
  }

  // ── Empty state ──────────────────────────────────────────────
  if (leads.length === 0) {
    return (
      <div className="glass-card p-16 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
             style={{ background: 'rgba(164,244,201,0.1)', border: '1px solid rgba(164,244,201,0.2)' }}>
          <Play size={26} style={{ color: 'var(--text-secondary)' }} />
        </div>
        <p className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No leads yet</p>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Enrich your first YouTube lead to get started</p>
        <Link href="/enrich" className="btn-primary inline-flex">
          + Enrich a Lead
        </Link>
      </div>
    )
  }

  // ── Select style (shared) ────────────────────────────────────
  const selStyle = {
    background: 'rgba(13,59,102,0.4)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: '0.625rem',
    padding: '0.5rem 0.875rem',
    fontSize: '0.8125rem',
    outline: 'none',
    cursor: 'pointer',
    minWidth: '120px',
  }

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="glass-card px-5 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              id="leads-search"
              placeholder="Search leads…"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="input-field pl-9 text-sm py-2"
            />
          </div>

          {/* Right-side controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Subscriber filter */}
            <div className="relative">
              <select
                id="filter-subscribers"
                value={subRange}
                onChange={(e) => setSubRange(e.target.value as any)}
                style={selStyle}
              >
                <option value="all" style={{ background: '#0D3B66' }}>All subs</option>
                <option value="under1k" style={{ background: '#0D3B66' }}>&lt; 1K</option>
                <option value="1k-5k" style={{ background: '#0D3B66' }}>1K – 5K</option>
                <option value="5k-10k" style={{ background: '#0D3B66' }}>5K – 10K</option>
                <option value="10k-50k" style={{ background: '#0D3B66' }}>10K – 50K</option>
                <option value="over50k" style={{ background: '#0D3B66' }}>50K+</option>
              </select>
            </div>

            {/* Score filter */}
            <div className="relative">
              <select
                id="filter-score"
                value={scoreRange}
                onChange={(e) => setScoreRange(e.target.value as any)}
                style={selStyle}
              >
                <option value="all" style={{ background: '#0D3B66' }}>All scores</option>
                <option value="strong" style={{ background: '#0D3B66' }}>Strong fit (≥4.0)</option>
                <option value="solid" style={{ background: '#0D3B66' }}>Solid fit (3–3.99)</option>
                <option value="weak" style={{ background: '#0D3B66' }}>Weak fit (2–2.99)</option>
                <option value="poor" style={{ background: '#0D3B66' }}>Poor fit (&lt;2)</option>
              </select>
            </div>

            {/* Found by filter */}
            <div className="relative">
              <select
                id="filter-found-by"
                value={foundBy}
                onChange={(e) => setFoundBy(e.target.value)}
                style={selStyle}
              >
                <option value="all" style={{ background: '#0D3B66' }}>All members</option>
                {teamMembers.map((tm) => (
                  <option key={tm.initials} value={tm.initials} style={{ background: '#0D3B66' }}>
                    {tm.initials} – {tm.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={() => { setSearchName(''); setSubRange('all'); setScoreRange('all'); setFoundBy('all') }}
                className="btn-ghost text-xs px-3 py-2 flex items-center gap-1"
                style={{ color: 'var(--error)', borderColor: 'rgba(255,107,107,0.3)' }}
              >
                <X size={13} /> Clear
              </button>
            )}

            {/* View toggle */}
            <div
              className="flex rounded-lg overflow-hidden"
              style={{ border: '1px solid var(--border)' }}
            >
              <button
                id="view-table"
                onClick={() => setView('table')}
                title="Table view"
                className="px-3 py-2 transition-all"
                style={{
                  background: view === 'table' ? 'linear-gradient(135deg, rgba(164,244,201,0.2), rgba(110,180,152,0.2))' : 'transparent',
                  color: view === 'table' ? 'var(--text-secondary)' : 'var(--text-muted)',
                }}
              >
                <LayoutList size={16} />
              </button>
              <button
                id="view-grid"
                onClick={() => setView('grid')}
                title="Grid view"
                className="px-3 py-2 transition-all"
                style={{
                  background: view === 'grid' ? 'linear-gradient(135deg, rgba(164,244,201,0.2), rgba(110,180,152,0.2))' : 'transparent',
                  color: view === 'grid' ? 'var(--text-secondary)' : 'var(--text-muted)',
                  borderLeft: '1px solid var(--border)',
                }}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Result count */}
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          Showing <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{filteredLeads.length}</span> of{' '}
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{leads.length}</span> leads
        </p>
      </div>

      {/* ── TABLE VIEW ─────────────────────────────────────────── */}
      {view === 'table' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(26,90,99,0.35)' }}>
                  {['Lead', 'Found By', 'Subscribers', 'Score', 'Status', 'Date Added', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, idx) => (
                  <tr
                    key={lead.id}
                    className="transition-colors group"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(13,59,102,0.2)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(26,90,99,0.3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(13,59,102,0.2)')}
                  >
                    {/* Lead name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold"
                          style={{
                            background: 'linear-gradient(135deg, rgba(164,244,201,0.2), rgba(110,180,152,0.2))',
                            border: '1px solid rgba(164,244,201,0.2)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {initials(lead.lead_name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {lead.lead_name}
                          </p>
                          {lead.youtube_handle && (
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{lead.youtube_handle}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Found by */}
                    <td className="px-5 py-4">
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(110,180,152,0.12)', color: 'var(--accent-secondary)', border: '1px solid rgba(110,180,152,0.2)' }}
                      >
                        {lead.found_by}
                      </span>
                    </td>

                    {/* Subscribers */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Users size={13} style={{ color: 'var(--text-muted)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {formatSubs(lead.subscriber_count)}
                        </span>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="px-5 py-4">
                      <ScoreBadge score={lead.lead_score_total} />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className="badge badge-neutral capitalize">{lead.status}</span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(lead.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/leads/${lead.id}`}
                          title="Open lead"
                          className="p-1.5 rounded-lg transition-all hover:scale-105"
                          style={{ background: 'rgba(164,244,201,0.1)', color: 'var(--text-secondary)', border: '1px solid rgba(164,244,201,0.15)' }}
                        >
                          <ExternalLink size={14} />
                        </Link>
                        <Link
                          href={`/leads/${lead.id}/edit`}
                          title="Edit lead"
                          className="p-1.5 rounded-lg transition-all hover:scale-105"
                          style={{ background: 'rgba(110,180,152,0.1)', color: '#6EB498', border: '1px solid rgba(110,180,152,0.15)' }}
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          title="Delete lead"
                          onClick={() => { if (confirm('Delete this lead?')) handleDelete(lead.id) }}
                          disabled={deletingId === lead.id}
                          className="p-1.5 rounded-lg transition-all hover:scale-105 disabled:opacity-40"
                          style={{ background: 'rgba(255,107,107,0.1)', color: 'var(--error)', border: '1px solid rgba(255,107,107,0.15)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredLeads.length === 0 && (
              <div className="py-16 text-center" style={{ color: 'var(--text-muted)' }}>
                <Search size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No leads match your filters</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── GRID VIEW ──────────────────────────────────────────── */}
      {view === 'grid' && (
        <>
          {filteredLeads.length === 0 ? (
            <div className="glass-card py-16 text-center" style={{ color: 'var(--text-muted)' }}>
              <Search size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No leads match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="glass-card p-5 flex flex-col gap-4 hover:scale-[1.01] transition-transform"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold"
                        style={{
                          background: 'linear-gradient(135deg, rgba(164,244,201,0.2), rgba(110,180,152,0.2))',
                          border: '1px solid rgba(164,244,201,0.25)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {initials(lead.lead_name)}
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                          {lead.lead_name}
                        </p>
                        {lead.youtube_handle && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{lead.youtube_handle}</p>
                        )}
                      </div>
                    </div>
                    <ScoreBadge score={lead.lead_score_total} />
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-3">
                    <div
                      className="flex-1 rounded-lg px-3 py-2 text-center"
                      style={{ background: 'rgba(13,59,102,0.4)', border: '1px solid var(--border)' }}
                    >
                      <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Subscribers</p>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        {formatSubs(lead.subscriber_count)}
                      </p>
                    </div>
                    <div
                      className="flex-1 rounded-lg px-3 py-2 text-center"
                      style={{ background: 'rgba(13,59,102,0.4)', border: '1px solid var(--border)' }}
                    >
                      <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Found By</p>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>{lead.found_by}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(lead.created_at)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/leads/${lead.id}`}
                        title="Open"
                        className="p-1.5 rounded-lg transition-all hover:scale-110"
                        style={{ background: 'rgba(164,244,201,0.1)', color: 'var(--text-secondary)', border: '1px solid rgba(164,244,201,0.15)' }}
                      >
                        <ExternalLink size={13} />
                      </Link>
                      <Link
                        href={`/leads/${lead.id}/edit`}
                        title="Edit"
                        className="p-1.5 rounded-lg transition-all hover:scale-110"
                        style={{ background: 'rgba(110,180,152,0.1)', color: '#6EB498', border: '1px solid rgba(110,180,152,0.15)' }}
                      >
                        <Pencil size={13} />
                      </Link>
                      <button
                        title="Delete"
                        onClick={() => { if (confirm('Delete this lead?')) handleDelete(lead.id) }}
                        disabled={deletingId === lead.id}
                        className="p-1.5 rounded-lg transition-all hover:scale-110 disabled:opacity-40"
                        style={{ background: 'rgba(255,107,107,0.1)', color: 'var(--error)', border: '1px solid rgba(255,107,107,0.15)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
