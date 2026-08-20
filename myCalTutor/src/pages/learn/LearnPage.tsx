import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function LearnPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-3">
        <Badge variant="secondary" className="w-fit">
          Personal MVP
        </Badge>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Calculus I
        </h1>
        <p className="max-w-xl text-muted-foreground">
          This is your learning path. Skills, lessons, and progress will appear
          here in the next milestone.
        </p>
      </header>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Continue learning</CardTitle>
          <CardDescription>
            Interactive lessons are not available yet. MVP 1 will add a
            playable Calculus I path.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-surface-muted px-4 py-6 text-sm text-muted-foreground">
            The vertical skill path will live here — completed, current, and
            locked nodes in a Duolingo-style sequence.
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link to="/lesson/preview">Preview lesson player</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
