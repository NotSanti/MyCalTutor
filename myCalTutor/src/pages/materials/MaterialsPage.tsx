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

export function MaterialsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-3">
        <Badge variant="secondary" className="w-fit">
          Course files
        </Badge>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Materials
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Textbook, syllabus, notes, and worksheets will be uploaded and
          inspected here. PDF ingest starts in MVP 3.
        </p>
      </header>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>No materials yet</CardTitle>
          <CardDescription>
            Upload is disabled until storage and page-level text extraction are
            in place.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed border-border bg-surface-muted px-4 py-10 text-center text-sm text-muted-foreground">
            Drop a PDF here later. For now this page is a placeholder.
          </div>
        </CardContent>
        <CardFooter>
          <Button disabled>Add material</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
