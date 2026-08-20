export type HeadingCandidate = {
  pageNumber: number
  line: string
}

const MAX_CANDIDATES = 400
const MAX_CHARS = 40_000
const MAX_LINE_LENGTH = 120

function isHeadingLine(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length < 3 || trimmed.length > MAX_LINE_LENGTH) {
    return false
  }

  if (/^chapter\s+\d+/i.test(trimmed)) {
    return true
  }

  if (/^appendix\s+[a-z0-9]/i.test(trimmed)) {
    return true
  }

  if (/^\d+\.\d+(?:\.\d+)*\s+\S/.test(trimmed)) {
    return true
  }

  // TOC-style chapter: "2 Limits and Derivatives 79"
  if (/^\d+\s+[A-Z][A-Za-z].+\d+\s*$/.test(trimmed) && trimmed.split(/\s+/).length <= 12) {
    return true
  }

  return false
}

export function harvestHeadings(
  pages: { pageNumber: number; text: string }[],
): HeadingCandidate[] {
  const seen = new Set<string>()
  const candidates: HeadingCandidate[] = []

  for (const page of pages) {
    const lines = page.text.split(/\r?\n/)
    for (const raw of lines) {
      const line = raw.replace(/\s+/g, ' ').trim()
      if (!isHeadingLine(line)) {
        continue
      }

      const key = line.toLowerCase()
      if (seen.has(key)) {
        continue
      }

      seen.add(key)
      candidates.push({ pageNumber: page.pageNumber, line })
      if (candidates.length >= MAX_CANDIDATES) {
        return candidates
      }
    }
  }

  return candidates
}

export function formatHeadingSource(candidates: HeadingCandidate[]): string {
  const lines = candidates.map(
    (candidate) => `p.${candidate.pageNumber}: ${candidate.line}`,
  )
  let output = lines.join('\n')
  if (output.length > MAX_CHARS) {
    output = output.slice(0, MAX_CHARS)
  }
  return output
}
