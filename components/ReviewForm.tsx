'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface Lead {
  id: string
  lead_name: string
  found_by: string
  youtube_url: string
  youtube_handle: string | null
  subscriber_count: number | null
  total_views: number | null
  video_count: number | null
  channel_created_at: string | null
  last_upload_at: string | null
  avg_views_last_10: number | null
  s2v_ratio_pct: number | null
  posting_frequency_30d: number | null
  email: string | null
  website: string | null
  category: string | null
  content_style: string | null
  posting_pattern: string | null
  monetization: string | null
  strengths: string[] | null
  concerns: string[] | null
  data_gaps: string[] | null
  remarks_ai_draft: string | null
  remarks_final: string | null
  g_factor: number
  yt_score_factor: number | null
  sub_range_factor: number | null
  s2v_factor: number | null
  lead_score_total: number | null
  ai_confidence: string | null
  status: string
  status_notes: string | null
  draft: boolean
  raw_youtube_data: { recentVideos?: RecentVideo[] } | null
}

interface RecentVideo {
  title: string
  publishedAt: string
  viewCount: number
}

interface TeamMember { initials: string; full_name: string }
interface StatusOption { value: string; label: string }

interface Props {
  lead: Lead
  teamMembers: TeamMember[]
  statusOptions: StatusOption[]
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high:   'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  low:    'bg-red-50 text-red-700 border-red-200',
}

const SCORE_COLORS: Record<string, string> = {
  green:  'text-green-700',
  blue:   'text-blue-700',
  yellow: 'text-yellow-700',
  red:    'text-red-700',
}

const SCORE_BG: Record<string, string> = {
  green:  'bg-green-50 border-green-200',
  blue:   'bg-blue-50 border-blue-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  red:    'bg-red-50 border-red-200',
}

function computeScore(yt: number, sub: number, s2v: number, g: number) {
  const gNorm = parseFloat(((g - 1) / 4).toFixed(2))
  const total = parseFloat((1 + yt + sub + s2v + gNorm).toFixed(2))
  return { gNorm, total }
}

function getLabel(score: number): { label: string; color: string } {
  if (score >= 4.0) return { label: 'Strong fit', color: 'green' }
  if (score >= 3.0) return { label: 'Solid fit', color: 'blue' }
  if (score >= 2.0) return { label: 'Weak fit', color: 'yellow' }
  return { label: 'Poor fit', color: 'red' }
}

function fmt(n: number | null | undefined, decimals = 0): string {
  if (n == null) return '—'
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals })
}

