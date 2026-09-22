import OpenAI from 'openai'

let _openai: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

export async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const provider = process.env.AI_PROVIDER ?? 'openai'

  if (provider === 'openai') {
    const openai = getOpenAIClient()
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

    const completion = await openai.chat.completions.create({
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
    throw new Error('Anthropic provider not yet implemented. Set AI_PROVIDER=openai in .env.local')
  }

  throw new Error(`Unknown AI_PROVIDER: "${provider}". Valid values: openai, anthropic`)
}
