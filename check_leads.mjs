import { createClient } from '@supabase/supabase-js'

const SERVICE_KEY = process.argv[2]
const admin = createClient('https://zdgcmcvkrvsormlxiioy.supabase.co', SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Check all leads
const { data: all, error } = await admin
  .from('leads')
  .select('id, lead_name, draft, lead_score_total')
  .limit(5)

if (error) {
  console.error('Error:', error)
} else {
  console.log('All leads:')
  all.forEach(l => {
    console.log(`  - ${l.lead_name} (draft=${l.draft}, score=${l.lead_score_total})`)
  })
}
