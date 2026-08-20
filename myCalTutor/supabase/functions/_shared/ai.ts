import type { z } from 'npm:zod@4'

export const DEFAULT_MODEL = 'gpt-4o-mini'
export const STRUCTURE_MODEL = DEFAULT_MODEL

export type AIRequest<T> = {
  system: string
  user: string
  schema: z.ZodType<T>
  jsonSchema: Record<string, unknown>
  schemaName: string
  model?: string
}

export type AIProvider = {
  generateStructured: <T>(request: AIRequest<T>) => Promise<T>
}

type OpenAIChatResponse = {
  choices?: { message?: { content?: string | null } }[]
  error?: { message?: string }
}

export const openaiProvider: AIProvider = {
  async generateStructured<T>(request: AIRequest<T>): Promise<T> {
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured.')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model ?? DEFAULT_MODEL,
        temperature: 0,
        messages: [
          { role: 'system', content: request.system },
          { role: 'user', content: request.user },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: request.schemaName,
            strict: true,
            schema: request.jsonSchema,
          },
        },
      }),
    })

    const payload = (await response.json()) as OpenAIChatResponse
    if (!response.ok) {
      throw new Error(payload.error?.message ?? `OpenAI request failed (${response.status}).`)
    }

    const content = payload.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('OpenAI returned an empty response.')
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new Error('OpenAI returned invalid JSON.')
    }

    return request.schema.parse(parsed)
  },
}
