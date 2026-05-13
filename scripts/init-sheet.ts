import { initSheet } from '../lib/sheets'

async function main() {
  console.log('Initializing Google Sheet…')
  await initSheet()
  console.log('Done.')
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : err)
  process.exit(1)
})
