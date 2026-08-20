import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  MATERIAL_TYPE_LABELS,
  MATERIAL_TYPES,
  materialTypeSchema,
  type MaterialType,
} from '@/types/materials'

const selectClassName = cn(
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
  'disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30',
)

type AddMaterialDialogProps = {
  disabled?: boolean
  onUpload: (input: { file: File; materialType: MaterialType }) => Promise<unknown>
}

export function AddMaterialDialog({
  disabled = false,
  onUpload,
}: AddMaterialDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [materialType, setMaterialType] = useState<MaterialType>('textbook')
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setFile(null)
    setMaterialType('textbook')
    setError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!file) {
      setError('Choose a PDF file.')
      return
    }

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      setError('Only PDF files can be uploaded.')
      return
    }

    const parsedType = materialTypeSchema.safeParse(materialType)
    if (!parsedType.success) {
      setError('Choose a material type.')
      return
    }

    const uploadPromise = onUpload({
      file,
      materialType: parsedType.data,
    })
    setOpen(false)
    reset()

    try {
      await uploadPromise
      toast.success('Material is ready to inspect.')
    } catch (uploadError) {
      toast.error(
        uploadError instanceof Error
          ? uploadError.message
          : 'Could not upload the material.',
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          reset()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={disabled}>Add material</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Add course material</DialogTitle>
            <DialogDescription>
              Upload a PDF. Text is extracted in the browser, page by page.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">PDF file</span>
              <Input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null)
                  setError(null)
                }}
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Material type</span>
              <select
                className={selectClassName}
                value={materialType}
                onChange={(event) =>
                  setMaterialType(event.target.value as MaterialType)
                }
              >
                {MATERIAL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {MATERIAL_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </label>

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={disabled}>
              Upload and extract
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
