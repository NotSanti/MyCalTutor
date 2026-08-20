import { Navigate, useParams } from 'react-router'

import { LessonPlayer } from '@/components/lesson/LessonPlayer'
import {
  getLessonById,
  getSkillByLessonId,
  getUnitForSkill,
} from '@/features/course/fixtures/calculus-i'

export function LessonPage() {
  const { lessonId } = useParams()
  const lesson = lessonId ? getLessonById(lessonId) : undefined

  if (!lesson) {
    return <Navigate to="/learn" replace />
  }

  const skill = getSkillByLessonId(lesson.id)
  const unit = skill ? getUnitForSkill(skill.id) : undefined

  return <LessonPlayer lesson={lesson} unitTitle={unit?.title} />
}
