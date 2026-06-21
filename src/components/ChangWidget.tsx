import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Header } from './Header'
import { TabBar } from './TabBar'
import { BottomSheet } from './BottomSheet'
import { ChatPanel } from './chat/ChatPanel'
import { HistorySheetContent } from './chat/HistorySheetContent'
import { QuickSheetContent } from './chat/QuickSheetContent'
import { TasksPanel } from './tasks/TasksPanel'
import { TaskDetailPanel } from './tasks/TaskDetailPanel'
import { NotificationsPanel } from './noti/NotificationsPanel'
import type { Tab } from '@/types'

export function ChangWidget() {
  const { minimized, activeTab, currentTaskId, switchTab, sheetTab, closeSheet } = useWidgetStore()
  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-10 flex h-[680px] w-[408px] flex-col overflow-hidden rounded-[20px]',
        'bg-card border border-border',
        'transition-all duration-200',
        minimized && 'pointer-events-none translate-y-5 scale-95 opacity-0',
        'max-[480px]:inset-0 max-[480px]:h-full max-[480px]:w-full max-[480px]:rounded-none',
        'max-[480px]:!translate-y-0 max-[480px]:!scale-100 max-[480px]:!opacity-100 max-[480px]:!pointer-events-auto',
      )}
      style={{ boxShadow: 'var(--widget-shadow)' }}
    >
      <Header />
      <Tabs
        value={currentTaskId ? 'tasks' : activeTab}
        onValueChange={(v) => switchTab(v as Tab)}
        activationMode="manual"
        className="relative flex flex-1 flex-col overflow-hidden"
      >
        <div className="relative flex-1 overflow-hidden">
          <TabsContent value="chat" className="m-0 h-full overflow-hidden">
            <ChatPanel />
          </TabsContent>
          <TabsContent value="tasks" className="m-0 h-full overflow-hidden">
            {currentTaskId ? <TaskDetailPanel /> : <TasksPanel />}
          </TabsContent>
          <TabsContent value="noti" className="m-0 h-full overflow-hidden">
            <NotificationsPanel />
          </TabsContent>

          <AnimatePresence>
            {sheetTab && (
              <motion.div
                key="sheet-backdrop"
                onClick={closeSheet}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-10 bg-black/30"
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {sheetTab && (
              <BottomSheet key="sheet" onDismiss={closeSheet}>
                {sheetTab === 'history' && <HistorySheetContent />}
                {sheetTab === 'quick' && <QuickSheetContent />}
              </BottomSheet>
            )}
          </AnimatePresence>
        </div>

        <TabBar />
      </Tabs>
    </div>
  )
}
