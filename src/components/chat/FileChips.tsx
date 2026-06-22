import { FileText, Music2, X, File as FileIcon, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useObjectUrl } from '@/hooks/useObjectUrl'

export function FileChips({
  files,
  onRemove,
}: {
  files: File[]
  onRemove?: (index: number) => void
}) {
  if (files.length === 0) return null
  const indexed = files.map((file, idx) => ({ file, idx }))
  const images = indexed.filter(({ file }) => file.type.startsWith('image/'))
  const others = indexed.filter(({ file }) => !file.type.startsWith('image/'))

  return (
    <div className="flex flex-col gap-2 px-1 pb-2 pt-1">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map(({ file, idx }) => (
            <ImageThumb key={`${file.name}-${idx}`} file={file} onRemove={onRemove && (() => onRemove(idx))} />
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {others.map(({ file, idx }) => (
            <FileChip key={`${file.name}-${idx}`} file={file} onRemove={onRemove && (() => onRemove(idx))} />
          ))}
        </div>
      )}
    </div>
  )
}

function ImageThumb({ file, onRemove }: { file: File; onRemove?: () => void }) {
  const url = useObjectUrl(file)
  return (
    <div className="group relative h-16 w-16 overflow-hidden rounded-[10px] border border-border bg-muted">
      {url && <img src={url} alt={file.name} className="absolute inset-0 h-full w-full object-cover" />}
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={`Xoá ${file.name}`}
          className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100"
        >
          <X />
        </Button>
      )}
    </div>
  )
}

function FileChip({ file, onRemove }: { file: File; onRemove?: () => void }) {
  const Icon = getFileIcon(file)
  return (
    <div className="group inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-border bg-background px-2.5">
      <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <span className="max-w-[160px] truncate text-[12.5px] font-medium text-muted-foreground">{file.name}</span>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={`Xoá ${file.name}`}
          className="ml-0.5 h-4 w-4 rounded-full bg-muted hover:bg-foreground/15"
        >
          <X />
        </Button>
      )}
    </div>
  )
}

function getFileIcon(file: File): LucideIcon {
  if (file.type.startsWith('audio/')) return Music2
  if (
    file.type === 'application/pdf' ||
    file.type.startsWith('text/') ||
    /\.(md|txt|doc|docx)$/i.test(file.name)
  )
    return FileText
  return FileIcon
}
