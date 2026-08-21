export function buildGenerateLessonPrompt(input: {
  sectionNumber: string
  sectionTitle: string
  concepts: {
    name: string
    description: string
    importance: number
    difficulty: number
    pageStart: number
    pageEnd: number
  }[]
  source: string
}) {
  const heading = [input.sectionNumber, input.sectionTitle]
    .filter(Boolean)
    .join(' — ')

  const conceptLines = input.concepts.map((concept) => {
    const pages =
      concept.pageStart === concept.pageEnd
        ? `p. ${concept.pageStart}`
        : `pp. ${concept.pageStart}–${concept.pageEnd}`
    return `- ${concept.name} (importance ${concept.importance}, difficulty ${concept.difficulty}, ${pages}): ${concept.description}`
  })

  const system = `ROLE
You write one Calculus I lesson for a first-year student from one textbook section.

TASK
Return structured lesson JSON the app can play. Teach the reviewed concepts as the spine of the lesson. Prefer the most important concept if several compete.

SOURCE MATERIAL
Labeled extracted PDF text for this section, plus the reviewed concept list. Extraction is imperfect, especially for math symbols.

CONSTRAINTS
- Use only this section and the reviewed concepts. Do not invent theorems, definitions, or names the pages and concepts do not support.
- If the extraction is messy, teach from the concept descriptions and keep garbled math only when it is still useful.
- Write mathematics in KaTeX like the existing lessons: inline $...$ and display $$...$$. Example: $\\lim_{x \\to a} f(x)$.
- Do not emit HTML, JSX, Tailwind, or Markdown headings.
- sourcePages must be page numbers that appear in the labeled source (the numbers after "page").
- simpleCheck must be multiple-choice or numeric-answer.
- For multiple-choice: exactly four options with ids a, b, c, d; answer is that id; numericAnswer is null; keywords is [].
- For numeric-answer: options is []; answer may repeat the number as a string; numericAnswer is the number; keywords is [].
- For short-answer: options is []; numericAnswer is null; keywords are 1 to 3 ordinary English words or short phrases a student would type. Every keyword is required. Do not use words, formulas, or symbols that already appear in the prompt. Do not use LaTeX or interval notation as keywords. Every keyword must also appear in the explanation.
- estimatedMinutes should be 8–15. xpReward should be 20–30.

EXPECTED OUTPUT
JSON with title, description, estimatedMinutes, xpReward, intro.objective, explanation, workedExample, simpleCheck, application, challenge, summary.recap.`

  const user = `Section: ${heading}

Reviewed concepts:
${conceptLines.join('\n')}

${input.source}`

  return { system, user }
}
