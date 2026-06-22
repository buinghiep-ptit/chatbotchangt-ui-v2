import type { Transition, Variants } from 'motion/react'

// Snappy native-feeling spring for panel/sheet motion.
export const SPRING: Transition = { type: 'spring', stiffness: 380, damping: 32 }
// Softer spring for the layout indicator and drag snap-back.
export const SOFT_SPRING: Transition = { type: 'spring', stiffness: 300, damping: 30 }

// Left-to-right order of the three real tabs; drives slide direction.
export const TAB_ORDER = ['chat', 'tasks', 'noti'] as const

/** Sign of travel between two tab indices: 1 = rightward, -1 = leftward, 0 = same. */
export function getDirection(prev: number, next: number): number {
  return Math.sign(next - prev)
}

// Drag-to-dismiss thresholds for the bottom sheet.
export const DISMISS_OFFSET = 100
export const DISMISS_VELOCITY = 500

/** True when a downward drag should close the sheet (far enough OR fast enough). */
export function shouldDismiss(offsetY: number, velocityY: number): boolean {
  return offsetY > DISMISS_OFFSET || velocityY > DISMISS_VELOCITY
}

// Directional slide for the main tab panels (chat/tasks/noti).
export const tabPanelVariants: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : dir < 0 ? '-100%' : 0, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-30%' : dir < 0 ? '30%' : 0, opacity: 0 }),
}

// iOS-style push/pop for tasks list <-> detail. dir >= 0 = push (deeper), dir < 0 = pop.
export const pushVariants: Variants = {
  enter: (dir: number) => ({ x: dir >= 0 ? '100%' : '-25%' }),
  center: { x: '0%' },
  exit: (dir: number) => ({ x: dir >= 0 ? '-25%' : '100%' }),
}

// Staggered list entrance.
export const listContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
}
export const listItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
}

// Subtle directional slide for sub-tab content (tasks filter switching).
export const subTabVariants: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? '30%' : dir < 0 ? '-30%' : 0, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-30%' : dir < 0 ? '30%' : 0, opacity: 0 }),
}

// Message-bubble entrance.
export const bubbleVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
}
