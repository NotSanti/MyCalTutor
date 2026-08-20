import { Link } from 'react-router'
import { toast } from 'sonner'

import { StructureTree } from '@/components/setup/StructureTree'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useMaterials } from '@/hooks/useMaterials'
import { useSourceSections, useStructureActions } from '@/hooks/useStructure'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import type { StructureStatus } from '@/types/materials'

function statusLabel(status: StructureStatus) {
  switch (status) {
    case 'idle':
      return 'Not detected'
    case 'analyzing':
      return 'Detecting'
    case 'draft':
      return 'Draft'
    case 'approved':
      return 'Approved'
    case 'failed':
      return 'Failed'
  }
}

export function CourseSetupPage() {
  const materialsQuery = useMaterials()
  const textbook = materialsQuery.data?.find(
    (material) =>
      material.materialType === 'textbook' && material.status === 'ready',
  )
  const sectionsQuery = useSourceSections(textbook?.id)
  const actions = useStructureActions(textbook?.id)

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="font-heading text-2xl font-semibold">
          Supabase is not configured
        </h1>
      </div>
    )
  }

  if (materialsQuery.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!textbook) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Course setup
        </h1>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Upload a textbook first</CardTitle>
            <CardDescription>
              Structure detection needs a ready textbook with extracted page
              text.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link to="/materials">Go to materials</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const chapters = sectionsQuery.data ?? []
  const busy = actions.isAnalyzing || textbook.structureStatus === 'analyzing'
  const canApprove = chapters.length > 0 && !busy

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <Badge variant="secondary" className="w-fit">
            Textbook structure
          </Badge>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Course setup
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Detect chapters and sections from {textbook.name}, then correct the
            tree before approving it.
          </p>
        </div>
        <Badge
          variant={
            textbook.structureStatus === 'failed' ? 'destructive' : 'secondary'
          }
        >
          {statusLabel(textbook.structureStatus)}
        </Badge>
      </header>

      {textbook.structureError ? (
        <p className="text-sm text-destructive">{textbook.structureError}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            void actions.analyze().catch((error: unknown) => {
              toast.error(
                error instanceof Error
                  ? error.message
                  : 'Could not detect structure.',
              )
            })
          }}
          disabled={busy}
        >
          {textbook.structureStatus === 'failed' || chapters.length > 0
            ? 'Retry detection'
            : 'Detect structure'}
        </Button>
        <Button
          variant="outline"
          disabled={!canApprove || actions.isApproving}
          onClick={() => {
            void actions.approve().then(
              () => {
                toast.success('Course structure approved.')
              },
              (error: unknown) => {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : 'Could not approve the structure.',
                )
              },
            )
          }}
        >
          Approve course structure
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Detected course structure</CardTitle>
          <CardDescription>
            Rename, delete, or reorder before you approve. This does not change
            the Learn path yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sectionsQuery.isPending || busy ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-5/6" />
            </div>
          ) : chapters.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No chapters yet. Run detection to harvest headings from the
              textbook.
            </p>
          ) : (
            <StructureTree
              chapters={chapters}
              onRename={(input) => {
                void actions.rename(input)
              }}
              onDelete={(sectionId) => {
                void actions.remove(sectionId)
              }}
              onReorder={(firstId, secondId) => {
                void actions.reorder(firstId, secondId)
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
