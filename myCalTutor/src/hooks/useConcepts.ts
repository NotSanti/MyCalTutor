import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { isSupabaseConfigured } from '@/lib/supabase/client'
import {
  addConcept,
  deleteConcept,
  extractConcepts,
  fetchConceptsForSection,
  generateLesson,
  updateConcept,
} from '@/lib/supabase/concepts'
import { fetchSourceSection } from '@/lib/supabase/structure'

function sectionKey(sectionId: string) {
  return ['source-section', sectionId] as const
}

function conceptsKey(sectionId: string) {
  return ['concepts', sectionId] as const
}

export function useSourceSection(sectionId: string | undefined) {
  return useQuery({
    queryKey: sectionKey(sectionId ?? ''),
    queryFn: () => fetchSourceSection(sectionId as string),
    enabled: Boolean(sectionId) && isSupabaseConfigured(),
    refetchInterval: (query) =>
      query.state.data?.conceptsStatus === 'extracting' ||
      query.state.data?.lessonStatus === 'generating'
        ? 2000
        : false,
  })
}

export function useSectionConcepts(sectionId: string | undefined) {
  return useQuery({
    queryKey: conceptsKey(sectionId ?? ''),
    queryFn: () => fetchConceptsForSection(sectionId as string),
    enabled: Boolean(sectionId) && isSupabaseConfigured(),
  })
}

export function useConceptActions(sectionId: string | undefined) {
  const queryClient = useQueryClient()

  async function invalidate() {
    if (!sectionId) {
      return
    }

    await queryClient.invalidateQueries({ queryKey: conceptsKey(sectionId) })
    await queryClient.invalidateQueries({ queryKey: sectionKey(sectionId) })
    await queryClient.invalidateQueries({ queryKey: ['source-sections'] })
  }

  const extractMutation = useMutation({
    mutationFn: () => {
      if (!sectionId) {
        throw new Error('No section selected.')
      }

      return extractConcepts(sectionId)
    },
    onSettled: async () => {
      await invalidate()
    },
  })

  const saveMutation = useMutation({
    mutationFn: (input: {
      conceptId: string
      name: string
      description: string
      importance: number
      difficulty: number
    }) =>
      updateConcept(input.conceptId, {
        name: input.name,
        description: input.description,
        importance: input.importance,
        difficulty: input.difficulty,
      }),
    onSettled: async () => {
      await invalidate()
    },
  })

  const removeMutation = useMutation({
    mutationFn: deleteConcept,
    onSettled: async () => {
      await invalidate()
    },
  })

  const createMutation = useMutation({
    mutationFn: addConcept,
    onSettled: async () => {
      await invalidate()
    },
  })

  const generateMutation = useMutation({
    mutationFn: () => {
      if (!sectionId) {
        throw new Error('No section selected.')
      }

      return generateLesson(sectionId)
    },
    onSettled: async () => {
      await invalidate()
      await queryClient.invalidateQueries({ queryKey: ['course'] })
    },
  })

  return {
    extract: () => extractMutation.mutateAsync(),
    generate: () => generateMutation.mutateAsync(),
    save: saveMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    create: createMutation.mutateAsync,
    isExtracting: extractMutation.isPending,
    isGenerating: generateMutation.isPending,
  }
}
