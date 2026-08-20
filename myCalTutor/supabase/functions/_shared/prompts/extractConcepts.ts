export function buildExtractConceptsPrompt(input: {
  sectionNumber: string
  sectionTitle: string
  source: string
}) {
  const heading = [input.sectionNumber, input.sectionTitle]
    .filter(Boolean)
    .join(' — ')

  const system = `ROLE
You extract teachable Calculus I concepts from one textbook section.

TASK
Return a structured list of concepts a first-year student should learn from this section only.

SOURCE MATERIAL
Labeled extracted PDF text for this section. Extraction is imperfect, especially for math symbols.

CONSTRAINTS
- Use only this section. Do not invent theorems, definitions, or names that the pages do not support.
- If the extraction is messy, describe the idea in plain language and keep the garbled math only when it is still useful.
- importance and difficulty are integers from 1 to 5.
- sourcePages must be page numbers that appear in the labeled source (the numbers after "page").
- Prefer 4 to 12 concepts. Skip examples that are only practice drills unless they introduce a distinct idea.
- Do not generate lessons, skills, or activities.

EXPECTED OUTPUT
JSON with concepts[].{name, description, importance, difficulty, sourcePages}.`

  const user = `Section: ${heading}

${input.source}`

  return { system, user }
}
