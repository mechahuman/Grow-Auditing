'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Youtube, Users, Eye, Video, Clock, BarChart2, Mail, Globe, Instagram, Twitter, Info, ChevronDown, ChevronUp, Trash2, Save, Loader2, Star } from 'lucide-react'

interface Lead {
  id: string; lead_name: string; found_by: string; youtube_url: string; youtube_handle: string | null
  subscriber_count: number | null; total_views: number | null; video_count: number | null
  channel_created_at: string | null; last_upload_at: string | null; avg_views_last_10: number | null
  s2v_ratio_pct: number | null; posting_frequency_30d: number | null
  email: string | null; website: string | null; instagram: string | null; twitter: string | null
  category: string | null; content_style: string | null; posting_pattern: string | null; monetization: string | null
  strengths: string[] | null; concerns: string[] | null; data_gaps: string[] | null
  remarks_ai_draft: string | null; remarks_final: string | null
  g_factor: number; yt_score_factor: number | null; sub_range_factor: number | null; s2v_factor: number | null
  lead_score_total: number | null; ai_confidence: string | null; status: string; status_notes: string | null
  draft: boolean; raw_youtube_data: { recentVideos?: { title: string; publishedAt: string; viewCount: number }[] } | null
}
interface TeamMember { initials: string; full_name: string }
interface StatusOption { value: string; label: string }
interface Props { lead: Lead; teamMembers: TeamMember[]; statusOptions: StatusOption[] }

