'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Play, Mail, Globe, MessageSquare } from 'lucide-react'

export default function LeadDetail({ lead, statusLabel }: any) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const initials = lead.lead_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  
  const getScore = (s: number | null) => {
    if (!s) return { label: '—', color: '#ff6b6b' }
    if (s >= 4) return { label: 'Strong', color: '#a4f4c9' }
    if (s >= 3) return { label: 'Solid', color: '#6EB498' }
    if (s >= 2) return { label: 'Weak', color: '#FFB347' }
    return { label: 'Poor', color: '#FF6B6B' }
  }

  const { label: scoreLabel, color: scoreColor } = getScore(lead.lead_score_total)
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold" style={{ background: 'linear-gradient(135deg, #862ffa 0%, #f15bb5 100%)', color: '#fff' }}>{initials}</div>
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
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>YouTube Stats</h2>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>Subs: {lead.subscriber_count ? lead.subscriber_count >= 1_000_000 ? (lead.subscriber_count / 1_000_000).toFixed(1) + 'M' : (lead.subscriber_count / 1_000).toFixed(1) + 'K' : '—'}</p>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>Videos: {lead.video_count || '—'}</p>
          </div>
          {recentVideos.length > 0 && (
            <div className="card-glass p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(134, 47, 250, 0.08) 0%, rgba(241, 91, 181, 0.05) 100%)', border: '1px solid rgba(134, 47, 250, 0.15)' }}>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>Recent Videos</h2>
              {recentVideos.map((v: any) => <p key={v.title} className="text-sm" style={{ color: 'var(--text-primary)' }}>{v.title}</p>)}
            </div>
          )}
        </div>
        <div className="space-y-5">
          <div className="card-glass p-6 rounded-2xl text-center" style={{ background: `linear-gradient(135deg, rgba(134, 47, 250, 0.1) 0%, rgba(241, 91, 181, 0.08) 100%)`, border: `1px solid ${scoreColor}40` }}>
            <p className="text-5xl font-black mb-2" style={{ color: scoreColor }}>{lead.lead_score_total?.toFixed(2) || '—'}</p>
            <p className="text-sm font-bold" style={{ color: scoreColor }}>{scoreLabel}</p>
          </div>
          {lead.email && <div className="card-glass p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(134, 47, 250, 0.08) 0%, rgba(241, 91, 181, 0.05) 100%)', border: '1px solid rgba(134, 47, 250, 0.15)' }}>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>📧 {lead.email}</p>
          </div>}
        </div>
      </div>
    </div>
  )
}
