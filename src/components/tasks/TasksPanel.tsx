import { useWidgetStore } from '@/store/useWidgetStore'
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
          <div className="flex flex-col gap-2.5 p-3">
            {filtered.map((t) => <TaskCard key={t.id} task={t} />)}
          </div>
        )}
      </div>
    </div>
  )
}
