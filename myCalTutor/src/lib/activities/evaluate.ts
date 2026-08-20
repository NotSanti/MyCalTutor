import type {
  MultipleChoiceBlock,
  NumericAnswerBlock,
  ShortAnswerBlock,
} from '@/types/course'

const DEFAULT_TOLERANCE = 1e-6

export function evaluateMultipleChoice(
  selectedId: string,
  block: MultipleChoiceBlock,
): boolean {
  return selectedId === block.answer
}

export function evaluateNumeric(
  input: string,
  block: NumericAnswerBlock,
): boolean {
  const parsed = Number.parseFloat(input.trim())

  if (!Number.isFinite(parsed)) {
    return false
  }

  const tolerance = block.tolerance ?? DEFAULT_TOLERANCE
  return Math.abs(parsed - block.answer) <= tolerance
}

export function evaluateShortAnswer(
  input: string,
  block: ShortAnswerBlock,
): boolean {
  const normalized = input.toLowerCase()
  return block.keywords.every((keyword) =>
    normalized.includes(keyword.toLowerCase()),
  )
}
