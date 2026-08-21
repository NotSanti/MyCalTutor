import { useState } from 'react'

import { FeedbackBanner } from '@/components/lesson/FeedbackBanner'
import { MathText } from '@/components/math/MathText'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  evaluateMultipleChoice,
  evaluateNumeric,
  evaluateShortAnswer,
} from '@/lib/activities/evaluate'
import { cn } from '@/lib/utils'
import type { LessonBlock } from '@/types/course'

function SourceCitation({ pages }: { pages?: number[] }) {
  if (!pages || pages.length === 0) {
    return null
  }

  const sorted = [...new Set(pages)].sort((a, b) => a - b)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const contiguous = last - first + 1 === sorted.length
  const label =
    sorted.length === 1
      ? `Source: p. ${first}`
      : contiguous
        ? `Source: pp. ${first}–${last}`
        : `Source: pp. ${sorted.join(', ')}`

  return <p className="mt-3 text-xs text-muted-foreground">{label}</p>
}

type LessonBlockViewProps = {
  block: LessonBlock
  onContinue: () => void
  onAttempt?: (input: { answer: string; isCorrect: boolean }) => void
}

export function LessonBlockView({
  block,
  onContinue,
  onAttempt,
}: LessonBlockViewProps) {
  if (block.type === 'explanation') {
    return (
      <div className="flex w-full flex-col items-center gap-6">
        <div className="w-full text-left">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            {block.title}
          </h2>
          <MathText className="mt-3 block text-base leading-relaxed" text={block.content} />
          <SourceCitation pages={block.sourcePages} />
        </div>
        <Button size="lg" onClick={onContinue}>
          Continue
        </Button>
      </div>
    )
  }

  if (block.type === 'worked-example') {
    return (
      <div className="flex w-full flex-col items-center gap-6">
        <div className="w-full text-left">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Worked example
          </p>
          <MathText
            className="mt-2 block text-lg font-medium"
            text={block.problem}
          />
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-left">
            {block.steps.map((step) => (
              <li key={step} className="leading-relaxed">
                <MathText text={step} />
              </li>
            ))}
          </ol>
          <SourceCitation pages={block.sourcePages} />
        </div>
        <Button size="lg" onClick={onContinue}>
          Continue
        </Button>
      </div>
    )
  }

  return <ActivityBlock block={block} onContinue={onContinue} onAttempt={onAttempt} />
}

function ActivityBlock({
  block,
  onContinue,
  onAttempt,
}: {
  block: Extract<
    LessonBlock,
    { type: 'multiple-choice' | 'numeric-answer' | 'short-answer' }
  >
  onContinue: () => void
  onAttempt?: (input: { answer: string; isCorrect: boolean }) => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [feedback, setFeedback] = useState<{ correct: boolean } | null>(null)

  function check() {
    if (block.type === 'multiple-choice' && selectedId) {
      const isCorrect = evaluateMultipleChoice(selectedId, block)
      onAttempt?.({ answer: selectedId, isCorrect })
      setFeedback({ correct: isCorrect })
      return
    }

    if (block.type === 'numeric-answer') {
      const isCorrect = evaluateNumeric(inputValue, block)
      onAttempt?.({ answer: inputValue, isCorrect })
      setFeedback({ correct: isCorrect })
      return
    }

    if (block.type === 'short-answer') {
      const isCorrect = evaluateShortAnswer(inputValue, block)
      onAttempt?.({ answer: inputValue, isCorrect })
      setFeedback({ correct: isCorrect })
    }
  }

  function retry() {
    setFeedback(null)
  }

  const canCheck =
    feedback === null &&
    (block.type === 'multiple-choice' ? Boolean(selectedId) : inputValue.trim().length > 0)

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <MathText
        className="w-full text-left text-lg font-medium leading-relaxed"
        text={block.prompt}
      />

      {block.type === 'multiple-choice' ? (
        <div className="flex w-full flex-col gap-2">
          {block.options.map((option) => {
            const selected = selectedId === option.id
            const showAnswer = feedback !== null

            return (
              <button
                key={option.id}
                type="button"
                disabled={showAnswer}
                onClick={() => setSelectedId(option.id)}
                className={cn(
                  'rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                  selected
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-surface hover:bg-surface-muted',
                  showAnswer &&
                    option.id === block.answer &&
                    'border-success bg-success/10',
                  showAnswer &&
                    selected &&
                    option.id !== block.answer &&
                    'border-danger bg-danger/10',
                )}
              >
                <MathText text={option.label} />
              </button>
            )
          })}
        </div>
      ) : null}

      {block.type === 'numeric-answer' ? (
        <Input
          inputMode="decimal"
          value={inputValue}
          disabled={feedback !== null}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && canCheck) {
              check()
            }
          }}
          placeholder="Your answer"
          className="h-12 max-w-xs text-center text-lg"
        />
      ) : null}

      {block.type === 'short-answer' ? (
        <Textarea
          value={inputValue}
          disabled={feedback !== null}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="Write a short explanation"
          className="min-h-28"
        />
      ) : null}

      {feedback ? (
        <FeedbackBanner
          correct={feedback.correct}
          explanation={block.explanation}
        />
      ) : null}

      {feedback?.correct ? (
        <Button size="lg" onClick={onContinue}>
          Continue
        </Button>
      ) : feedback && !feedback.correct ? (
        <Button size="lg" variant="secondary" onClick={retry}>
          Try again
        </Button>
      ) : (
        <Button size="lg" disabled={!canCheck} onClick={check}>
          Check
        </Button>
      )}
    </div>
  )
}
