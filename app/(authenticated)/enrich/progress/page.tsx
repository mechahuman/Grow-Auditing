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

export default function ProgressPage() {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const formRaw = sessionStorage.getItem('enrich_form')
    if (!formRaw) {
      router.replace('/enrich')
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
      .then((res) => res.json())
      .then((data) => {
        clearInterval(interval)
        sessionStorage.removeItem('enrich_form')
        if (data.error) {
          setError(data.error)
        } else {
          router.push(`/leads/${data.leadId}/review`)
        }
      })
      .catch(() => {
        clearInterval(interval)
        setError('Something went wrong. Please try again.')
      })

    return () => clearInterval(interval)
  }, [router])

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
            onClick={() => router.push('/enrich')}
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
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="glass-card p-10 max-w-sm w-full text-center">
        {/* Animated spinner ring */}
        <div className="relative w-20 h-20 mx-auto mb-7">
          {/* Outer glow ring */}
          <div
            className="absolute inset-0 rounded-full animate-pulse-slow"
            style={{ background: 'radial-gradient(circle, rgba(164,244,201,0.15) 0%, transparent 70%)' }}
          />
          {/* Spinning arc */}
          <svg className="w-20 h-20 animate-spin" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="rgba(164,244,201,0.1)"
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
                <stop offset="0%" stopColor="#A4F4C9" />
                <stop offset="100%" stopColor="#6EB498" />
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
        <h2 className="text-lg font-bold mb-1 text-gradient">
          {STATUS_STEPS[stepIndex].label}
        </h2>
        <p className="text-sm mb-6 transition-all duration-500" style={{ color: 'var(--text-muted)' }}>
          {STATUS_STEPS[stepIndex].detail}
        </p>

        {/* Step progress bar */}
        <div
          className="w-full h-1.5 rounded-full overflow-hidden mb-5"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #A4F4C9 0%, #6EB498 100%)',
            }}
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
                    ? 'linear-gradient(135deg, #A4F4C9, #6EB498)'
                    : i === stepIndex
                    ? 'rgba(164,244,201,0.2)'
                    : 'rgba(255,255,255,0.06)',
                  border: i === stepIndex ? '1px solid #A4F4C9' : 'none',
                  color: i < stepIndex ? '#0D3B66' : 'inherit',
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
