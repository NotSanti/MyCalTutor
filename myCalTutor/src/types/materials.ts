import { z } from 'zod'

export const MATERIAL_TYPES = [
  'textbook',
  'syllabus',
  'notes',
  'worksheet',
] as const

export const materialTypeSchema = z.enum(MATERIAL_TYPES)

export type MaterialType = z.infer<typeof materialTypeSchema>

export const MATERIAL_STATUSES = [
  'uploading',
  'extracting',
  'ready',
  'failed',
] as const

export type MaterialStatus = (typeof MATERIAL_STATUSES)[number]

export type CourseMaterial = {
  id: string
  courseId: string
  name: string
  originalFilename: string
  materialType: MaterialType
  storagePath: string | null
  pageCount: number | null
  status: MaterialStatus
  errorMessage: string | null
  createdAt: string
}

export type MaterialPage = {
  id: string
  materialId: string
  pageNumber: number
  text: string
}

export type MaterialWithPages = CourseMaterial & {
  pages: MaterialPage[]
}

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  textbook: 'Textbook',
  syllabus: 'Syllabus',
  notes: 'Notes',
  worksheet: 'Worksheet',
}
