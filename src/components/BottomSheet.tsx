import { cn } from '@/lib/utils'

interface BottomSheetProps {
  children: React.ReactNode
}

/**
 * Bottom sheet overlay. Mounted only while a sheet tab is active (see ChangWidget),
 * so it occupies no space and leaves no residual strip when closed. Slides up on mount.
 */
export function BottomSheet({ children }: BottomSheetProps) {
  return (
    <div
      className={cn(
        'absolute bottom-0 left-0 right-0 z-20',
        'max-h-[60%] overflow-y-auto',
        'rounded-t-2xl bg-card border-t border-border',
        'animate-in slide-in-from-bottom-[100%] duration-200 ease-out',
      )}
    >
      <div className="mx-auto my-2 h-1 w-10 rounded-full bg-border/60 flex-shrink-0" />
      {children}
    </div>
  )
}
