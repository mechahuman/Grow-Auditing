'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_STEPS = [
  'Validating YouTube URL…',
  'Fetching channel data…',
  'Analysing recent videos…',
  'Looking up contact info…',
  'Running AI analysis…',
  'Almost done…',
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

    // Cycle through status messages every 10s
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

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-white border border-red-200 rounded-lg p-8 text-center">
        <div className="text-red-600 text-4xl mb-4">✕</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Enrichment failed</h2>
        <p className="text-sm text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => router.push('/enrich')}
          className="bg-gray-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-800"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-20 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Enriching lead…</h2>
      <p className="text-sm text-gray-500 transition-all duration-500">{STATUS_STEPS[stepIndex]}</p>
      <p className="text-xs text-gray-400 mt-4">This takes 30–60 seconds. Don't close this tab.</p>
    </div>
  )
}
