import { MessageCircle, ListChecks, Bell, History, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Tab } from '@/types'

const TABS: { id: Tab; label: string; Icon: typeof Bell }[] = [
  { id: 'chat', label: 'Trò chuyện', Icon: MessageCircle },
  { id: 'tasks', label: 'Công việc', Icon: ListChecks },
  { id: 'noti', label: 'Thông báo', Icon: Bell },
  { id: 'history', label: 'Lịch sử', Icon: History },
  { id: 'quick', label: 'Gợi ý', Icon: Zap },
]

export function TabBar() {
  const { pendingTaskCount, unreadNotiCount, sheetTab, switchTab } = useWidgetStore()
  const badge: Partial<Record<Tab, number>> = {
    tasks: pendingTaskCount(),
    noti: unreadNotiCount(),
  }

  return (
    <TabsList className="flex h-auto shrink-0 rounded-none border-t border-border/60 bg-card px-1 py-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))]">
      {TABS.map(({ id, label, Icon }) => {
        const count = badge[id]
        const sheetActive = sheetTab === id
        const isSheetTab = id === 'history' || id === 'quick'
        return (
          <TabsTrigger
            key={id}
            value={id}
            // Real tabs: also handle onClick so clicking the already-active background
            // tab (parked at 'chat' while a sheet is open) still closes the sheet —
            // Radix fires onValueChange only on a value *change*. Sheet tabs rely solely
            // on onValueChange (single fire via activationMode="manual") to keep their toggle.
            onClick={isSheetTab ? undefined : () => switchTab(id)}
            className={cn(
              'relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5',
              'font-semibold text-muted-foreground',
              'data-[state=active]:bg-transparent data-[state=active]:shadow-none',
              !sheetTab && 'data-[state=active]:text-primary',
              sheetTab && !sheetActive && 'data-[state=active]:text-muted-foreground',
              sheetActive && 'text-primary',
            )}
          >
            <span className="relative inline-flex">
              <Icon className="h-[21px] w-[21px]" />
              {!!count && (
                <span className="absolute -top-1.5 left-full -ml-2 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-background bg-[hsl(var(--status-alert))] px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </span>
            <span className="text-[10px]">{label}</span>
          </TabsTrigger>
        )
      })}
    </TabsList>
  )
}
