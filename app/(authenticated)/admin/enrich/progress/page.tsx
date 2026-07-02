'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, RotateCcw } from 'lucide-react'

const STATUS_STEPS = [
  { label: 'Validating YouTube URL', detail: 'Confirming channel is accessible…' },
  { label: 'Fetching channel data', detail: 'Pulling subscribers, views, and metadata…' },
  { label: 'Analysing recent videos', detail: 'Reviewing engagement and content patterns…' },
  { label: 'Looking up contact info', detail: 'Scanning about page and descriptions…' },
  { label: 'Running AI analysis', detail: 'Generating intelligence report with GROQ…' },
  { label: 'Finalising report', detail: 'Almost there, wrapping up…' },
]

export default function AdminProgressPage() {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [duplicateInfo, setDuplicateInfo] = useState<{
    leadName: string
    foundBy: string
    assignedTo: string
    addedAt: string
    existingLeadId: string
  } | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const formRaw = sessionStorage.getItem('enrich_form')
    if (!formRaw) {
      router.replace('/admin?section=enrich')
      return
    }

    const form = JSON.parse(formRaw)

    // Advance steps every ~10s
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STATUS_STEPS.length - 1))
    }, 10_000)

    fetch('/api/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then(async (res) => {
        const data = await res.json()
        clearInterval(interval)

        if (res.status === 409) {
          // Duplicate detected
          sessionStorage.removeItem('enrich_form')
          setDuplicateInfo(data)
          return
        }

        if (!res.ok) {
          sessionStorage.removeItem('enrich_form')
          setError(data.error || 'Something went wrong. Please try again.')
          return
        }

        // Success
        sessionStorage.removeItem('enrich_form')
        router.push(`/admin/leads/${data.leadId}/review`)
      })
      .catch(() => {
        clearInterval(interval)
        setError('Something went wrong. Please try again.')
      })

    return () => clearInterval(interval)
  }, [router])

  // ── Duplicate detected state ──
  if (duplicateInfo) {
    const dateAdded = new Date(duplicateInfo.addedAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <div className="glass-card p-10 max-w-sm w-full text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168,85,247,0.3)' }}
          >
            <AlertCircle size={26} style={{ color: '#a855f7' }} />
          </div>
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Already in the System
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-semibold">{duplicateInfo.leadName}</span> has already been added.
          </p>
          <div
            className="p-4 rounded-lg mb-6 text-sm space-y-2"
            style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168,85,247,0.2)' }}
          >
            <div style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold">Found by:</span> {duplicateInfo.foundBy}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold">Currently assigned to:</span> {duplicateInfo.assignedTo}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              <span className="font-semibold">Added on:</span> {dateAdded}
            </div>
          </div>
          <button
            onClick={() => router.push('/admin?section=enrich')}
            className="btn-primary w-full"
          >
            OK
          </button>
        </div>
      </div>
    )
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <div className="glass-card p-10 max-w-sm w-full text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(255, 107, 107, 0.15)', border: '1px solid rgba(255,107,107,0.3)' }}
          >
            <AlertCircle size={26} style={{ color: 'var(--error)' }} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Enrichment Failed
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{error}</p>
          <button
            onClick={() => router.push('/admin?section=enrich')}
            className="btn-primary w-full"
          >
            <RotateCcw size={15} />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ── Loading / Progress state ──
  const progress = ((stepIndex + 1) / STATUS_STEPS.length) * 100

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="card-glass p-10 max-w-sm w-full text-center animate-fade-in">
        {/* Animated spinner ring */}
        <div className="relative w-20 h-20 mx-auto mb-7">
          {/* Outer glow ring */}
          <div
            className="absolute inset-0 rounded-full animate-pulse-glow"
            style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)' }}
          />
          {/* Spinning arc */}
          <svg className="w-20 h-20 animate-spin" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="rgba(168, 85, 247, 0.1)"
              strokeWidth="4"
            />
            <circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="url(#spinGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="60 155"
            />
            <defs>
              <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#f15bb5" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center dot */}
          <div
            className="absolute inset-0 flex items-center justify-center text-sm font-bold"
            style={{ color: 'var(--text-secondary)' }}
          >
            {Math.round(progress)}%
          </div>
        </div>

        {/* Status labels */}
        <h2 className="text-lg font-bold mb-1 text-gradient-primary">
          {STATUS_STEPS[stepIndex].label}
        </h2>
        <p className="text-sm mb-6 transition-all duration-500" style={{ color: 'var(--text-secondary)' }}>
          {STATUS_STEPS[stepIndex].detail}
        </p>

        {/* Step progress bar */}
        <div
          className="w-full h-2 rounded-full overflow-hidden mb-5"
          style={{ background: 'rgba(168, 85, 247, 0.1)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out gradient-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step list */}
        <div className="space-y-1.5 text-left">
          {STATUS_STEPS.map((step, i) => (
            <div
              key={step.label}
              className="flex items-center gap-2.5 text-xs transition-all duration-300"
              style={{
                color: i < stepIndex
                  ? 'var(--text-secondary)'
                  : i === stepIndex
                  ? 'var(--text-primary)'
                  : 'var(--text-muted)',
              }}
            >
              <span
                className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: i < stepIndex
                    ? 'linear-gradient(135deg, #a855f7, #f15bb5)'
                    : i === stepIndex
                    ? 'rgba(168, 85, 247, 0.2)'
                    : 'rgba(255,255,255,0.06)',
                  border: i === stepIndex ? '1px solid #a855f7' : 'none',
                  color: i < stepIndex ? '#fff' : 'inherit',
                }}
              >
                {i < stepIndex ? '✓' : i + 1}
              </span>
              {step.label}
            </div>
          ))}
        </div>

        <p className="text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Don't close this tab — this takes 30–60 seconds
        </p>
      </div>
    </div>
  )
}
