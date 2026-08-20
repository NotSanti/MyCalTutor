import { Link } from 'react-router'
import { toast } from 'sonner'

import { AddMaterialDialog } from '@/components/materials/AddMaterialDialog'
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
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useMaterialActions, useMaterials } from '@/hooks/useMaterials'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import type { ExtractProgress } from '@/lib/pdf/extract'
import {
  MATERIAL_TYPE_LABELS,
  type CourseMaterial,
  type MaterialStatus,
} from '@/types/materials'

function statusLabel(status: MaterialStatus, interrupted: boolean) {
  if (interrupted) {
    return 'Interrupted'
  }

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

function statusVariant(status: MaterialStatus, interrupted: boolean) {
  if (interrupted || status === 'failed') {
    return 'destructive' as const
  }

  if (status === 'ready') {
    return 'default' as const
  }

  return 'secondary' as const
}

function pageCountLabel(pageCount: number | null) {
  if (pageCount == null) {
    return 'Page count pending'
  }

  return pageCount === 1 ? '1 page' : `${pageCount} pages`
}

function MaterialCard({
  material,
  processing,
  progress,
  onRetry,
}: {
  material: CourseMaterial
  processing: boolean
  progress?: ExtractProgress
  onRetry: (material: CourseMaterial) => void
}) {
  const interrupted =
    !processing &&
    (material.status === 'uploading' || material.status === 'extracting')
  const canRetry =
    material.status === 'failed' ||
    (interrupted && Boolean(material.storagePath))
  const percent =
    progress && progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : material.status === 'uploading' && processing
        ? 10
        : undefined

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">
            <Link
              to={`/materials/${material.id}`}
              className="hover:underline"
            >
              {material.name}
            </Link>
          </CardTitle>
          <Badge variant={statusVariant(material.status, interrupted)}>
            {statusLabel(material.status, interrupted)}
          </Badge>
        </div>
        <CardDescription>
          {MATERIAL_TYPE_LABELS[material.materialType]}
          {' · '}
          {pageCountLabel(material.pageCount)}
        </CardDescription>
      </CardHeader>
      {processing || material.errorMessage ? (
        <CardContent className="grid gap-2">
          {processing && percent != null ? (
            <>
              <Progress value={percent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {progress
                  ? `Extracting page ${progress.current} of ${progress.total}`
                  : 'Uploading PDF…'}
              </p>
            </>
          ) : null}
          {material.errorMessage ? (
            <p className="text-sm text-destructive">{material.errorMessage}</p>
          ) : null}
        </CardContent>
      ) : null}
      <CardFooter className="gap-2">
        <Button asChild variant="outline">
          <Link to={`/materials/${material.id}`}>Inspect</Link>
        </Button>
        {canRetry ? (
          <Button
            variant="secondary"
            onClick={() => onRetry(material)}
            disabled={processing}
          >
            Retry
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  )
}

export function MaterialsPage() {
  const materialsQuery = useMaterials()
  const actions = useMaterialActions()

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="font-heading text-2xl font-semibold">
          Supabase is not configured
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to upload materials.
        </p>
      </div>
    )
  }

  const materials = materialsQuery.data ?? []

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <Badge variant="secondary" className="w-fit">
            Course files
          </Badge>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Materials
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Upload the Calculus textbook and other PDFs, then inspect the
            extracted text page by page.
          </p>
        </div>
        <AddMaterialDialog
          disabled={actions.isUploading}
          onUpload={actions.upload}
        />
      </header>

      {materialsQuery.isPending ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      ) : null}

      {materialsQuery.isError ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Could not load materials</CardTitle>
            <CardDescription>
              {materialsQuery.error instanceof Error
                ? materialsQuery.error.message
                : 'Check that the course_materials migration has been applied.'}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!materialsQuery.isPending &&
      !materialsQuery.isError &&
      materials.length === 0 ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>No materials yet</CardTitle>
            <CardDescription>
              Add the Calculus textbook PDF to inspect extraction quality.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-dashed border-border bg-surface-muted px-4 py-10 text-center text-sm text-muted-foreground">
              PDFs are stored privately and extracted in this browser.
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-4">
        {materials.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            processing={actions.processingIds.includes(material.id)}
            progress={actions.progressById[material.id]}
            onRetry={(item) => {
              void actions.retry(item).catch((retryError: unknown) => {
                toast.error(
                  retryError instanceof Error
                    ? retryError.message
                    : 'Retry failed.',
                )
              })
            }}
          />
        ))}
      </div>
    </div>
  )
}
