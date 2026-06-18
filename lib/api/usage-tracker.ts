/**
 * Utility functions for tracking API usage across the application
 */

export interface APIUsageLog {
  apiName: 'youtube' | 'groq' | 'google_sheets' | 'supabase'
  userId: string
  endpoint?: string
  status: 'success' | 'error'
  errorMessage?: string
  quotaUnitsUsed?: number
  responseTimeMs?: number
}

/**
 * Log an API call to the usage tracking system
 * This is non-blocking and should not fail if logging fails
 */
export async function logAPIUsage(log: APIUsageLog): Promise<void> {
  try {
    // Get the base URL for fetch - handle both client and server
    let baseUrl: string
    if (typeof window !== 'undefined') {
      baseUrl = window.location.origin
    } else {
      // On server: use NEXT_PUBLIC_APP_URL, fallback to Vercel URL, then localhost
      baseUrl = process.env.NEXT_PUBLIC_APP_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
        || 'http://localhost:3000'
    }

    // Skip logging if we can't determine a valid URL
    if (!baseUrl || baseUrl === 'http://localhost:3000') {
      return
    }

    const response = await fetch(`${baseUrl}/api/track-api-usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiName: log.apiName,
        userId: log.userId,
        endpoint: log.endpoint || 'unknown',
        status: log.status,
        errorMessage: log.errorMessage || null,
        quotaUnitsUsed: log.quotaUnitsUsed || 1,
        responseTimeMs: log.responseTimeMs || 0,
      }),
    })

    if (!response.ok) {
      console.warn(`API usage logging returned status ${response.status} for ${log.apiName}`)
    }
  } catch (error) {
    // Silently fail - logging is non-critical and should not impact API functionality
    console.warn(`Failed to log API usage for ${log.apiName}:`, error)
  }
}

/**
 * Wrapper for timing API calls
 */
export function createAPITimer() {
  const startTime = Date.now()
  return () => Date.now() - startTime
}

/**
 * Format quota percentage with color coding
 */
export function getQuotaStatus(percentUsed: number): 'healthy' | 'warning' | 'exceeded' {
  if (percentUsed >= 100) return 'exceeded'
  if (percentUsed >= 80) return 'warning'
  return 'healthy'
}

/**
 * Format quota percentage for display
 */
export function formatQuotaPercent(used: number, max: number): number {
  if (max === 0) return 0
  return Math.round((used / max) * 100 * 10) / 10
}

/**
 * Format cost as currency
 */
export function formatCost(costCents: number): string {
  return `$${(costCents / 100).toFixed(2)}`
}
