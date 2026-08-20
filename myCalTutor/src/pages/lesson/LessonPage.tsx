import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

export function LessonPage() {
  const { lessonId } = useParams()

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
        <Progress value={20} className="h-2" />
      </div>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-6 py-12 text-center">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Placeholder
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Lesson player
          </h1>
          <p className="max-w-md text-muted-foreground">
            One activity at a time will appear here. This route is{' '}
            <span className="font-medium text-foreground">
              {lessonId ?? 'unknown'}
            </span>
            . Real lesson content arrives in MVP 1.
          </p>
        </div>

        <Button asChild>
          <Link to="/learn">Back to Learn</Link>
        </Button>
      </main>
    </div>
  )
}
