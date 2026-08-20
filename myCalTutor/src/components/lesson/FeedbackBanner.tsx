import { MathText } from '@/components/math/MathText'
import { cn } from '@/lib/utils'

type FeedbackBannerProps = {
  correct: boolean
  explanation: string
}

export function FeedbackBanner({ correct, explanation }: FeedbackBannerProps) {
  return (
    <div
      className={cn(
        'w-full rounded-xl px-4 py-3 text-left',
        correct ? 'bg-success/15' : 'bg-danger/15',
      )}
    >
      <p
        className={cn(
          'font-semibold',
          correct ? 'text-success' : 'text-danger',
        )}
      >
        {correct ? 'Correct!' : 'Not quite.'}
      </p>
      <MathText
        className="mt-1 block text-sm text-foreground"
        text={explanation}
      />
    </div>
  )
}
