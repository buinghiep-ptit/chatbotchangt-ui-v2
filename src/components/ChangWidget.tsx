import { useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Tabs } from '@/components/ui/tabs'
import { Header } from './Header'
import { TabBar } from './TabBar'
import { BottomSheet } from './BottomSheet'
import { ChatPanel } from './chat/ChatPanel'
import { HistorySheetContent } from './chat/HistorySheetContent'
import { QuickSheetContent } from './chat/QuickSheetContent'
import { TasksView } from './tasks/TasksView'
import { NotificationsPanel } from './noti/NotificationsPanel'
import { TAB_ORDER, getDirection, tabPanelVariants, SPRING } from '@/lib/motion'
import type { Tab } from '@/types'

export function ChangWidget() {
  const { minimized, activeTab, currentTaskId, switchTab, sheetTab, closeSheet } = useWidgetStore()
  const view = (currentTaskId ? 'tasks' : activeTab) as 'chat' | 'tasks' | 'noti'

  // Direction of travel for the slide, based on tab order. Updated each render.
  const nextIndex = TAB_ORDER.indexOf(view)
  const prevIndexRef = useRef(nextIndex)
  const direction = getDirection(prevIndexRef.current, nextIndex)
  prevIndexRef.current = nextIndex

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-10 flex h-[680px] w-[408px] flex-col overflow-hidden rounded-[20px]',
        'bg-card border border-border',
        'transition-all duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
        minimized && 'pointer-events-none translate-y-5 scale-95 opacity-0',
        'max-[480px]:inset-0 max-[480px]:h-full max-[480px]:w-full max-[480px]:rounded-none',
        'max-[480px]:!translate-y-0 max-[480px]:!scale-100 max-[480px]:!opacity-100 max-[480px]:!pointer-events-auto',
      )}
      style={{ boxShadow: 'var(--widget-shadow)' }}
    >
      <Header />
      <Tabs
        value={view}
        onValueChange={(v) => switchTab(v as Tab)}
        activationMode="manual"
        className="relative flex flex-1 flex-col overflow-hidden"
      >
        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence custom={direction} initial={false}>
            <motion.div
              key={view}
              custom={direction}
              variants={tabPanelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SPRING}
              className="absolute inset-0 h-full overflow-hidden"
            >
              {view === 'chat' && <ChatPanel />}
              {view === 'tasks' && <TasksView />}
              {view === 'noti' && <NotificationsPanel />}
            </motion.div>
          </AnimatePresence>

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
