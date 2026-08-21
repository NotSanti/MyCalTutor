export type SectionType = 'chapter' | 'section'

export const CONCEPTS_STATUSES = [
  'idle',
  'extracting',
  'ready',
  'failed',
] as const

export type ConceptsStatus = (typeof CONCEPTS_STATUSES)[number]

export const LESSON_STATUSES = [
  'idle',
  'generating',
  'ready',
  'failed',
] as const

export type LessonStatus = (typeof LESSON_STATUSES)[number]

export type SourceSection = {
  id: string
  materialId: string
  parentSectionId: string | null
  title: string
  sectionNumber: string
  sectionType: SectionType
  startPage: number | null
  endPage: number | null
  sortOrder: number
  conceptsStatus: ConceptsStatus
  conceptsError: string | null
  conceptsModel: string | null
  conceptsExtractedAt: string | null
  generatedLessonId: string | null
  lessonStatus: LessonStatus
  lessonError: string | null
  lessonModel: string | null
  lessonGeneratedAt: string | null
}

export type StructureChapter = SourceSection & {
  sections: SourceSection[]
}
