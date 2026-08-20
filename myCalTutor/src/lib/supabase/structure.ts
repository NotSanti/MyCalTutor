import { z } from 'zod'

import {
  getSupabaseClient,
  isSupabaseConfigured,
} from '@/lib/supabase/client'
import { SupabaseNotConfiguredError } from '@/lib/supabase/queries'
import type { StructureStatus } from '@/types/materials'
import type {
  SourceSection,
  StructureChapter,
} from '@/types/structure'

export { isSupabaseConfigured }

type SectionRow = {
  id: string
  material_id: string
  parent_section_id: string | null
  title: string
  section_number: string
  section_type: 'chapter' | 'section'
  start_page: number | null
  end_page: number | null
  sort_order: number
}

function requireClient() {
  const client = getSupabaseClient()
  if (!client) {
    throw new SupabaseNotConfiguredError()
  }

  return client
}

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message)
  }
}

function mapSection(row: SectionRow): SourceSection {
  return {
    id: row.id,
    materialId: row.material_id,
    parentSectionId: row.parent_section_id,
    title: row.title,
    sectionNumber: row.section_number,
    sectionType: row.section_type,
    startPage: row.start_page,
    endPage: row.end_page,
    sortOrder: row.sort_order,
  }
}

export function assembleStructure(rows: SourceSection[]): StructureChapter[] {
  const chapters = rows
    .filter((row) => row.sectionType === 'chapter')
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return chapters.map((chapter) => ({
    ...chapter,
    sections: rows
      .filter(
        (row) =>
          row.sectionType === 'section' && row.parentSectionId === chapter.id,
      )
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }))
}

export async function fetchSourceSections(
  materialId: string,
): Promise<SourceSection[]> {
  const client = requireClient()
  const result = await client
    .from('source_sections')
    .select(
      'id, material_id, parent_section_id, title, section_number, section_type, start_page, end_page, sort_order',
    )
    .eq('material_id', materialId)
    .order('sort_order', { ascending: true })

  throwIfError(result.error)
  return ((result.data ?? []) as SectionRow[]).map(mapSection)
}

export async function updateSourceSection(
  sectionId: string,
  patch: { title?: string; sectionNumber?: string },
) {
  const client = requireClient()
  const result = await client
    .from('source_sections')
    .update({
      ...(patch.title != null ? { title: patch.title } : {}),
      ...(patch.sectionNumber != null
        ? { section_number: patch.sectionNumber }
        : {}),
    })
    .eq('id', sectionId)

  throwIfError(result.error)
}

export async function deleteSourceSection(sectionId: string) {
  const client = requireClient()
  const result = await client.from('source_sections').delete().eq('id', sectionId)
  throwIfError(result.error)
}

export async function swapSourceSectionOrder(firstId: string, secondId: string) {
  const client = requireClient()
  const result = await client
    .from('source_sections')
    .select('id, sort_order')
    .in('id', [firstId, secondId])

  throwIfError(result.error)
  const rows = (result.data ?? []) as { id: string; sort_order: number }[]
  const first = rows.find((row) => row.id === firstId)
  const second = rows.find((row) => row.id === secondId)
  if (!first || !second) {
    throw new Error('Could not reorder those sections.')
  }

  const firstUpdate = await client
    .from('source_sections')
    .update({ sort_order: second.sort_order })
    .eq('id', first.id)
  throwIfError(firstUpdate.error)

  const secondUpdate = await client
    .from('source_sections')
    .update({ sort_order: first.sort_order })
    .eq('id', second.id)
  throwIfError(secondUpdate.error)
}

export async function updateStructureStatus(
  materialId: string,
  status: StructureStatus,
) {
  const client = requireClient()
  const result = await client
    .from('course_materials')
    .update({
      structure_status: status,
      structure_error: null,
    })
    .eq('id', materialId)

  throwIfError(result.error)
}

const analyzeResponseSchema = z.object({
  structure: z.unknown().optional(),
  error: z.string().optional(),
})

export async function analyzeDocument(materialId: string) {
  const client = requireClient()
  const result = await client.functions.invoke('analyze-document', {
    body: { materialId },
  })

  const fromData = analyzeResponseSchema.safeParse(result.data)
  if (fromData.success && fromData.data.error) {
    throw new Error(fromData.data.error)
  }

  if (result.error) {
    throw new Error(result.error.message)
  }
}
