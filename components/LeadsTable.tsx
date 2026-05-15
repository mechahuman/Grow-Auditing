'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

function scoreColor(score: number | null): string {
  if (score == null) return 'bg-gray-100 text-gray-700'
  if (score >= 4.0) return 'bg-green-100 text-green-800'
  if (score >= 3.0) return 'bg-blue-100 text-blue-800'
  if (score >= 2.0) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

function scoreLabel(score: number | null): string {
  if (score == null) return '—'
  if (score >= 4.0) return 'Strong fit'
  if (score >= 3.0) return 'Solid fit'
  if (score >= 2.0) return 'Weak fit'
  return 'Poor fit'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString()
}

function formatSubs(count: number | null): string {
  if (count == null) return '—'
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return String(count)
}

export function LeadsTable({ leads, teamMembers, currentUserEmail }: LeadsTableProps) {
  const router = useRouter()

  // Filter state
  const [searchName, setSearchName] = useState('')
  const [subRange, setSubRange] = useState<'all' | 'under1k' | '1k-5k' | '5k-10k' | '10k-50k' | 'over50k'>('all')
  const [scoreRange, setScoreRange] = useState<'all' | 'strong' | 'solid' | 'weak' | 'poor'>('all')
  const [foundBy, setFoundBy] = useState('all')

  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Filtered leads
  const filteredLeads = useMemo(() => {
    let result = leads

    // Name search
    if (searchName) {
      const q = searchName.toLowerCase()
      result = result.filter((l) => l.lead_name.toLowerCase().includes(q))
    }

    // Subscriber range filter
    if (subRange !== 'all') {
      result = result.filter((l) => {
        const count = l.subscriber_count ?? 0
        if (subRange === 'under1k') return count < 1000
        if (subRange === '1k-5k') return count >= 1000 && count < 5000
        if (subRange === '5k-10k') return count >= 5000 && count < 10000
        if (subRange === '10k-50k') return count >= 10000 && count < 50000
        if (subRange === 'over50k') return count >= 50000
        return true
      })
    }

    // Score range filter
    if (scoreRange !== 'all') {
      result = result.filter((l) => {
        const score = l.lead_score_total ?? 0
        if (scoreRange === 'strong') return score >= 4.0
        if (scoreRange === 'solid') return score >= 3.0 && score < 4.0
        if (scoreRange === 'weak') return score >= 2.0 && score < 3.0
        if (scoreRange === 'poor') return score < 2.0
        return true
      })
    }

    // Found by filter
    if (foundBy !== 'all') {
      result = result.filter((l) => l.found_by === foundBy)
    }

    return result
  }, [leads, searchName, subRange, scoreRange, foundBy])

  const hasActiveFilters = searchName || subRange !== 'all' || scoreRange !== 'all' || foundBy !== 'all'

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      } else {
        alert('Failed to delete lead')
      }
    } catch {
      alert('Error deleting lead')
    } finally {
      setDeletingId(null)
    }
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-600">No leads saved yet</p>
        <Link
          href="/enrich"
          className="mt-4 inline-block text-sm text-blue-600 hover:underline"
        >
          Create your first lead →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search by name</label>
            <input
              type="text"
              placeholder="Lead name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {/* Subscriber range */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Subscribers</label>
            <select
              value={subRange}
              onChange={(e) => setSubRange(e.target.value as any)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="under1k">&lt; 1K</option>
              <option value="1k-5k">1K – 5K</option>
              <option value="5k-10k">5K – 10K</option>
              <option value="10k-50k">10K – 50K</option>
              <option value="over50k">50K+</option>
            </select>
          </div>

          {/* Score range */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Score</label>
            <select
              value={scoreRange}
              onChange={(e) => setScoreRange(e.target.value as any)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="strong">Strong fit (≥4.0)</option>
              <option value="solid">Solid fit (3.0–3.99)</option>
              <option value="weak">Weak fit (2.0–2.99)</option>
              <option value="poor">Poor fit (&lt;2.0)</option>
            </select>
          </div>

          {/* Found by */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Found by</label>
            <select
              value={foundBy}
              onChange={(e) => setFoundBy(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              {teamMembers.map((tm) => (
                <option key={tm.initials} value={tm.initials}>
                  {tm.initials} - {tm.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearchName('')
              setSubRange('all')
              setScoreRange('all')
              setFoundBy('all')
            }}
            className="mt-3 text-xs text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Lead Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Found By</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700">Subscribers</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Date Added</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{lead.lead_name}</p>
                  {lead.youtube_handle && (
                    <p className="text-xs text-gray-500">@{lead.youtube_handle}</p>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{lead.found_by}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-600">
                  {formatSubs(lead.subscriber_count)}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${scoreColor(lead.lead_score_total)}`}>
                    {lead.lead_score_total?.toFixed(1) || '—'} {scoreLabel(lead.lead_score_total)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 capitalize">{lead.status}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(lead.created_at)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Open
                    </Link>
                    <Link
                      href={`/leads/${lead.id}/edit`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm('Delete this lead?')) {
                          handleDelete(lead.id)
                        }
                      }}
                      disabled={deletingId === lead.id}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deletingId === lead.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLeads.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-600">
            No leads match your filters
          </div>
        )}
      </div>

      {leads.length > 0 && (
        <p className="text-xs text-gray-500 text-right">
          Showing {filteredLeads.length} of {leads.length} leads
        </p>
      )}
    </div>
  )
}
