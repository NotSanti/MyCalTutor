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
import {
  calculusICourse,
  getLessonById,
  getSkillByLessonId,
  getUnitForSkill,
} from '@/features/course/fixtures/calculus-i'
import { useProgress } from '@/hooks/useProgress'
import { getContinueLessonId } from '@/lib/progress/unlock'

export function LearnPage() {
  const { progress } = useProgress()
  const continueLessonId = getContinueLessonId(calculusICourse, progress)
  const continueLesson = continueLessonId
    ? getLessonById(continueLessonId)
    : undefined
  const continueSkill = continueLesson
    ? getSkillByLessonId(continueLesson.id)
    : undefined
  const continueUnit = continueSkill
    ? getUnitForSkill(continueSkill.id)
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
          {calculusICourse.title}
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

      <CoursePath course={calculusICourse} progress={progress} />
    </div>
  )
}
