import { createClient } from 'npm:@supabase/supabase-js@2'

import { DEFAULT_MODEL, openaiProvider } from '../_shared/ai.ts'
import { buildExtractConceptsPrompt } from '../_shared/prompts/extractConcepts.ts'
import {
  extractConceptsRequestSchema,
  extractedConceptsJsonSchema,
  extractedConceptsSchema,
  type ExtractedConcepts,
} from '../_shared/schemas.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const COURSE_ID = 'calculus-i'
const MAX_SOURCE_CHARS = 40_000

type SectionRow = {
  id: string
  material_id: string
  title: string
  section_number: string
  start_page: number | null
  end_page: number | null
}

type MaterialRow = {
  id: string
  structure_status: string
}

type PageRow = {
  page_number: number
  text: string
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  })
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message.slice(0, 500)
  }

  return 'Concept extraction failed.'
}

function getAdminClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase service credentials are missing.')
  }

  return createClient(url, serviceRoleKey)
}

function formatSectionSource(pages: PageRow[]): string {
  const blocks = pages.map(
    (page) => `--- page ${page.page_number} ---\n${page.text.trim()}`,
  )
  let output = blocks.join('\n\n')
  if (output.length > MAX_SOURCE_CHARS) {
    output = `${output.slice(0, MAX_SOURCE_CHARS)}\n\n[truncated]`
  }
  return output
}

function pageRange(pages: number[]): { page_start: number; page_end: number } {
  const sorted = [...pages].sort((a, b) => a - b)
  return {
    page_start: sorted[0],
    page_end: sorted[sorted.length - 1],
  }
}

async function updateConceptsStatus(
  client: ReturnType<typeof getAdminClient>,
  sectionId: string,
  patch: {
    concepts_status: 'idle' | 'extracting' | 'ready' | 'failed'
    concepts_error?: string | null
    concepts_model?: string | null
    concepts_extracted_at?: string | null
  },
) {
  const result = await client
    .from('source_sections')
    .update(patch)
    .eq('id', sectionId)

  if (result.error) {
    throw new Error(result.error.message)
  }
}

async function replaceSectionConcepts(
  client: ReturnType<typeof getAdminClient>,
  section: SectionRow,
  extracted: ExtractedConcepts,
) {
  const existing = await client
    .from('concept_sources')
    .select('concept_id')
    .eq('source_section_id', section.id)

  if (existing.error) {
    throw new Error(existing.error.message)
  }

  const conceptIds = [
    ...new Set(
      ((existing.data ?? []) as { concept_id: string }[]).map(
        (row) => row.concept_id,
      ),
    ),
  ]

  const deleteSources = await client
    .from('concept_sources')
    .delete()
    .eq('source_section_id', section.id)

  if (deleteSources.error) {
    throw new Error(deleteSources.error.message)
  }

  if (conceptIds.length > 0) {
    const remaining = await client
      .from('concept_sources')
      .select('concept_id')
      .in('concept_id', conceptIds)

    if (remaining.error) {
      throw new Error(remaining.error.message)
    }

    const stillUsed = new Set(
      ((remaining.data ?? []) as { concept_id: string }[]).map(
        (row) => row.concept_id,
      ),
    )
    const orphanIds = conceptIds.filter((id) => !stillUsed.has(id))
    if (orphanIds.length > 0) {
      const deleteConcepts = await client
        .from('concepts')
        .delete()
        .in('id', orphanIds)

      if (deleteConcepts.error) {
        throw new Error(deleteConcepts.error.message)
      }
    }
  }

  for (const concept of extracted.concepts) {
    const insertConcept = await client
      .from('concepts')
      .insert({
        course_id: COURSE_ID,
        name: concept.name,
        description: concept.description,
        importance: concept.importance,
        difficulty: concept.difficulty,
      })
      .select('id')
      .single()

    if (insertConcept.error || !insertConcept.data) {
      throw new Error(insertConcept.error?.message ?? 'Could not save a concept.')
    }

    const range = pageRange(concept.sourcePages)
    const insertSource = await client.from('concept_sources').insert({
      concept_id: (insertConcept.data as { id: string }).id,
      material_id: section.material_id,
      source_section_id: section.id,
      page_start: range.page_start,
      page_end: range.page_end,
    })

    if (insertSource.error) {
      throw new Error(insertSource.error.message)
    }
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  let sectionId: string | undefined
  let client: ReturnType<typeof getAdminClient> | undefined

  try {
    client = getAdminClient()
    const raw: unknown = await request.json()
    const parsed = extractConceptsRequestSchema.safeParse(raw)
    if (!parsed.success) {
      return jsonResponse({ error: 'sectionId is required.' }, 400)
    }

    sectionId = parsed.data.sectionId

    const sectionResult = await client
      .from('source_sections')
      .select('id, material_id, title, section_number, start_page, end_page')
      .eq('id', sectionId)
      .single()

    if (sectionResult.error || !sectionResult.data) {
      return jsonResponse({ error: 'Section was not found.' }, 404)
    }

    const section = sectionResult.data as SectionRow
    if (section.start_page == null || section.end_page == null) {
      throw new Error(
        'This section needs a start and end page on Course setup before concepts can be extracted.',
      )
    }

    const materialResult = await client
      .from('course_materials')
      .select('id, structure_status')
      .eq('id', section.material_id)
      .single()

    if (materialResult.error || !materialResult.data) {
      return jsonResponse({ error: 'Material was not found.' }, 404)
    }

    const material = materialResult.data as MaterialRow
    if (material.structure_status !== 'approved') {
      return jsonResponse(
        { error: 'Approve the course structure before extracting concepts.' },
        400,
      )
    }

    await updateConceptsStatus(client, sectionId, {
      concepts_status: 'extracting',
      concepts_error: null,
    })

    const pagesResult = await client
      .from('material_pages')
      .select('page_number, text')
      .eq('material_id', section.material_id)
      .gte('page_number', section.start_page)
      .lte('page_number', section.end_page)
      .order('page_number', { ascending: true })

    if (pagesResult.error) {
      throw new Error(pagesResult.error.message)
    }

    const pages = (pagesResult.data ?? []) as PageRow[]
    if (pages.length === 0) {
      throw new Error('No extracted pages were found for this section range.')
    }

    const prompt = buildExtractConceptsPrompt({
      sectionNumber: section.section_number,
      sectionTitle: section.title,
      source: formatSectionSource(pages),
    })

    const extracted = await openaiProvider.generateStructured({
      system: prompt.system,
      user: prompt.user,
      schema: extractedConceptsSchema,
      jsonSchema: extractedConceptsJsonSchema as unknown as Record<string, unknown>,
      schemaName: 'extracted_concepts',
      model: DEFAULT_MODEL,
    })

    await replaceSectionConcepts(client, section, extracted)
    await updateConceptsStatus(client, sectionId, {
      concepts_status: 'ready',
      concepts_error: null,
      concepts_model: DEFAULT_MODEL,
      concepts_extracted_at: new Date().toISOString(),
    })

    return jsonResponse({ concepts: extracted.concepts })
  } catch (error) {
    if (sectionId && client) {
      await updateConceptsStatus(client, sectionId, {
        concepts_status: 'failed',
        concepts_error: errorMessage(error),
      }).catch(() => undefined)
    }

    return jsonResponse({ error: errorMessage(error) }, 500)
  }
})
