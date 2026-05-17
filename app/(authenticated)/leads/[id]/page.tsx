'use client'

import { notFound, useParams } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Globe, Pencil, Trash2, Play, MessageSquare } from 'lucide-react'

export default function LeadPage() {
  const params = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<any>(null)
  const [statusLabel, setStatusLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const [leadRes, statusRes] = await Promise.all([
        supabase.from('leads').select('*').eq('id', params.id as string).single(),
        supabase.from('status_options').select('value, label').order('sort_order')
      ])

      if (leadRes.data) {
        setLead(leadRes.data)
        const label = statusRes.data?.find((opt: any) => opt.value === leadRes.data.status)?.label || leadRes.data.status
        setStatusLabel(label)
      }
      setLoading(false)
    }

    fetchData()
  }, [params.id])

  if (loading) return <div className="py-20 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</div>
  if (!lead) return <div className="py-20 text-center" style={{ color: 'var(--text-muted)' }}>Lead not found</div>

  function initials(name: string) { return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() }
  function getScoreLabel(score: number | null) {
    if (score == null) return { label: '—', color: '#ff6b6b' }
    if (score >= 4.0) return { label: 'Strong fit', color: '#a4f4c9' }
    if (score >= 3.0) return { label: 'Solid fit', color: '#6EB498' }
    if (score >= 2.0) return { label: 'Weak fit', color: '#FFB347' }
    return { label: 'Poor fit', color: '#FF6B6B' }
  }

  const { label: scoreLabel, color: scoreColor } = getScoreLabel(lead.lead_score_total)
  const recentVideos = lead.raw_youtube_data?.recentVideos?.slice(0, 4) ?? []

  async function handleDelete() {
    if (!confirm('Delete this lead?')) return
    setDeleting(true)
    const res = await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/leads')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #862ffa 0%, #f15bb5 100%)', color: '#fff' }}>
              {initials(lead.lead_name)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary">{lead.lead_name}</h1>
              <a href={lead.youtube_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                <Play size={14} /> {lead.youtube_handle || 'YouTube'}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(134, 47, 250, 0.15)', color: '#c084fc', border: '1px solid rgba(134, 47, 250, 0.3)' }}>{lead.found_by}</span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg capitalize" style={{ background: 'rgba(241, 91, 181, 0.12)', color: '#f15bb5', border: '1px solid rgba(241, 91, 181, 0.25)' }}>{statusLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(`/leads/${lead.id}/edit`)} className="px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #862ffa 0%, #d946ef 100%)', color: '#fff', border: '1px solid rgba(134, 47, 250, 0.5)' }}>
            <Pencil size={16} /> Edit
          </button>
          <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 rounded-xl disabled:opacity-50" style={{ background: 'rgba(255, 107, 107, 0.12)', color: 'var(--error)', border: '1px solid rgba(255, 107, 107, 0.25)' }}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="card-glass p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(134, 47, 250, 0.08) 0%, rgba(241, 91, 181, 0.05) 100%)', border: '1px solid rgba(134, 47, 250, 0.15)' }}>
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>YouTube</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[{ l: 'Subs', v: lead.subscriber_count }, { l: 'Videos', v: lead.video_count }, { l: 'Views', v: lead.total_views }, { l: 'Category', v: lead.category }].map(({ l, v }) => (
                <div key={l} className="rounded-xl p-4" style={{ background: 'rgba(134, 47, 250, 0.1)', border: '1px solid rgba(134, 47, 250, 0.2)' }}>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{l}</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{v ? typeof v === 'number' && v > 1000 ? v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1_000).toFixed(1)}K` : v : '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {recentVideos.length > 0 && (
            <div className="card-glass p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(134, 47, 250, 0.08) 0%, rgba(241, 91, 181, 0.05) 100%)', border: '1px solid rgba(134, 47, 250, 0.15)' }}>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>Videos</h2>
              <div className="space-y-2">
                {recentVideos.map((v: any, i: number) => (
                  <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{v.title}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{new Date(v.publishedAt).toLocaleDateString()}</p>
                    </div>
                    <p className="text-xs font-bold flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{v.viewCount >= 1_000_000 ? `${(v.viewCount / 1_000_000).toFixed(1)}M` : `${(v.viewCount / 1_000).toFixed(0)}K`}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card-glass p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(134, 47, 250, 0.08) 0%, rgba(241, 91, 181, 0.05) 100%)', border: '1px solid rgba(134, 47, 250, 0.15)' }}>
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>AI Analysis</h2>
            <div className="space-y-3">
              {[['Content', lead.content_style], ['Monetize', lead.monetization], ['Pattern', lead.posting_pattern]].map(([l, v]) => (
                <div key={l} className="flex justify-between items-start gap-3 pb-3" style={{ borderBottom: '1px solid rgba(134, 47, 250, 0.1)' }}>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{l}</span>
                  <span className="text-sm text-right" style={{ color: 'var(--text-primary)' }}>{v || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card-glass p-6 rounded-2xl text-center" style={{ background: `linear-gradient(135deg, rgba(134, 47, 250, 0.1) 0%, rgba(241, 91, 181, 0.08) 100%)`, border: `1px solid ${scoreColor}40` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Score</p>
            <div className="text-5xl font-black mb-2" style={{ color: scoreColor }}>{lead.lead_score_total?.toFixed(2) || '—'}</div>
            <p className="text-sm font-bold" style={{ color: scoreColor }}>{scoreLabel}</p>
          </div>

          {(lead.email || lead.website) && (
            <div className="card-glass p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(134, 47, 250, 0.08) 0%, rgba(241, 91, 181, 0.05) 100%)', border: '1px solid rgba(134, 47, 250, 0.15)' }}>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>Contact</h3>
              <div className="space-y-3">
                {lead.email && <div className="flex items-center gap-2"><Mail size={16} style={{ color: '#862ffa' }} /><div className="flex-1 min-w-0"><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Email</p><p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{lead.email}</p></div></div>}
                {lead.website && <div className="flex items-center gap-2"><Globe size={16} style={{ color: '#862ffa' }} /><div className="flex-1 min-w-0"><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Website</p><a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-sm truncate hover:opacity-70" style={{ color: '#862ffa' }}>{lead.website.substring(0, 40)}</a></div></div>}
              </div>
            </div>
          )}

          {lead.remarks_final && (
            <div className="card-glass p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(134, 47, 250, 0.08) 0%, rgba(241, 91, 181, 0.05) 100%)', border: '1px solid rgba(134, 47, 250, 0.15)' }}>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <MessageSquare size={14} /> Notes
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{lead.remarks_final}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
