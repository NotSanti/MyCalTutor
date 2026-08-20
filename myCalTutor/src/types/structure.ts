export type SectionType = 'chapter' | 'section'

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
}

export type StructureChapter = SourceSection & {
  sections: SourceSection[]
}
