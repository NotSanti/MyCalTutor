import { ArrowLeft, Star } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { LessonBlockView } from '@/components/lesson/LessonBlockView'
import { MathText } from '@/components/math/MathText'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { activityIdForBlock } from '@/features/course/lookups'
import { useProgress } from '@/hooks/useProgress'
import { recordActivityAttempt } from '@/lib/supabase/queries'
import type { Course, Lesson } from '@/types/course'

type LessonPlayerProps = {
  course: Course
  lesson: Lesson
  unitTitle?: string
}

export function LessonPlayer({ course, lesson, unitTitle }: LessonPlayerProps) {
  const { progress, saveLessonProgress, completeLesson } = useProgress(course)
  const totalSteps = lesson.content.blocks.length + 2
  const [stepIndex, setStepIndex] = useState(() => {
    if (progress.inProgress?.lessonId === lesson.id) {
      return Math.min(progress.inProgress.blockIndex, totalSteps - 1)
    }

    return 0
  })
  const [awardedXp, setAwardedXp] = useState<number | null>(null)

  const isIntro = stepIndex === 0
  const isComplete = stepIndex >= totalSteps - 1
  const block =
    !isIntro && !isComplete ? lesson.content.blocks[stepIndex - 1] : undefined
  const progressValue =
    totalSteps <= 1 ? 100 : Math.round((stepIndex / (totalSteps - 1)) * 100)

  function goTo(nextIndex: number) {
    setStepIndex(nextIndex)

    if (nextIndex >= totalSteps - 1) {
      const alreadyCompleted = progress.completedLessonIds.includes(lesson.id)
      void completeLesson(lesson.id, lesson.xpReward, lesson.skillId)
      setAwardedXp(alreadyCompleted ? 0 : lesson.xpReward)
      return
    }

    void saveLessonProgress(lesson.id, nextIndex)
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/learn">
            <ArrowLeft data-icon="inline-start" />
            Exit
          </Link>
        </Button>
        <p className="text-sm font-medium text-muted-foreground">
          Lesson progress
        </p>
        <span className="w-16" />
      </header>

      <div className="px-4 pt-4 sm:px-6">
        <Progress value={progressValue} className="h-2" />
      </div>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-6 py-10">
        <div className="w-full text-center">
          {unitTitle ? (
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {unitTitle}
            </p>
          ) : null}
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {lesson.title}
          </h1>
        </div>

        {isIntro ? (
          <div className="flex w-full flex-col items-center gap-6">
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
              {lesson.content.intro.objective}
            </p>
            <Button size="lg" onClick={() => goTo(1)}>
              Continue
            </Button>
          </div>
        ) : null}

        {block ? (
          <LessonBlockView
            key={stepIndex}
            block={block}
            onContinue={() => goTo(stepIndex + 1)}
            onAttempt={({ answer, isCorrect }) => {
              void recordActivityAttempt({
                activityId: activityIdForBlock(lesson.id, stepIndex - 1),
                answer,
                isCorrect,
              }).catch(() => {
                // Attempts are diagnostic; don't block the lesson.
              })
            }}
          />
        ) : null}

        {isComplete ? (
          <div className="flex w-full flex-col items-center gap-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-success text-success-foreground">
              <Star className="size-7" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="font-heading text-xl font-semibold">
                Lesson complete
              </h2>
              <p className="text-sm font-medium text-xp">
                {awardedXp ? `+${awardedXp} XP` : 'Already completed'}
              </p>
              <MathText
                className="mt-1 block text-muted-foreground"
                text={lesson.content.summary.recap}
              />
            </div>
            <Button size="lg" asChild>
              <Link to="/learn">Back to path</Link>
            </Button>
          </div>
        ) : null}
      </main>
    </div>
  )
}
