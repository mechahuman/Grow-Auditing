import { createClient } from '@supabase/supabase-js'

const SERVICE_KEY = process.argv[2]
const admin = createClient('https://zdgcmcvkrvsormlxiioy.supabase.co', SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

console.log('=== VERIFYING SCORING FACTORS ===\n')

// Get a saved lead with all its scoring data
const { data: leads } = await admin
  .from('leads')
  .select(`
    lead_name,
    lead_score_total,
    yt_factor,
    sub_range_factor,
    s2v_ratio_factor,
    g_factor,
    subscriber_count,
    s2v_ratio_pct
  `)
  .eq('draft', false)
  .limit(1)

if (!leads || leads.length === 0) {
  console.log('No saved leads found')
  process.exit(1)
}

const lead = leads[0]
console.log(`Lead: ${lead.lead_name}`)
console.log(`  - Subscribers: ${lead.subscriber_count}`)
console.log(`  - S2V Ratio: ${lead.s2v_ratio_pct}%`)
console.log(`\nScoring Factors:`)
console.log(`  - YT Factor: ${lead.yt_factor}`)
console.log(`  - Sub Range Factor: ${lead.sub_range_factor}`)
console.log(`  - S2V Ratio Factor: ${lead.s2v_ratio_factor}`)
console.log(`  - G Factor: ${lead.g_factor}`)

// Verify formula: 1 + (yt + sub + s2v + g_norm) where g_norm = (g-1)/4
const gNorm = (lead.g_factor - 1) / 4
const calculated = 1 + (lead.yt_factor + lead.sub_range_factor + lead.s2v_ratio_factor + gNorm)
console.log(`\nFormula Check:`)
console.log(`  - G Normalized: (${lead.g_factor} - 1) / 4 = ${gNorm.toFixed(2)}`)
console.log(`  - Calculated: 1 + (${lead.yt_factor} + ${lead.sub_range_factor} + ${lead.s2v_ratio_factor} + ${gNorm.toFixed(2)})`)
console.log(`  - = ${calculated.toFixed(2)}`)
console.log(`  - Stored: ${lead.lead_score_total}`)
console.log(`  - Match: ${Math.abs(calculated - lead.lead_score_total) < 0.01 ? '✓' : '✗'}`)

console.log('\n✓ Verification complete')
