export type SkillStatus = 'locked' | 'available' | 'in_progress' | 'completed'

export type LessonIntro = {
  objective: string
}

export type LessonSummary = {
  recap: string
}

export type ExplanationBlock = {
  type: 'explanation'
  title: string
  content: string
  sourcePages?: number[]
}

export type WorkedExampleBlock = {
  type: 'worked-example'
  problem: string
  steps: string[]
  sourcePages?: number[]
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
  intro: LessonIntro
  blocks: LessonBlock[]
  summary: LessonSummary
}

export type Lesson = {
  id: string
  skillId: string
  title: string
  description: string
  estimatedMinutes: number
  xpReward: number
  content: LessonContent
}

export type Skill = {
  id: string
  title: string
  description: string
  sortOrder: number
  lessonId: string | null
  startsCompleted: boolean
}

export type Unit = {
  id: string
  title: string
  description: string
  sortOrder: number
  skills: Skill[]
}

export type Course = {
  id: string
  title: string
  description: string
  units: Unit[]
  lessons: Lesson[]
}

export type ProgressState = {
  xp: number
  streakDays: number
  lastPracticedOn: string | null
  completedLessonIds: string[]
  inProgress: { lessonId: string; blockIndex: number } | null
}
