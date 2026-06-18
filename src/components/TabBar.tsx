import { MessageCircle, ListChecks, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import type { Tab } from '@/types'

const TABS: { id: Tab; label: string; Icon: typeof Bell }[] = [
  { id: 'chat', label: 'Trò chuyện', Icon: MessageCircle },
  { id: 'tasks', label: 'Công việc', Icon: ListChecks },
  { id: 'noti', label: 'Thông báo', Icon: Bell },
]

export function TabBar() {
  const { activeTab, currentTaskId, switchTab, pendingTaskCount, unreadNotiCount } = useWidgetStore()
  // detail view keeps the Tasks tab highlighted
  const highlight: Tab = currentTaskId ? 'tasks' : activeTab
  const badge: Partial<Record<Tab, number>> = { tasks: pendingTaskCount(), noti: unreadNotiCount() }

  return (
    <div className="flex flex-shrink-0 border-t border-border/60 bg-background/40 px-1 py-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] backdrop-blur">
      {TABS.map(({ id, label, Icon }) => {
        const count = badge[id]
        return (
          <button key={id} type="button" onClick={() => switchTab(id)}
            className={cn('relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 font-semibold',
              highlight === id ? 'text-primary' : 'text-muted-foreground')}>
            <span className="relative inline-flex">
              <Icon className="h-[21px] w-[21px]" />
              {!!count && (
                <span className="absolute -top-1.5 left-full -ml-2 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-background bg-[hsl(var(--status-alert))] px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </span>
            <span className="text-[10px]">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
