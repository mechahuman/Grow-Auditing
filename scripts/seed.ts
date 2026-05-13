import { createServiceClient } from '../lib/supabase/service'

const members = [
  { initials: 'PS', full_name: 'Parth Shah',     email: null, active: true },
  { initials: 'JS', full_name: 'Jnanam Shah',    email: null, active: true },
  { initials: 'D',  full_name: 'Deep',           email: null, active: true },
  { initials: 'MR', full_name: 'Maanit Rathod',  email: null, active: true },
  { initials: 'MS', full_name: 'Meet Sanghavi',  email: null, active: true },
  { initials: 'PD', full_name: 'Pratik Dhotre',  email: null, active: true },
  { initials: 'OR', full_name: 'Om Rane',        email: null, active: true },
]

async function main() {
  const supabase = createServiceClient()

  // Upsert so re-running is safe
  const { error } = await supabase
    .from('team_members')
    .upsert(members, { onConflict: 'initials' })

  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }

  console.log(`Seeded ${members.length} team members.`)

  const { data } = await supabase.from('team_members').select('initials, full_name').order('full_name')
  console.log('Current team_members table:')
  data?.forEach((m) => console.log(`  ${m.initials} — ${m.full_name}`))
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
