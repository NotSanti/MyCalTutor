import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef, useState } from 'react'

import type { ExtractProgress } from '@/lib/pdf/extract'
import {
  fetchMaterialWithPages,
  fetchMaterials,
  isSupabaseConfigured,
  retryMaterialExtraction,
  uploadCourseMaterial,
} from '@/lib/supabase/materials'
import type { CourseMaterial, MaterialType } from '@/types/materials'

const materialsKey = ['materials', 'calculus-i'] as const

function materialKey(materialId: string) {
  return ['material', materialId] as const
}

export function useMaterials() {
  return useQuery({
    queryKey: materialsKey,
    queryFn: fetchMaterials,
    enabled: isSupabaseConfigured(),
    refetchInterval: (query) => {
      const busy = query.state.data?.some(
        (material) =>
          material.status === 'uploading' ||
          material.status === 'extracting' ||
          material.structureStatus === 'analyzing',
      )
      return busy ? 2000 : false
    },
  })
}

export function useMaterial(materialId: string | undefined) {
  return useQuery({
    queryKey: materialKey(materialId ?? ''),
    queryFn: () => fetchMaterialWithPages(materialId as string),
    enabled: Boolean(materialId) && isSupabaseConfigured(),
  })
}

export function useMaterialActions() {
  const queryClient = useQueryClient()
  const activeIdRef = useRef<string | null>(null)
  const [processingIds, setProcessingIds] = useState<string[]>([])
  const [progressById, setProgressById] = useState<
    Record<string, ExtractProgress>
  >({})

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: materialsKey })
    await queryClient.invalidateQueries({ queryKey: ['material'] })
  }, [queryClient])

  const startProcessing = useCallback((materialId: string) => {
    activeIdRef.current = materialId
    setProcessingIds((current) =>
      current.includes(materialId) ? current : [...current, materialId],
    )
  }, [])

  const stopActive = useCallback(() => {
    const materialId = activeIdRef.current
    activeIdRef.current = null
    if (!materialId) {
      return
    }

    setProcessingIds((current) => current.filter((id) => id !== materialId))
    setProgressById((current) => {
      const next = { ...current }
      delete next[materialId]
      return next
    })
  }, [])

  const uploadMutation = useMutation({
    mutationFn: (input: { file: File; materialType: MaterialType }) =>
      uploadCourseMaterial({
        ...input,
        onCreated: (material) => {
          startProcessing(material.id)
          void invalidate()
        },
        onProgress: (progress) => {
          const materialId = activeIdRef.current
          if (!materialId) {
            return
          }

          setProgressById((current) => ({
            ...current,
            [materialId]: progress,
          }))
        },
      }),
    onSettled: async () => {
      stopActive()
      await invalidate()
    },
  })

  const retryMutation = useMutation({
    mutationFn: (material: CourseMaterial) => {
      startProcessing(material.id)
      return retryMaterialExtraction(material, (progress) => {
        setProgressById((current) => ({
          ...current,
          [material.id]: progress,
        }))
      })
    },
    onSettled: async () => {
      stopActive()
      await invalidate()
    },
  })

  return {
    processingIds,
    progressById,
    upload: (input: { file: File; materialType: MaterialType }) =>
      uploadMutation.mutateAsync(input),
    retry: (material: CourseMaterial) => retryMutation.mutateAsync(material),
    isUploading: uploadMutation.isPending,
  }
}
