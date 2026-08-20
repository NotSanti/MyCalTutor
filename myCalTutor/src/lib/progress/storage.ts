import type { ProgressState } from '@/types/course'

export const PROGRESS_STORAGE_KEY = 'mycaltutor.progress.v1'

export const defaultProgress: ProgressState = {
  xp: 0,
  streakDays: 0,
  lastPracticedOn: null,
  completedLessonIds: [],
  inProgress: null,
}

export function todayStamp(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function yesterdayStamp(date = new Date()): string {
  const previous = new Date(date)
  previous.setDate(previous.getDate() - 1)
  return todayStamp(previous)
}

function isProgressState(value: unknown): value is ProgressState {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>

  return (
    typeof record.xp === 'number' &&
    typeof record.streakDays === 'number' &&
    (record.lastPracticedOn === null || typeof record.lastPracticedOn === 'string') &&
    Array.isArray(record.completedLessonIds) &&
    record.completedLessonIds.every((id) => typeof id === 'string') &&
    (record.inProgress === null ||
      (typeof record.inProgress === 'object' &&
        record.inProgress !== null &&
        typeof (record.inProgress as { lessonId?: unknown }).lessonId ===
          'string' &&
        typeof (record.inProgress as { blockIndex?: unknown }).blockIndex ===
          'number'))
  )
}

export function parseProgress(raw: string | null): ProgressState {
  if (!raw) {
    return defaultProgress
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isProgressState(parsed)) {
      return defaultProgress
    }

    return parsed
  } catch {
    return defaultProgress
  }
}

export function withPracticeStreak(
  progress: ProgressState,
  now = new Date(),
): ProgressState {
  const today = todayStamp(now)
  const yesterday = yesterdayStamp(now)

  if (progress.lastPracticedOn === today) {
    return progress
  }

  return {
    ...progress,
    lastPracticedOn: today,
    streakDays:
      progress.lastPracticedOn === yesterday ? progress.streakDays + 1 : 1,
  }
}

export function withLessonProgress(
  progress: ProgressState,
  lessonId: string,
  blockIndex: number,
): ProgressState {
  return {
    ...progress,
    inProgress: { lessonId, blockIndex },
  }
}

export function withCompletedLesson(
  progress: ProgressState,
  lessonId: string,
  xpReward: number,
  now = new Date(),
): ProgressState {
  const practiced = withPracticeStreak(progress, now)

  if (practiced.completedLessonIds.includes(lessonId)) {
    return {
      ...practiced,
      inProgress:
        practiced.inProgress?.lessonId === lessonId ? null : practiced.inProgress,
    }
  }

  return {
    ...practiced,
    xp: practiced.xp + xpReward,
    completedLessonIds: [...practiced.completedLessonIds, lessonId],
    inProgress:
      practiced.inProgress?.lessonId === lessonId ? null : practiced.inProgress,
  }
}
