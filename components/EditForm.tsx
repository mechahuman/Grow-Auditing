'use client'

import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import { Avatar } from './Avatar'

interface EditFormProps {
  lead: any
  teamMembers: { initials: string; full_name: string }[]
  statusOptions: { value: string; label: string }[]
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function EditForm({ lead, teamMembers, statusOptions }: EditFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [copiedEmail, setCopiedEmail] = useState(false)

  // Form state
  const [leadName, setLeadName] = useState(lead.lead_name || '')
  const [foundBy, setFoundBy] = useState(lead.found_by || '')
  const [email, setEmail] = useState(lead.email || '')
  const [website, setWebsite] = useState(lead.website || '')
  const [instagram, setInstagram] = useState(lead.instagram || '')
  const [twitter, setTwitter] = useState(lead.twitter || '')
  const [category, setCategory] = useState(lead.category || '')
  const [contentStyle, setContentStyle] = useState(lead.content_style || '')
  const [monetization, setMonetization] = useState(lead.monetization || '')
  const [postingPattern, setPostingPattern] = useState(lead.posting_pattern || '')
  const [remarksFinal, setRemarksFinal] = useState(lead.remarks_final || '')
  const [outreachEmailDraft, setOutreachEmailDraft] = useState(lead.outreach_email_draft || '')
  const [status, setStatus] = useState(lead.status || 'new')
  const [statusNotes, setStatusNotes] = useState(lead.status_notes || '')
  const [gFactor, setGFactor] = useState<number>(lead.g_factor || 3)

  // Live score calculation
  const score = useMemo(() => {
    const gNorm = (gFactor - 1) / 4
    const total =
      1 +
      (lead.yt_score_factor || 0) +
      (lead.sub_range_factor || 0) +
      (lead.s2v_factor || 0) +
      gNorm
    return { gNorm, total }
  }, [gFactor, lead.yt_score_factor, lead.sub_range_factor, lead.s2v_factor])

  const scoreColor =
    score.total >= 4.0
      ? 'bg-green-100 text-green-800'
      : score.total >= 3.0
      ? 'bg-blue-100 text-blue-800'
      : score.total >= 2.0
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-red-100 text-red-800'

  const scoreLabel =
    score.total >= 4.0
      ? 'Strong fit'
      : score.total >= 3.0
      ? 'Solid fit'
      : score.total >= 2.0
      ? 'Weak fit'
      : 'Poor fit'

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setToast({ message: 'Copied!', type: 'success' })
    setTimeout(() => setToast(null), 2000)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          g_factor: gFactor.toString(),
          lead_name: leadName,
          found_by: foundBy,
          email: email || null,
          website: website || null,
          instagram: instagram || null,
          twitter: twitter || null,
          category,
          content_style: contentStyle,
          monetization,
          posting_pattern: postingPattern,
          remarks_final: remarksFinal,
          outreach_email_draft: outreachEmailDraft || null,
          status,
          status_notes: statusNotes || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update lead')
      }

      setToast({ message: 'Lead updated successfully', type: 'success' })
      setTimeout(() => {
        router.push(`/leads/${lead.id}`)
      }, 500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      setToast({ message: msg, type: 'error' })
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-4">
          <Avatar
            thumbnailUrl={lead.channel_thumbnail_url || null}
            initials={getInitials(lead.lead_name)}
            name={lead.lead_name}
            size="xl"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Lead</h1>
            <p className="text-gray-600">{lead.lead_name}</p>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`mb-4 rounded-lg p-4 ${
              toast.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {toast.message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Editable Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lead Name
                  </label>
                  <input
                    type="text"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Found By
                    </label>
                    <select
                      value={foundBy}
                      onChange={(e) => setFoundBy(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="">Select team member</option>
                      {teamMembers.map((tm) => (
                        <option key={tm.initials} value={tm.initials}>
                          {tm.initials} - {tm.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                    />
                    {email && (
                      <button
                        onClick={() => copyToClipboard(email)}
                        className="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                    />
                    {website && (
                      <button
                        onClick={() => copyToClipboard(website)}
                        className="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                    />
                    {instagram && (
                      <button
                        onClick={() => copyToClipboard(instagram)}
                        className="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                    />
                    {twitter && (
                      <button
                        onClick={() => copyToClipboard(twitter)}
                        className="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Classifications */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Classifications</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content Style
                    </label>
                    <input
                      type="text"
                      value={contentStyle}
                      onChange={(e) => setContentStyle(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monetization
                    </label>
                    <input
                      type="text"
                      value={monetization}
                      onChange={(e) => setMonetization(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Posting Pattern
                    </label>
                    <input
                      type="text"
                      value={postingPattern}
                      onChange={(e) => setPostingPattern(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Remarks & Status */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Remarks & Status</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Final Remarks
                  </label>
                  <textarea
                    value={remarksFinal}
                    onChange={(e) => setRemarksFinal(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📧 Outreach Email Draft
                  </label>
                  <textarea
                    value={outreachEmailDraft}
                    onChange={(e) => setOutreachEmailDraft(e.target.value)}
                    rows={6}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
                    placeholder="AI-generated email draft — edit as needed before sending"
                  />
                  {outreachEmailDraft && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(outreachEmailDraft)
                        setCopiedEmail(true)
                        setTimeout(() => setCopiedEmail(false), 2000)
                      }}
                      className="mt-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors"
                      style={copiedEmail
                        ? { borderColor: '#86efac', color: '#16a34a', background: '#f0fdf4' }
                        : { borderColor: '#d1d5db', color: '#374151', background: 'white' }
                      }
                    >
                      {copiedEmail ? 'Copied!' : 'Copy Email'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status Notes
                    </label>
                    <input
                      type="text"
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Score & G-Factor */}
          <div className="space-y-6">
            {/* Score Card */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-sm text-gray-600 mb-3">Lead Score</h3>
              <div className={`inline-block rounded-lg px-3 py-1 ${scoreColor}`}>
                <p className="text-2xl font-bold">{score.total.toFixed(1)}</p>
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
                  <span className="font-medium">{gFactor}/5</span>
                </div>
              </div>
            </div>

            {/* G-Factor Selector */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">G-Factor Rating</h3>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <label key={val} className="flex items-center">
                    <input
                      type="radio"
                      name="g-factor"
                      value={val}
                      checked={gFactor === val}
                      onChange={(e) => setGFactor(parseInt(e.target.value))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      {val === 1
                        ? 'Poor fit'
                        : val === 2
                        ? 'Weak'
                        : val === 3
                        ? 'Solid'
                        : val === 4
                        ? 'Strong'
                        : 'Excellent'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => router.push(`/leads/${lead.id}`)}
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
