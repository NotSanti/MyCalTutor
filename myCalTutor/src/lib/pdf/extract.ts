export type ExtractedPage = {
  pageNumber: number
  text: string
}

export type ExtractProgress = {
  current: number
  total: number
}

async function loadPdfjs() {
  const [{ getDocument, GlobalWorkerOptions }, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])

  if (!GlobalWorkerOptions.workerSrc) {
    GlobalWorkerOptions.workerSrc = worker.default
  }

  return { getDocument }
}

function isTextItem(item: unknown): item is { str: string; hasEOL?: boolean } {
  return typeof item === 'object' && item !== null && 'str' in item
}

function itemsToText(items: readonly unknown[]): string {
  return items
    .map((item) => {
      if (!isTextItem(item)) {
        return ''
      }

      return item.hasEOL ? `${item.str}\n` : item.str
    })
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function yieldToUi() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

export async function extractPdfPages(
  data: ArrayBuffer | Uint8Array,
  onProgress?: (progress: ExtractProgress) => void,
): Promise<ExtractedPage[]> {
  const { getDocument } = await loadPdfjs()
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  const loadingTask = getDocument({ data: bytes })
  const pdf = await loadingTask.promise
  const pages: ExtractedPage[] = []

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      pages.push({
        pageNumber,
        text: itemsToText(content.items),
      })
      page.cleanup()
      onProgress?.({ current: pageNumber, total: pdf.numPages })

      if (pageNumber % 5 === 0) {
        await yieldToUi()
      }
    }
  } finally {
    await pdf.cleanup()
    await loadingTask.destroy()
  }

  return pages
}

export async function extractPdfFile(
  file: Blob,
  onProgress?: (progress: ExtractProgress) => void,
): Promise<ExtractedPage[]> {
  return extractPdfPages(await file.arrayBuffer(), onProgress)
}
