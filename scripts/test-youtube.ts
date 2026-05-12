// Quick smoke test: verify YouTube API key works and can fetch channel data.
// Run with: npx tsx scripts/test-youtube.ts

const API_KEY = process.env.YOUTUBE_API_KEY
if (!API_KEY) throw new Error('YOUTUBE_API_KEY not set in .env.local')

async function testYouTube() {
  console.log('Testing YouTube Data API v3...\n')

  // Fetch Ryan Tolmia's channel using the @handle format
  const handle = 'RyanTolmia'
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${handle}&key=${API_KEY}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`YouTube API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json() as { items?: Array<{ id: string; snippet: { title: string; description: string }; statistics: { subscriberCount: string; viewCount: string; videoCount: string } }> }

  if (!data.items || data.items.length === 0) {
    throw new Error('No channel found for handle: ' + handle)
  }

  const channel = data.items[0]
  console.log('Channel ID:        ', channel.id)
  console.log('Title:             ', channel.snippet.title)
  console.log('Subscribers:       ', parseInt(channel.statistics.subscriberCount).toLocaleString())
  console.log('Total views:       ', parseInt(channel.statistics.viewCount).toLocaleString())
  console.log('Video count:       ', channel.statistics.videoCount)
  console.log('\nYouTube API key: OK')
}

testYouTube().catch(err => {
  console.error('FAILED:', err.message)
  process.exit(1)
})
