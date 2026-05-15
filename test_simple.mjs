import { createClient } from '@supabase/supabase-js'

const SERVICE_KEY = process.argv[2]
const SUPABASE_URL = 'https://zdgcmcvkrvsormlxiioy.supabase.co'

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

console.log('=== WEEK 4 E2E STATUS CHECK ===\n')

// Check existing draft leads
console.log('Step 1: Checking for existing draft leads...')
const { data: drafts, error: draftErr } = await admin
  .from('leads')
  .select('id, lead_name, draft, created_at')
  .eq('draft', true)
  .limit(1)

if (draftErr) {
  console.error('Error fetching drafts:', draftErr)
} else {
  console.log(`Found ${drafts?.length || 0} draft leads`)
  drafts?.forEach(d => {
    console.log(`  - ${d.lead_name} (${d.id})`)
  })
}

// Check saved leads  
console.log('\nStep 2: Checking for saved (non-draft) leads...')
const { data: saved, error: savedErr } = await admin
  .from('leads')
  .select('id, lead_name, draft, google_sheet_row_ref, lead_score_total')
  .eq('draft', false)
  .order('created_at', { ascending: false })
  .limit(3)

if (savedErr) {
  console.error('Error fetching saved:', savedErr)
} else {
  console.log(`Found ${saved?.length || 0} saved leads`)
  saved?.forEach(s => {
    console.log(`  - ${s.lead_name} (Score: ${s.lead_score_total}) → Sheet: ${s.google_sheet_row_ref || 'pending'}`)
  })
}

// Check team members
console.log('\nStep 3: Checking team members...')
const { data: team, error: teamErr } = await admin
  .from('team_members')
  .select('initials, full_name')
  .eq('active', true)

if (teamErr) {
  console.error('Error fetching team:', teamErr)
} else {
  console.log(`Found ${team?.length || 0} active team members:`)
  team?.forEach(t => {
    console.log(`  - ${t.initials} (${t.full_name})`)
  })
}

console.log('\n✓ Status check complete')
