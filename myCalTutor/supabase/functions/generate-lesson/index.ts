import { createClient } from 'npm:@supabase/supabase-js@2'

import { DEFAULT_MODEL, openaiProvider } from '../_shared/ai.ts'
import {
  activityRowsForLesson,
  generatedLessonId,
  generatedSkillId,
  toLessonContent,
} from '../_shared/lesson.ts'
import { buildGenerateLessonPrompt } from '../_shared/prompts/generateLesson.ts'
import {
  generateLessonRequestSchema,
  generatedLessonJsonSchema,
  generatedLessonSchema,
} from '../_shared/schemas.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const COURSE_ID = 'calculus-i'
const UNIT_ID = 'from-textbook'
const MAX_SOURCE_CHARS = 40_000

type SectionRow = {
  id: string
  material_id: string
  title: string
  section_number: string
  start_page: number | null
  end_page: number | null
  concepts_status: string
}

type MaterialRow = {
  id: string
  structure_status: string
}

type PageRow = {
  page_number: number
  text: string
}

type ConceptRow = {
  id: string
  name: string
  description: string
  importance: number
  difficulty: number
}

type ConceptSourceRow = {
  concept_id: string
  page_start: number
  page_end: number
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

  return 'Lesson generation failed.'
}

function getAdminClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase service credentials are missing.')
  }

  return createClient(url, serviceRoleKey)
}

function formatSectionSource(pages: PageRow[]): {
  source: string
  includedPages: number[]
} {
  const includedPages: number[] = []
  const blocks: string[] = []
  let length = 0

  for (const page of pages) {
    const block = `--- page ${page.page_number} ---\n${page.text.trim()}`
    const extra = (blocks.length > 0 ? 2 : 0) + block.length
    if (length + extra > MAX_SOURCE_CHARS && blocks.length > 0) {
      break
    }
    blocks.push(block)
    includedPages.push(page.page_number)
    length += extra
  }

  let source = blocks.join('\n\n')
  if (includedPages.length < pages.length) {
    source = `${source}\n\n[truncated]`
  }

  return { source, includedPages }
}

