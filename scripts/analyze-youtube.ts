import { fetchAllYouTubeData } from '../lib/youtube'
import { analyzeChannel } from '../lib/ai'

const url = process.argv[2]

if (!url) {
  console.error('Usage: npm run analyze-youtube -- <youtube-url>')
  process.exit(1)
}

async function main() {
  console.log(`\nFetching YouTube data for: ${url}`)
  const data = await fetchAllYouTubeData(url)

  console.log(`Channel: ${data.title} | ${data.subscriberCount.toLocaleString()} subs`)
  console.log(`Running AI analysis (provider: ${process.env.AI_PROVIDER ?? 'groq'})...\n`)

  const result = await analyzeChannel(data)

  if (result.enrichment_partial) {
    console.warn('WARNING: enrichment_partial=true — AI response was incomplete or failed\n')
  }

  const { analysis } = result

  console.log('='.repeat(60))
  console.log(`Category:        ${analysis.category}`)
  console.log(`Content style:   ${analysis.content_style}`)
  console.log(`Monetization:    ${analysis.monetization}`)
  console.log(`Posting pattern: ${analysis.posting_pattern}`)
  console.log(`Confidence:      ${analysis.ai_confidence}`)
  console.log('')
  console.log('Strengths:')
  analysis.strengths.forEach((s) => console.log(`  + ${s}`))
  console.log('')
  console.log('Concerns:')
  analysis.concerns.forEach((c) => console.log(`  - ${c}`))
  console.log('')
  console.log('Remarks draft:')
  console.log(`  "${analysis.remarks_draft}"`)
  if (analysis.data_gaps.length > 0) {
    console.log('')
    console.log('Data gaps:')
    analysis.data_gaps.forEach((d) => console.log(`  ? ${d}`))
  }
  console.log('='.repeat(60))
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : err)
  process.exit(1)
})
