// Quick smoke test: verify Groq API key works and returns structured output.
// Run with: npx tsx scripts/test-groq.ts

import Groq from 'groq-sdk'

const API_KEY = process.env.GROQ_API_KEY
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
if (!API_KEY) throw new Error('GROQ_API_KEY not set in .env.local')

async function testGroq() {
  console.log('Testing Groq API...\n')
  console.log('Model:', MODEL)

  const groq = new Groq({ apiKey: API_KEY })

  const res = await groq.chat.completions.create({
    model: MODEL,
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: 'Say exactly: {"status": "ok", "message": "Groq API is working"}',
      },
    ],
  })

  const text = res.choices[0]?.message?.content ?? ''
  console.log('Response:', text)
  console.log('Tokens used:', res.usage?.total_tokens)
  console.log('\nGroq API: OK')
}

testGroq().catch(err => {
  console.error('FAILED:', err.message)
  process.exit(1)
})
