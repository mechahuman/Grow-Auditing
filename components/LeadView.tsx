'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

interface LeadViewProps {
  lead: any
  statusLabel: string
}

export function LeadView({ lead, statusLabel }: LeadViewProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/leads')
      } else {
        alert('Failed to delete lead')
        setDeleting(false)
      }
    } catch (err) {
      alert('Error deleting lead')
      setDeleting(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setToast('Copied!')
    setTimeout(() => setToast(null), 2000)
  }

  const recentVideos = lead.raw_youtube_data?.recentVideos || []
  const topVideos = recentVideos.slice(0, 5)

  // Score formatting
  const score = lead.lead_score_total
  const scoreColor =
    score >= 4.0 ? 'bg-green-100 text-green-800' :
    score >= 3.0 ? 'bg-blue-100 text-blue-800' :
    score >= 2.0 ? 'bg-yellow-100 text-yellow-800' :
    'bg-red-100 text-red-800'

  const scoreLabel =
    score >= 4.0 ? 'Strong fit' :
    score >= 3.0 ? 'Solid fit' :
    score >= 2.0 ? 'Weak fit' :
    'Poor fit'

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{lead.lead_name}</h1>
            <p className="text-sm text-gray-600">
              Found by {lead.found_by} · {lead.youtube_handle}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/leads/${lead.id}/edit`}
              className="inline-block rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800"
            >
              Edit Lead
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-red-700 hover:bg-red-100"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4">
            <p className="text-sm text-red-800">
              Are you sure you want to delete this lead? This action cannot be undone.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleDelete}
                className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded bg-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-400"
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: YouTube Data & AI */}
          <div className="lg:col-span-2 space-y-6">
            {/* YouTube Stats */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">YouTube Channel</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Subscribers</p>
                  <p className="text-xl font-bold text-gray-900">
                    {lead.subscriber_count ? lead.subscriber_count.toLocaleString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Videos</p>
                  <p className="text-xl font-bold text-gray-900">
                    {lead.video_count || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Views (Last 10)</p>
                  <p className="text-xl font-bold text-gray-900">
                    {lead.avg_views_last_10 ? lead.avg_views_last_10.toLocaleString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">S2V Ratio</p>
                  <p className="text-xl font-bold text-gray-900">
                    {lead.s2v_ratio_pct ? `${lead.s2v_ratio_pct.toFixed(1)}%` : '—'}
                  </p>
                </div>
              </div>
              <a
                href={lead.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm text-blue-600 hover:underline"
              >
                View on YouTube →
              </a>
            </div>

            {/* Recent Videos */}
            {topVideos.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Videos</h3>
                <div className="space-y-3">
                  {topVideos.map((video: any, i: number) => (
                    <div key={i} className="flex gap-3 py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{video.title}</p>
                        <p className="text-xs text-gray-600">
                          {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {video.viewCount ? (video.viewCount / 1000).toFixed(0) + 'K views' : '—'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis */}
            {lead.category && (
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h3>
                <div className="space-y-3">
                  {lead.category && (
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="text-sm font-medium text-gray-900">{lead.category}</p>
                    </div>
                  )}
                  {lead.content_style && (
                    <div>
                      <p className="text-sm text-gray-600">Content Style</p>
                      <p className="text-sm font-medium text-gray-900">{lead.content_style}</p>
                    </div>
                  )}
                  {lead.monetization && (
                    <div>
                      <p className="text-sm text-gray-600">Monetization</p>
                      <p className="text-sm font-medium text-gray-900">{lead.monetization}</p>
                    </div>
                  )}
                  {lead.posting_pattern && (
                    <div>
                      <p className="text-sm text-gray-600">Posting Pattern</p>
                      <p className="text-sm font-medium text-gray-900">{lead.posting_pattern}</p>
                    </div>
                  )}
                  {lead.strengths && lead.strengths.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600">Strengths</p>
                      <ul className="text-sm space-y-1">
                        {lead.strengths.map((s: string, i: number) => (
                          <li key={i} className="text-green-700">+ {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {lead.concerns && lead.concerns.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600">Concerns</p>
                      <ul className="text-sm space-y-1">
                        {lead.concerns.map((c: string, i: number) => (
                          <li key={i} className="text-red-700">- {c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {lead.data_gaps && lead.data_gaps.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600">Data Gaps</p>
                      <ul className="text-sm space-y-1">
                        {lead.data_gaps.map((g: string, i: number) => (
                          <li key={i} className="text-gray-700">? {g}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {lead.ai_confidence && (
                    <div className="mt-2 rounded bg-blue-50 p-2">
                      <p className="text-xs text-blue-800">
                        AI Confidence: <span className="font-medium capitalize">{lead.ai_confidence}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Score & Details */}
          <div className="space-y-6">
            {/* Score Card */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-sm text-gray-600 mb-3">Lead Score</h3>
              <div className={`inline-block rounded-lg px-3 py-1 ${scoreColor}`}>
                <p className="text-2xl font-bold">{score.toFixed(1)}</p>
                <p className="text-xs font-medium">{scoreLabel}</p>
              </div>

              <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">YT Factor</span>
                  <span className="font-medium">{lead.yt_score_factor?.toFixed(2) || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sub Range</span>
                  <span className="font-medium">{lead.sub_range_factor?.toFixed(2) || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">S2V Ratio</span>
                  <span className="font-medium">{lead.s2v_factor?.toFixed(2) || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">G-Factor</span>
                  <span className="font-medium">{lead.g_factor}/5</span>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Details</h3>
              <div className="space-y-3">
                {lead.email && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Email</p>
                    <div className="flex items-center justify-between gap-2">
                      <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 hover:underline truncate">
                        {lead.email}
                      </a>
                      <button
                        onClick={() => copyToClipboard(lead.email)}
                        className="px-2 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
                {lead.website && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Website</p>
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate"
                      >
                        {lead.website}
                      </a>
                      <button
                        onClick={() => copyToClipboard(lead.website)}
                        className="px-2 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
                {lead.instagram && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Instagram</p>
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={lead.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate"
                      >
                        {lead.instagram}
                      </a>
                      <button
                        onClick={() => copyToClipboard(lead.instagram)}
                        className="px-2 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
                {lead.twitter && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Twitter</p>
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={lead.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate"
                      >
                        {lead.twitter}
                      </a>
                      <button
                        onClick={() => copyToClipboard(lead.twitter)}
                        className="px-2 py-1 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-sm text-gray-600 mb-3">Status</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">{statusLabel}</p>
                </div>
                {lead.status_notes && (
                  <div>
                    <p className="text-xs text-gray-600">Notes</p>
                    <p className="text-sm text-gray-700">{lead.status_notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Remarks */}
            {lead.remarks_final && (
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h3 className="text-sm text-gray-600 mb-3">Final Remarks</h3>
                <p className="text-sm text-gray-700">{lead.remarks_final}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
