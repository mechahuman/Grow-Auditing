'use client'

import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Copy, Check, Users, Eye, Video, Clock, BarChart2, Mail, Globe, Info, ChevronDown, ChevronUp, Trash2, Save, Loader2, Star, Play, Camera, MessageSquare, RefreshCw, Download, Edit as EditIcon } from 'lucide-react'
import { Avatar } from './Avatar'
import jsPDF from 'jspdf'

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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
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
  async function handleDownloadPDF() {
    setIsDownloadingPdf(true)
    try {
      const { jsPDF: jsPDFConstructor } = await import('jspdf')

      const loadLogo = (): Promise<string | null> => {
        return new Promise((resolve) => {
          const logo = new Image()
          logo.crossOrigin = 'anonymous'
          logo.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = logo.width
            canvas.height = logo.height
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(logo, 0, 0)
              resolve(canvas.toDataURL('image/png'))
            } else {
              resolve(null)
            }
          }
          logo.onerror = () => resolve(null)
          logo.src = '/apple-touch-icon.png'
        })
      }

      const logoData = await loadLogo()

      const pdf: any = new jsPDFConstructor('p', 'mm', 'a4')
      let yPosition = 15
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15
      const maxWidth = pageWidth - 2 * margin

      if (logoData) {
        try {
          pdf.addImage(logoData, 'PNG', margin, 8, 12, 12)
        } catch (e) {
          // Logo failed to add, continue without it
        }
      }

      const today = new Date()
      const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      pdf.setFontSize(9)
      pdf.setFont('Helvetica', 'normal')
      pdf.setTextColor(100, 100, 100)
      const dateWidth = pdf.getTextWidth(dateStr)
      pdf.text(dateStr, pageWidth - margin - dateWidth, 12)
      pdf.setTextColor(0, 0, 0)

      yPosition = 25

      const addSection = (title: string) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage()
          yPosition = 15
        }
        pdf.setFontSize(12)
        pdf.setFont('Helvetica', 'bold')
        pdf.text(title, margin, yPosition)
        yPosition += 8
        pdf.setFont('Helvetica', 'normal')
      }

      const addText = (text: string, fontSize = 10) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage()
          yPosition = 15
        }
        pdf.setFontSize(fontSize)
        pdf.setFont('Helvetica', 'normal')
        const lines = pdf.splitTextToSize(text, maxWidth)
        pdf.text(lines, margin, yPosition)
        yPosition += lines.length * 5 + 2
      }

      const addKeyValue = (key: string, value: string) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage()
          yPosition = 15
        }
        pdf.setFontSize(10)
        pdf.setFont('Helvetica', 'bold')
        pdf.text(`${key}:`, margin, yPosition)
        pdf.setFont('Helvetica', 'normal')
        const lines = pdf.splitTextToSize(value, maxWidth - 50)
        pdf.text(lines, margin + 45, yPosition)
        yPosition += Math.max(lines.length * 5, 5) + 2
      }

      const statusLabel = statusOptions.find(o => o.value === lead.status)?.label ?? lead.status
      const scoreLabel = getLabel(lead.lead_score_total ?? 0).label
      const recentVideos = lead.raw_youtube_data?.recentVideos?.slice(0, 5) ?? []

      pdf.setFontSize(16)
      pdf.setFont('Helvetica', 'bold')
      pdf.text(lead.lead_name, margin, yPosition)
      yPosition += 8

      pdf.setFontSize(10)
      pdf.setFont('Helvetica', 'normal')
      pdf.setTextColor(150, 150, 150)
      pdf.text(`@${lead.youtube_handle || 'YouTube Channel'}`, margin, yPosition)
      yPosition += 8

      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(9)
      pdf.setFont('Helvetica', 'bold')
      pdf.text(`Found by: ${lead.found_by}`, margin, yPosition)
      yPosition += 1
      pdf.text(`Status: ${statusLabel}`, margin + 60, yPosition)
      yPosition += 10

      addSection('CHANNEL STATS')
      const stats = [
        ['Subscribers', fmt(lead.subscriber_count)],
        ['Total Views', fmt(lead.total_views)],
        ['Videos', fmt(lead.video_count)],
        ['Channel Age', monthsAgo(lead.channel_created_at)],
        ['Last Upload', daysAgo(lead.last_upload_at)],
        ['Avg Views (Last 10)', fmt(lead.avg_views_last_10)],
        ['S2V Ratio', lead.s2v_ratio_pct != null ? `${lead.s2v_ratio_pct}%` : '—'],
        ['Posts (30d)', lead.posting_frequency_30d ?? '—'],
      ]
      stats.forEach(([label, val]) => {
        addKeyValue(label as string, val as string)
      })

      if (lead.avg_like_rate_pct !== null || lead.avg_comment_rate_pct !== null || lead.shorts_pct !== null || lead.avg_duration_sec !== null) {
        yPosition += 3
        addSection('ENGAGEMENT BREAKDOWN')
        if (lead.avg_like_rate_pct !== null) addKeyValue('Avg Like Rate', `${lead.avg_like_rate_pct.toFixed(2)}%`)
        if (lead.avg_comment_rate_pct !== null) addKeyValue('Avg Comment Rate', `${lead.avg_comment_rate_pct.toFixed(2)}%`)
        if (lead.shorts_pct !== null) addKeyValue('Shorts Content', `${lead.shorts_pct.toFixed(1)}%`)
        if (lead.avg_duration_sec !== null) addKeyValue('Avg Video Duration', formatDuration(lead.avg_duration_sec))
      }

      if (lead.top_video_title && lead.top_video_url) {
        yPosition += 3
        addSection('TOP RECENT VIDEO')
        addKeyValue('Title', lead.top_video_title)
        addKeyValue('Views', fmt(lead.top_video_views))
        addText('Best performing video from last 15 uploads', 9)
      }

      if (recentVideos.length > 0) {
        yPosition += 3
        addSection('LATEST CONTENT')
        recentVideos.forEach((v: any) => {
          addKeyValue(v.title, `${fmt(v.viewCount)} views`)
        })
      }

      if (lead.channel_country !== null || lead.is_verified !== null || lead.has_community_posts !== null || (lead.channel_keywords && lead.channel_keywords.length > 0)) {
        yPosition += 3
        addSection('CHANNEL PROFILE')
        if (lead.channel_country) addKeyValue('Country', lead.channel_country)
        if (lead.is_verified !== null) addKeyValue('Verification', lead.is_verified ? 'Verified' : 'Not verified')
        if (lead.has_community_posts !== null) addKeyValue('Community Posts', lead.has_community_posts ? 'Active' : 'Not detected')
        if (lead.channel_keywords && lead.channel_keywords.length > 0) {
          addKeyValue('Keywords', lead.channel_keywords.slice(0, 10).join(', '))
        }
      }

      yPosition += 3
      addSection('LEAD SCORE')
      addKeyValue('Total Score', lead.lead_score_total?.toFixed(2) || '—')
      addKeyValue('Score Level', scoreLabel)
      const scoreFactors = [
        ['YT Factor', lead.yt_score_factor?.toFixed(1) ?? '—'],
        ['Sub Range Factor', lead.sub_range_factor?.toFixed(1) ?? '—'],
        ['S2V Factor', lead.s2v_factor?.toFixed(1) ?? '—'],
        ['G-Factor', lead.g_factor ? ((lead.g_factor - 1) / 4).toFixed(2) : '—'],
      ]
      scoreFactors.forEach(([k, v]) => {
        addKeyValue(k as string, v as string)
      })

      if (lead.email || lead.website || lead.instagram || lead.twitter || lead.tiktok || lead.linkedin || lead.facebook || lead.merch) {
        yPosition += 3
        addSection('CONTACT DETAILS')
        if (lead.email) addKeyValue('Email', lead.email)
        if (lead.website) addKeyValue('Website', lead.website)
        if (lead.instagram) addKeyValue('Instagram', lead.instagram)
        if (lead.twitter) addKeyValue('Twitter', lead.twitter)
        if (lead.tiktok) addKeyValue('TikTok', lead.tiktok)
        if (lead.linkedin) addKeyValue('LinkedIn', lead.linkedin)
        if (lead.facebook) addKeyValue('Facebook', lead.facebook)
        if (lead.merch) addKeyValue('Merch/Store', lead.merch)
      }

      if (lead.status_notes) {
        yPosition += 3
        addSection('STATUS UPDATE')
        addText(lead.status_notes)
      }

      yPosition += 3
      addSection('AI INSIGHTS & ANALYSIS')
      const insights = [
        ['Category', lead.category],
        ['Content Style', lead.content_style],
        ['Monetization', lead.monetization],
        ['Posting Pattern', lead.posting_pattern],
      ]
      insights.forEach(([label, val]) => {
        if (val) addKeyValue(label as string, val as string)
      })

      if ((lead.strengths ?? []).length > 0) {
        yPosition += 2
        pdf.setFontSize(11)
        pdf.setFont('Helvetica', 'bold')
        pdf.text('Strengths:', margin, yPosition)
        yPosition += 5
        pdf.setFont('Helvetica', 'normal')
        (lead.strengths ?? []).forEach((s: string) => {
          addText(`• ${s}`)
        })
      }

      if ((lead.concerns ?? []).length > 0) {
        yPosition += 2
        pdf.setFontSize(11)
        pdf.setFont('Helvetica', 'bold')
        pdf.text('Considerations:', margin, yPosition)
        yPosition += 5
        pdf.setFont('Helvetica', 'normal')
        (lead.concerns ?? []).forEach((c: string) => {
          addText(`• ${c}`)
        })
      }

      if (lead.ai_red_flags && lead.ai_red_flags.length > 0) {
        yPosition += 3
        addSection('RED FLAGS')
        lead.ai_red_flags.forEach((flag: string) => {
          addText(`${flag}`)
        })
      } else {
        yPosition += 3
        addSection('RED FLAGS')
        addText('No red flags detected')
      }

      if (lead.ai_confidence || lead.ai_confidence_reason || (lead.data_gaps ?? []).length > 0) {
        yPosition += 3
        addSection('AI CONFIDENCE')
        if (lead.ai_confidence) addKeyValue('Confidence Level', lead.ai_confidence)
        if (lead.ai_confidence_reason) addText(lead.ai_confidence_reason)
        if ((lead.data_gaps ?? []).length > 0) {
          pdf.setFont('Helvetica', 'bold')
          pdf.text('Data Gaps:', margin, yPosition)
          yPosition += 5
          pdf.setFont('Helvetica', 'normal')
          (lead.data_gaps ?? []).forEach((d: string) => {
            addText(`○ ${d}`)
          })
        }
      }

      if (lead.remarks_final || lead.remarks_ai_draft) {
        yPosition += 3
        addSection('FINAL NOTES & RECOMMENDATIONS')
        if (lead.remarks_final) {
          addText(lead.remarks_final)
        }
        if (lead.remarks_ai_draft) {
          yPosition += 2
          pdf.setFont('Helvetica', 'bold')
          pdf.text('AI Summary:', margin, yPosition)
          yPosition += 5
          pdf.setFont('Helvetica', 'normal')
          addText(lead.remarks_ai_draft)
        }
      }

      pdf.save(`${lead.lead_name}-Audit.pdf`)
      showToast('PDF downloaded successfully!')
      setIsDownloadingPdf(false)
    } catch (error) {
      console.error('PDF download failed:', error)
      showToast('Failed to download PDF', false)
      setIsDownloadingPdf(false)
    }
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
              <button onClick={() => router.push(window.location.pathname.includes('/admin/') ? `/admin/leads/${lead.id}/edit` : `/leads/${lead.id}/edit`)} className="p-2 rounded-lg transition-all hover:opacity-75" title="Edit"
                style={{ background: 'rgba(168,85,247,0.12)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)' }}>
                <EditIcon size={16} />
              </button>
              <button onClick={() => setShowReEnrichModal(true)} disabled={re_enriching} className="btn-ghost flex items-center gap-1.5 text-sm transition-all disabled:opacity-50"
                style={{ color: '#A4F4C9', borderColor: 'rgba(164,244,201,0.3)' }}>
                {re_enriching ? <>
                  <Loader2 size={14} className="animate-spin" />Re-enriching…
                </> : <>
                  <RefreshCw size={14} /> Re-Enrich
                </>}
              </button>
              <button onClick={handleDownloadPDF} disabled={isDownloadingPdf} className="p-2 rounded-lg transition-all hover:opacity-75" title="Download"
                style={{ background: 'rgba(110,180,152,0.12)', color: '#6EB498', border: '1px solid rgba(110,180,152,0.3)' }}>
                {isDownloadingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              </button>
              <button onClick={handleDelete} className="p-2 rounded-lg transition-all hover:opacity-75" title="Delete"
                style={{ background: 'rgba(255,107,107,0.12)', color: '#FF6B6B', border: '1px solid rgba(255,107,107,0.3)' }}>
                <Trash2 size={16} />
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
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Subscribers</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{fmt(lead.subscriber_count)}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Total Views</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{fmt(lead.total_views)}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Videos</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{fmt(lead.video_count)}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Channel Age</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{monthsAgo(lead.channel_created_at)}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Last Upload</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{daysAgo(lead.last_upload_at)}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Avg Views (10)</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{fmt(lead.avg_views_last_10)}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>S2V Ratio</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{lead.s2v_ratio_pct != null ? `${lead.s2v_ratio_pct}%` : '—'}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Posts (30d)</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{lead.posting_frequency_30d ?? '—'}</p>
              </div>
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

          {/* Latest Content */}
          {recentVideos.length > 0 && (
            <div className="glass-card p-5">
              <SectionTitle>Latest Content</SectionTitle>
              <ul className="space-y-2">
                {recentVideos.map((v, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: i < recentVideos.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{v.title}</span>
                    <span className="text-sm flex-shrink-0 font-semibold" style={{ color: '#a855f7' }}>{fmt(v.viewCount)}</span>
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

          {/* Get In Touch - Contact Details for saved leads */}
          {!lead.draft && (lead.email || lead.website || lead.instagram || lead.twitter || lead.tiktok || lead.linkedin || lead.facebook || lead.merch) && (
            <div className="glass-card p-8" style={{ background: 'linear-gradient(135deg, rgba(241, 91, 181, 0.12) 0%, rgba(168, 85, 247, 0.06) 100%)', border: '1px solid rgba(241, 91, 181, 0.2)' }}>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 pb-4" style={{ color: '#f15bb5', borderBottom: '1px solid rgba(241, 91, 181, 0.3)', letterSpacing: '1.5px' }}>Get In Touch</h3>
              <div className="space-y-3">
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-3 p-4 rounded-xl transition-all hover:opacity-80" style={{ background: 'rgba(241,91,181,0.08)', border: '1px solid rgba(241, 91, 181, 0.3)' }}>
                    <Globe size={18} style={{ color: '#f15bb5', flexShrink: 0 }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{lead.email}</span>
                  </a>
                )}
                {lead.website && (
                  <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl transition-all hover:opacity-80" style={{ background: 'rgba(241,91,181,0.08)', border: '1px solid rgba(241, 91, 181, 0.3)' }}>
                    <Globe size={18} style={{ color: '#f15bb5', flexShrink: 0 }} />
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{lead.website}</span>
                  </a>
                )}
                {lead.instagram && (
                  <a href={lead.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl transition-all hover:opacity-80" style={{ background: 'rgba(241,91,181,0.08)', border: '1px solid rgba(241, 91, 181, 0.3)' }}>
                    <Camera size={18} style={{ color: '#f15bb5', flexShrink: 0 }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{lead.instagram}</span>
                  </a>
                )}
                {lead.twitter && (
                  <a href={lead.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl transition-all hover:opacity-80" style={{ background: 'rgba(241,91,181,0.08)', border: '1px solid rgba(241, 91, 181, 0.3)' }}>
                    <MessageSquare size={18} style={{ color: '#f15bb5', flexShrink: 0 }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{lead.twitter}</span>
                  </a>
                )}
                {lead.tiktok && (
                  <a href={lead.tiktok} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl transition-all hover:opacity-80" style={{ background: 'rgba(241,91,181,0.08)', border: '1px solid rgba(241, 91, 181, 0.3)' }}>
                    <Camera size={18} style={{ color: '#f15bb5', flexShrink: 0 }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>TikTok</span>
                  </a>
                )}
                {lead.linkedin && (
                  <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl transition-all hover:opacity-80" style={{ background: 'rgba(241,91,181,0.08)', border: '1px solid rgba(241, 91, 181, 0.3)' }}>
                    <Globe size={18} style={{ color: '#f15bb5', flexShrink: 0 }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>LinkedIn</span>
                  </a>
                )}
                {lead.facebook && (
                  <a href={lead.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl transition-all hover:opacity-80" style={{ background: 'rgba(241,91,181,0.08)', border: '1px solid rgba(241, 91, 181, 0.3)' }}>
                    <MessageSquare size={18} style={{ color: '#f15bb5', flexShrink: 0 }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Facebook</span>
                  </a>
                )}
                {lead.merch && (
                  <a href={lead.merch} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl transition-all hover:opacity-80" style={{ background: 'rgba(241,91,181,0.08)', border: '1px solid rgba(241, 91, 181, 0.3)' }}>
                    <Globe size={18} style={{ color: '#f15bb5', flexShrink: 0 }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Merch / Store</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {lead.draft && (
            <>
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
            </>
          )}
        </div>
      </div>

      {!lead.draft && (
        <>
          {/* AI Insights & Analysis - Full width for saved leads */}
          <div className="glass-card p-8 mt-6" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(241, 91, 181, 0.08) 100%)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-8 pb-4" style={{ color: '#a855f7', borderBottom: '1px solid rgba(168, 85, 247, 0.3)', letterSpacing: '1.5px' }}>AI Insights & Analysis</h3>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                ['Category', lead.category],
                ['Content Style', lead.content_style],
                ['Monetization', lead.monetization],
                ['Posting Pattern', lead.posting_pattern],
              ].map(([label, val]) => (
                <div key={label as string} className="rounded-xl p-4" style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
                  <p className="text-xs mb-2" style={{ color: '#9b5de5', fontWeight: '600', letterSpacing: '0.5px' }}>{label}</p>
                  <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--text-primary)' }}>{val ?? '—'}</p>
                </div>
              ))}
            </div>

            {/* Strengths and Considerations in 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              {/* Strengths */}
              {(lead.strengths ?? []).length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#A4F4C9' }} />
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#A4F4C9' }}>Strengths</p>
                  </div>
                  <ul className="space-y-3">
                    {(lead.strengths ?? []).map((s: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                        <span style={{ color: '#A4F4C9', fontWeight: 'bold' }}>•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Considerations */}
              {(lead.concerns ?? []).length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#FF6B6B' }} />
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#FF6B6B' }}>Considerations</p>
                  </div>
                  <ul className="space-y-3">
                    {(lead.concerns ?? []).map((c: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                        <span style={{ color: '#FF6B6B', fontWeight: 'bold' }}>•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Red Flags */}
            {(lead.ai_red_flags && lead.ai_red_flags.length > 0) ? (
              <div className="rounded-xl p-4 mt-6 mb-6" style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.3)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#FF6B6B' }}>Red Flags</p>
                <ul className="space-y-2">
                  {lead.ai_red_flags.map((flag: string, i: number) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--text-primary)' }}>
                      <span style={{ color: '#FF6B6B' }}>•</span> {flag}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-xl p-4 mt-6 mb-6" style={{ background: 'rgba(164,244,201,0.08)', border: '1px solid rgba(164,244,201,0.3)' }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#A4F4C9' }}>No red flags detected</p>
              </div>
            )}

            {/* AI Confidence */}
            {(lead.ai_confidence || lead.ai_confidence_reason || (lead.data_gaps ?? []).length > 0) && (
              <div className="rounded-xl p-4" style={{ background: 'rgba(241, 91, 181, 0.08)', border: '1px solid rgba(241, 91, 181, 0.2)' }}>
                <div className="flex items-start gap-3">
                  <Info size={16} style={{ color: '#f15bb5', marginTop: '2px' }} className="flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#f15bb5' }}>
                      AI Confidence: {lead.ai_confidence ?? 'Unknown'}
                    </p>
                    {lead.ai_confidence_reason && (
                      <p className="text-xs mb-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)' }}>
                        {lead.ai_confidence_reason}
                      </p>
                    )}
                    {(lead.data_gaps ?? []).length > 0 && (
                      <ul className="space-y-1.5">
                        {(lead.data_gaps ?? []).map((d: string, i: number) => (
                          <li key={i} className="text-xs flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>○</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Notes */}
          {lead.status_notes && (
            <div className="glass-card p-5 mt-6">
              <SectionTitle>Status Update</SectionTitle>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{lead.status_notes}</p>
            </div>
          )}

          {/* Final Notes - Read-only */}
          {(lead.remarks_final || lead.remarks_ai_draft) && (
            <div className="glass-card p-5 mt-6">
              <SectionTitle>Final Notes & Recommendations</SectionTitle>
              {lead.remarks_final && (
                <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{lead.remarks_final}</p>
                </div>
              )}
              {lead.remarks_ai_draft && (
                <div>
                  <button onClick={() => setShowAIDraft(v => !v)} className="flex items-center gap-1.5 text-xs"
                    style={{ color: 'var(--text-muted)' }}>
                    {showAIDraft ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {showAIDraft ? 'Hide' : 'Show'} AI Summary
                  </button>
                  {showAIDraft && (
                    <div className="mt-2 text-sm p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      {lead.remarks_ai_draft}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Outreach Email Draft - Read-only */}
          {lead.outreach_email_draft && (
            <div className="glass-card p-8 mt-6" style={{ background: 'linear-gradient(135deg, rgba(76,175,80,0.12) 0%, rgba(76,175,80,0.06) 100%)', border: '1px solid rgba(76,175,80,0.2)' }}>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 pb-4" style={{ color: '#4CAF50', borderBottom: '1px solid rgba(76,175,80,0.3)', letterSpacing: '1.5px' }}>Outreach Email Draft</h3>
              <div className="text-sm leading-relaxed p-6 rounded-xl whitespace-pre-wrap" style={{ background: 'rgba(76,175,80,0.08)', border: '1px solid rgba(76,175,80,0.3)', color: 'var(--text-primary)', fontFamily: 'inherit', lineHeight: '1.6' }}>
                {lead.outreach_email_draft}
              </div>
              <button
                onClick={() => {
                  if (lead.outreach_email_draft) {
                    navigator.clipboard.writeText(lead.outreach_email_draft)
                    showToast('Email copied to clipboard!')
                  }
                }}
                className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.3)', color: '#4CAF50' }}>
                Copy Email
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
