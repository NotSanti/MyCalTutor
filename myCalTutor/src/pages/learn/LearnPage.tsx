import { Flame, Star } from 'lucide-react'
import { Link } from 'react-router'

import { CoursePath } from '@/components/course/CoursePath'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getLessonById,
  getSkillByLessonId,
  getUnitForSkill,
} from '@/features/course/lookups'
import { useCourse } from '@/hooks/useCourse'
import { useProgress } from '@/hooks/useProgress'
import { getContinueLessonId } from '@/lib/progress/unlock'
import { isSupabaseConfigured } from '@/lib/supabase/client'

export function LearnPage() {
  const courseQuery = useCourse()
  const { progress } = useProgress(courseQuery.data)

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="font-heading text-2xl font-semibold">Supabase is not configured</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to load the course.
        </p>
      </div>
    )
  }

  if (courseQuery.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (courseQuery.isError || !courseQuery.data) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="font-heading text-2xl font-semibold">Could not load the course</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {courseQuery.error instanceof Error
            ? courseQuery.error.message
            : 'Check that the Calculus I seed has been applied.'}
        </p>
      </div>
    )
  }

  const course = courseQuery.data
  const continueLessonId = getContinueLessonId(course, progress)
  const continueLesson = continueLessonId
    ? getLessonById(course, continueLessonId)
    : undefined
  const continueSkill = continueLesson
    ? getSkillByLessonId(course, continueLesson.id)
    : undefined
  const continueUnit = continueSkill
    ? getUnitForSkill(course, continueSkill.id)
    : undefined

  const totalSteps = continueLesson
    ? continueLesson.content.blocks.length + 2
    : 0
  const currentStep =
    progress.inProgress?.lessonId === continueLesson?.id
      ? (progress.inProgress?.blockIndex ?? 0)
      : 0
  const continuePercent =
    totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-4">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {course.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 font-medium">
            <Flame className="size-4 text-xp" />
            {progress.streakDays} day streak
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 font-medium">
            <Star className="size-4 text-xp" />
            {progress.xp} XP
          </span>
        </div>
      </header>

      {continueLesson ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Continue learning</CardTitle>
            <CardDescription>
              {continueLesson.title}
              {continueUnit ? ` · ${continueUnit.title}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={continuePercent} className="h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              {continuePercent}% through this lesson
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link to={`/lesson/${continueLesson.id}`}>Continue</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Path complete</CardTitle>
            <CardDescription>
              You finished the playable Limits lessons. More skills stay locked
              until later milestones.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <CoursePath course={course} progress={progress} />
    </div>
  )
}
