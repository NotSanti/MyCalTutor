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

export const extractConceptsRequestSchema = z.object({
  sectionId: z.string().uuid(),
})

export const extractedConceptSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  importance: z.number().int().min(1).max(5),
  difficulty: z.number().int().min(1).max(5),
  sourcePages: z.array(z.number().int().positive()).min(1),
})

export const extractedConceptsSchema = z.object({
  concepts: z.array(extractedConceptSchema).min(1),
})

export type ExtractConceptsRequest = z.infer<typeof extractConceptsRequestSchema>
export type ExtractedConcepts = z.infer<typeof extractedConceptsSchema>

export const extractedConceptsJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['concepts'],
  properties: {
    concepts: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'description', 'importance', 'difficulty', 'sourcePages'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          importance: { type: 'integer', minimum: 1, maximum: 5 },
          difficulty: { type: 'integer', minimum: 1, maximum: 5 },
          sourcePages: {
            type: 'array',
            minItems: 1,
            items: { type: 'integer', minimum: 1 },
          },
        },
      },
    },
  },
} as const
