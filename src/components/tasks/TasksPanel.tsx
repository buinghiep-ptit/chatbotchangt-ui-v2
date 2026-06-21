import { motion } from 'motion/react'
import { useWidgetStore } from '@/store/useWidgetStore'
import { listContainer, listItem } from '@/lib/motion'
import { SubTabs } from './SubTabs'
import { TaskCard } from './TaskCard'
import { EmptyState } from './EmptyState'

export function TasksPanel() {
  // Select stable references and derive in render. Subscribing to
  // `filteredTasks()` directly returns a fresh array each call, which makes
  // Zustand's getSnapshot change every render -> infinite update loop.
  const tasks = useWidgetStore((s) => s.tasks)
  const taskFilter = useWidgetStore((s) => s.taskFilter)
  const filtered = tasks.filter((t) => t.bucket.includes(taskFilter))
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <SubTabs />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            // Re-key on the filter so switching sub-tabs replays the stagger.
            key={taskFilter}
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
      </div>
    </div>
  )
}
