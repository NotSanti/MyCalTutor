import { Navigate, useParams } from 'react-router'

import { LessonPlayer } from '@/components/lesson/LessonPlayer'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getLessonById,
  getSkillByLessonId,
  getUnitForSkill,
} from '@/features/course/lookups'
import { useCourse } from '@/hooks/useCourse'
import { isSupabaseConfigured } from '@/lib/supabase/client'

export function LessonPage() {
  const { lessonId } = useParams()
  const courseQuery = useCourse()

  if (!isSupabaseConfigured() || courseQuery.isError) {
    return <Navigate to="/learn" replace />
  }

  if (courseQuery.isPending || !courseQuery.data) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full max-w-xl" />
      </div>
    )
  }

  const course = courseQuery.data
  const lesson = lessonId ? getLessonById(course, lessonId) : undefined

  if (!lesson) {
    return <Navigate to="/learn" replace />
  }

  const skill = getSkillByLessonId(course, lesson.id)
  const unit = skill ? getUnitForSkill(course, skill.id) : undefined

  return (
    <LessonPlayer course={course} lesson={lesson} unitTitle={unit?.title} />
  )
}
