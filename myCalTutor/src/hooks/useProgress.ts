import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import {
  defaultProgress,
  parseProgress,
  PROGRESS_STORAGE_KEY,
  withCompletedLesson,
  withLessonProgress,
} from '@/lib/progress/storage'
import {
  fetchProgress,
  isDefaultProgress,
  isSupabaseConfigured,
  persistLearnerState,
  upsertSkillProgress,
} from '@/lib/supabase/queries'
import type { Course, ProgressState } from '@/types/course'

const progressKey = ['progress'] as const

async function loadProgress(course: Course): Promise<ProgressState> {
  const remote = await fetchProgress(course)

  if (!isDefaultProgress(remote) || typeof window === 'undefined') {
    return remote
  }

  const local = parseProgress(
    window.localStorage.getItem(PROGRESS_STORAGE_KEY),
  )

  if (isDefaultProgress(local)) {
    return remote
  }

  await persistLearnerState(local)

  for (const lessonId of local.completedLessonIds) {
    const lesson = course.lessons.find((item) => item.id === lessonId)
    if (lesson) {
      await upsertSkillProgress(lesson.skillId, true)
    }
  }

  window.localStorage.removeItem(PROGRESS_STORAGE_KEY)
  return local
}

export function useProgress(course: Course | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: progressKey,
    queryFn: () => loadProgress(course as Course),
    enabled: Boolean(course) && isSupabaseConfigured(),
  })

  const saveState = useCallback(
    async (next: ProgressState) => {
      await persistLearnerState(next)
      queryClient.setQueryData(progressKey, next)
    },
    [queryClient],
  )

  const saveLessonProgress = useCallback(
    async (lessonId: string, blockIndex: number) => {
      const current = queryClient.getQueryData<ProgressState>(progressKey)
      if (!current) {
        return
      }

      await saveState(withLessonProgress(current, lessonId, blockIndex))
    },
    [queryClient, saveState],
  )

  const completeLesson = useCallback(
    async (lessonId: string, xpReward: number, skillId: string) => {
      const current =
        queryClient.getQueryData<ProgressState>(progressKey) ?? defaultProgress
      const next = withCompletedLesson(current, lessonId, xpReward)
      await persistLearnerState(next)
      await upsertSkillProgress(skillId, true)
      queryClient.setQueryData(progressKey, next)
    },
    [queryClient],
  )

  const saveLessonMutation = useMutation({
    mutationFn: ({
      lessonId,
      blockIndex,
    }: {
      lessonId: string
      blockIndex: number
    }) => saveLessonProgress(lessonId, blockIndex),
  })

  const completeLessonMutation = useMutation({
    mutationFn: ({
      lessonId,
      xpReward,
      skillId,
    }: {
      lessonId: string
      xpReward: number
      skillId: string
    }) => completeLesson(lessonId, xpReward, skillId),
  })

  return {
    progress: query.data ?? defaultProgress,
    isLoading: query.isLoading,
    saveLessonProgress: (lessonId: string, blockIndex: number) =>
      saveLessonMutation.mutateAsync({ lessonId, blockIndex }),
    completeLesson: (lessonId: string, xpReward: number, skillId: string) =>
      completeLessonMutation.mutateAsync({ lessonId, xpReward, skillId }),
  }
}
