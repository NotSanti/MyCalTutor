import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SourceSection, StructureChapter } from '@/types/structure'

function SectionEditor({
  item,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  indented = false,
}: {
  item: SourceSection
  onSave: (input: { title: string; sectionNumber: string }) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  indented?: boolean
}) {
  const [title, setTitle] = useState(item.title)
  const [sectionNumber, setSectionNumber] = useState(item.sectionNumber)

  function commit() {
    const nextTitle = title.trim()
    const nextNumber = sectionNumber.trim()
    if (!nextTitle) {
      setTitle(item.title)
      return
    }

    if (nextTitle !== item.title || nextNumber !== item.sectionNumber) {
      onSave({ title: nextTitle, sectionNumber: nextNumber })
    }
  }

  return (
    <div className={indented ? 'ml-6 flex items-center gap-2' : 'flex items-center gap-2'}>
      <Input
        value={sectionNumber}
        onChange={(event) => setSectionNumber(event.target.value)}
        onBlur={commit}
        className="w-20 shrink-0"
        aria-label="Section number"
      />
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur()
          }
        }}
        aria-label="Section title"
      />
      <p className="hidden shrink-0 text-xs text-muted-foreground sm:block">
        {item.startPage != null
          ? item.endPage != null
            ? `pp. ${item.startPage}–${item.endPage}`
            : `p. ${item.startPage}`
          : 'page unknown'}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onMoveUp}
        disabled={!canMoveUp}
        aria-label="Move up"
      >
        <ChevronUp />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onMoveDown}
        disabled={!canMoveDown}
        aria-label="Move down"
      >
        <ChevronDown />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onDelete}
        aria-label="Delete"
      >
        <Trash2 />
      </Button>
    </div>
  )
}

export function StructureTree({
  chapters,
  onRename,
  onDelete,
  onReorder,
}: {
  chapters: StructureChapter[]
  onRename: (input: {
    sectionId: string
    title: string
    sectionNumber: string
  }) => void
  onDelete: (sectionId: string) => void
  onReorder: (firstId: string, secondId: string) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      {chapters.map((chapter, chapterIndex) => (
        <div key={chapter.id} className="flex flex-col gap-2">
          <SectionEditor
            item={chapter}
            canMoveUp={chapterIndex > 0}
            canMoveDown={chapterIndex < chapters.length - 1}
            onSave={(input) => onRename({ sectionId: chapter.id, ...input })}
            onDelete={() => onDelete(chapter.id)}
            onMoveUp={() =>
              onReorder(chapter.id, chapters[chapterIndex - 1].id)
            }
            onMoveDown={() =>
              onReorder(chapter.id, chapters[chapterIndex + 1].id)
            }
          />
          {chapter.sections.map((section, sectionIndex) => (
            <SectionEditor
              key={section.id}
              item={section}
              indented
              canMoveUp={sectionIndex > 0}
              canMoveDown={sectionIndex < chapter.sections.length - 1}
              onSave={(input) => onRename({ sectionId: section.id, ...input })}
              onDelete={() => onDelete(section.id)}
              onMoveUp={() =>
                onReorder(section.id, chapter.sections[sectionIndex - 1].id)
              }
              onMoveDown={() =>
                onReorder(section.id, chapter.sections[sectionIndex + 1].id)
              }
            />
          ))}
        </div>
      ))}
    </div>
  )
}
