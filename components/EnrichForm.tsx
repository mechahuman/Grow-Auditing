'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase/client'
import { User, Link2, Zap, Mail, Globe } from 'lucide-react'

interface TeamMember {
  initials: string
  full_name: string
}

const G_FACTOR_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Below Avg',
  3: 'Average',
  4: 'High',
  5: 'Very High',
}

interface EnrichFormProps {
  progressPath: string
}

export default function EnrichForm({ progressPath }: EnrichFormProps) {
  const router = useRouter()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [form, setForm] = useState({
    lead_name: '',
    found_by: '',
    youtube_url: '',
    g_factor: '3',
    email: '',
    website: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('team_members')
      .select('initials, full_name')
      .eq('active', true)
      .order('full_name')
      .then(({ data }) => setTeamMembers(data ?? []))
  }, [])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.lead_name.trim()) e.lead_name = 'Required'
    if (!form.found_by) e.found_by = 'Required'
    if (!form.youtube_url.trim()) e.youtube_url = 'Required'
    else if (!form.youtube_url.includes('youtube.com') && !form.youtube_url.includes('youtu.be')) {
      e.youtube_url = 'Must be a YouTube URL'
    }
    if (!form.g_factor) e.g_factor = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    sessionStorage.setItem('enrich_form', JSON.stringify(form))
    router.push(progressPath)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient-primary mb-2">Start an Audit</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Takes ~30–60 seconds — we'll fetch YouTube data and run AI analysis.
          </p>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit} className="glass-card p-7 space-y-5">

          {/* Lead Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                   style={{ color: 'var(--text-secondary)' }}>
              Lead Name <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }} />
              <input
                id="enrich-lead-name"
                type="text"
                value={form.lead_name}
                onChange={(e) => setForm((f) => ({ ...f, lead_name: e.target.value }))}
                placeholder="e.g. TechReviewHub"
                className="input-field pl-9"
                style={errors.lead_name ? { borderColor: 'var(--error)' } : {}}
              />
            </div>
            {errors.lead_name && (
              <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.lead_name}</p>
            )}
          </div>

          {/* Found By */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                   style={{ color: 'var(--text-secondary)' }}>
              Found By <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <select
              id="enrich-found-by"
              value={form.found_by}
              onChange={(e) => setForm((f) => ({ ...f, found_by: e.target.value }))}
              className="input-field appearance-none"
              style={{
                ...(errors.found_by ? { borderColor: 'var(--error)' } : {}),
                color: form.found_by ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              <option value="">Select team member…</option>
              {teamMembers.map((m) => (
                <option key={m.initials} value={m.initials}>
                  {m.full_name} ({m.initials})
                </option>
              ))}
            </select>
            {errors.found_by && (
              <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.found_by}</p>
            )}
          </div>

          {/* YouTube URL */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                   style={{ color: 'var(--text-secondary)' }}>
              YouTube URL <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <div className="relative">
              <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                     style={{ color: 'var(--text-muted)' }} />
              <input
                id="enrich-youtube-url"
                type="url"
                value={form.youtube_url}
                onChange={(e) => setForm((f) => ({ ...f, youtube_url: e.target.value }))}
                placeholder="https://youtube.com/@channel"
                className="input-field pl-9"
                style={errors.youtube_url ? { borderColor: 'var(--error)' } : {}}
              />
            </div>
            {errors.youtube_url && (
              <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.youtube_url}</p>
            )}
          </div>

          {/* G-Factor */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-0.5"
                   style={{ color: 'var(--text-secondary)' }}>
              G-Factor <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              Your gut feeling for this lead's growth potential
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => {
                const isSelected = form.g_factor === String(n)
                return (
                  <label key={n} className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="g_factor"
                      value={String(n)}
                      checked={isSelected}
                      onChange={(e) => setForm((f) => ({ ...f, g_factor: e.target.value }))}
                      className="sr-only"
                    />
                    <span
                      className="flex flex-col items-center py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200"
                      style={isSelected ? {
                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(241, 91, 181, 0.15) 100%)',
                        borderColor: '#a855f7',
                        color: '#c084fc',
                        boxShadow: '0 0 12px rgba(168, 85, 247, 0.35)',
                      } : {
                        background: 'transparent',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span className="text-base font-bold">{n}</span>
                      <span className="text-[10px] mt-0.5 hidden sm:block">{G_FACTOR_LABELS[n]}</span>
                    </span>
                  </label>
                )
              })}
            </div>
            {errors.g_factor && (
              <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.g_factor}</p>
            )}
          </div>

          {/* Divider — Optional fields */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3"
               style={{ color: 'var(--text-muted)' }}>
              Optional — auto-fetched if blank
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                       style={{ color: 'var(--text-secondary)' }}>Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: 'var(--text-muted)' }} />
                  <input
                    id="enrich-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="contact@channel.com"
                    className="input-field pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                       style={{ color: 'var(--text-secondary)' }}>Website</label>
                <div className="relative">
                  <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                         style={{ color: 'var(--text-muted)' }} />
                  <input
                    id="enrich-website"
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                    placeholder="https://their-site.com"
                    className="input-field pl-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            id="enrich-submit"
            type="submit"
            className="btn-cta w-full py-3 text-base font-bold justify-center mt-6"
          >
            <Zap size={18} />
            Run Audit →
          </button>
        </form>
      </div>
    </div>
  )
}
