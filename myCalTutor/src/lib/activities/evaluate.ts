import type {
  MultipleChoiceBlock,
  NumericAnswerBlock,
  ShortAnswerBlock,
} from '@/types/course'

const DEFAULT_TOLERANCE = 1e-6

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'how',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'what',
  'why',
  'with',
  'all',
])

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

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/[^a-z0-9+\-^.\s]/g, ' ')
    .replace(/-/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function significantTokens(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((token) => token.length > 1 && !STOPWORDS.has(token))
}

export function evaluateShortAnswer(
  input: string,
  block: ShortAnswerBlock,
): boolean {
  const answer = normalize(input)
  if (!answer) {
    return false
  }

  const explanation = normalize(block.explanation)
  if (explanation) {
    if (answer === explanation || answer.includes(explanation)) {
      return true
    }

    const minOverlap = Math.min(40, explanation.length)
    if (answer.length >= minOverlap && explanation.includes(answer)) {
      return true
    }
  }

  const prompt = normalize(block.prompt)
  const keywords = block.keywords.map(normalize).filter(Boolean)
  const required = keywords.filter((keyword) => !prompt.includes(keyword))

  if (required.length > 0) {
    return required.every((keyword) => answer.includes(keyword))
  }

  const distinctive = significantTokens(block.explanation).filter(
    (token) => !prompt.includes(token),
  )
  if (distinctive.length === 0) {
    return keywords.every((keyword) => answer.includes(keyword))
  }

  const matched = distinctive.filter((token) => answer.includes(token)).length
  return matched >= Math.max(1, Math.ceil(distinctive.length / 2))
}
