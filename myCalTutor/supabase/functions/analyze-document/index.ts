import { createClient } from 'npm:@supabase/supabase-js@2'

import { openaiProvider, STRUCTURE_MODEL } from '../_shared/ai.ts'
import { formatHeadingSource, harvestHeadings } from '../_shared/headings.ts'
import { buildAnalyzeDocumentPrompt } from '../_shared/prompts/analyzeDocument.ts'
import {
  analyzeDocumentRequestSchema,
  textbookStructureJsonSchema,
  textbookStructureSchema,
  type TextbookStructure,
} from '../_shared/schemas.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

type PageRow = {
  page_number: number
  text: string
}

type MaterialRow = {
  id: string
  material_type: string
  status: string
  page_count: number | null
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

  return 'Document analysis failed.'
}

function fillEndPages(
  structure: TextbookStructure,
  pageCount: number | null,
): TextbookStructure {
  type Item = {
    startPage: number | null
    setEndPage: (value: number | null) => void
  }

  const chapters = structure.chapters.map((chapter) => ({
    ...chapter,
    endPage: null as number | null,
    sections: chapter.sections.map((section) => ({
      ...section,
      endPage: null as number | null,
    })),
  }))

  const items: Item[] = []
  for (const chapter of chapters) {
    items.push({
      startPage: chapter.startPage,
      setEndPage: (value) => {
        chapter.endPage = value
      },
    })
    for (const section of chapter.sections) {
      items.push({
        startPage: section.startPage,
        setEndPage: (value) => {
          section.endPage = value
        },
      })
    }
  }

  for (let index = 0; index < items.length; index += 1) {
    const current = items[index]
    if (current.startPage == null) {
      current.setEndPage(null)
      continue
    }

    const next = items.slice(index + 1).find((item) => item.startPage != null)
    if (next?.startPage != null) {
      current.setEndPage(Math.max(current.startPage, next.startPage - 1))
    } else {
      current.setEndPage(pageCount)
    }
  }

  return {
    chapters: chapters.map((chapter) => ({
      number: chapter.number,
      title: chapter.title,
      startPage: chapter.startPage,
      endPage: chapter.endPage,
      sections: chapter.sections.map((section) => ({
        number: section.number,
        title: section.title,
        startPage: section.startPage,
        endPage: section.endPage,
      })),
    })),
  }
}

function getAdminClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase service credentials are missing.')
  }

  return createClient(url, serviceRoleKey)
}

async function loadPages(
  client: ReturnType<typeof createClient>,
  materialId: string,
) {
  const pages: PageRow[] = []
  const pageSize = 1000
  let from = 0

  while (true) {
    const result = await client
      .from('material_pages')
      .select('page_number, text')
      .eq('material_id', materialId)
      .order('page_number', { ascending: true })
      .range(from, from + pageSize - 1)

    if (result.error) {
      throw new Error(result.error.message)
    }

    const batch = (result.data ?? []) as PageRow[]
    pages.push(...batch)
    if (batch.length < pageSize) {
      break
    }

    from += pageSize
  }

  return pages
}

async function persistStructure(
  client: ReturnType<typeof createClient>,
  materialId: string,
  structure: ReturnType<typeof fillEndPages>,
) {
  const deleteResult = await client
    .from('source_sections')
    .delete()
    .eq('material_id', materialId)

  if (deleteResult.error) {
    throw new Error(deleteResult.error.message)
  }

  const rows: {
    id: string
    material_id: string
    parent_section_id: string | null
    title: string
    section_number: string
    section_type: 'chapter' | 'section'
    start_page: number | null
    end_page: number | null
    sort_order: number
  }[] = []

  for (const [chapterIndex, chapter] of structure.chapters.entries()) {
    const chapterId = crypto.randomUUID()
    rows.push({
      id: chapterId,
      material_id: materialId,
      parent_section_id: null,
      title: chapter.title,
      section_number: chapter.number,
      section_type: 'chapter',
      start_page: chapter.startPage,
      end_page: chapter.endPage,
      sort_order: chapterIndex,
    })

    for (const [sectionIndex, section] of chapter.sections.entries()) {
      rows.push({
        id: crypto.randomUUID(),
        material_id: materialId,
        parent_section_id: chapterId,
        title: section.title,
        section_number: section.number,
        section_type: 'section',
        start_page: section.startPage,
        end_page: section.endPage,
        sort_order: sectionIndex,
      })
    }
  }

  const insertResult = await client.from('source_sections').insert(rows)
  if (insertResult.error) {
    throw new Error(insertResult.error.message)
  }
}

async function updateStructureStatus(
  client: ReturnType<typeof createClient>,
  materialId: string,
  patch: {
    structure_status: 'idle' | 'analyzing' | 'draft' | 'approved' | 'failed'
    structure_error?: string | null
    structure_model?: string | null
    structure_analyzed_at?: string | null
  },
) {
  const result = await client
    .from('course_materials')
    .update(patch)
    .eq('id', materialId)

  if (result.error) {
    throw new Error(result.error.message)
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  let materialId: string | undefined
  let client: ReturnType<typeof getAdminClient> | undefined

  try {
    client = getAdminClient()
    const raw: unknown = await request.json()
    const parsed = analyzeDocumentRequestSchema.safeParse(raw)
    if (!parsed.success) {
      return jsonResponse({ error: 'materialId is required.' }, 400)
    }

    materialId = parsed.data.materialId

    const materialResult = await client
      .from('course_materials')
      .select('id, material_type, status, page_count')
      .eq('id', materialId)
      .single()

    if (materialResult.error || !materialResult.data) {
      return jsonResponse({ error: 'Material was not found.' }, 404)
    }

    const material = materialResult.data as MaterialRow
    if (material.material_type !== 'textbook' || material.status !== 'ready') {
      return jsonResponse(
        { error: 'Choose a ready textbook before detecting structure.' },
        400,
      )
    }

    await updateStructureStatus(client, materialId, {
      structure_status: 'analyzing',
      structure_error: null,
    })

    const pages = await loadPages(client, materialId)
    const candidates = harvestHeadings(
      pages.map((page) => ({
        pageNumber: page.page_number,
        text: page.text,
      })),
    )

    if (candidates.length === 0) {
      throw new Error('No heading candidates were found in the extracted text.')
    }

    const prompt = buildAnalyzeDocumentPrompt(formatHeadingSource(candidates))
    const structure = await openaiProvider.generateStructured({
      system: prompt.system,
      user: prompt.user,
      schema: textbookStructureSchema,
      jsonSchema: textbookStructureJsonSchema as unknown as Record<string, unknown>,
      schemaName: 'textbook_structure',
    })

    const withEndPages = fillEndPages(structure, material.page_count)
    await persistStructure(client, materialId, withEndPages)
    await updateStructureStatus(client, materialId, {
      structure_status: 'draft',
      structure_error: null,
      structure_model: STRUCTURE_MODEL,
      structure_analyzed_at: new Date().toISOString(),
    })

    return jsonResponse({ structure: withEndPages })
  } catch (error) {
    if (materialId && client) {
      await updateStructureStatus(client, materialId, {
        structure_status: 'failed',
        structure_error: errorMessage(error),
      }).catch(() => undefined)
    }

    return jsonResponse({ error: errorMessage(error) }, 500)
  }
})
