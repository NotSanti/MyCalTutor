import { ArrowLeft } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'

import { ConceptCard } from '@/components/concepts/ConceptCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  useConceptActions,
  useSectionConcepts,
  useSourceSection,
} from '@/hooks/useConcepts'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import type { ConceptsStatus, LessonStatus } from '@/types/structure'

function statusLabel(status: ConceptsStatus) {
  switch (status) {
    case 'idle':
      return 'Not extracted'
    case 'extracting':
      return 'Extracting'
    case 'ready':
      return 'Ready'
    case 'failed':
      return 'Failed'
  }
}

function lessonStatusLabel(status: LessonStatus) {
  switch (status) {
    case 'idle':
      return 'Not generated'
    case 'generating':
      return 'Generating'
    case 'ready':
      return 'Ready'
    case 'failed':
      return 'Failed'
  }
}

function AddConceptForm({
  defaultPageStart,
  defaultPageEnd,
  onAdd,
}: {
  defaultPageStart: number | null
  defaultPageEnd: number | null
  onAdd: (input: {
    name: string
    description: string
    importance: number
    difficulty: number
    pageStart: number
    pageEnd: number
  }) => Promise<unknown>
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [importance, setImportance] = useState('3')
  const [difficulty, setDifficulty] = useState('3')
  const [pageStart, setPageStart] = useState(
    defaultPageStart != null ? String(defaultPageStart) : '',
  )
  const [pageEnd, setPageEnd] = useState(
    defaultPageEnd != null ? String(defaultPageEnd) : '',
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const nextName = name.trim()
    const nextDescription = description.trim()
    const nextImportance = Number(importance)
    const nextDifficulty = Number(difficulty)
    const nextStart = Number(pageStart)
    const nextEnd = Number(pageEnd)
    if (!nextName || !nextDescription) {
      toast.error('Name and description are required.')
      return
    }

    if (
      nextImportance < 1 ||
      nextImportance > 5 ||
      nextDifficulty < 1 ||
      nextDifficulty > 5 ||
      !Number.isInteger(nextStart) ||
      !Number.isInteger(nextEnd) ||
      nextStart < 1 ||
      nextEnd < nextStart
    ) {
      toast.error('Importance, difficulty, and page range must be valid.')
      return
    }

    await onAdd({
      name: nextName,
      description: nextDescription,
      importance: nextImportance,
      difficulty: nextDifficulty,
      pageStart: nextStart,
      pageEnd: nextEnd,
    })
    setName('')
    setDescription('')
    toast.success('Concept added.')
  }

  return (
    <Card className="shadow-sm">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Add concept</CardTitle>
          <CardDescription>
            Manual concepts still need a source page range.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            aria-label="New concept name"
          />
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            aria-label="New concept description"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Input
              type="number"
              min={1}
              max={5}
              value={importance}
              onChange={(event) => setImportance(event.target.value)}
              aria-label="Importance"
            />
            <Input
              type="number"
              min={1}
              max={5}
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
              aria-label="Difficulty"
            />
            <Input
              type="number"
              min={1}
              value={pageStart}
              onChange={(event) => setPageStart(event.target.value)}
              aria-label="Source page start"
            />
            <Input
              type="number"
              min={1}
              value={pageEnd}
              onChange={(event) => setPageEnd(event.target.value)}
              aria-label="Source page end"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit">Add</Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export function ConceptInspectorPage() {
  const { sectionId } = useParams()
  const sectionQuery = useSourceSection(sectionId)
  const conceptsQuery = useSectionConcepts(sectionId)
  const actions = useConceptActions(sectionId)

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="font-heading text-2xl font-semibold">
          Supabase is not configured
        </h1>
      </div>
    )
  }

  if (sectionQuery.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (sectionQuery.isError || !sectionQuery.data) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="font-heading text-2xl font-semibold">
          Could not load this section
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {sectionQuery.error instanceof Error
            ? sectionQuery.error.message
            : 'The section may not exist.'}
        </p>
        <Button asChild className="mt-6">
          <Link to="/course/setup">Back to setup</Link>
        </Button>
      </div>
    )
  }

  const section = sectionQuery.data
  const concepts = conceptsQuery.data ?? []
  const extracting = actions.isExtracting || section.conceptsStatus === 'extracting'
  const generating = actions.isGenerating || section.lessonStatus === 'generating'
  const canGenerate =
    !extracting &&
    !generating &&
    section.conceptsStatus === 'ready' &&
    concepts.length > 0 &&
    section.startPage != null &&
    section.endPage != null
  const heading = [section.sectionNumber, section.title]
    .filter(Boolean)
    .join(' — ')

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-4">
        <Button asChild variant="ghost" className="w-fit px-0 hover:bg-transparent">
          <Link to="/course/setup">
            <ArrowLeft />
            Course setup
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <Badge variant="secondary" className="w-fit">
              Concept inspector
            </Badge>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              {heading}
            </h1>
            <p className="text-sm text-muted-foreground">
              {section.startPage != null && section.endPage != null
                ? `Pages ${section.startPage}–${section.endPage}`
                : 'Set a page range on Course setup before extracting.'}
            </p>
          </div>
          <Badge
            variant={section.conceptsStatus === 'failed' ? 'destructive' : 'secondary'}
          >
            {statusLabel(section.conceptsStatus)}
          </Badge>
        </div>
        {section.conceptsError ? (
          <p className="text-sm text-destructive">{section.conceptsError}</p>
        ) : null}
      </header>

      <div>
        <Button
          disabled={extracting}
          onClick={() => {
            void actions.extract().catch((error: unknown) => {
              toast.error(
                error instanceof Error
                  ? error.message
                  : 'Could not extract concepts.',
              )
            })
          }}
        >
          {section.conceptsStatus === 'failed' || concepts.length > 0
            ? 'Retry extraction'
            : 'Extract concepts'}
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle>Lesson</CardTitle>
              <CardDescription>
                Generate one playable lesson from this section’s reviewed
                concepts and pages.
              </CardDescription>
            </div>
            <Badge
              variant={
                section.lessonStatus === 'failed' ? 'destructive' : 'secondary'
              }
            >
              {lessonStatusLabel(section.lessonStatus)}
            </Badge>
          </div>
        </CardHeader>
        {section.lessonError ? (
          <CardContent>
            <p className="text-sm text-destructive">{section.lessonError}</p>
          </CardContent>
        ) : null}
        <CardFooter className="flex flex-wrap gap-2">
          <Button
            disabled={!canGenerate}
            onClick={() => {
              void actions.generate().catch((error: unknown) => {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : 'Could not generate the lesson.',
                )
              })
            }}
          >
            {generating
              ? 'Generating…'
              : section.lessonStatus === 'ready' ||
                  section.lessonStatus === 'failed'
                ? 'Regenerate lesson'
                : 'Generate lesson'}
          </Button>
          {section.lessonStatus === 'ready' && section.generatedLessonId ? (
            <Button asChild variant="secondary" disabled={generating}>
              <Link to={`/lesson/${section.generatedLessonId}`}>Play lesson</Link>
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              Play lesson
            </Button>
          )}
        </CardFooter>
      </Card>

      {conceptsQuery.isPending || extracting ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : concepts.length === 0 ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>No concepts yet</CardTitle>
            <CardDescription>
              Extract from this section only, then edit anything that looks
              wrong.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {concepts.map((concept) => (
            <ConceptCard
              key={concept.id}
              concept={concept}
              onSave={(input) => {
                void actions.save({ conceptId: concept.id, ...input })
              }}
              onDelete={() => {
                void actions.remove(concept.id)
              }}
            />
          ))}
        </div>
      )}

      <AddConceptForm
        defaultPageStart={section.startPage}
        defaultPageEnd={section.endPage}
        onAdd={(input) =>
          actions.create({
            ...input,
            materialId: section.materialId,
            sectionId: section.id,
          })
        }
      />
    </div>
  )
}
