import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { hostBridge } from '@/lib/hostBridge'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Tabs } from '@/components/ui/tabs'
import { Header } from './Header'
import { TabBar } from './TabBar'
import { BottomSheet } from './BottomSheet'
import { ChatPanel } from './chat/ChatPanel'
import { HistorySheetContent } from './chat/HistorySheetContent'
import { QuickSheetContent } from './chat/QuickSheetContent'
import { MoreSheetContent } from './chat/MoreSheetContent'
import { BrickSheetContent } from './chat/BrickSheetContent'
import { TasksView } from './tasks/TasksView'
import { NotificationsPanel } from './noti/NotificationsPanel'
import { TAB_ORDER, getDirection, tabPanelVariants, SPRING } from '@/lib/motion'
import type { Tab } from '@/types'

// Accessible names for the animated tab panels — reuse the TabBar's visible labels.
const PANEL_LABELS: Record<'chat' | 'tasks' | 'noti', string> = {
  chat: 'Trò chuyện',
  tasks: 'Công việc',
  noti: 'Thông báo',
}

export function ChangWidget() {
  const { activeTab, currentTaskId, switchTab, sheetTab, closeSheet, brickSheetOpen, closeBrickSheet } = useWidgetStore()
  const view = (currentTaskId ? 'tasks' : activeTab) as 'chat' | 'tasks' | 'noti'

  // Tell the host this chat frame has loaded so it can reveal the bubble.
  useEffect(() => {
    hostBridge.initChat()
  }, [])

  // Direction of travel for the slide, based on tab order. Derived by comparing
  // the new index with the previous one held in state — React's "adjust state
  // when a prop changes" pattern. Lint-clean and correct under StrictMode/
  // concurrent rendering (reading/writing a ref during render is neither).
  const nextIndex = TAB_ORDER.indexOf(view)
  const [prevIndex, setPrevIndex] = useState(nextIndex)
  const [direction, setDirection] = useState(0)
  if (prevIndex !== nextIndex) {
    setDirection(getDirection(prevIndex, nextIndex))
    setPrevIndex(nextIndex)
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-card">
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
              role="tabpanel"
              aria-label={PANEL_LABELS[view]}
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
                {sheetTab === 'more' && <MoreSheetContent />}
              </BottomSheet>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {brickSheetOpen && (
              <motion.div
                key="brick-backdrop"
                onClick={closeBrickSheet}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-10 bg-black/30"
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {brickSheetOpen && (
              <BottomSheet key="brick-sheet" onDismiss={closeBrickSheet}>
                <BrickSheetContent />
              </BottomSheet>
            )}
          </AnimatePresence>
        </div>

        <TabBar />
      </Tabs>
    </div>
  )
}
