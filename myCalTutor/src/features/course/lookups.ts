import type { Course, Lesson, Skill, Unit } from '@/types/course'

export function getLessonById(course: Course, lessonId: string): Lesson | undefined {
  return course.lessons.find((lesson) => lesson.id === lessonId)
}

export function getSkillByLessonId(course: Course, lessonId: string): Skill | undefined {
  for (const unit of course.units) {
    const skill = unit.skills.find((item) => item.lessonId === lessonId)
    if (skill) {
      return skill
    }
  }

  return undefined
}

export function getUnitForSkill(course: Course, skillId: string): Unit | undefined {
  return course.units.find((unit) =>
    unit.skills.some((skill) => skill.id === skillId),
  )
}

export function activityIdForBlock(lessonId: string, blockIndex: number) {
  return `${lessonId}-${blockIndex}`
}
