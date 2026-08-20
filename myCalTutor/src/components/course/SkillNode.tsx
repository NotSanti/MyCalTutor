import { Check, Lock } from 'lucide-react'
import { Link } from 'react-router'

import { cn } from '@/lib/utils'
import type { SkillStatus } from '@/types/course'

type SkillNodeProps = {
  title: string
  status: SkillStatus
  lessonId: string | null
}

export function SkillNode({ title, status, lessonId }: SkillNodeProps) {
  const isLocked = status === 'locked'
  const canOpen = Boolean(lessonId) && !isLocked

  const node = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          'flex size-16 items-center justify-center rounded-full border-4 shadow-sm transition-transform',
          status === 'completed' &&
            'border-success/40 bg-success text-success-foreground',
          status === 'available' &&
            'border-primary bg-primary text-primary-foreground',
          status === 'in_progress' &&
            'border-primary bg-background text-primary ring-4 ring-primary/25',
          status === 'locked' &&
            'border-border bg-surface-muted text-locked',
          canOpen && 'hover:scale-[1.03]',
        )}
      >
        {status === 'completed' ? (
          <Check className="size-7" strokeWidth={3} />
        ) : status === 'locked' ? (
          <Lock className="size-6" />
        ) : (
          <span className="size-3.5 rounded-full bg-current" />
        )}
      </div>
      <p
        className={cn(
          'max-w-36 text-center text-sm font-medium',
          isLocked ? 'text-muted-foreground' : 'text-foreground',
        )}
      >
        {title}
      </p>
    </div>
  )

  if (!canOpen || !lessonId) {
    return <div className={cn(isLocked && 'cursor-not-allowed')}>{node}</div>
  }

  return (
    <Link to={`/lesson/${lessonId}`} className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {node}
    </Link>
  )
}
