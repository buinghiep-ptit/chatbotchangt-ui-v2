import { cn } from '@/lib/utils'

export function Chip({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5',
        'text-[12.5px] font-medium text-muted-foreground transition-colors',
        'hover:border-primary hover:text-primary hover:bg-primary/10',
        className,
      )}
    >
      {children}
    </button>
  )
}
