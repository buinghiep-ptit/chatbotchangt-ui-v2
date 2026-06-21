import { useState } from 'react'
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
  // Previous value + derived direction held in state (React's "adjust state when
  // a prop changes" pattern) — lint-clean and StrictMode-safe, unlike a ref read
  // and written during render.
  const [prevHadTask, setPrevHadTask] = useState(hasTask)
  const [direction, setDirection] = useState(0)
  if (prevHadTask !== hasTask) {
    setDirection(hasTask ? 1 : -1)
    setPrevHadTask(hasTask)
  }

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
          // Opaque background so the incoming panel fully occludes the outgoing
          // one during the push/pop — otherwise the widget's bg-card shows
          // through the transparent panel and the list appears to flicker.
          className="absolute inset-0 h-full bg-card"
        >
          {currentTaskId ? <TaskDetailPanel /> : <TasksPanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
