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

export const generateLessonRequestSchema = z.object({
  sectionId: z.string().uuid(),
})

const generatedActivityOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
})

const generatedActivityBaseSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(generatedActivityOptionSchema),
  answer: z.string(),
  numericAnswer: z.number().nullable(),
  tolerance: z.number().nullable(),
  keywords: z.array(z.string()),
  explanation: z.string().min(1),
})

export const generatedSimpleCheckSchema = generatedActivityBaseSchema.extend({
  type: z.enum(['multiple-choice', 'numeric-answer']),
})

export const generatedQuestionSchema = generatedActivityBaseSchema.extend({
  type: z.enum(['multiple-choice', 'numeric-answer', 'short-answer']),
})

export const generatedLessonSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  estimatedMinutes: z.number().int().min(5).max(40),
  xpReward: z.number().int().min(10).max(50),
  intro: z.object({
    objective: z.string().min(1),
  }),
  explanation: z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    sourcePages: z.array(z.number().int().positive()).min(1),
  }),
  workedExample: z.object({
    problem: z.string().min(1),
    steps: z.array(z.string().min(1)).min(2),
    sourcePages: z.array(z.number().int().positive()).min(1),
  }),
  simpleCheck: generatedSimpleCheckSchema,
  application: generatedQuestionSchema,
  challenge: generatedQuestionSchema,
  summary: z.object({
    recap: z.string().min(1),
  }),
})

export type GenerateLessonRequest = z.infer<typeof generateLessonRequestSchema>
export type GeneratedLesson = z.infer<typeof generatedLessonSchema>
export type GeneratedActivity = z.infer<typeof generatedQuestionSchema>

const generatedActivityJsonSchema = (types: string[]) =>
  ({
    type: 'object',
    additionalProperties: false,
    required: [
      'type',
      'prompt',
      'options',
      'answer',
      'numericAnswer',
      'tolerance',
      'keywords',
      'explanation',
    ],
    properties: {
      type: { type: 'string', enum: types },
      prompt: { type: 'string' },
      options: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'label'],
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
          },
        },
      },
      answer: { type: 'string' },
      numericAnswer: { type: ['number', 'null'] },
      tolerance: { type: ['number', 'null'] },
      keywords: {
        type: 'array',
        items: { type: 'string' },
      },
      explanation: { type: 'string' },
    },
  }) as const

export const generatedLessonJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'title',
    'description',
    'estimatedMinutes',
    'xpReward',
    'intro',
    'explanation',
    'workedExample',
    'simpleCheck',
    'application',
    'challenge',
    'summary',
  ],
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    estimatedMinutes: { type: 'integer', minimum: 5, maximum: 40 },
    xpReward: { type: 'integer', minimum: 10, maximum: 50 },
    intro: {
      type: 'object',
      additionalProperties: false,
      required: ['objective'],
      properties: {
        objective: { type: 'string' },
      },
    },
    explanation: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'content', 'sourcePages'],
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        sourcePages: {
          type: 'array',
          minItems: 1,
          items: { type: 'integer', minimum: 1 },
        },
      },
    },
    workedExample: {
      type: 'object',
      additionalProperties: false,
      required: ['problem', 'steps', 'sourcePages'],
      properties: {
        problem: { type: 'string' },
        steps: {
          type: 'array',
          minItems: 2,
          items: { type: 'string' },
        },
        sourcePages: {
          type: 'array',
          minItems: 1,
          items: { type: 'integer', minimum: 1 },
        },
      },
    },
    simpleCheck: generatedActivityJsonSchema(['multiple-choice', 'numeric-answer']),
    application: generatedActivityJsonSchema([
      'multiple-choice',
      'numeric-answer',
      'short-answer',
    ]),
    challenge: generatedActivityJsonSchema([
      'multiple-choice',
      'numeric-answer',
      'short-answer',
    ]),
    summary: {
      type: 'object',
      additionalProperties: false,
      required: ['recap'],
      properties: {
        recap: { type: 'string' },
      },
    },
  },
} as const

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
