import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function Chip({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <Button variant="outline" onClick={onClick}
      className={cn(
        'h-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5',
        'text-[12.5px] font-medium text-muted-foreground',
        'hover:border-primary hover:bg-primary/10 hover:text-primary',
        className,
      )}>
      {children}
    </Button>
  )
}