function daysAgo(iso: string | null): string {
  if (!iso) return '—'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function monthsAgo(iso: string | null): string {
  if (!iso) return '—'
  const months = Math.floor((Date.now() - new Date(iso).getTime()) / (86_400_000 * 30.44))
  if (months < 1) return '<1 month'
  return `${months} month${months > 1 ? 's' : ''}`
}

export function ReviewForm({ lead, teamMembers, statusOptions }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)
  const [showAIDraft, setShowAIDraft] = useState(false)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const [gFactor, setGFactor] = useState(lead.g_factor)
  const [fields, setFields] = useState({
    lead_name:      lead.lead_name,
    found_by:       lead.found_by,
    email:          lead.email ?? '',
    website:        lead.website ?? '',
    category:       lead.category ?? '',
    content_style:  lead.content_style ?? '',
    monetization:   lead.monetization ?? '',
    posting_pattern: lead.posting_pattern ?? '',
    remarks_final:  lead.remarks_final ?? '',
    status:         lead.status,
    status_notes:   lead.status_notes ?? '',
  })

  const ytFactor  = lead.yt_score_factor  ?? 1
  const subFactor = lead.sub_range_factor ?? 0
  const s2vFactor = lead.s2v_factor       ?? 0

  const { gNorm, total } = useMemo(
    () => computeScore(ytFactor, subFactor, s2vFactor, gFactor),
    [ytFactor, subFactor, s2vFactor, gFactor]
  )
  const { label: scoreLabel, color: scoreColor } = getLabel(total)

  const recentVideos = lead.raw_youtube_data?.recentVideos?.slice(0, 5) ?? []

  function set(name: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setFields((f) => ({ ...f, [name]: e.target.value }))
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: lead.id, g_factor: String(gFactor), ...fields }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) {
      showToast(`Error: ${data.error}`)
    } else {
      showToast('Lead saved!')
      setTimeout(() => router.push(`/leads/${lead.id}`), 1000)
    }
  }

  async function handleDiscard() {
    setDiscarding(true)
    await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
    router.push('/leads')
  }

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* Score info modal */}
      {showScoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowScoreModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-3">How the score works</h3>
            <p className="text-sm text-gray-600 mb-3">Score = 1 + (YT + Sub Range + S2V + G-Factor normalized)</p>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li><strong>YT Factor:</strong> 1 if channel exists, 0 if not</li>
              <li><strong>Sub Range:</strong> 0 (&lt;1k) · 0.5 (1k–4.9k) · 1 (5k+)</li>
              <li><strong>S2V:</strong> 1 if avg views / subs ≥ 10%, else 0</li>
              <li><strong>G-Factor:</strong> (G − 1) / 4 → maps 1–5 to 0–1</li>
            </ul>
            <p className="text-xs text-gray-400 mt-4">Range: 1.0 (min) — 5.0 (max)</p>
            <button onClick={() => setShowScoreModal(false)} className="mt-4 text-sm text-gray-900 font-medium hover:underline">Close</button>
          </div>
        </div>
      )}

      {/* Discard modal */}
      {showDiscard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Discard this lead?</h3>
            <p className="text-sm text-gray-600 mb-5">This will permanently delete the enrichment. You'll need to re-enrich this channel if you want it back.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDiscard(false)}
                className="flex-1 border border-gray-300 rounded-md py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDiscard}
                disabled={discarding}
                className="flex-1 bg-red-600 text-white rounded-md py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {discarding ? 'Discarding…' : 'Yes, discard'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{lead.lead_name}</h1>
          <a href={lead.youtube_url} target="_blank" rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline">
            {lead.youtube_handle ?? lead.youtube_url}
          </a>
        </div>
        <div className="flex gap-3">
          {lead.draft && (
            <button
              onClick={() => setShowDiscard(true)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Discard
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Lead'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — Read-only channel context */}
        <div className="space-y-4">
          {/* Channel stats */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Channel Stats</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-500">Subscribers</dt>
              <dd className="font-medium">{fmt(lead.subscriber_count)}</dd>
              <dt className="text-gray-500">Total views</dt>
              <dd className="font-medium">{fmt(lead.total_views)}</dd>
              <dt className="text-gray-500">Videos</dt>
              <dd className="font-medium">{fmt(lead.video_count)}</dd>
              <dt className="text-gray-500">Channel age</dt>
              <dd className="font-medium">{monthsAgo(lead.channel_created_at)}</dd>
              <dt className="text-gray-500">Last upload</dt>
              <dd className="font-medium">{daysAgo(lead.last_upload_at)}</dd>
              <dt className="text-gray-500">Avg views (last 10)</dt>
              <dd className="font-medium">{fmt(lead.avg_views_last_10)}</dd>
              <dt className="text-gray-500">S2V ratio</dt>
              <dd className="font-medium">{lead.s2v_ratio_pct != null ? `${lead.s2v_ratio_pct}%` : '—'}</dd>
              <dt className="text-gray-500">Posts (30d)</dt>
              <dd className="font-medium">{lead.posting_frequency_30d ?? '—'}</dd>
            </dl>
          </div>

          {/* Recent videos */}
          {recentVideos.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Recent Videos</h2>
              <ul className="space-y-2">
                {recentVideos.map((v, i) => (
                  <li key={i} className="text-sm flex justify-between gap-4">
                    <span className="text-gray-800 truncate">{v.title}</span>
                    <span className="text-gray-500 shrink-0">{fmt(v.viewCount)} views</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI observations */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">AI Observations</h2>
            <dl className="text-sm space-y-2 mb-4">
              <div className="flex gap-2">
                <dt className="text-gray-500 w-28 shrink-0">Category</dt>
                <dd className="text-gray-900">{lead.category ?? '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-500 w-28 shrink-0">Content style</dt>
                <dd className="text-gray-900">{lead.content_style ?? '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-500 w-28 shrink-0">Monetization</dt>
                <dd className="text-gray-900">{lead.monetization ?? '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-500 w-28 shrink-0">Posting</dt>
                <dd className="text-gray-900">{lead.posting_pattern ?? '—'}</dd>
              </div>
            </dl>

            {(lead.strengths ?? []).length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Strengths</p>
                <ul className="space-y-1">
                  {(lead.strengths ?? []).map((s, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-1.5">
                      <span className="text-green-600 shrink-0">+</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(lead.concerns ?? []).length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Concerns</p>
                <ul className="space-y-1">
                  {(lead.concerns ?? []).map((c, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-1.5">
                      <span className="text-red-500 shrink-0">−</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* AI confidence + data gaps */}
          {(lead.ai_confidence || (lead.data_gaps ?? []).length > 0) && (
            <div className={`border rounded-lg p-4 text-sm ${CONFIDENCE_COLORS[lead.ai_confidence ?? 'low']}`}>
              <p className="font-medium mb-1">
                AI confidence: {lead.ai_confidence ?? 'unknown'}
              </p>
              {(lead.data_gaps ?? []).length > 0 && (
                <ul className="space-y-0.5 mt-2">
                  {(lead.data_gaps ?? []).map((d, i) => (
                    <li key={i} className="opacity-80">? {d}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — Editable fields */}
        <div className="space-y-4">
          {/* Live score */}
          <div className={`border rounded-lg p-5 ${SCORE_BG[scoreColor]}`}>
            <div className="flex items-baseline justify-between mb-1">
              <span className={`text-3xl font-bold ${SCORE_COLORS[scoreColor]}`}>{total.toFixed(2)}</span>
              <span className={`text-sm font-semibold ${SCORE_COLORS[scoreColor]}`}>{scoreLabel}</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Score = 1 + (YT + Sub Range + S2V + G-norm) ·{' '}
              <button onClick={() => setShowScoreModal(true)} className="underline hover:no-underline">What is this?</button>
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
              <span>YT Factor</span>      <span className="font-medium">{ytFactor.toFixed(1)}</span>
              <span>Sub Range Factor</span><span className="font-medium">{subFactor.toFixed(1)}</span>
              <span>S2V Factor</span>      <span className="font-medium">{s2vFactor.toFixed(1)}</span>
              <span>G-Factor ({gFactor}/5)</span><span className="font-medium">{gNorm.toFixed(2)} normalized</span>
            </div>
          </div>

          {/* G-Factor selector */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              G-Factor <span className="font-normal text-gray-500">(gut feeling: 1–5)</span>
            </label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setGFactor(n)}
                  className={`flex-1 py-2.5 rounded-md border text-sm font-medium transition-colors ${
                    gFactor === n
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Editable fields */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Edit Fields</h2>

            {[
              { key: 'lead_name', label: 'Lead Name' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  value={fields[key as keyof typeof fields]}
                  onChange={set(key as keyof typeof fields)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Found By</label>
              <select
                value={fields.found_by}
                onChange={set('found_by')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                {teamMembers.map((m) => (
                  <option key={m.initials} value={m.initials}>{m.full_name} ({m.initials})</option>
                ))}
              </select>
            </div>

            {([
              ['email', 'Email'],
              ['website', 'Website'],
              ['category', 'Category'],
              ['content_style', 'Content Style'],
              ['monetization', 'Monetization'],
              ['posting_pattern', 'Posting Pattern'],
            ] as [keyof typeof fields, string][]).map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  value={fields[key]}
                  onChange={set(key)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={fields.status}
                onChange={set('status')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status Notes</label>
              <input
                value={fields.status_notes}
                onChange={set('status_notes')}
                placeholder="Optional"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Remarks (Final)
            </label>
            <textarea
              value={fields.remarks_final}
              onChange={set('remarks_final')}
              rows={5}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y"
            />

            {lead.remarks_ai_draft && (
              <div className="mt-3">
                <button
                  onClick={() => setShowAIDraft((v) => !v)}
                  className="text-xs text-gray-500 hover:text-gray-900 underline"
                >
                  {showAIDraft ? 'Hide' : 'Show'} original AI draft
                </button>
                {showAIDraft && (
                  <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-3 border border-gray-200 italic">
                    {lead.remarks_ai_draft}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gray-900 text-white rounded-md py-3 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Lead →'}
          </button>
        </div>
      </div>
    </div>
  )
}
