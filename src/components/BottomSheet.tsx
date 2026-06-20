import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  children: React.ReactNode
}

export function BottomSheet({ open, children }: BottomSheetProps) {
  return (
    <div
      className={cn(
        'absolute bottom-0 left-0 right-0 z-20',
        'max-h-[60%] overflow-y-auto',
        'rounded-t-2xl bg-card border-t border-border',
        'transition-transform duration-200 ease-out',
        open ? 'translate-y-0' : 'translate-y-full',
      )}
    >
      <div className="mx-auto my-2 h-1 w-10 rounded-full bg-border/60 flex-shrink-0" />
      {children}
    </div>
  )
}
