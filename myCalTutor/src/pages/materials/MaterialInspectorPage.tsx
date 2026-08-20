import { ArrowLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useMaterial } from '@/hooks/useMaterials'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { MATERIAL_TYPE_LABELS, type MaterialStatus } from '@/types/materials'

function statusLabel(status: MaterialStatus) {
  switch (status) {
    case 'uploading':
      return 'Uploading'
    case 'extracting':
      return 'Extracting'
    case 'ready':
      return 'Ready'
    case 'failed':
      return 'Failed'
  }
}

export function MaterialInspectorPage() {
  const { materialId } = useParams()
  const materialQuery = useMaterial(materialId)
  const [query, setQuery] = useState('')

  const pages = useMemo(() => {
    const all = materialQuery.data?.pages ?? []
    const needle = query.trim().toLowerCase()
    if (!needle) {
      return all
    }

    return all.filter((page) => page.text.toLowerCase().includes(needle))
  }, [materialQuery.data?.pages, query])

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="font-heading text-2xl font-semibold">
          Supabase is not configured
        </h1>
      </div>
    )
  }

  if (materialQuery.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (materialQuery.isError || !materialQuery.data) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="font-heading text-2xl font-semibold">
          Could not load this material
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {materialQuery.error instanceof Error
            ? materialQuery.error.message
            : 'The material may not exist yet.'}
        </p>
        <Button asChild className="mt-6">
          <Link to="/materials">Back to materials</Link>
        </Button>
      </div>
    )
  }

  const material = materialQuery.data

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-4">
        <Button asChild variant="ghost" className="w-fit px-0 hover:bg-transparent">
          <Link to="/materials">
            <ArrowLeft />
            Materials
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              {material.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {material.originalFilename}
            </p>
          </div>
          <Badge
            variant={material.status === 'failed' ? 'destructive' : 'secondary'}
          >
            {statusLabel(material.status)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {MATERIAL_TYPE_LABELS[material.materialType]}
          {' · '}
          {material.pageCount == null
            ? 'Page count pending'
            : `${material.pageCount} ${material.pageCount === 1 ? 'page' : 'pages'}`}
        </p>
        {material.errorMessage ? (
          <p className="text-sm text-destructive">{material.errorMessage}</p>
        ) : null}
      </header>

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search extracted text"
        aria-label="Search extracted text"
      />

      {pages.length === 0 ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>
              {material.pages.length === 0
                ? 'No extracted text yet'
                : 'No pages match'}
            </CardTitle>
            <CardDescription>
              {material.pages.length === 0
                ? 'Wait for extraction to finish, or retry from the materials list.'
                : 'Try a different search term.'}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {pages.map((page) => (
            <Card key={page.id} className="shadow-sm">
              <CardHeader>
                <CardTitle>Page {page.pageNumber}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-foreground">
                  {page.text || '(no selectable text on this page)'}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
