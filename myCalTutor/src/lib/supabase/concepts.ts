import { z } from 'zod'

import {
  getSupabaseClient,
  isSupabaseConfigured,
} from '@/lib/supabase/client'
import { SupabaseNotConfiguredError } from '@/lib/supabase/queries'
import type { ConceptSource, CourseConcept } from '@/types/concepts'

export { isSupabaseConfigured }

const COURSE_ID = 'calculus-i'

type ConceptRow = {
  id: string
  course_id: string
  name: string
  description: string
  importance: number
  difficulty: number
  created_at: string
}

type SourceRow = {
  id: string
  concept_id: string
  material_id: string
  source_section_id: string
  page_start: number
  page_end: number
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

function mapSource(row: SourceRow): ConceptSource {
  return {
    id: row.id,
    conceptId: row.concept_id,
    materialId: row.material_id,
    sourceSectionId: row.source_section_id,
    pageStart: row.page_start,
    pageEnd: row.page_end,
  }
}

function mapConcept(row: ConceptRow, sources: ConceptSource[]): CourseConcept {
  return {
    id: row.id,
    courseId: row.course_id,
    name: row.name,
    description: row.description,
    importance: row.importance,
    difficulty: row.difficulty,
    createdAt: row.created_at,
    sources,
  }
}

export async function fetchConceptsForSection(
  sectionId: string,
): Promise<CourseConcept[]> {
  const client = requireClient()
  const sourcesResult = await client
    .from('concept_sources')
    .select('id, concept_id, material_id, source_section_id, page_start, page_end')
    .eq('source_section_id', sectionId)

  throwIfError(sourcesResult.error)
  const sourceRows = (sourcesResult.data ?? []) as SourceRow[]
  const conceptIds = [...new Set(sourceRows.map((row) => row.concept_id))]
  if (conceptIds.length === 0) {
    return []
  }

  const conceptsResult = await client
    .from('concepts')
    .select('id, course_id, name, description, importance, difficulty, created_at')
    .in('id', conceptIds)
    .order('created_at', { ascending: true })

  throwIfError(conceptsResult.error)
  const sourcesByConcept = new Map<string, ConceptSource[]>()
  for (const row of sourceRows) {
    const list = sourcesByConcept.get(row.concept_id) ?? []
    list.push(mapSource(row))
    sourcesByConcept.set(row.concept_id, list)
  }

  return ((conceptsResult.data ?? []) as ConceptRow[]).map((row) =>
    mapConcept(row, sourcesByConcept.get(row.id) ?? []),
  )
}

export async function updateConcept(
  conceptId: string,
  patch: {
    name: string
    description: string
    importance: number
    difficulty: number
  },
) {
  const client = requireClient()
  const result = await client
    .from('concepts')
    .update({
      name: patch.name,
      description: patch.description,
      importance: patch.importance,
      difficulty: patch.difficulty,
    })
    .eq('id', conceptId)

  throwIfError(result.error)
}

export async function deleteConcept(conceptId: string) {
  const client = requireClient()
  const result = await client.from('concepts').delete().eq('id', conceptId)
  throwIfError(result.error)
}

export async function addConcept(input: {
  name: string
  description: string
  importance: number
  difficulty: number
  materialId: string
  sectionId: string
  pageStart: number
  pageEnd: number
}) {
  const client = requireClient()
  const insertConcept = await client
    .from('concepts')
    .insert({
      course_id: COURSE_ID,
      name: input.name,
      description: input.description,
      importance: input.importance,
      difficulty: input.difficulty,
    })
    .select('id')
    .single()

  throwIfError(insertConcept.error)
  if (!insertConcept.data) {
    throw new Error('Could not add the concept.')
  }

  const insertSource = await client.from('concept_sources').insert({
    concept_id: (insertConcept.data as { id: string }).id,
    material_id: input.materialId,
    source_section_id: input.sectionId,
    page_start: input.pageStart,
    page_end: input.pageEnd,
  })

  throwIfError(insertSource.error)
}

const extractResponseSchema = z.object({
  concepts: z.unknown().optional(),
  error: z.string().optional(),
})

export async function extractConcepts(sectionId: string) {
  const client = requireClient()
  const result = await client.functions.invoke('extract-concepts', {
    body: { sectionId },
  })

  const fromData = extractResponseSchema.safeParse(result.data)
  if (fromData.success && fromData.data.error) {
    throw new Error(fromData.data.error)
  }

  if (result.error) {
    throw new Error(result.error.message)
  }
}
