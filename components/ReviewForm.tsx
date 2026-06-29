'use client'

import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Copy, Check, Users, Eye, Video, Clock, BarChart2, Mail, Globe, Info, ChevronDown, ChevronUp, Trash2, Save, Loader2, Star, Play, Camera, MessageSquare, RefreshCw, Download, Edit as EditIcon } from 'lucide-react'
import { Avatar } from './Avatar'

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
  channel_thumbnail_url: string | null
  re_enrich_count?: number; re_enriched_at?: string | null
  // Group A: computed from video data
  shorts_pct: number | null; avg_like_rate_pct: number | null; avg_comment_rate_pct: number | null
  avg_duration_sec: number | null; top_video_title: string | null; top_video_url: string | null
  top_video_views: number | null
  // Group B: from channels.list
  channel_country: string | null; channel_keywords: string[] | null; is_verified: boolean | null
  // Group C: promoted from socialLinks
  tiktok: string | null; linkedin: string | null; facebook: string | null; merch: string | null
  // Group D: community posts
  has_community_posts: boolean | null
  // Group E: AI-generated
  ai_red_flags: string[] | null; ai_confidence_reason: string | null; outreach_email_draft: string | null
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
function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
function monthsAgo(iso: string | null) {
  if (!iso) return '—'
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / (86_400_000 * 30.44))
  return m < 1 ? '<1 month' : `${m} month${m > 1 ? 's' : ''}`
}

