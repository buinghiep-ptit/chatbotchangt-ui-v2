import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import { SEED_TASKS } from '@/data/tasks'
import type { TaskFilter } from '@/types'

const SUBTABS: { id: TaskFilter; label: string }[] = [
  { id: 'pending', label: 'Cần xử lý' },
  { id: 'watch', label: 'Theo dõi' },
  { id: 'mine', label: 'Khởi tạo' },
  { id: 'done', label: 'Hoàn thành' },
]
const count = (f: TaskFilter) => SEED_TASKS.filter((t) => t.bucket.includes(f)).length

export function SubTabs() {
  const { taskFilter, setTaskFilter } = useWidgetStore()
  return (
    <div className="flex flex-shrink-0 gap-1 overflow-x-auto border-b border-border/60 px-3 py-2.5 [&::-webkit-scrollbar]:hidden">
      {SUBTABS.map(({ id, label }) => (
        <button key={id} type="button" onClick={() => setTaskFilter(id)}
          className={cn('whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] font-semibold',
            taskFilter === id ? 'bg-primary/15 text-primary' : 'text-muted-foreground')}>
          {label}<span className="ml-1 opacity-70">{count(id)}</span>
        </button>
      ))}
    </div>
  )
}
