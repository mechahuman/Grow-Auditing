'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Play, Mail, Globe, Camera, MessageSquare, Info, ChevronDown, ChevronUp, RefreshCw, Loader2, Check } from 'lucide-react'
import { Avatar } from './Avatar'

export default function LeadDetail({ lead, statusLabel }: any) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [showAIDraft, setShowAIDraft] = useState(false)
  const [re_enriching, setReEnriching] = useState(false)
  const [showReEnrichModal, setShowReEnrichModal] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const initials = lead.lead_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const getScore = (s: number | null) => {
    if (!s) return { label: 'Poor fit', color: '#FF6B6B' }
    if (s >= 4) return { label: 'Strong fit', color: '#A4F4C9' }
    if (s >= 3) return { label: 'Solid fit', color: '#6EB498' }
    if (s >= 2) return { label: 'Weak fit', color: '#FFB347' }
    return { label: 'Poor fit', color: '#FF6B6B' }
  }

  const fmt = (n: number | null | undefined, d = 0) => {
    if (n == null) return '—'
    return n.toLocaleString('en-US', { maximumFractionDigits: d })
  }

  const daysAgo = (iso: string | null) => {
    if (!iso) return '—'
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
    return d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d}d ago`
  }

  const monthsAgo = (iso: string | null) => {
    if (!iso) return '—'
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / (86_400_000 * 30.44))
    return m < 1 ? '<1 month' : `${m} month${m > 1 ? 's' : ''}`
  }

  const { label: scoreLabel, color: scoreColor } = getScore(lead.lead_score_total)
  const recentVideos = lead.raw_youtube_data?.recentVideos?.slice(0, 5) ?? []

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleDelete() {
    if (!confirm('Delete this lead?')) return
    setDeleting(true)
    const res = await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/leads')
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all"
          style={{ background: toast.ok ? 'rgba(164,244,201,0.15)' : 'rgba(255,107,107,0.15)', border: `1px solid ${toast.ok ? 'rgba(164,244,201,0.4)' : 'rgba(255,107,107,0.4)'}`, color: toast.ok ? '#A4F4C9' : '#FF6B6B', backdropFilter: 'blur(12px)' }}>
          {toast.ok ? <Check size={15} /> : null}{toast.msg}
        </div>
      )}

      {/* Re-Enrich confirmation modal */}
      {showReEnrichModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card p-6 max-w-sm w-full mx-4" style={{ background: 'rgba(20, 20, 30, 0.9)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
            <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Re-enrich this channel?</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>We'll fetch fresh YouTube data and re-run AI analysis. Your edited remarks and G-Factor will be preserved.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowReEnrichModal(false)} className="btn-ghost flex-1" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Cancel</button>
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <Avatar
              thumbnailUrl={lead.channel_thumbnail_url || null}
              initials={initials}
              name={lead.lead_name}
              size="xl"
            />
            <div>
              <h1 className="text-3xl font-bold" style={{ background: 'linear-gradient(90deg, #a855f7 0%, #f15bb5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{lead.lead_name}</h1>
              <a href={lead.youtube_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm mt-2 hover:opacity-75 transition-opacity" style={{ color: '#c084fc' }}>
                <Play size={14} /> {lead.youtube_handle || 'YouTube Channel'}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}>Found by {lead.found_by}</span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg capitalize" style={{ background: 'rgba(241, 91, 181, 0.12)', color: '#f15bb5', border: '1px solid rgba(241, 91, 181, 0.25)' }}>{statusLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowReEnrichModal(true)} disabled={re_enriching} className="px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all disabled:opacity-50" style={{ background: 'rgba(164, 244, 201, 0.12)', color: '#A4F4C9', border: '1px solid rgba(164, 244, 201, 0.3)' }}>
            {re_enriching ? <>
              <Loader2 size={16} className="animate-spin" />Re-enriching…
            </> : <>
              <RefreshCw size={16} /> Re-Enrich
            </>}
          </button>
          <button onClick={() => router.push(`/leads/${lead.id}/edit`)} className="px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #d946ef 100%)', color: '#fff', border: '1px solid rgba(168, 85, 247, 0.5)' }}>
            <Pencil size={16} /> Edit
          </button>
          <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 rounded-xl disabled:opacity-50 flex items-center gap-2" style={{ background: 'rgba(255, 107, 107, 0.12)', color: 'var(--error)', border: '1px solid rgba(255, 107, 107, 0.25)' }}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT COLUMN */}
        <div className="space-y-5">

          {/* Channel Stats */}
          <div className="glass-card p-6" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(241, 91, 181, 0.05) 100%)', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 pb-3" style={{ color: '#a855f7', borderBottom: '1px solid rgba(168, 85, 247, 0.2)', letterSpacing: '1px' }}>Channel Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Subscribers', fmt(lead.subscriber_count)],
                ['Total Views', fmt(lead.total_views)],
                ['Videos', fmt(lead.video_count)],
                ['Channel Age', monthsAgo(lead.channel_created_at)],
                ['Last Upload', daysAgo(lead.last_upload_at)],
                ['Avg Views (10)', fmt(lead.avg_views_last_10)],
                ['S2V Ratio', lead.s2v_ratio_pct != null ? `${lead.s2v_ratio_pct}%` : '—'],
                ['Posts (30d)', lead.posting_frequency_30d ?? '—'],
              ].map(([label, val]) => (
                <div key={label as string} className="rounded-xl p-3" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)', fontWeight: '500', letterSpacing: '0.5px' }}>{label}</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Videos */}
          {recentVideos.length > 0 && (
            <div className="glass-card p-6" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(241, 91, 181, 0.05) 100%)', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4 pb-3" style={{ color: '#a855f7', borderBottom: '1px solid rgba(168, 85, 247, 0.2)', letterSpacing: '1px' }}>Latest Content</h3>
              <ul className="space-y-3">
                {recentVideos.map((v: any, i: number) => (
                  <li key={i} className="flex items-start justify-between gap-3 p-3 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
                    <span className="text-sm font-medium leading-relaxed flex-1" style={{ color: 'var(--text-primary)' }}>{v.title}</span>
                    <span className="text-xs flex-shrink-0 font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>{fmt(v.viewCount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">

          {/* Score Card */}
          <div className="glass-card p-5" style={{ borderColor: `${scoreColor}40` }}>
            <div className="flex items-end justify-between mb-3">
              <div>
                <div className="text-4xl font-black" style={{ color: scoreColor }}>{lead.lead_score_total?.toFixed(2) || '—'}</div>
                <div className="text-sm font-semibold mt-0.5" style={{ color: scoreColor }}>{scoreLabel}</div>
              </div>
            </div>
            <div className="w-full h-2 rounded-full mb-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((lead.lead_score_total - 1) / 4) * 100}%`, background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}99)` }} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[['YT Factor', lead.yt_score_factor?.toFixed(1) ?? '—'], ['Sub Range', lead.sub_range_factor?.toFixed(1) ?? '—'], ['S2V Factor', lead.s2v_factor?.toFixed(1) ?? '—'], ['G-Factor', lead.g_factor ? ((lead.g_factor - 1) / 4).toFixed(2) : '—']].map(([k, v]) => (
                <div key={k} className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                  <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{k}</div>
                  <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Details - Expanded */}
          {(lead.email || lead.website || lead.instagram || lead.twitter) && (
            <div className="glass-card p-8" style={{ background: 'linear-gradient(135deg, rgba(241, 91, 181, 0.12) 0%, rgba(168, 85, 247, 0.06) 100%)', border: '1px solid rgba(241, 91, 181, 0.2)' }}>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 pb-4" style={{ color: '#f15bb5', borderBottom: '1px solid rgba(241, 91, 181, 0.3)', letterSpacing: '1.5px' }}>Get In Touch</h3>
              <div className="space-y-4">
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-4 py-3.5 px-4 rounded-xl transition-all hover:scale-105 hover:shadow-lg" style={{ background: 'rgba(241,91,181,0.08)', border: '1.5px solid rgba(241, 91, 181, 0.3)' }}>
                    <Mail size={20} style={{ color: '#f15bb5', flexShrink: 0 }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{lead.email}</span>
                  </a>
                )}
                {lead.website && (
                  <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 py-3.5 px-4 rounded-xl transition-all hover:scale-105 hover:shadow-lg" style={{ background: 'rgba(241,91,181,0.08)', border: '1.5px solid rgba(241, 91, 181, 0.3)' }}>
                    <Globe size={20} style={{ color: '#f15bb5', flexShrink: 0 }} />
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{lead.website}</span>
                  </a>
                )}
                {lead.instagram && (
                  <a href={lead.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 py-3.5 px-4 rounded-xl transition-all hover:scale-105 hover:shadow-lg" style={{ background: 'rgba(241,91,181,0.08)', border: '1.5px solid rgba(241, 91, 181, 0.3)' }}>
                    <Camera size={20} style={{ color: '#f15bb5', flexShrink: 0 }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{lead.instagram}</span>
                  </a>
                )}
                {lead.twitter && (
                  <a href={lead.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 py-3.5 px-4 rounded-xl transition-all hover:scale-105 hover:shadow-lg" style={{ background: 'rgba(241,91,181,0.08)', border: '1.5px solid rgba(241, 91, 181, 0.3)' }}>
                    <MessageSquare size={20} style={{ color: '#f15bb5', flexShrink: 0 }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{lead.twitter}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Status Notes */}
          {lead.status_notes && (
            <div className="glass-card p-5" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.06) 0%, rgba(241, 91, 181, 0.03) 100%)', border: '1px solid rgba(168, 85, 247, 0.12)' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-3 pb-3" style={{ color: '#a855f7', borderBottom: '1px solid rgba(168, 85, 247, 0.15)', letterSpacing: '1px' }}>Status Update</h3>
              <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--text-primary)' }}>{lead.status_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Insights - Full Width */}
      <div className="glass-card p-8" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(241, 91, 181, 0.08) 100%)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
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

        {/* Strengths and Concerns in 2 Columns */}
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

          {/* Concerns */}
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

        {/* AI Confidence */}
        {(lead.ai_confidence || (lead.data_gaps ?? []).length > 0) && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(241, 91, 181, 0.08)', border: '1px solid rgba(241, 91, 181, 0.2)' }}>
            <div className="flex items-start gap-3">
              <Info size={16} style={{ color: '#f15bb5', marginTop: '2px' }} className="flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#f15bb5' }}>
                  AI Confidence: {lead.ai_confidence ?? 'Unknown'}
                </p>
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

      {/* Final Notes - Elongated and Detailed */}
      {(lead.remarks_final || lead.remarks_ai_draft) && (
        <div className="glass-card p-8" style={{ background: 'linear-gradient(135deg, rgba(241, 91, 181, 0.1) 0%, rgba(168, 85, 247, 0.06) 100%)', border: '1px solid rgba(241, 91, 181, 0.2)' }}>
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6 pb-4" style={{ color: '#f15bb5', borderBottom: '1px solid rgba(241, 91, 181, 0.3)', letterSpacing: '1.5px' }}>📌 Final Notes & Recommendations</h3>

          {lead.remarks_final && (
            <div className="mb-8 p-6 rounded-xl" style={{ background: 'rgba(241, 91, 181, 0.08)', border: '2px solid rgba(241, 91, 181, 0.3)' }}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium" style={{ color: 'var(--text-primary)', lineHeight: '1.8' }}>
                {lead.remarks_final}
              </p>
            </div>
          )}

          {lead.remarks_ai_draft && (
            <div>
              <button onClick={() => setShowAIDraft(v => !v)} className="flex items-center gap-2 text-xs font-semibold transition-colors hover:opacity-75 mb-4"
                style={{ color: 'var(--text-secondary)' }}>
                {showAIDraft ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showAIDraft ? 'Hide' : 'Show'} AI Summary
              </button>
              {showAIDraft && (
                <div className="text-sm leading-relaxed p-6 rounded-xl whitespace-pre-wrap" style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                  {lead.remarks_ai_draft}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(168, 85, 247, 0.1)' }}>
      <span className="text-xs font-medium" style={{ color: '#9b5de5', letterSpacing: '0.5px' }}>{label}</span>
      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}
