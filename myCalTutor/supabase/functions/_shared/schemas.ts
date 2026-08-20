import { z } from 'npm:zod@4'

export const analyzeDocumentRequestSchema = z.object({
  materialId: z.string().min(1),
})

export const textbookSectionSchema = z.object({
  number: z.string().min(1),
  title: z.string().min(1),
  startPage: z.number().int().positive().nullable(),
})

export const textbookChapterSchema = z.object({
  number: z.string().min(1),
  title: z.string().min(1),
  startPage: z.number().int().positive().nullable(),
  sections: z.array(textbookSectionSchema),
})

export const textbookStructureSchema = z.object({
  chapters: z.array(textbookChapterSchema).min(1),
})

export type AnalyzeDocumentRequest = z.infer<typeof analyzeDocumentRequestSchema>
export type TextbookStructure = z.infer<typeof textbookStructureSchema>

export const textbookStructureJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['chapters'],
  properties: {
    chapters: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['number', 'title', 'startPage', 'sections'],
        properties: {
          number: { type: 'string' },
          title: { type: 'string' },
          startPage: { type: ['integer', 'null'] },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['number', 'title', 'startPage'],
              properties: {
                number: { type: 'string' },
                title: { type: 'string' },
                startPage: { type: ['integer', 'null'] },
              },
            },
          },
        },
      },
    },
  },
} as const
