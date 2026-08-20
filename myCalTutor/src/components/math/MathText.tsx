import katex from 'katex'
import { useMemo } from 'react'

import { cn } from '@/lib/utils'

const MATH_TOKEN = /(\$\$[\s\S]+?\$\$|\$[^$\n]+\$)/g

function renderLatex(source: string, displayMode: boolean) {
  return katex.renderToString(source, {
    displayMode,
    throwOnError: false,
    output: 'html',
  })
}

export function MathText({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const parts = useMemo(() => text.split(MATH_TOKEN), [text])

  return (
    <span className={cn('whitespace-pre-wrap', className)}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
          return (
            <span
              key={index}
              className="my-3 block overflow-x-auto"
              dangerouslySetInnerHTML={{
                __html: renderLatex(part.slice(2, -2), true),
              }}
            />
          )
        }

        if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
          return (
            <span
              key={index}
              dangerouslySetInnerHTML={{
                __html: renderLatex(part.slice(1, -1), false),
              }}
            />
          )
        }

        return <span key={index}>{part}</span>
      })}
    </span>
  )
}
