import { extractPdfFile, type ExtractProgress } from '@/lib/pdf/extract'
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from '@/lib/supabase/client'
import { SupabaseNotConfiguredError } from '@/lib/supabase/queries'
import type {
  CourseMaterial,
  MaterialPage,
  MaterialStatus,
  MaterialType,
  MaterialWithPages,
  StructureStatus,
} from '@/types/materials'

export { isSupabaseConfigured }

const COURSE_ID = 'calculus-i'
const BUCKET = 'course-materials'
const PAGE_BATCH_SIZE = 50
const MATERIAL_COLUMNS =
  'id, course_id, name, original_filename, material_type, storage_path, page_count, status, error_message, structure_status, structure_error, structure_model, structure_analyzed_at, created_at'

type MaterialRow = {
  id: string
  course_id: string
  name: string
  original_filename: string
  material_type: MaterialType
  storage_path: string | null
  page_count: number | null
  status: MaterialStatus
  error_message: string | null
  structure_status: StructureStatus
  structure_error: string | null
  structure_model: string | null
  structure_analyzed_at: string | null
  created_at: string
}

type PageRow = {
  id: string
  material_id: string
  page_number: number
  text: string
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

function mapMaterial(row: MaterialRow): CourseMaterial {
  return {
    id: row.id,
    courseId: row.course_id,
    name: row.name,
    originalFilename: row.original_filename,
    materialType: row.material_type,
    storagePath: row.storage_path,
    pageCount: row.page_count,
    status: row.status,
    errorMessage: row.error_message,
    structureStatus: row.structure_status,
    structureError: row.structure_error,
    structureModel: row.structure_model,
    structureAnalyzedAt: row.structure_analyzed_at,
    createdAt: row.created_at,
  }
}

function mapPage(row: PageRow): MaterialPage {
  return {
    id: row.id,
    materialId: row.material_id,
    pageNumber: row.page_number,
    text: row.text,
  }
}

function nameFromFilename(filename: string) {
  const withoutExt = filename.replace(/\.pdf$/i, '').trim()
  return withoutExt || filename
}

function sanitizeFilename(filename: string) {
  const cleaned = filename.replace(/[/\\]+/g, '-').replace(/\s+/g, ' ').trim()
  return (cleaned || 'document.pdf').slice(0, 180)
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message.slice(0, 500)
  }

  return 'Extraction failed.'
}

export async function fetchMaterials(): Promise<CourseMaterial[]> {
  const client = requireClient()
  const result = await client
    .from('course_materials')
    .select(MATERIAL_COLUMNS)
    .eq('course_id', COURSE_ID)
    .order('created_at', { ascending: false })

  throwIfError(result.error)
  return ((result.data ?? []) as MaterialRow[]).map(mapMaterial)
}

export async function fetchMaterialWithPages(
  materialId: string,
): Promise<MaterialWithPages> {
  const client = requireClient()
  const [materialResult, pagesResult] = await Promise.all([
    client
      .from('course_materials')
      .select(MATERIAL_COLUMNS)
      .eq('id', materialId)
      .single(),
    client
      .from('material_pages')
      .select('id, material_id, page_number, text')
      .eq('material_id', materialId)
      .order('page_number', { ascending: true }),
  ])

  throwIfError(materialResult.error)
  throwIfError(pagesResult.error)

  if (!materialResult.data) {
    throw new Error('Material was not found.')
  }

  return {
    ...mapMaterial(materialResult.data as MaterialRow),
    pages: ((pagesResult.data ?? []) as PageRow[]).map(mapPage),
  }
}

async function updateMaterialStatus(
  materialId: string,
  patch: {
    status: MaterialStatus
    storage_path?: string
    page_count?: number | null
    error_message?: string | null
  },
) {
  const client = requireClient()
  const result = await client
    .from('course_materials')
    .update(patch)
    .eq('id', materialId)

  throwIfError(result.error)
}

async function replacePages(
  materialId: string,
  pages: { pageNumber: number; text: string }[],
) {
  const client = requireClient()
  const deleteResult = await client
    .from('material_pages')
    .delete()
    .eq('material_id', materialId)

  throwIfError(deleteResult.error)

  for (let index = 0; index < pages.length; index += PAGE_BATCH_SIZE) {
    const batch = pages.slice(index, index + PAGE_BATCH_SIZE).map((page) => ({
      material_id: materialId,
      page_number: page.pageNumber,
      text: page.text,
    }))
    const insertResult = await client.from('material_pages').insert(batch)
    throwIfError(insertResult.error)
  }
}

async function downloadMaterialPdf(storagePath: string, filename: string) {
  const client = requireClient()
  const result = await client.storage.from(BUCKET).download(storagePath)
  throwIfError(result.error)

  if (!result.data) {
    throw new Error('Could not download the stored PDF.')
  }

  return new File([result.data], filename, { type: 'application/pdf' })
}

async function extractAndPersist(
  material: CourseMaterial,
  file: Blob,
  onProgress?: (progress: ExtractProgress) => void,
) {
  await updateMaterialStatus(material.id, {
    status: 'extracting',
    error_message: null,
  })

  const pages = await extractPdfFile(file, onProgress)
  await replacePages(material.id, pages)
  await updateMaterialStatus(material.id, {
    status: 'ready',
    page_count: pages.length,
    error_message: null,
  })

  return pages.length
}

export async function uploadCourseMaterial(input: {
  file: File
  materialType: MaterialType
  onCreated?: (material: CourseMaterial) => void
  onProgress?: (progress: ExtractProgress) => void
}): Promise<CourseMaterial> {
  const client = requireClient()
  const id = crypto.randomUUID()
  const originalFilename = sanitizeFilename(input.file.name)
  const storagePath = `${COURSE_ID}/${id}/${originalFilename}`

  const insertResult = await client
    .from('course_materials')
    .insert({
      id,
      course_id: COURSE_ID,
      name: nameFromFilename(originalFilename),
      original_filename: originalFilename,
      material_type: input.materialType,
      storage_path: storagePath,
      status: 'uploading',
    })
    .select(MATERIAL_COLUMNS)
    .single()

  throwIfError(insertResult.error)

  const material = mapMaterial(insertResult.data as MaterialRow)
  input.onCreated?.(material)

  try {
    const uploadResult = await client.storage
      .from(BUCKET)
      .upload(storagePath, input.file, {
        contentType: 'application/pdf',
        upsert: false,
      })

    throwIfError(uploadResult.error)
    const pageCount = await extractAndPersist(
      material,
      input.file,
      input.onProgress,
    )
    return {
      ...material,
      status: 'ready' as const,
      pageCount,
      errorMessage: null,
    }
  } catch (error) {
    await updateMaterialStatus(id, {
      status: 'failed',
      error_message: errorMessage(error),
    })
    throw error
  }
}

export async function retryMaterialExtraction(
  material: CourseMaterial,
  onProgress?: (progress: ExtractProgress) => void,
): Promise<void> {
  if (!material.storagePath) {
    throw new Error('This material has no stored PDF to retry.')
  }

  try {
    const file = await downloadMaterialPdf(
      material.storagePath,
      material.originalFilename,
    )
    await extractAndPersist(material, file, onProgress)
  } catch (error) {
    await updateMaterialStatus(material.id, {
      status: 'failed',
      error_message: errorMessage(error),
    })
    throw error
  }
}