function computeScore(yt: number, sub: number, s2v: number, g: number) {
  const gNorm = parseFloat(((g - 1) / 4).toFixed(2))
  return { gNorm, total: parseFloat((1 + yt + sub + s2v + gNorm).toFixed(2)) }
}
function getLabel(score: number) {
  if (score >= 4.0) return { label: 'Strong fit', color: '#A4F4C9' }
  if (score >= 3.0) return { label: 'Solid fit', color: '#6EB498' }
  if (score >= 2.0) return { label: 'Weak fit', color: '#FFB347' }
  return { label: 'Poor fit', color: '#FF6B6B' }
}
function fmt(n: number | null | undefined, d = 0) {
  if (n == null) return '—'
  return n.toLocaleString('en-US', { maximumFractionDigits: d })
}
function daysAgo(iso: string | null) {
  if (!iso) return '—'
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  return d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d}d ago`
}
function monthsAgo(iso: string | null) {
  if (!iso) return '—'
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / (86_400_000 * 30.44))
  return m < 1 ? '<1 month' : `${m} month${m > 1 ? 's' : ''}`
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-secondary)' }}>
      {children}
    </h2>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  function handle() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button onClick={handle} title="Copy" className="p-1.5 rounded-lg transition-all hover:scale-110 flex-shrink-0"
      style={{ background: copied ? 'rgba(164,244,201,0.2)' : 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: copied ? '#A4F4C9' : 'var(--text-muted)' }}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  )
}

export function ReviewForm({ lead, teamMembers, statusOptions }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)
  const [showAIDraft, setShowAIDraft] = useState(false)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [gFactor, setGFactor] = useState(lead.g_factor)
  const [fields, setFields] = useState({
    lead_name: lead.lead_name, found_by: lead.found_by,
    email: lead.email ?? '', website: lead.website ?? '',
    instagram: lead.instagram ?? '', twitter: lead.twitter ?? '',
    category: lead.category ?? '', content_style: lead.content_style ?? '',
    monetization: lead.monetization ?? '', posting_pattern: lead.posting_pattern ?? '',
    remarks_final: lead.remarks_final ?? '', status: lead.status, status_notes: lead.status_notes ?? '',
  })

  const ytFactor = lead.yt_score_factor ?? 1
  const subFactor = lead.sub_range_factor ?? 0
  const s2vFactor = lead.s2v_factor ?? 0
  const { gNorm, total } = useMemo(() => computeScore(ytFactor, subFactor, s2vFactor, gFactor), [ytFactor, subFactor, s2vFactor, gFactor])
  const { label: scoreLabel, color: scoreColor } = getLabel(total)
  const recentVideos = lead.raw_youtube_data?.recentVideos?.slice(0, 5) ?? []

  function set(name: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setFields(f => ({ ...f, [name]: e.target.value }))
  }
  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }
  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lead_id: lead.id, g_factor: String(gFactor), ...fields }) })
    const data = await res.json()
    setSaving(false)
    if (data.error) { showToast(`Error: ${data.error}`, false) }
    else { showToast('Lead saved!'); setTimeout(() => router.push(`/leads/${lead.id}`), 1000) }
  }
  async function handleDiscard() {
    setDiscarding(true)
    await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
    router.push('/leads')
  }

  const inputCls = 'input-field text-sm'
  const labelCls = 'block text-xs font-semibold uppercase tracking-wider mb-1.5'

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all"
          style={{ background: toast.ok ? 'rgba(164,244,201,0.15)' : 'rgba(255,107,107,0.15)', border: `1px solid ${toast.ok ? 'rgba(164,244,201,0.4)' : 'rgba(255,107,107,0.4)'}`, color: toast.ok ? '#A4F4C9' : '#FF6B6B', backdropFilter: 'blur(12px)' }}>
          {toast.ok ? <Check size={15} /> : null}{toast.msg}
        </div>
      )}

      {/* Score info modal */}
      {showScoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowScoreModal(false)}>
          <div className="glass-card p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-3 text-gradient">How the Score Works</h3>
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Score = 1 + (YT + Sub Range + S2V + G-Factor normalized)</p>
            <ul className="text-sm space-y-2" style={{ color: 'var(--text-primary)' }}>
              <li><span style={{ color: 'var(--text-secondary)' }}>YT Factor:</span> 1 if channel exists, 0 if not</li>
              <li><span style={{ color: 'var(--text-secondary)' }}>Sub Range:</span> 0 (&lt;1k) · 0.5 (1k–4.9k) · 1 (5k+)</li>
              <li><span style={{ color: 'var(--text-secondary)' }}>S2V:</span> 1 if avg views / subs ≥ 10%, else 0</li>
              <li><span style={{ color: 'var(--text-secondary)' }}>G-Factor:</span> (G − 1) / 4 → maps 1–5 to 0–1</li>
            </ul>
            <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>Range: 1.0 (min) — 5.0 (max)</p>
            <button onClick={() => setShowScoreModal(false)} className="btn-ghost w-full mt-4 text-sm">Close</button>
          </div>
        </div>
      )}

      {/* Discard modal */}
      {showDiscard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card p-6 max-w-sm w-full mx-4">
            <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Discard this lead?</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>This will permanently delete the enrichment. You'll need to re-enrich this channel if you want it back.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDiscard(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleDiscard} disabled={discarding} className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)', color: '#FF6B6B' }}>
                {discarding ? 'Discarding…' : 'Yes, discard'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gradient mb-0.5">{lead.lead_name}</h1>
          <a href={lead.youtube_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}>
            <Youtube size={14} /> {lead.youtube_handle ?? lead.youtube_url}
          </a>
        </div>
        <div className="flex gap-2 flex-wrap">
          {lead.draft && (
            <button onClick={() => setShowDiscard(true)} className="btn-ghost flex items-center gap-1.5 text-sm"
              style={{ color: '#FF6B6B', borderColor: 'rgba(255,107,107,0.3)' }}>
              <Trash2 size={14} /> Discard
            </button>
          )}
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-1.5">
            {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : <><Save size={14} />Save Lead</>}
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-5">

          {/* Channel stats */}
          <div className="glass-card p-5">
            <SectionTitle>Channel Stats</SectionTitle>
            <StatRow label="Subscribers" value={fmt(lead.subscriber_count)} />
            <StatRow label="Total views" value={fmt(lead.total_views)} />
            <StatRow label="Videos" value={fmt(lead.video_count)} />
            <StatRow label="Channel age" value={monthsAgo(lead.channel_created_at)} />
            <StatRow label="Last upload" value={daysAgo(lead.last_upload_at)} />
            <StatRow label="Avg views (last 10)" value={fmt(lead.avg_views_last_10)} />
            <StatRow label="S2V ratio" value={lead.s2v_ratio_pct != null ? `${lead.s2v_ratio_pct}%` : '—'} />
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Posts (30d)</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{lead.posting_frequency_30d ?? '—'}</span>
            </div>
          </div>

          {/* Recent videos */}
          {recentVideos.length > 0 && (
            <div className="glass-card p-5">
              <SectionTitle>Recent Videos</SectionTitle>
              <ul className="space-y-2">
                {recentVideos.map((v, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{v.title}</span>
                    <span className="text-xs flex-shrink-0 font-medium" style={{ color: 'var(--text-secondary)' }}>{fmt(v.viewCount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Observations */}
          <div className="glass-card p-5">
            <SectionTitle>AI Observations</SectionTitle>
            {[
              ['Category', lead.category],
              ['Content Style', lead.content_style],
              ['Monetization', lead.monetization],
              ['Posting', lead.posting_pattern],
            ].map(([label, val]) => (
              <div key={label as string} className="flex gap-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="text-xs w-28 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{val ?? '—'}</span>
              </div>
            ))}

            {(lead.strengths ?? []).length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Strengths</p>
                <ul className="space-y-1">
                  {(lead.strengths ?? []).map((s, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--text-primary)' }}>
                      <span style={{ color: '#A4F4C9' }}>+</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(lead.concerns ?? []).length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#FF6B6B' }}>Concerns</p>
                <ul className="space-y-1">
                  {(lead.concerns ?? []).map((c, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--text-primary)' }}>
                      <span style={{ color: '#FF6B6B' }}>−</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* AI confidence */}
          {(lead.ai_confidence || (lead.data_gaps ?? []).length > 0) && (
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info size={14} style={{ color: 'var(--text-secondary)' }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  AI Confidence: {lead.ai_confidence ?? 'unknown'}
                </span>
              </div>
              {(lead.data_gaps ?? []).length > 0 && (
                <ul className="space-y-1">
                  {(lead.data_gaps ?? []).map((d, i) => (
                    <li key={i} className="text-xs" style={{ color: 'var(--text-muted)' }}>? {d}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-5">

          {/* Live score card */}
          <div className="glass-card p-5" style={{ borderColor: `${scoreColor}40` }}>
            <div className="flex items-end justify-between mb-3">
              <div>
                <div className="text-4xl font-black" style={{ color: scoreColor }}>{total.toFixed(2)}</div>
                <div className="text-sm font-semibold mt-0.5" style={{ color: scoreColor }}>{scoreLabel}</div>
              </div>
              <button onClick={() => setShowScoreModal(true)} className="btn-ghost text-xs px-2 py-1 flex items-center gap-1">
                <Info size={12} /> How it's scored
              </button>
            </div>
            <div className="w-full h-2 rounded-full mb-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((total - 1) / 4) * 100}%`, background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}99)` }} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[['YT Factor', ytFactor.toFixed(1)], ['Sub Range', subFactor.toFixed(1)], ['S2V Factor', s2vFactor.toFixed(1)], [`G-Factor (${gFactor}/5)`, gNorm.toFixed(2)]].map(([k, v]) => (
                <div key={k} className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                  <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{k}</div>
                  <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* G-Factor */}
          <div className="glass-card p-5">
            <SectionTitle>G-Factor <span className="normal-case font-normal" style={{ color: 'var(--text-muted)' }}>(gut feeling 1–5)</span></SectionTitle>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setGFactor(n)} className="flex-1 py-3 rounded-xl border text-sm font-bold transition-all"
                  style={gFactor === n ? { background: 'linear-gradient(135deg, rgba(164,244,201,0.2), rgba(110,180,152,0.2))', borderColor: '#A4F4C9', color: '#A4F4C9', boxShadow: '0 0 14px rgba(164,244,201,0.25)' } : { background: 'transparent', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Edit fields */}
          <div className="glass-card p-5 space-y-4">
            <SectionTitle>Edit Fields</SectionTitle>

            <div>
              <label className={labelCls} style={{ color: 'var(--text-secondary)' }}>Lead Name</label>
              <input value={fields.lead_name} onChange={set('lead_name')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--text-secondary)' }}>Found By</label>
              <select value={fields.found_by} onChange={set('found_by')} className={inputCls} style={{ background: 'rgba(13,59,102,0.4)' }}>
                {teamMembers.map(m => <option key={m.initials} value={m.initials} style={{ background: '#0D3B66' }}>{m.full_name} ({m.initials})</option>)}
              </select>
            </div>

            {/* Contact Details */}
            <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <SectionTitle>Contact Details</SectionTitle>
              {([['email', 'Email', Mail], ['website', 'Website', Globe], ['instagram', 'Instagram', Instagram], ['twitter', 'Twitter / X', Twitter]] as [keyof typeof fields, string, any][]).map(([key, label, Icon]) => (
                <div key={key} className="mb-3">
                  <label className={labelCls} style={{ color: 'var(--text-secondary)' }}>
                    <Icon size={11} className="inline mr-1" />{label}
                  </label>
                  <div className="flex gap-2">
                    <input value={fields[key]} onChange={set(key)} className={`${inputCls} flex-1`} placeholder={`Enter ${label.toLowerCase()}…`} />
                    {fields[key] && <CopyButton value={fields[key]} />}
                  </div>
                </div>
              ))}
            </div>

            {/* Metadata fields */}
            {([['category', 'Category'], ['content_style', 'Content Style'], ['monetization', 'Monetization'], ['posting_pattern', 'Posting Pattern']] as [keyof typeof fields, string][]).map(([key, label]) => (
              <div key={key}>
                <label className={labelCls} style={{ color: 'var(--text-secondary)' }}>{label}</label>
                <input value={fields[key]} onChange={set(key)} className={inputCls} />
              </div>
            ))}

            {/* Status */}
            <div>
              <label className={labelCls} style={{ color: 'var(--text-secondary)' }}>Status</label>
              <select value={fields.status} onChange={set('status')} className={inputCls} style={{ background: 'rgba(13,59,102,0.4)' }}>
                {statusOptions.map(s => <option key={s.value} value={s.value} style={{ background: '#0D3B66' }}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--text-secondary)' }}>Status Notes</label>
              <input value={fields.status_notes} onChange={set('status_notes')} placeholder="Optional" className={inputCls} />
            </div>
          </div>

          {/* Remarks */}
          <div className="glass-card p-5">
            <SectionTitle>Remarks (Final)</SectionTitle>
            <textarea value={fields.remarks_final} onChange={set('remarks_final')} rows={5}
              className="input-field text-sm resize-y"
              placeholder="Write final remarks for this lead…" />
            {lead.remarks_ai_draft && (
              <div className="mt-3">
                <button onClick={() => setShowAIDraft(v => !v)} className="flex items-center gap-1.5 text-xs"
                  style={{ color: 'var(--text-muted)' }}>
                  {showAIDraft ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {showAIDraft ? 'Hide' : 'Show'} original AI draft
                </button>
                {showAIDraft && (
                  <div className="mt-2 text-sm italic rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    {lead.remarks_ai_draft}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Save button */}
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 text-sm">
            {saving ? <><Loader2 size={15} className="animate-spin" />Saving…</> : <><Save size={15} />Save Lead →</>}
          </button>
        </div>
      </div>
    </div>
  )
}
