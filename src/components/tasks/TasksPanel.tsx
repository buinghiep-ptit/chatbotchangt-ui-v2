import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useWidgetStore } from '@/store/useWidgetStore'
import { listContainer, listItem, subTabVariants, SPRING } from '@/lib/motion'
import type { TaskFilter } from '@/types'
import { SubTabs } from './SubTabs'
import { TaskCard } from './TaskCard'
import { EmptyState } from './EmptyState'

const SUBTAB_ORDER: TaskFilter[] = ['pending', 'watch', 'mine', 'done']

export function TasksPanel() {
  // Select stable references and derive in render. Subscribing to
  // `filteredTasks()` directly returns a fresh array each call, which makes
  // Zustand's getSnapshot change every render -> infinite update loop.
  const tasks = useWidgetStore((s) => s.tasks)
  const taskFilter = useWidgetStore((s) => s.taskFilter)
  const filtered = tasks.filter((t) => t.bucket.includes(taskFilter))

  // Track slide direction when the active filter changes.
  const [prevFilter, setPrevFilter] = useState(taskFilter)
  const [direction, setDirection] = useState(0)
  if (prevFilter !== taskFilter) {
    setDirection(Math.sign(SUBTAB_ORDER.indexOf(taskFilter) - SUBTAB_ORDER.indexOf(prevFilter)))
    setPrevFilter(taskFilter)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <SubTabs />
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence custom={direction} initial={false}>
          <motion.div
            key={taskFilter}
            custom={direction}
            variants={subTabVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={SPRING}
            className="absolute inset-0 overflow-y-auto scrollbar-thin"
          >
            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <motion.div
                variants={listContainer}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-2.5 p-3"
              >
                {filtered.map((t) => (
                  <motion.div key={t.id} variants={listItem}>
                    <TaskCard task={t} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
