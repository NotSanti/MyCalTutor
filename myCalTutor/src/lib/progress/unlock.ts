import type { Course, ProgressState, Skill, SkillStatus } from '@/types/course'

export function isSkillCompleted(skill: Skill, progress: ProgressState): boolean {
  if (skill.startsCompleted) {
    return true
  }

  if (!skill.lessonId) {
    return false
  }

  return progress.completedLessonIds.includes(skill.lessonId)
}

export function getSkillStatus(
  course: Course,
  skill: Skill,
  progress: ProgressState,
): SkillStatus {
  if (isSkillCompleted(skill, progress)) {
    return 'completed'
  }

  const unit = course.units.find((item) =>
    item.skills.some((candidate) => candidate.id === skill.id),
  )

  if (!unit) {
    return 'locked'
  }

  const ordered = [...unit.skills].sort((a, b) => a.sortOrder - b.sortOrder)
  const index = ordered.findIndex((item) => item.id === skill.id)
  const previous = index > 0 ? ordered[index - 1] : undefined
  const previousDone = !previous || isSkillCompleted(previous, progress)

  if (!previousDone || !skill.lessonId) {
    return 'locked'
  }

  if (progress.inProgress?.lessonId === skill.lessonId) {
    return 'in_progress'
  }

  return 'available'
}

export function getContinueLessonId(
  course: Course,
  progress: ProgressState,
): string | null {
  if (progress.inProgress) {
    const lesson = course.lessons.find(
      (item) => item.id === progress.inProgress?.lessonId,
    )
    if (lesson && !progress.completedLessonIds.includes(lesson.id)) {
      return lesson.id
    }
  }

  for (const unit of [...course.units].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const ordered = [...unit.skills].sort((a, b) => a.sortOrder - b.sortOrder)
    for (const skill of ordered) {
      const status = getSkillStatus(course, skill, progress)
      if (
        (status === 'available' || status === 'in_progress') &&
        skill.lessonId
      ) {
        return skill.lessonId
      }
    }
  }

  return null
}
