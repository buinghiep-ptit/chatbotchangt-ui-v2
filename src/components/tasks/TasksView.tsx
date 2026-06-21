import { useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useWidgetStore } from '@/store/useWidgetStore'
import { TasksPanel } from './TasksPanel'
import { TaskDetailPanel } from './TaskDetailPanel'
import { pushVariants, SPRING } from '@/lib/motion'

/**
 * Tasks tab content. Animates between the list and a task detail like an iOS
 * navigation stack: opening pushes the detail in from the right; the back
 * button pops it off to the right. AnimatePresence preserves the outgoing
 * view's last-rendered content during the transition.
 */
export function TasksView() {
  const currentTaskId = useWidgetStore((s) => s.currentTaskId)
  const hasTask = !!currentTaskId

  // direction: 1 when pushing into a detail, -1 when popping back, 0 otherwise.
  const prevHadTask = useRef(hasTask)
  const direction = hasTask && !prevHadTask.current ? 1 : !hasTask && prevHadTask.current ? -1 : 0
  prevHadTask.current = hasTask

  return (
    <div className="relative h-full overflow-hidden">
      <AnimatePresence custom={direction} initial={false}>
        <motion.div
          key={currentTaskId ?? 'list'}
          custom={direction}
          variants={pushVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SPRING}
          className="absolute inset-0 h-full"
        >
          {currentTaskId ? <TaskDetailPanel /> : <TasksPanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
