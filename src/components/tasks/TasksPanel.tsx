import { useWidgetStore } from '@/store/useWidgetStore'
import { SubTabs } from './SubTabs'
import { TaskCard } from './TaskCard'
import { EmptyState } from './EmptyState'

export function TasksPanel() {
  const tasks = useWidgetStore((s) => s.filteredTasks())
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <SubTabs />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {tasks.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-2.5 p-3">
            {tasks.map((t) => <TaskCard key={t.id} task={t} />)}
          </div>
        )}
      </div>
    </div>
  )
}
