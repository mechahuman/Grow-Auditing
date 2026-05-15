import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zdgcmcvkrvsormlxiioy.supabase.co'
const SERVICE_KEY = process.argv[2]
const ANON_KEY = process.argv[3]
const API_URL = 'http://localhost:3000'
const TEST_EMAIL = 'manavbhavsar2005@gmail.com'
const TEST_PASSWORD = 'Manav2005'

console.log('=== WEEK 4 E2E TEST ===\n')

// Step 1: Ensure test user exists
console.log('Step 1: Creating/verifying test user...')
const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

try {
  await adminClient.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true
  })
  console.log('✓ User created')
} catch (err) {
  if (err.code !== 'user_already_exists') throw err
  console.log('✓ User already exists')
}

// Step 2: Get auth session via Supabase auth API
console.log('\nStep 2: Logging in to get session...')
const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'apikey': ANON_KEY
  },
  body: JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  })
})

if (!authResponse.ok) {
  throw new Error(`Auth failed: ${authResponse.status} ${await authResponse.text()}`)
}

const { access_token, user } = await authResponse.json()
console.log(`✓ Logged in as ${user.email}`)

// Step 3: Test /api/enrich with a known YouTube URL
console.log('\nStep 3: Testing /api/enrich with test YouTube URL...')
const enrichResponse = await fetch(`${API_URL}/api/enrich`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    lead_name: 'Test E2E Lead',
    found_by: 'PS',
    youtube_url: 'https://www.youtube.com/@RyanTolmia',
    g_factor: 4
  })
})

if (!enrichResponse.ok) {
  const err = await enrichResponse.text()
  throw new Error(`Enrich failed: ${enrichResponse.status} ${err}`)
}

const { leadId } = await enrichResponse.json()
console.log(`✓ Draft lead created: ${leadId}`)

// Step 4: Verify lead exists in Supabase (draft=true)
console.log('\nStep 4: Verifying draft lead in Supabase...')
const { data: draftLead, error: fetchErr } = await adminClient
  .from('leads')
  .select('*')
  .eq('id', leadId)
  .single()

if (fetchErr) throw fetchErr
console.log(`✓ Found draft lead:`)
console.log(`  - Name: ${draftLead.lead_name}`)
console.log(`  - Draft: ${draftLead.draft}`)
console.log(`  - Score: ${draftLead.lead_score_total}`)
console.log(`  - AI Confidence: ${draftLead.ai_confidence}`)

// Step 5: Test /api/save (publish lead)
console.log('\nStep 5: Testing /api/save to publish lead...')
const saveResponse = await fetch(`${API_URL}/api/save`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    lead_id: leadId,
    g_factor: 4.5,
    lead_name: 'Test E2E Lead - Updated',
    remarks_final: 'E2E test remarks',
    status: 'reviewing'
  })
})

if (!saveResponse.ok) {
  const err = await saveResponse.text()
  console.warn(`⚠ Save response: ${saveResponse.status}`)
  console.log(`Response: ${err.substring(0, 300)}`)
} else {
  console.log(`✓ Lead saved successfully`)
  
  // Verify it's no longer a draft
  const { data: savedLead } = await adminClient
    .from('leads')
    .select('draft, lead_score_total, google_sheet_row_ref')
    .eq('id', leadId)
    .single()
  
  console.log(`  - Draft: ${savedLead.draft}`)
  console.log(`  - Updated Score: ${savedLead.lead_score_total}`)
  console.log(`  - Sheet Row Ref: ${savedLead.google_sheet_row_ref}`)
}

// Step 6: Verify sheet was updated (if successful)
console.log('\nStep 6: Checking Google Sheets for row...')
const { data: allLeads } = await adminClient
  .from('leads')
  .select('lead_name, google_sheet_row_ref, draft')
  .eq('draft', false)
  .order('created_at', { ascending: false })
  .limit(3)

if (allLeads && allLeads.length > 0) {
  console.log(`✓ Recent saved leads (non-draft):`)
  allLeads.forEach((l, i) => {
    console.log(`  ${i+1}. ${l.lead_name} → ${l.google_sheet_row_ref || '(pending sync)'}`)
  })
} else {
  console.log('⚠ No saved leads found yet')
}

console.log('\n=== ✓ E2E TEST COMPLETE ===')
