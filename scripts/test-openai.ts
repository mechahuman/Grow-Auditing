// Quick smoke test: verify OpenAI API key works and returns structured output.
// Run with: npx tsx --env-file=.env.local scripts/test-openai.ts

import OpenAI from 'openai'

const API_KEY = process.env.OPENAI_API_KEY
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

if (!API_KEY) throw new Error('OPENAI_API_KEY not set in .env.local')

async function testOpenAI() {
  console.log('Testing OpenAI API...\n')
  console.log('Model:', MODEL)

  const openai = new OpenAI({ apiKey: API_KEY })

  const res = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 100,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: 'Say exactly in JSON: {"status": "ok", "message": "OpenAI API is working"}',
      },
    ],
  })

  const text = res.choices[0]?.message?.content ?? ''
  console.log('Response:', text)
  console.log('Tokens used:', res.usage?.total_tokens)
  console.log('\nOpenAI API: OK')
}

testOpenAI().catch(err => {
  console.error('FAILED:', err.message)
  process.exit(1)
})
