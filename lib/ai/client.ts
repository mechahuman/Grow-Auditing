import Groq from 'groq-sdk'

let _groq: Groq | null = null

function getGroqClient(): Groq {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return _groq
}

export async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const provider = process.env.AI_PROVIDER ?? 'groq'

  if (provider === 'groq') {
    const groq = getGroqClient()
    const model = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'

    const completion = await groq.chat.completions.create({
      model,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })

    return completion.choices[0].message.content ?? ''
  }

  if (provider === 'anthropic') {
    throw new Error('Anthropic provider not yet implemented. Set AI_PROVIDER=groq in .env.local')
  }

  throw new Error(`Unknown AI_PROVIDER: "${provider}". Valid values: groq, anthropic`)
}
