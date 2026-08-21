export function generatedSkillId(sectionId: string) {
  return `skill-gen-${sectionId}`
}

export function generatedLessonId(sectionId: string) {
  return `lesson-gen-${sectionId}`
}

export type ExplanationBlock = {
  type: 'explanation'
  title: string
  content: string
  sourcePages: number[]
}

export type WorkedExampleBlock = {
  type: 'worked-example'
  problem: string
  steps: string[]
  sourcePages: number[]
}

export type MultipleChoiceBlock = {
  type: 'multiple-choice'
  prompt: string
  options: { id: string; label: string }[]
  answer: string
  explanation: string
}

export type NumericAnswerBlock = {
  type: 'numeric-answer'
  prompt: string
  answer: number
  tolerance?: number
  explanation: string
}

export type ShortAnswerBlock = {
  type: 'short-answer'
  prompt: string
  keywords: string[]
  explanation: string
}

export type LessonBlock =
  | ExplanationBlock
  | WorkedExampleBlock
  | MultipleChoiceBlock
  | NumericAnswerBlock
  | ShortAnswerBlock

export type LessonContent = {
  intro: { objective: string }
  blocks: LessonBlock[]
  summary: { recap: string }
}

export type ActivityRow = {
  id: string
  lesson_id: string
  type: string
  prompt: string
  content: Record<string, unknown>
  correct_answer: string
  explanation: string
  sort_order: number
}

export type GeneratedActivityInput = {
  type: 'multiple-choice' | 'numeric-answer' | 'short-answer'
  prompt: string
  options: { id: string; label: string }[]
  answer: string
  numericAnswer: number | null
  tolerance: number | null
  keywords: string[]
  explanation: string
}

export function clipSourcePages(
  pages: number[],
  allowed: ReadonlySet<number>,
): number[] {
  const clipped = [...new Set(pages.filter((page) => allowed.has(page)))].sort(
    (a, b) => a - b,
  )
  if (clipped.length > 0) {
    return clipped
  }

  return [...allowed].sort((a, b) => a - b)
}

function toActivityBlock(activity: GeneratedActivityInput): LessonBlock {
  if (activity.type === 'multiple-choice') {
    if (activity.options.length < 2) {
      throw new Error('Multiple-choice questions need at least two options.')
    }

    const answer = activity.options.some((option) => option.id === activity.answer)
      ? activity.answer
      : null
    if (!answer) {
      throw new Error('Multiple-choice answer must match an option id.')
    }

    return {
      type: 'multiple-choice',
      prompt: activity.prompt,
      options: activity.options,
      answer,
      explanation: activity.explanation,
    }
  }

  if (activity.type === 'numeric-answer') {
    const parsed =
      typeof activity.numericAnswer === 'number' &&
      Number.isFinite(activity.numericAnswer)
        ? activity.numericAnswer
        : Number(activity.answer)
    if (!Number.isFinite(parsed)) {
      throw new Error('Numeric questions need a numeric answer.')
    }

    return {
      type: 'numeric-answer',
      prompt: activity.prompt,
      answer: parsed,
      ...(activity.tolerance != null ? { tolerance: activity.tolerance } : {}),
      explanation: activity.explanation,
    }
  }

  const keywords = activity.keywords
    .map((keyword) => keyword.trim())
    .filter(Boolean)
  if (keywords.length === 0) {
    throw new Error('Short-answer questions need at least one keyword.')
  }

  return {
    type: 'short-answer',
    prompt: activity.prompt,
    keywords,
    explanation: activity.explanation,
  }
}

export function toLessonContent(input: {
  intro: { objective: string }
  explanation: { title: string; content: string; sourcePages: number[] }
  workedExample: { problem: string; steps: string[]; sourcePages: number[] }
  simpleCheck: GeneratedActivityInput
  application: GeneratedActivityInput
  challenge: GeneratedActivityInput
  summary: { recap: string }
  allowedPages: ReadonlySet<number>
}): LessonContent {
  return {
    intro: input.intro,
    blocks: [
      {
        type: 'explanation',
        title: input.explanation.title,
        content: input.explanation.content,
        sourcePages: clipSourcePages(input.explanation.sourcePages, input.allowedPages),
      },
      {
        type: 'worked-example',
        problem: input.workedExample.problem,
        steps: input.workedExample.steps,
        sourcePages: clipSourcePages(
          input.workedExample.sourcePages,
          input.allowedPages,
        ),
      },
      toActivityBlock(input.simpleCheck),
      toActivityBlock(input.application),
      toActivityBlock(input.challenge),
    ],
    summary: input.summary,
  }
}

function activityPayload(block: LessonBlock): Pick<
  ActivityRow,
  'type' | 'prompt' | 'content' | 'correct_answer' | 'explanation'
> | null {
  if (block.type === 'multiple-choice') {
    return {
      type: block.type,
      prompt: block.prompt,
      content: { options: block.options, answer: block.answer },
      correct_answer: block.answer,
      explanation: block.explanation,
    }
  }

  if (block.type === 'numeric-answer') {
    return {
      type: block.type,
      prompt: block.prompt,
      content: { answer: block.answer, tolerance: block.tolerance ?? null },
      correct_answer: String(block.answer),
      explanation: block.explanation,
    }
  }

  if (block.type === 'short-answer') {
    return {
      type: block.type,
      prompt: block.prompt,
      content: { keywords: block.keywords },
      correct_answer: block.keywords[0] ?? '',
      explanation: block.explanation,
    }
  }

  return null
}

export function activityRowsForLesson(
  lessonId: string,
  content: LessonContent,
): ActivityRow[] {
  const rows: ActivityRow[] = []
  content.blocks.forEach((block, blockIndex) => {
    const payload = activityPayload(block)
    if (!payload) {
      return
    }

    rows.push({
      id: `${lessonId}-${blockIndex}`,
      lesson_id: lessonId,
      sort_order: blockIndex,
      ...payload,
    })
  })
  return rows
}
