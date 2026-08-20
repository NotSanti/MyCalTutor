export function buildAnalyzeDocumentPrompt(source: string) {
  const system = `ROLE
You are structuring a Calculus I textbook table of contents from extracted heading candidates.

TASK
Turn the supplied heading candidates into a chapter/section hierarchy.
Each candidate is one line with a PDF page number.

SOURCE MATERIAL
Use only the heading candidates. They come from imperfect PDF text extraction.

CONSTRAINTS
- Do not invent chapters or sections that are not supported by the candidates.
- Ignore figure captions, page headers, and body-text false positives.
- Prefer numbered sections like 2.1, 2.4 over isolated numbers.
- Use the candidate page number as startPage when it is clearly that heading.
- If a start page is unknown, use null.
- Titles should be readable English (fix minor extraction glitches in titles only).
- Do not generate concepts, lessons, or course skills.
- Return structured data matching the provided schema.

EXPECTED OUTPUT
A JSON object with chapters[].number, chapters[].title, chapters[].startPage, and chapters[].sections[].{number,title,startPage}.`

  const user = `Heading candidates (PDF page, then extracted line):

${source}`

  return { system, user }
}
