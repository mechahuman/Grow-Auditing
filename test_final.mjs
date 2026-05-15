import { createClient } from '@supabase/supabase-js'

const SERVICE_KEY = process.argv[2]
const admin = createClient('https://zdgcmcvkrvsormlxiioy.supabase.co', SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

console.log('=== COMPREHENSIVE E2E STATUS ===\n')

// Check ALL leads with full details
const { data: all, error: allErr } = await admin
  .from('leads')
  .select('*')
  .order('created_at', { ascending: false })

if (allErr) {
  console.error('Error:', allErr.message)
  process.exit(1)
}

console.log(`Total leads in database: ${all.length}\n`)

// Separate by draft status
const drafts = all.filter(l => l.draft === true)
const saved = all.filter(l => l.draft === false)

console.log(`DRAFT LEADS (${drafts.length}):`)
drafts.forEach(d => {
  console.log(`  ✗ ${d.lead_name}`)
  console.log(`    Score: ${d.lead_score_total}, AI: ${d.ai_confidence}, Sheet Ref: ${d.google_sheet_row_ref || 'none'}`)
})

console.log(`\nSAVED LEADS (${saved.length}):`)
saved.forEach(s => {
  console.log(`  ✓ ${s.lead_name}`)
  console.log(`    Score: ${s.lead_score_total}, Status: ${s.status}, Sheet Ref: ${s.google_sheet_row_ref || 'none'}`)
})

// List all column names to understand the schema
console.log(`\nDatabase Columns (${all.length > 0 ? Object.keys(all[0]).length : '0'}):`)
if (all.length > 0) {
  console.log(Object.keys(all[0]).sort().join(', '))
}
