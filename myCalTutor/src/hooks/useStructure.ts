import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { isSupabaseConfigured } from '@/lib/supabase/client'
import {
  analyzeDocument,
  assembleStructure,
  deleteSourceSection,
  fetchSourceSections,
  swapSourceSectionOrder,
  updateSourceSection,
  updateStructureStatus,
} from '@/lib/supabase/structure'

const materialsKey = ['materials', 'calculus-i'] as const

function sectionsKey(materialId: string) {
  return ['source-sections', materialId] as const
}

export function useSourceSections(materialId: string | undefined) {
  return useQuery({
    queryKey: sectionsKey(materialId ?? ''),
    queryFn: async () => {
      const rows = await fetchSourceSections(materialId as string)
      return assembleStructure(rows)
    },
    enabled: Boolean(materialId) && isSupabaseConfigured(),
  })
}

export function useStructureActions(materialId: string | undefined) {
  const queryClient = useQueryClient()

  async function invalidate() {
    if (materialId) {
      await queryClient.invalidateQueries({ queryKey: sectionsKey(materialId) })
    }
    await queryClient.invalidateQueries({ queryKey: materialsKey })
  }

  const analyzeMutation = useMutation({
    mutationFn: () => {
      if (!materialId) {
        throw new Error('No textbook selected.')
      }

      return analyzeDocument(materialId)
    },
    onSettled: async () => {
      await invalidate()
    },
  })

  const renameMutation = useMutation({
    mutationFn: (input: {
      sectionId: string
      title: string
      sectionNumber: string
    }) =>
      updateSourceSection(input.sectionId, {
        title: input.title,
        sectionNumber: input.sectionNumber,
      }),
    onSettled: async () => {
      await invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSourceSection,
    onSettled: async () => {
      await invalidate()
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (input: { firstId: string; secondId: string }) =>
      swapSourceSectionOrder(input.firstId, input.secondId),
    onSettled: async () => {
      await invalidate()
    },
  })

  const approveMutation = useMutation({
    mutationFn: () => {
      if (!materialId) {
        throw new Error('No textbook selected.')
      }

      return updateStructureStatus(materialId, 'approved')
    },
    onSettled: async () => {
      await invalidate()
    },
  })

  return {
    analyze: () => analyzeMutation.mutateAsync(),
    rename: (input: {
      sectionId: string
      title: string
      sectionNumber: string
    }) => renameMutation.mutateAsync(input),
    remove: (sectionId: string) => deleteMutation.mutateAsync(sectionId),
    reorder: (firstId: string, secondId: string) =>
      reorderMutation.mutateAsync({ firstId, secondId }),
    approve: () => approveMutation.mutateAsync(),
    isAnalyzing: analyzeMutation.isPending,
    isApproving: approveMutation.isPending,
  }
}
