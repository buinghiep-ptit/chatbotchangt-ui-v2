import { motion, useDragControls, type PanInfo } from 'motion/react'
import { SPRING, shouldDismiss } from '@/lib/motion'

interface BottomSheetProps {
  children: React.ReactNode
  onDismiss: () => void
  maxHeight?: string
}

/**
 * Bottom sheet overlay. Mounted only while a sheet tab is active (see ChangWidget),
 * wrapped by AnimatePresence there so it animates both in and out. Springs up on
 * enter, down on exit. Drag-to-dismiss is initiated only from the grabber so the
 * sheet body still scrolls normally.
 */
export function BottomSheet({ children, onDismiss, maxHeight = '60%' }: BottomSheetProps) {
  const controls = useDragControls()
  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 z-20 overflow-y-auto rounded-t-2xl bg-card border-t border-border"
      style={{ maxHeight }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={SPRING}
      drag="y"
      dragListener={false}
      dragControls={controls}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, info: PanInfo) => {
        if (shouldDismiss(info.offset.y, info.velocity.y)) onDismiss()
      }}
    >
      <div
        data-testid="sheet-grabber"
        onPointerDown={(e) => controls.start(e)}
        className="flex flex-shrink-0 cursor-grab justify-center pb-1.5 pt-2.5 touch-none"
        style={{ touchAction: 'none' }}
      >
        <div className="h-1 w-10 rounded-full bg-border/60" />
      </div>
      {children}
    </motion.div>
  )
}
