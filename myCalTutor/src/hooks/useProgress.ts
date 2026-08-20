import { useCallback, useSyncExternalStore } from 'react'

import {
  defaultProgress,
  parseProgress,
  PROGRESS_STORAGE_KEY,
  withCompletedLesson,
  withLessonProgress,
} from '@/lib/progress/storage'
import type { ProgressState } from '@/types/course'

const listeners = new Set<() => void>()

let snapshot: ProgressState = loadSnapshot()

function loadSnapshot(): ProgressState {
  if (typeof window === 'undefined') {
    return defaultProgress
  }

  return parseProgress(window.localStorage.getItem(PROGRESS_STORAGE_KEY))
}

function emit() {
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return snapshot
}

function getServerSnapshot() {
  return defaultProgress
}

function commit(next: ProgressState) {
  snapshot = next
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next))
  emit()
}

export function useProgress() {
  const progress = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )

  const saveLessonProgress = useCallback((lessonId: string, blockIndex: number) => {
    commit(withLessonProgress(snapshot, lessonId, blockIndex))
  }, [])

  const completeLesson = useCallback((lessonId: string, xpReward: number) => {
    commit(withCompletedLesson(snapshot, lessonId, xpReward))
  }, [])

  return {
    progress,
    saveLessonProgress,
    completeLesson,
  }
}
