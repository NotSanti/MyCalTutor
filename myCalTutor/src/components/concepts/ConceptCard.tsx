import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { CourseConcept } from '@/types/concepts'

function sourceLabel(concept: CourseConcept) {
  if (concept.sources.length === 0) {
    return 'No source pages'
  }

  return concept.sources
    .map((source) =>
      source.pageStart === source.pageEnd
        ? `p. ${source.pageStart}`
        : `pp. ${source.pageStart}–${source.pageEnd}`,
    )
    .join(', ')
}

export function ConceptCard({
  concept,
  onSave,
  onDelete,
}: {
  concept: CourseConcept
  onSave: (input: {
    name: string
    description: string
    importance: number
    difficulty: number
  }) => void
  onDelete: () => void
}) {
  const [name, setName] = useState(concept.name)
  const [description, setDescription] = useState(concept.description)
  const [importance, setImportance] = useState(String(concept.importance))
  const [difficulty, setDifficulty] = useState(String(concept.difficulty))

  function commit() {
    const nextName = name.trim()
    const nextDescription = description.trim()
    const nextImportance = Number(importance)
    const nextDifficulty = Number(difficulty)
    if (!nextName || !nextDescription) {
      setName(concept.name)
      setDescription(concept.description)
      return
    }

    if (
      nextImportance < 1 ||
      nextImportance > 5 ||
      nextDifficulty < 1 ||
      nextDifficulty > 5
    ) {
      setImportance(String(concept.importance))
      setDifficulty(String(concept.difficulty))
      return
    }

    if (
      nextName !== concept.name ||
      nextDescription !== concept.description ||
      nextImportance !== concept.importance ||
      nextDifficulty !== concept.difficulty
    ) {
      onSave({
        name: nextName,
        description: nextDescription,
        importance: nextImportance,
        difficulty: nextDifficulty,
      })
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={commit}
            aria-label="Concept name"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          onBlur={commit}
          aria-label="Concept description"
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5">
            <span className="text-xs text-muted-foreground">Importance 1–5</span>
            <Input
              type="number"
              min={1}
              max={5}
              value={importance}
              onChange={(event) => setImportance(event.target.value)}
              onBlur={commit}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs text-muted-foreground">Difficulty 1–5</span>
            <Input
              type="number"
              min={1}
              max={5}
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
              onBlur={commit}
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">{sourceLabel(concept)}</p>
      </CardContent>
      <CardFooter>
        <Button type="button" variant="destructive" onClick={onDelete}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
