export type ConceptSource = {
  id: string
  conceptId: string
  materialId: string
  sourceSectionId: string
  pageStart: number
  pageEnd: number
}

export type CourseConcept = {
  id: string
  courseId: string
  name: string
  description: string
  importance: number
  difficulty: number
  createdAt: string
  sources: ConceptSource[]
}