function formatDuration(sec: number | null): string {
  if (sec == null) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m${s > 0 ? `${s}s` : ''}`
}

function getEngagementBadge(value: number | null, type: 'like' | 'comment' | 'shorts' | 'duration') {
  if (value == null) return { label: 'Unknown', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.04)' }

  if (type === 'like') {
    if (value >= 2) return { label: 'Strong', color: '#A4F4C9', bg: 'rgba(164,244,201,0.12)' }
    if (value >= 0.5) return { label: 'Good', color: '#6EB498', bg: 'rgba(110,180,152,0.12)' }
    return { label: 'Low', color: '#FFB347', bg: 'rgba(255,179,71,0.12)' }
  }
  if (type === 'comment') {
    if (value >= 0.2) return { label: 'Strong', color: '#A4F4C9', bg: 'rgba(164,244,201,0.12)' }
    if (value >= 0.05) return { label: 'Good', color: '#6EB498', bg: 'rgba(110,180,152,0.12)' }
    return { label: 'Low', color: '#FFB347', bg: 'rgba(255,179,71,0.12)' }
  }
  if (type === 'shorts') {
    if (value > 70) return { label: 'Mostly Shorts', color: '#FFB347', bg: 'rgba(255,179,71,0.12)' }
    if (value > 30) return { label: 'Mixed Content', color: '#6EB498', bg: 'rgba(110,180,152,0.12)' }
    return { label: 'Long-form Focus', color: '#A4F4C9', bg: 'rgba(164,244,201,0.12)' }
  }
  if (type === 'duration') {
    if (value >= 15 * 60) return { label: 'Long-form', color: '#A4F4C9', bg: 'rgba(164,244,201,0.12)' }
    if (value < 3 * 60) return { label: 'Short-form', color: '#FFB347', bg: 'rgba(255,179,71,0.12)' }
    return { label: 'Medium-form', color: '#6EB498', bg: 'rgba(110,180,152,0.12)' }
  }

  return { label: 'Unknown', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.04)' }
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
  const [re_enriching, setReEnriching] = useState(false)
  const [showReEnrichModal, setShowReEnrichModal] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [gFactor, setGFactor] = useState(lead.g_factor)
  const [fields, setFields] = useState({
    lead_name: lead.lead_name, found_by: lead.found_by,
    email: lead.email ?? '', website: lead.website ?? '',
    instagram: lead.instagram ?? '', twitter: lead.twitter ?? '',
    tiktok: lead.tiktok ?? '', linkedin: lead.linkedin ?? '', facebook: lead.facebook ?? '', merch: lead.merch ?? '',
    category: lead.category ?? '', content_style: lead.content_style ?? '',
    monetization: lead.monetization ?? '', posting_pattern: lead.posting_pattern ?? '',
    remarks_final: lead.remarks_final ?? '', outreach_email_draft: lead.outreach_email_draft ?? '',
    status: lead.status, status_notes: lead.status_notes ?? '',
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
  async function handleReEnrich() {
    setReEnriching(true)
    setShowReEnrichModal(false)
    const res = await fetch('/api/re-enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: lead.id }),
    })
    const data = await res.json()
    setReEnriching(false)
    if (data.error) {
      showToast(`Re-enrich failed: ${data.error}`, false)
    } else {
      showToast(`Lead re-enriched! (${data.re_enrich_count} total)`)
      setTimeout(() => window.location.reload(), 1000)
    }
  }
  function handleDownload() {
    const data = {
      lead_name: lead.lead_name,
      youtube_handle: lead.youtube_handle,
      subscriber_count: lead.subscriber_count,
      total_views: lead.total_views,
      video_count: lead.video_count,
      lead_score_total: lead.lead_score_total,
      status: lead.status,
      found_by: lead.found_by,
      email: lead.email,
      website: lead.website,
      remarks_final: lead.remarks_final,
    }
    const jsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${lead.lead_name.replace(/\s+/g, '-')}-${lead.id.substring(0, 8)}.json`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    showToast('Lead downloaded!')
  }
  async function handleDelete() {
    if (!confirm('Delete this lead permanently?')) return
    const res = await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Lead deleted!')
      setTimeout(() => router.back(), 800)
    } else {
      showToast('Failed to delete lead', false)
    }
  }

  const inputCls = 'input-field text-sm'
  const labelCls = 'block text-xs font-semibold uppercase tracking-wider mb-1.5'

  return (
    <div className="relative px-6 py-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all"
          style={{ background: toast.ok ? 'rgba(164,244,201,0.15)' : 'rgba(255,107,107,0.15)', border: `1px solid ${toast.ok ? 'rgba(164,244,201,0.4)' : 'rgba(255,107,107,0.4)'}`, color: toast.ok ? '#A4F4C9' : '#FF6B6B', backdropFilter: 'blur(12px)' }}>
          {toast.ok ? <Check size={15} /> : null}{toast.msg}
        </div>
      )}

      {/* Score info modal */}
      {showScoreModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-xl" onClick={() => setShowScoreModal(false)}>
          <div className="p-5 max-w-xs w-full mx-4 rounded-2xl" style={{ background: 'rgba(12,12,18,0.98)', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-2 text-gradient">How the Score is Calculated</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Score = 1 + (YT + Sub Range + S2V + G-Factor norm)</p>
            <ul className="text-xs space-y-2">
              <li className="flex justify-between gap-2"><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>YT Factor</span><span style={{ color: 'var(--text-muted)' }}>1 if YouTube exists, else 0</span></li>
              <li className="flex justify-between gap-2"><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Sub Range</span><span style={{ color: 'var(--text-muted)' }}>0 · 0.5 · 1 by sub count</span></li>
              <li className="flex justify-between gap-2"><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>S2V Factor</span><span style={{ color: 'var(--text-muted)' }}>1 if views/subs ≥ 10%, else 0</span></li>
              <li className="flex justify-between gap-2"><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>G-Factor</span><span style={{ color: 'var(--text-muted)' }}>(G − 1) / 4 → 0.0 to 1.0</span></li>
            </ul>
            <p className="text-xs mt-3 pb-3" style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Range: 1.0 (min) — 5.0 (max)</p>
            <button onClick={() => setShowScoreModal(false)} className="btn-ghost w-full mt-3 text-xs">Dismiss</button>
          </div>
        </div>,
        document.body
      )}

      {/* Re-Enrich confirmation modal */}
      {showReEnrichModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card p-6 max-w-sm w-full mx-4">
            <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Re-enrich this channel?</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>We'll fetch fresh YouTube data and re-run AI analysis. Your edited remarks and G-Factor will be preserved.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowReEnrichModal(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleReEnrich} disabled={re_enriching} className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: 'rgba(164,244,201,0.15)', border: '1px solid rgba(164,244,201,0.3)', color: '#A4F4C9' }}>
                {re_enriching ? <>
                  <Loader2 size={14} className="inline mr-1.5 animate-spin" />Re-enriching…
                </> : 'Yes, re-enrich'}
              </button>
            </div>
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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-7">
        <div className="flex items-start gap-4">
          <Avatar
            thumbnailUrl={lead.channel_thumbnail_url || null}
            initials={getInitials(lead.lead_name)}
            name={lead.lead_name}
            size="xl"
          />
          <div>
            <h1 className="text-2xl font-bold text-gradient mb-0.5">{lead.lead_name}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <a href={lead.youtube_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-secondary)' }}>
                <Play size={14} /> {lead.youtube_handle ?? lead.youtube_url}
              </a>
              {lead.re_enrich_count !== undefined && lead.re_enrich_count > 0 && (
                <div className="text-xs px-2.5 py-1 rounded-lg" style={{ background: 'rgba(164,244,201,0.12)', border: '1px solid rgba(164,244,201,0.2)', color: 'var(--text-secondary)' }}>
                  Re-enriched {lead.re_enrich_count} time{lead.re_enrich_count > 1 ? 's' : ''} · {daysAgo(lead.re_enriched_at ?? null)}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!lead.draft && (
            <>
              <button onClick={() => router.push(window.location.pathname.includes('/admin/') ? `/admin/leads/${lead.id}/edit` : `/leads/${lead.id}/edit`)} className="btn-ghost flex items-center gap-1.5 text-sm"
                style={{ color: '#c084fc', borderColor: 'rgba(168,85,247,0.3)' }}>
                <EditIcon size={14} /> Edit
              </button>
              <button onClick={() => setShowReEnrichModal(true)} disabled={re_enriching} className="btn-ghost flex items-center gap-1.5 text-sm transition-all disabled:opacity-50"
                style={{ color: '#A4F4C9', borderColor: 'rgba(164,244,201,0.3)' }}>
                {re_enriching ? <>
                  <Loader2 size={14} className="animate-spin" />Re-enriching…
                </> : <>
                  <RefreshCw size={14} /> Re-Enrich
                </>}
              </button>
              <button onClick={handleDownload} className="btn-ghost flex items-center gap-1.5 text-sm"
                style={{ color: '#6EB498', borderColor: 'rgba(110,180,152,0.3)' }}>
                <Download size={14} /> Download
              </button>
              <button onClick={handleDelete} className="btn-ghost flex items-center gap-1.5 text-sm"
                style={{ color: '#FF6B6B', borderColor: 'rgba(255,107,107,0.3)' }}>
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
          {lead.draft && (
            <>
              <button onClick={() => setShowDiscard(true)} className="btn-ghost flex items-center gap-1.5 text-sm"
                style={{ color: '#FF6B6B', borderColor: 'rgba(255,107,107,0.3)' }}>
                <Trash2 size={14} /> Discard
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-1.5">
                {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : <><Save size={14} />Save Lead</>}
              </button>
            </>
          )}
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

          {/* Engagement Breakdown */}
          {(lead.avg_like_rate_pct !== null || lead.avg_comment_rate_pct !== null || lead.shorts_pct !== null || lead.avg_duration_sec !== null) && (
            <div className="glass-card p-5">
              <SectionTitle>Engagement Breakdown</SectionTitle>
              <div className="space-y-3">
                {lead.avg_like_rate_pct !== null && (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Like Rate</div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{lead.avg_like_rate_pct.toFixed(2)}%</div>
                    </div>
                    <div className="text-xs px-2.5 py-1 rounded-lg" style={{ background: getEngagementBadge(lead.avg_like_rate_pct, 'like').bg, color: getEngagementBadge(lead.avg_like_rate_pct, 'like').color, border: `1px solid ${getEngagementBadge(lead.avg_like_rate_pct, 'like').color}40` }}>
                      {getEngagementBadge(lead.avg_like_rate_pct, 'like').label}
                    </div>
                  </div>
                )}
                {lead.avg_comment_rate_pct !== null && (
                  <div className="flex items-center justify-between" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                    <div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Comment Rate</div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{lead.avg_comment_rate_pct.toFixed(2)}%</div>
                    </div>
                    <div className="text-xs px-2.5 py-1 rounded-lg" style={{ background: getEngagementBadge(lead.avg_comment_rate_pct, 'comment').bg, color: getEngagementBadge(lead.avg_comment_rate_pct, 'comment').color, border: `1px solid ${getEngagementBadge(lead.avg_comment_rate_pct, 'comment').color}40` }}>
                      {getEngagementBadge(lead.avg_comment_rate_pct, 'comment').label}
                    </div>
                  </div>
                )}
                {lead.shorts_pct !== null && (
                  <div className="flex items-center justify-between" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                    <div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Shorts Content</div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{lead.shorts_pct.toFixed(1)}%</div>
                    </div>
                    <div className="text-xs px-2.5 py-1 rounded-lg" style={{ background: getEngagementBadge(lead.shorts_pct, 'shorts').bg, color: getEngagementBadge(lead.shorts_pct, 'shorts').color, border: `1px solid ${getEngagementBadge(lead.shorts_pct, 'shorts').color}40` }}>
                      {getEngagementBadge(lead.shorts_pct, 'shorts').label}
                    </div>
                  </div>
                )}
                {lead.avg_duration_sec !== null && (
                  <div className="flex items-center justify-between" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                    <div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Video Duration</div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatDuration(lead.avg_duration_sec)}</div>
                    </div>
                    <div className="text-xs px-2.5 py-1 rounded-lg" style={{ background: getEngagementBadge(lead.avg_duration_sec, 'duration').bg, color: getEngagementBadge(lead.avg_duration_sec, 'duration').color, border: `1px solid ${getEngagementBadge(lead.avg_duration_sec, 'duration').color}40` }}>
                      {getEngagementBadge(lead.avg_duration_sec, 'duration').label}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top Recent Video */}
          {lead.top_video_title && lead.top_video_url && (
            <div className="glass-card p-5">
              <SectionTitle>Top Recent Video</SectionTitle>
              <div className="space-y-2">
                <div>
                  <a href={lead.top_video_url} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-semibold hover:opacity-70 transition-opacity line-clamp-2"
                    style={{ color: '#A4F4C9' }}>
                    {lead.top_video_title}
                  </a>
                </div>
                <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Views</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{fmt(lead.top_video_views)}</span>
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Best performing video from last 15 uploads</div>
              </div>
            </div>
          )}

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

          {/* Channel Profile */}
          {(lead.channel_country !== null || lead.is_verified !== null || lead.has_community_posts !== null || (lead.channel_keywords && lead.channel_keywords.length > 0)) && (
            <div className="glass-card p-5">
              <SectionTitle>Channel Profile</SectionTitle>
              <div className="space-y-3">
                {lead.channel_country && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Country</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{lead.channel_country}</span>
                  </div>
                )}
                {lead.is_verified !== null && (
                  <div className="flex items-center justify-between" style={{ borderTop: lead.channel_country ? '1px solid var(--border)' : 'none', paddingTop: lead.channel_country ? '0.75rem' : '0' }}>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Verification</span>
                    <span className="text-sm font-semibold" style={{ color: lead.is_verified ? '#A4F4C9' : 'var(--text-muted)' }}>
                      {lead.is_verified ? '✓ Verified' : '— Not verified'}
                    </span>
                  </div>
                )}
                {lead.has_community_posts !== null && (
                  <div className="flex items-center justify-between" style={{ borderTop: (lead.channel_country || lead.is_verified !== null) ? '1px solid var(--border)' : 'none', paddingTop: (lead.channel_country || lead.is_verified !== null) ? '0.75rem' : '0' }}>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Community Posts</span>
                    <span className="text-sm font-semibold" style={{ color: lead.has_community_posts ? '#A4F4C9' : 'var(--text-muted)' }}>
                      {lead.has_community_posts ? '✓ Active' : '— Not detected'}
                    </span>
                  </div>
                )}
                {lead.channel_keywords && lead.channel_keywords.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                    <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Keywords</div>
                    <div className="flex flex-wrap gap-1.5">
                      {lead.channel_keywords.slice(0, 10).map((kw, i) => (
                        <div key={i} className="text-xs px-2 py-1 rounded-full"
                          style={{ background: 'rgba(164,244,201,0.12)', border: '1px solid rgba(164,244,201,0.2)', color: '#A4F4C9' }}>
                          {kw}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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

            {/* AI Red Flags - Prominent section */}
            {(lead.ai_red_flags && lead.ai_red_flags.length > 0) ? (
              <div className="mt-3 rounded-lg p-3" style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.3)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#FF6B6B' }}>
                  ⚠️ Red Flags
                </p>
                <ul className="space-y-1">
                  {lead.ai_red_flags.map((flag, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--text-primary)' }}>
                      <span style={{ color: '#FF6B6B' }}>⚠️</span>{flag}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-3 rounded-lg p-3" style={{ background: 'rgba(164,244,201,0.08)', border: '1px solid rgba(164,244,201,0.3)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#A4F4C9' }}>
                  ✓ No red flags detected
                </p>
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
          {(lead.ai_confidence || lead.ai_confidence_reason || (lead.data_gaps ?? []).length > 0) && (
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info size={14} style={{ color: 'var(--text-secondary)' }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  AI Confidence: {lead.ai_confidence ?? 'unknown'}
                </span>
              </div>
              {lead.ai_confidence_reason && (
                <div className="text-xs mb-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)' }}>
                  {lead.ai_confidence_reason}
                </div>
              )}
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
              <button
                onClick={() => setShowScoreModal(true)}
                className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-black transition-all hover:scale-110 self-start mt-0.5"
                style={{
                  background: 'rgba(120,120,135,0.12)',
                  border: '1.5px solid rgba(120,120,135,0.3)',
                  color: 'rgba(155,155,170,0.85)',
                  lineHeight: 1,
                }}
                title="How the score is calculated"
              >
                !
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
              {([['email', 'Email', Mail], ['website', 'Website', Globe], ['instagram', 'Instagram', Camera], ['twitter', 'Twitter / X', MessageSquare], ['tiktok', 'TikTok', Camera], ['linkedin', 'LinkedIn', Globe], ['facebook', 'Facebook', MessageSquare], ['merch', 'Merch / Store', Globe]] as [keyof typeof fields, string, any][]).map(([key, label, Icon]) => (
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

          {/* Outreach Email Draft */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <SectionTitle>📧 Outreach Email</SectionTitle>
              {lead.outreach_email_draft && <CopyButton value={lead.outreach_email_draft} />}
            </div>
            {lead.outreach_email_draft ? (
              <>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>AI-generated first draft — edit below before sending</p>
                <pre className="text-xs p-3 rounded-lg whitespace-pre-wrap" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'inherit' }}>
                  {lead.outreach_email_draft}
                </pre>
                <textarea value={fields.outreach_email_draft} onChange={set('outreach_email_draft')} rows={6}
                  className="input-field text-sm resize-y mt-3"
                  placeholder="Edit the email draft here…" />
              </>
            ) : (
              <div className="text-xs p-3 rounded-lg" style={{ background: 'rgba(255,179,71,0.08)', border: '1px solid rgba(255,179,71,0.3)', color: 'var(--text-muted)' }}>
                Not generated — re-enrich this lead to generate
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