async function updateLessonStatus(
  client: ReturnType<typeof getAdminClient>,
  sectionId: string,
  patch: {
    lesson_status: 'idle' | 'generating' | 'ready' | 'failed'
    lesson_error?: string | null
    lesson_model?: string | null
    lesson_generated_at?: string | null
    generated_lesson_id?: string | null
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

async function nextSkillSortOrder(
  client: ReturnType<typeof getAdminClient>,
  unitId: string,
) {
  const result = await client
    .from('skills')
    .select('sort_order')
    .eq('unit_id', unitId)

  if (result.error) {
    throw new Error(result.error.message)
  }

  const orders = ((result.data ?? []) as { sort_order: number }[]).map(
    (row) => row.sort_order,
  )
  return orders.length === 0 ? 1 : Math.max(...orders) + 1
}

async function persistGeneratedLesson(
  client: ReturnType<typeof getAdminClient>,
  input: {
    section: SectionRow
    lessonId: string
    skillId: string
    title: string
    description: string
    estimatedMinutes: number
    xpReward: number
    content: ReturnType<typeof toLessonContent>
  },
) {
  const unitResult = await client.from('units').upsert({
    id: UNIT_ID,
    course_id: COURSE_ID,
    title: 'From your textbook',
    description: 'Lessons generated from your uploaded textbook.',
    sort_order: 3,
  })
  if (unitResult.error) {
    throw new Error(unitResult.error.message)
  }

  const existingSkill = await client
    .from('skills')
    .select('id, sort_order')
    .eq('id', input.skillId)
    .maybeSingle()
  if (existingSkill.error) {
    throw new Error(existingSkill.error.message)
  }

  const sortOrder =
    (existingSkill.data as { sort_order: number } | null)?.sort_order ??
    (await nextSkillSortOrder(client, UNIT_ID))

  const skillHeading = [input.section.section_number, input.section.title]
    .filter(Boolean)
    .join(' — ')

  const skillResult = await client.from('skills').upsert({
    id: input.skillId,
    unit_id: UNIT_ID,
    title: skillHeading || input.title,
    description: input.description,
    sort_order: sortOrder,
    starts_completed: false,
  })
  if (skillResult.error) {
    throw new Error(skillResult.error.message)
  }

  const existingProgress = await client
    .from('skill_progress')
    .select('skill_id')
    .eq('skill_id', input.skillId)
    .maybeSingle()
  if (existingProgress.error) {
    throw new Error(existingProgress.error.message)
  }
  if (!existingProgress.data) {
    const progressResult = await client.from('skill_progress').insert({
      skill_id: input.skillId,
      completed: false,
    })
    if (progressResult.error) {
      throw new Error(progressResult.error.message)
    }
  }

  const lessonResult = await client.from('lessons').upsert({
    id: input.lessonId,
    skill_id: input.skillId,
    title: input.title,
    description: input.description,
    sort_order: 1,
    estimated_minutes: input.estimatedMinutes,
    xp_reward: input.xpReward,
    content: input.content,
  })
  if (lessonResult.error) {
    throw new Error(lessonResult.error.message)
  }

  const deleteActivities = await client
    .from('activities')
    .delete()
    .eq('lesson_id', input.lessonId)
  if (deleteActivities.error) {
    throw new Error(deleteActivities.error.message)
  }

  const activityRows = activityRowsForLesson(input.lessonId, input.content)
  if (activityRows.length > 0) {
    const insertActivities = await client.from('activities').insert(activityRows)
    if (insertActivities.error) {
      throw new Error(insertActivities.error.message)
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
    const parsed = generateLessonRequestSchema.safeParse(raw)
    if (!parsed.success) {
      return jsonResponse({ error: 'sectionId is required.' }, 400)
    }

    sectionId = parsed.data.sectionId
    const lessonId = generatedLessonId(sectionId)
    const skillId = generatedSkillId(sectionId)

    const sectionResult = await client
      .from('source_sections')
      .select(
        'id, material_id, title, section_number, start_page, end_page, concepts_status',
      )
      .eq('id', sectionId)
      .single()

    if (sectionResult.error || !sectionResult.data) {
      return jsonResponse({ error: 'Section was not found.' }, 404)
    }

    const section = sectionResult.data as SectionRow
    const startPage = section.start_page
    const endPage = section.end_page
    if (startPage == null || endPage == null) {
      return jsonResponse(
        {
          error:
            'This section needs a start and end page on Course setup before a lesson can be generated.',
        },
        400,
      )
    }
    if (section.concepts_status !== 'ready') {
      return jsonResponse(
        { error: 'Extract and review concepts for this section first.' },
        400,
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
        { error: 'Approve the course structure before generating a lesson.' },
        400,
      )
    }

    const sourcesResult = await client
      .from('concept_sources')
      .select('concept_id, page_start, page_end')
      .eq('source_section_id', section.id)

    if (sourcesResult.error) {
      throw new Error(sourcesResult.error.message)
    }

    const sources = (sourcesResult.data ?? []) as ConceptSourceRow[]
    const conceptIds = [...new Set(sources.map((row) => row.concept_id))]
    if (conceptIds.length === 0) {
      return jsonResponse(
        {
          error:
            'This section needs at least one concept before generating a lesson.',
        },
        400,
      )
    }

    const conceptsResult = await client
      .from('concepts')
      .select('id, name, description, importance, difficulty')
      .in('id', conceptIds)
      .order('importance', { ascending: false })

    if (conceptsResult.error) {
      throw new Error(conceptsResult.error.message)
    }

    const concepts = (conceptsResult.data ?? []) as ConceptRow[]
    if (concepts.length === 0) {
      return jsonResponse(
        {
          error:
            'This section needs at least one concept before generating a lesson.',
        },
        400,
      )
    }

    const sourcesByConcept = new Map<string, ConceptSourceRow[]>()
    for (const source of sources) {
      const list = sourcesByConcept.get(source.concept_id) ?? []
      list.push(source)
      sourcesByConcept.set(source.concept_id, list)
    }

    await updateLessonStatus(client, sectionId, {
      lesson_status: 'generating',
      lesson_error: null,
    })

    const pagesResult = await client
      .from('material_pages')
      .select('page_number, text')
      .eq('material_id', section.material_id)
      .gte('page_number', startPage)
      .lte('page_number', endPage)
      .order('page_number', { ascending: true })

    if (pagesResult.error) {
      throw new Error(pagesResult.error.message)
    }

    const pages = (pagesResult.data ?? []) as PageRow[]
    if (pages.length === 0) {
      throw new Error('No extracted pages were found for this section range.')
    }

    const formatted = formatSectionSource(pages)
    const prompt = buildGenerateLessonPrompt({
      sectionNumber: section.section_number,
      sectionTitle: section.title,
      concepts: concepts.map((concept) => {
        const conceptSources = sourcesByConcept.get(concept.id) ?? []
        const pageStart =
          conceptSources.length > 0
            ? Math.min(...conceptSources.map((source) => source.page_start))
            : startPage
        const pageEnd =
          conceptSources.length > 0
            ? Math.max(...conceptSources.map((source) => source.page_end))
            : endPage
        return {
          name: concept.name,
          description: concept.description,
          importance: concept.importance,
          difficulty: concept.difficulty,
          pageStart,
          pageEnd,
        }
      }),
      source: formatted.source,
    })

    const generated = await openaiProvider.generateStructured({
      system: prompt.system,
      user: prompt.user,
      schema: generatedLessonSchema,
      jsonSchema: generatedLessonJsonSchema as unknown as Record<string, unknown>,
      schemaName: 'generated_lesson',
      model: DEFAULT_MODEL,
    })

    const content = toLessonContent({
      intro: generated.intro,
      explanation: generated.explanation,
      workedExample: generated.workedExample,
      simpleCheck: generated.simpleCheck,
      application: generated.application,
      challenge: generated.challenge,
      summary: generated.summary,
      allowedPages: new Set(formatted.includedPages),
    })

    await persistGeneratedLesson(client, {
      section,
      lessonId,
      skillId,
      title: generated.title,
      description: generated.description,
      estimatedMinutes: generated.estimatedMinutes,
      xpReward: generated.xpReward,
      content,
    })

    await updateLessonStatus(client, sectionId, {
      lesson_status: 'ready',
      lesson_error: null,
      lesson_model: DEFAULT_MODEL,
      lesson_generated_at: new Date().toISOString(),
      generated_lesson_id: lessonId,
    })

    return jsonResponse({ lessonId })
  } catch (error) {
    if (sectionId && client) {
      await updateLessonStatus(client, sectionId, {
        lesson_status: 'failed',
        lesson_error: errorMessage(error),
      }).catch(() => undefined)
    }

    return jsonResponse({ error: errorMessage(error) }, 500)
  }
})
