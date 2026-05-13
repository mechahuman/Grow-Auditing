'use client'

import { useState } from 'react'
import Link from 'next/link'

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

const SCORE_BADGE: Record<string, string> = {
  green:  'bg-green-100 text-green-800',
  blue:   'bg-blue-100 text-blue-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red:    'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  new:          'New',
  mail_sent:    'Mail sent',
  followed_up:  'Followed up',
  replied:      'Replied',
  call_booked:  'Call booked',
  closed_won:   'Closed — onboarded',
  closed_lost:  'Closed — passed',
}

function scoreColor(score: number | null): string {
  if (score == null) return 'red'
  if (score >= 4.0) return 'green'
  if (score >= 3.0) return 'blue'
  if (score >= 2.0) return 'yellow'
  return 'red'
}

function scoreLabel(score: number | null): string {
  if (score == null) return '—'
  if (score >= 4.0) return `${score.toFixed(1)} Strong fit`
  if (score >= 3.0) return `${score.toFixed(1)} Solid fit`
  if (score >= 2.0) return `${score.toFixed(1)} Weak fit`
  return `${score.toFixed(1)} Poor fit`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function formatSubs(n: number | null): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

const FILTERS = [
  { id: 'all',    label: 'All' },
  { id: 'strong', label: 'Strong fit (4+)' },
  { id: 'solid',  label: 'Solid fit (3+)' },
  { id: 'mine',   label: 'Mine' },
]

export function LeadsTable({ leads, currentUserEmail }: { leads: Lead[]; currentUserEmail: string }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const visible = leads.filter((l) => {
    if (search && !l.lead_name.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'strong' && (l.lead_score_total ?? 0) < 4.0) return false
    if (filter === 'solid'  && (l.lead_score_total ?? 0) < 3.0) return false
    if (filter === 'mine'   && l.found_by !== currentUserEmail) return false
    return true
  })

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search leads…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto w-52 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {visible.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-sm">No leads found.</p>
          <Link
            href="/enrich"
            className="mt-4 inline-block bg-gray-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-800"
          >
            Create your first lead
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Lead Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Found By</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Subscribers</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {visible.map((lead, i) => {
                const color = scoreColor(lead.lead_score_total)
                return (
                  <tr key={lead.id} className={`border-b border-gray-100 hover:bg-gray-50 ${i === visible.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {lead.lead_name}
                      {lead.youtube_handle && (
                        <span className="ml-1.5 text-xs text-gray-400">{lead.youtube_handle}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.found_by}</td>
                    <td className="px-4 py-3 text-gray-600">{formatSubs(lead.subscriber_count)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SCORE_BADGE[color]}`}>
                        {scoreLabel(lead.lead_score_total)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {STATUS_LABELS[lead.status] ?? lead.status}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(lead.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/leads/${lead.id}/review`}
                        className="text-sm font-medium text-gray-900 hover:underline"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
