import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Header } from './Header'
import { TabBar } from './TabBar'
import { ChatPanel } from './chat/ChatPanel'
import { TasksPanel } from './tasks/TasksPanel'
import { TaskDetailPanel } from './tasks/TaskDetailPanel'
import { NotificationsPanel } from './noti/NotificationsPanel'

export function ChangWidget() {
  const { minimized, activeTab, currentTaskId } = useWidgetStore()
  return (
    <div
      className={cn(
        'glass glass-sheen fixed bottom-6 right-6 z-10 flex h-[680px] w-[408px] flex-col overflow-hidden rounded-[20px]',
        'transition-all duration-200',
        minimized && 'pointer-events-none translate-y-5 scale-95 opacity-0',
        'max-[480px]:inset-0 max-[480px]:h-full max-[480px]:w-full max-[480px]:rounded-none',
        'max-[480px]:!translate-y-0 max-[480px]:!scale-100 max-[480px]:!opacity-100 max-[480px]:!pointer-events-auto',
      )}
    >
      <Header />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {currentTaskId ? (
          <TaskDetailPanel />
        ) : (
          <>
            {activeTab === 'chat' && <ChatPanel />}
            {activeTab === 'tasks' && <TasksPanel />}
            {activeTab === 'noti' && <NotificationsPanel />}
          </>
        )}
      </div>
      <TabBar />
    </div>
  )
}
