'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'

interface TeamMember {
  initials: string
  full_name: string
}

export default function EnrichPage() {
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
    router.push('/enrich/progress')
  }

  function field(name: keyof typeof form, label: string, type = 'text', required = true, hint?: string) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type={type}
          value={form[name]}
          onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
          className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${
            errors[name] ? 'border-red-400' : 'border-gray-300'
          }`}
        />
        {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
        {errors[name] && <p className="text-xs text-red-600 mt-1">{errors[name]}</p>}
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Enrich a Lead</h1>
        <p className="text-sm text-gray-500 mt-0.5">Takes ~30–60 seconds — we'll fetch YouTube data and run AI analysis.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        {field('lead_name', 'Lead Name')}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Found By <span className="text-red-500">*</span>
          </label>
          <select
            value={form.found_by}
            onChange={(e) => setForm((f) => ({ ...f, found_by: e.target.value }))}
            className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${
              errors.found_by ? 'border-red-400' : 'border-gray-300'
            }`}
          >
            <option value="">Select team member…</option>
            {teamMembers.map((m) => (
              <option key={m.initials} value={m.initials}>{m.full_name} ({m.initials})</option>
            ))}
          </select>
          {errors.found_by && <p className="text-xs text-red-600 mt-1">{errors.found_by}</p>}
        </div>

        {field('youtube_url', 'YouTube URL', 'url')}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            G-Factor <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">Your gut feeling for this lead's growth potential</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="flex-1">
                <input
                  type="radio"
                  name="g_factor"
                  value={String(n)}
                  checked={form.g_factor === String(n)}
                  onChange={(e) => setForm((f) => ({ ...f, g_factor: e.target.value }))}
                  className="sr-only"
                />
                <span className={`block text-center py-2 rounded-md border text-sm font-medium cursor-pointer transition-colors ${
                  form.g_factor === String(n)
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                }`}>
                  {n}
                </span>
              </label>
            ))}
          </div>
          {errors.g_factor && <p className="text-xs text-red-600 mt-1">{errors.g_factor}</p>}
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Optional — auto-fetched if blank</p>
          {field('email', 'Email', 'email', false)}
          {field('website', 'Website', 'url', false)}
        </div>

        <button
          type="submit"
          className="w-full bg-gray-900 text-white rounded-md py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Enrich Lead →
        </button>
      </form>
    </div>
  )
}
