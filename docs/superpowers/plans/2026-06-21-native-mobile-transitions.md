# Native-feel Mobile Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add smooth, physics-based transitions (tab switching, tab focus indicator, bottom-sheet enter/exit + drag-to-dismiss, list→detail push/pop, list/message stagger) so the Chang webview feels like a native iOS/Android app.

**Architecture:** Introduce the `motion` library. Centralize springs/variants/pure helpers in `src/lib/motion.ts`. Drive tab-panel and bottom-sheet presence with `AnimatePresence` in `ChangWidget`, keep Radix `Tabs` for the tab-bar a11y, and add a shared-layout (`layoutId`) active indicator. Nest a push/pop `AnimatePresence` for tasks list→detail. All transitions use transform/opacity only and respect `prefers-reduced-motion` via a top-level `MotionConfig`.

**Tech Stack:** React 19, Vite, Tailwind, Radix UI Tabs, Zustand, `motion` (framer-motion), Vitest + Testing Library.

## Global Constraints

- **Animate only `transform` and `opacity`** in transitions — no width/height/top/left (60fps in webview).
- **Respect reduced motion:** app is wrapped in `<MotionConfig reducedMotion="user">`; never bypass it.
- **Mobile override must keep working:** the `max-[480px]:*` full-screen rules on the widget container (`ChangWidget`) must remain effective.
- **Library import path:** import all motion APIs from `motion/react` (e.g. `import { motion, AnimatePresence } from 'motion/react'`).
- **Vietnamese UI copy** is unchanged; do not alter any visible strings.
- **Package manager is yarn** (repo has `yarn.lock`).
- Keep existing behavioral test coverage green; only adjust assertions where animation genuinely changes the DOM lifecycle (deferred unmount), never to weaken coverage.

---

## File Structure

- `package.json` — add `motion` dependency.
- `src/main.tsx` — wrap `<App />` in `<MotionConfig reducedMotion="user">`.
- `src/lib/motion.ts` — **new**: springs, variants, `TAB_ORDER`, `getDirection`, `shouldDismiss`, dismiss thresholds. Pure helpers are unit-tested.
- `src/lib/motion.test.ts` — **new**: tests for `getDirection` + `shouldDismiss`.
- `src/components/BottomSheet.tsx` — motion sheet + drag-to-dismiss from grabber.
- `src/components/BottomSheet.test.tsx` — updated for new props/markup.
- `src/components/ChangWidget.tsx` — tab-panel `AnimatePresence` (directional slide) + sheet/backdrop `AnimatePresence`.
- `src/components/ChangWidget.test.tsx` — updated for deferred (animated) unmount.
- `src/components/tasks/TasksView.tsx` — **new**: nested push/pop between list and detail.
- `src/components/tasks/TasksView.test.tsx` — **new**: renders list vs detail.
- `src/components/TabBar.tsx` — `layoutId` active-indicator pill + `whileTap` icon.
- `src/components/chat/MessageList.tsx` — message-bubble entrance.
- `src/components/tasks/TasksPanel.tsx` — task-card stagger.
- `src/components/noti/NotificationsPanel.tsx` — notification stagger.

---

## Task 1: Foundation — install `motion`, add `MotionConfig`, create `src/lib/motion.ts`

**Files:**
- Modify: `package.json` (add dependency)
- Modify: `src/main.tsx`
- Create: `src/lib/motion.ts`
- Test: `src/lib/motion.test.ts`

**Interfaces:**
- Produces (consumed by later tasks):
  - `SPRING: Transition`, `SOFT_SPRING: Transition`
  - `TAB_ORDER: readonly ['chat','tasks','noti']`
  - `getDirection(prev: number, next: number): number`
  - `DISMISS_OFFSET: number`, `DISMISS_VELOCITY: number`, `shouldDismiss(offsetY: number, velocityY: number): boolean`
  - `tabPanelVariants: Variants`, `pushVariants: Variants`, `listContainer: Variants`, `listItem: Variants`, `bubbleVariants: Variants`

- [ ] **Step 1: Install the dependency**

Run:
```bash
yarn add motion
```
Expected: `motion` appears under `dependencies` in `package.json`; install completes without peer-dependency errors (motion supports React 19).

- [ ] **Step 2: Write the failing test for pure helpers**

Create `src/lib/motion.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { getDirection, shouldDismiss, DISMISS_OFFSET, DISMISS_VELOCITY } from './motion'

describe('getDirection', () => {
  it('returns 1 when moving to a higher index', () => {
    expect(getDirection(0, 2)).toBe(1)
  })
  it('returns -1 when moving to a lower index', () => {
    expect(getDirection(2, 0)).toBe(-1)
  })
  it('returns 0 when index is unchanged', () => {
    expect(getDirection(1, 1)).toBe(0)
  })
})

describe('shouldDismiss', () => {
  it('dismisses when dragged past the offset threshold', () => {
    expect(shouldDismiss(DISMISS_OFFSET + 1, 0)).toBe(true)
  })
  it('dismisses on a fast downward flick even below the offset threshold', () => {
    expect(shouldDismiss(10, DISMISS_VELOCITY + 1)).toBe(true)
  })
  it('does not dismiss for a small, slow drag', () => {
    expect(shouldDismiss(10, 50)).toBe(false)
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `yarn vitest run src/lib/motion.test.ts`
Expected: FAIL — `Failed to resolve import "./motion"` (file does not exist yet).

- [ ] **Step 4: Create `src/lib/motion.ts`**

```ts
import type { Transition, Variants } from 'motion/react'

// Snappy native-feeling spring for panel/sheet motion.
export const SPRING: Transition = { type: 'spring', stiffness: 380, damping: 32 }
// Softer spring for the layout indicator and drag snap-back.
export const SOFT_SPRING: Transition = { type: 'spring', stiffness: 300, damping: 30 }

// Left-to-right order of the three real tabs; drives slide direction.
export const TAB_ORDER = ['chat', 'tasks', 'noti'] as const

/** Sign of travel between two tab indices: 1 = rightward, -1 = leftward, 0 = same. */
export function getDirection(prev: number, next: number): number {
  return Math.sign(next - prev)
}

// Drag-to-dismiss thresholds for the bottom sheet.
export const DISMISS_OFFSET = 100
export const DISMISS_VELOCITY = 500

/** True when a downward drag should close the sheet (far enough OR fast enough). */
export function shouldDismiss(offsetY: number, velocityY: number): boolean {
  return offsetY > DISMISS_OFFSET || velocityY > DISMISS_VELOCITY
}

// Directional slide for the main tab panels (chat/tasks/noti).
export const tabPanelVariants: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : dir < 0 ? '-100%' : 0, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-30%' : dir < 0 ? '30%' : 0, opacity: 0 }),
}

// iOS-style push/pop for tasks list <-> detail. dir >= 0 = push (deeper), dir < 0 = pop.
export const pushVariants: Variants = {
  enter: (dir: number) => ({ x: dir >= 0 ? '100%' : '-25%' }),
  center: { x: '0%' },
  exit: (dir: number) => ({ x: dir >= 0 ? '-25%' : '100%' }),
}

// Staggered list entrance.
export const listContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
}
export const listItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
}

// Message-bubble entrance.
export const bubbleVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `yarn vitest run src/lib/motion.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Wrap the app in `MotionConfig`**

Edit `src/main.tsx` — add the import and wrap `<App />`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import App from './App'
import './index.css'
import { loadInitialTheme, useWidgetStore } from '@/store/useWidgetStore'

useWidgetStore.setState({ theme: loadInitialTheme() })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </React.StrictMode>,
)
```

- [ ] **Step 7: Verify the app still builds/runs**

Run: `yarn build`
Expected: build succeeds (TypeScript + Vite), no errors.

- [ ] **Step 8: Commit**

```bash
git add package.json yarn.lock src/lib/motion.ts src/lib/motion.test.ts src/main.tsx
git commit -m "feat: add motion lib, MotionConfig, and shared motion helpers"
```

---

## Task 2: BottomSheet — motion enter/exit + drag-to-dismiss from grabber

**Files:**
- Modify: `src/components/BottomSheet.tsx`
- Test: `src/components/BottomSheet.test.tsx`

**Interfaces:**
- Consumes: `SPRING`, `shouldDismiss` from `@/lib/motion` (Task 1).
- Produces: `BottomSheet` now requires an `onDismiss: () => void` prop (ChangWidget passes `closeSheet` in Task 3). The drag handle is rendered with `data-testid="sheet-grabber"`.

- [ ] **Step 1: Update the failing test**

Replace the entire contents of `src/components/BottomSheet.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { BottomSheet } from './BottomSheet'

it('renders its children', () => {
  render(<BottomSheet onDismiss={vi.fn()}><div>content</div></BottomSheet>)
  expect(screen.getByText('content')).toBeInTheDocument()
})

it('renders a drag grabber that initiates dismissal', () => {
  render(<BottomSheet onDismiss={vi.fn()}><div>content</div></BottomSheet>)
  expect(screen.getByTestId('sheet-grabber')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn vitest run src/components/BottomSheet.test.tsx`
Expected: FAIL — `getByTestId('sheet-grabber')` not found (current component has no testid) and/or TS error on `onDismiss` prop.

- [ ] **Step 3: Rewrite `BottomSheet.tsx`**

Replace the entire file:
```tsx
import { motion, useDragControls, type PanInfo } from 'motion/react'
import { SPRING, shouldDismiss } from '@/lib/motion'

interface BottomSheetProps {
  children: React.ReactNode
  onDismiss: () => void
}

/**
 * Bottom sheet overlay. Mounted only while a sheet tab is active (see ChangWidget),
 * wrapped by AnimatePresence there so it animates both in and out. Springs up on
 * enter, down on exit. Drag-to-dismiss is initiated only from the grabber so the
 * sheet body still scrolls normally.
 */
export function BottomSheet({ children, onDismiss }: BottomSheetProps) {
  const controls = useDragControls()
  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 z-20 max-h-[60%] overflow-y-auto rounded-t-2xl bg-card border-t border-border"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={SPRING}
      drag="y"
      dragListener={false}
      dragControls={controls}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, info: PanInfo) => {
        if (shouldDismiss(info.offset.y, info.velocity.y)) onDismiss()
      }}
    >
      <div
        data-testid="sheet-grabber"
        onPointerDown={(e) => controls.start(e)}
        className="flex flex-shrink-0 cursor-grab justify-center pb-1.5 pt-2.5 touch-none"
        style={{ touchAction: 'none' }}
      >
        <div className="h-1 w-10 rounded-full bg-border/60" />
      </div>
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn vitest run src/components/BottomSheet.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/BottomSheet.tsx src/components/BottomSheet.test.tsx
git commit -m "feat: animate bottom sheet with motion + drag-to-dismiss"
```

---

## Task 3: ChangWidget — animate sheet + backdrop presence (enter/exit)

**Files:**
- Modify: `src/components/ChangWidget.tsx`
- Test: `src/components/ChangWidget.test.tsx`

**Interfaces:**
- Consumes: `BottomSheet` with `onDismiss` (Task 2).
- Produces: sheet + backdrop now wrapped in `AnimatePresence`; closing a sheet unmounts **after** the exit animation (deferred).

- [ ] **Step 1: Update ChangWidget to wrap the sheet/backdrop in AnimatePresence**

Edit `src/components/ChangWidget.tsx`. Add the motion import at the top and replace the `{sheetTab && (...)}` block. The full file after this task (tab-panel slide comes in Task 4 — leave `TabsContent` as-is for now):
```tsx
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
```

- [ ] **Step 2: Update ChangWidget tests for deferred unmount**

In `src/components/ChangWidget.test.tsx`, replace the import line and the two tests that assert sheet removal so they await the animated unmount. Replace the whole file:
```tsx
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it } from 'vitest'
import { ChangWidget } from './ChangWidget'
import { useWidgetStore } from '@/store/useWidgetStore'

beforeEach(() => useWidgetStore.getState().__resetForTest())

it('does not mount the bottom sheet when no sheet tab is active', () => {
  render(<ChangWidget />)
  expect(useWidgetStore.getState().sheetTab).toBeNull()
  expect(screen.queryByText('Lịch sử hội thoại')).not.toBeInTheDocument()
})

it('mounts the history sheet only while the history tab is active', async () => {
  render(<ChangWidget />)
  act(() => useWidgetStore.getState().switchTab('history'))
  expect(screen.getByText('Lịch sử hội thoại')).toBeInTheDocument()

  act(() => useWidgetStore.getState().closeSheet())
  // Exit animation defers unmount; wait for it to finish.
  await waitFor(() =>
    expect(screen.queryByText('Lịch sử hội thoại')).not.toBeInTheDocument(),
  )
})

it('closes the sheet and highlights chat when the chat tab is clicked while a sheet is open', async () => {
  render(<ChangWidget />)
  act(() => useWidgetStore.getState().switchTab('history'))
  expect(screen.getByText('Lịch sử hội thoại')).toBeInTheDocument()

  await userEvent.click(screen.getByText('Trò chuyện'))

  expect(useWidgetStore.getState().sheetTab).toBeNull()
  expect(useWidgetStore.getState().activeTab).toBe('chat')
  await waitFor(() =>
    expect(screen.queryByText('Lịch sử hội thoại')).not.toBeInTheDocument(),
  )
})
```

- [ ] **Step 3: Run the ChangWidget tests**

Run: `yarn vitest run src/components/ChangWidget.test.tsx`
Expected: PASS (3 tests). If the exit animation occasionally exceeds the default `waitFor` window, the assertions still poll up to 1000ms — confirm they pass consistently across 2 runs.

- [ ] **Step 4: Commit**

```bash
git add src/components/ChangWidget.tsx src/components/ChangWidget.test.tsx
git commit -m "feat: animate bottom sheet + backdrop presence in ChangWidget"
```

---

## Task 4: ChangWidget — directional slide between tab panels

**Files:**
- Modify: `src/components/ChangWidget.tsx`

**Interfaces:**
- Consumes: `TAB_ORDER`, `getDirection`, `tabPanelVariants`, `SPRING` from `@/lib/motion` (Task 1).
- Produces: tab panels render through a single keyed `AnimatePresence` slide; `TabsContent` is no longer used for the three panels. (Tasks 5 keeps the `tasks` branch as `currentTaskId ? <TaskDetailPanel/> : <TasksPanel/>` until replaced by `TasksView`.)

- [ ] **Step 1: Replace the static TabsContent panels with an animated slide**

Edit `src/components/ChangWidget.tsx`. Remove the `TabsContent` import usage for panels and the three `TabsContent` blocks; add the `useRef` import, motion helpers import, and the keyed panel. Full file:
```tsx
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
import { TasksPanel } from './tasks/TasksPanel'
import { TaskDetailPanel } from './tasks/TaskDetailPanel'
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
        'transition-all duration-200',
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
              {view === 'tasks' && (currentTaskId ? <TaskDetailPanel /> : <TasksPanel />)}
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
```

- [ ] **Step 2: Run the existing ChangWidget + TabBar tests**

Run: `yarn vitest run src/components/ChangWidget.test.tsx src/components/TabBar.test.tsx`
Expected: PASS. (Sheet tests still pass; tab content now renders via the keyed panel. The history sheet text appears because `view` stays `chat` while the sheet is open.)

- [ ] **Step 3: Verify build**

Run: `yarn build`
Expected: succeeds with no TS errors (note: `TabsContent` import removed — confirm no stale references).

- [ ] **Step 4: Commit**

```bash
git add src/components/ChangWidget.tsx
git commit -m "feat: directional slide transition between tab panels"
```

---

## Task 5: TasksView — iOS push/pop between task list and detail

**Files:**
- Create: `src/components/tasks/TasksView.tsx`
- Modify: `src/components/ChangWidget.tsx` (use `<TasksView />` for the `tasks` branch)
- Test: `src/components/tasks/TasksView.test.tsx`

**Interfaces:**
- Consumes: `pushVariants`, `SPRING` from `@/lib/motion`; `TasksPanel`, `TaskDetailPanel`; `useWidgetStore` selector `currentTaskId`.
- Produces: `TasksView` — renders `TaskDetailPanel` when `currentTaskId` is set, else `TasksPanel`, with a nested push/pop `AnimatePresence`.

- [ ] **Step 1: Write the failing test**

Create `src/components/tasks/TasksView.test.tsx`:
```tsx
import { render, screen, act } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import { TasksView } from './TasksView'
import { useWidgetStore } from '@/store/useWidgetStore'
import { SEED_TASKS } from '@/data/tasks'

beforeEach(() => useWidgetStore.getState().__resetForTest())

it('renders the task list when no task is open', () => {
  render(<TasksView />)
  // SubTabs filter control from TasksPanel is present.
  expect(screen.getByText('Cần xử lý')).toBeInTheDocument()
})

it('renders the task detail when a task is open', () => {
  const id = SEED_TASKS[0].id
  act(() => useWidgetStore.getState().openTask(id))
  render(<TasksView />)
  expect(screen.getByTitle('Quay lại')).toBeInTheDocument()
})
```

Note: `Cần xử lý` is the default pending sub-tab label rendered by `TasksPanel`/`SubTabs`; `Quay lại` is the back-button title in `TaskDetailPanel`. If either label differs in the current source, read the component and use its actual text — do not invent labels.

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn vitest run src/components/tasks/TasksView.test.tsx`
Expected: FAIL — `Failed to resolve import './TasksView'`.

- [ ] **Step 3: Create `TasksView.tsx`**

```tsx
import { useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useWidgetStore } from '@/store/useWidgetStore'
import { TasksPanel } from './TasksPanel'
import { TaskDetailPanel } from './TaskDetailPanel'
import { pushVariants, SPRING } from '@/lib/motion'

/**
 * Tasks tab content. Animates between the list and a task detail like an iOS
 * navigation stack: opening pushes the detail in from the right; the back
 * button pops it off to the right. AnimatePresence preserves the outgoing
 * view's last-rendered content during the transition.
 */
export function TasksView() {
  const currentTaskId = useWidgetStore((s) => s.currentTaskId)
  const hasTask = !!currentTaskId

  // direction: 1 when pushing into a detail, -1 when popping back, 0 otherwise.
  const prevHadTask = useRef(hasTask)
  const direction = hasTask && !prevHadTask.current ? 1 : !hasTask && prevHadTask.current ? -1 : 0
  prevHadTask.current = hasTask

  return (
    <div className="relative h-full overflow-hidden">
      <AnimatePresence custom={direction} initial={false}>
        <motion.div
          key={currentTaskId ?? 'list'}
          custom={direction}
          variants={pushVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SPRING}
          className="absolute inset-0 h-full"
        >
          {currentTaskId ? <TaskDetailPanel /> : <TasksPanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn vitest run src/components/tasks/TasksView.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Wire `TasksView` into ChangWidget**

In `src/components/ChangWidget.tsx`:
1. Replace the imports of `TasksPanel` and `TaskDetailPanel` with `TasksView`:
   - Remove: `import { TasksPanel } from './tasks/TasksPanel'`
   - Remove: `import { TaskDetailPanel } from './tasks/TaskDetailPanel'`
   - Add: `import { TasksView } from './tasks/TasksView'`
2. Replace the tasks branch line:
   - From: `{view === 'tasks' && (currentTaskId ? <TaskDetailPanel /> : <TasksPanel />)}`
   - To: `{view === 'tasks' && <TasksView />}`

- [ ] **Step 6: Run the relevant suites and build**

Run: `yarn vitest run src/components/ChangWidget.test.tsx src/components/tasks/TasksView.test.tsx && yarn build`
Expected: tests PASS, build succeeds, no unused-import TS errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/tasks/TasksView.tsx src/components/tasks/TasksView.test.tsx src/components/ChangWidget.tsx
git commit -m "feat: iOS-style push/pop between task list and detail"
```

---

## Task 6: TabBar — sliding active indicator (layoutId) + tap feedback

**Files:**
- Modify: `src/components/TabBar.tsx`

**Interfaces:**
- Consumes: `SOFT_SPRING` from `@/lib/motion`.
- Produces: an active item shows a `motion.div` pill with `layoutId="tab-indicator"`; icons get `whileTap` feedback. Active item = `sheetTab ?? activeTab`.

- [ ] **Step 1: Update TabBar**

Replace the entire contents of `src/components/TabBar.tsx`:
```tsx
import { MessageCircle, ListChecks, Bell, History, Zap } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SOFT_SPRING } from '@/lib/motion'
import type { Tab } from '@/types'

const TABS: { id: Tab; label: string; Icon: typeof Bell }[] = [
  { id: 'chat', label: 'Trò chuyện', Icon: MessageCircle },
  { id: 'tasks', label: 'Công việc', Icon: ListChecks },
  { id: 'noti', label: 'Thông báo', Icon: Bell },
  { id: 'history', label: 'Lịch sử', Icon: History },
  { id: 'quick', label: 'Gợi ý', Icon: Zap },
]

export function TabBar() {
  const { pendingTaskCount, unreadNotiCount, sheetTab, activeTab, switchTab } = useWidgetStore()
  const badge: Partial<Record<Tab, number>> = {
    tasks: pendingTaskCount(),
    noti: unreadNotiCount(),
  }
  // The visually-focused tab: a sheet tab when one is open, else the active tab.
  const activeId: Tab = sheetTab ?? activeTab

  return (
    <TabsList className="flex h-auto shrink-0 rounded-none border-t border-border/60 bg-card px-1 py-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))]">
      {TABS.map(({ id, label, Icon }) => {
        const count = badge[id]
        const sheetActive = sheetTab === id
        const isSheetTab = id === 'history' || id === 'quick'
        const isActive = activeId === id
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
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                transition={SOFT_SPRING}
                className="absolute inset-1 -z-0 rounded-xl bg-primary/10"
              />
            )}
            <motion.span whileTap={{ scale: 0.85 }} className="relative z-10 inline-flex">
              <Icon className="h-[21px] w-[21px]" />
              {!!count && (
                <span className="absolute -top-1.5 left-full -ml-2 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-background bg-[hsl(var(--status-alert))] px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </motion.span>
            <span className="relative z-10 text-[10px]">{label}</span>
          </TabsTrigger>
        )
      })}
    </TabsList>
  )
}
```

- [ ] **Step 2: Run the TabBar tests**

Run: `yarn vitest run src/components/TabBar.test.tsx`
Expected: PASS. (The test asserts tab labels/behavior, not the indicator markup; the added pill and motion spans don't change queried text.)

- [ ] **Step 3: Verify build**

Run: `yarn build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/TabBar.tsx
git commit -m "feat: sliding TabBar active indicator + tap feedback"
```

---

## Task 7: Stagger lists + message-bubble entrance

**Files:**
- Modify: `src/components/tasks/TasksPanel.tsx`
- Modify: `src/components/noti/NotificationsPanel.tsx`
- Modify: `src/components/chat/MessageList.tsx`

**Interfaces:**
- Consumes: `listContainer`, `listItem`, `bubbleVariants` from `@/lib/motion`.
- Produces: list items fade/slide-up in sequence on mount; new message bubbles animate in.

- [ ] **Step 1: Stagger task cards in TasksPanel**

Edit `src/components/tasks/TasksPanel.tsx`. Add the motion import and wrap the list. Full file:
```tsx
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
```

- [ ] **Step 2: Stagger notifications in NotificationsPanel**

Edit `src/components/noti/NotificationsPanel.tsx`. Full file:
```tsx
import { motion } from 'motion/react'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Button } from '@/components/ui/button'
import { listContainer, listItem } from '@/lib/motion'
import { NotificationItem } from './NotificationItem'

export function NotificationsPanel() {
  const { notifications, markAllNotisRead } = useWidgetStore()
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between px-3.5 pb-2 pt-3">
        <div className="text-[14px] font-bold">Thông báo</div>
        <Button variant="link" onClick={markAllNotisRead} className="h-auto p-0 text-[12px] font-semibold">
          Đánh dấu đã đọc
        </Button>
      </div>
      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="show"
        className="flex-1 overflow-y-auto scrollbar-thin pb-3"
      >
        {notifications.map((n) => (
          <motion.div key={n.id} variants={listItem}>
            <NotificationItem noti={n} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 3: Animate message bubbles in MessageList**

Edit `src/components/chat/MessageList.tsx`. Wrap each message in a `motion.div` so newly-appended messages animate on mount. Full file:
```tsx
import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Copy, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Button } from '@/components/ui/button'
import { bubbleVariants } from '@/lib/motion'
import { MessageBubble } from '../shared/MessageBubble'
import { TaskInlineCard } from './TaskInlineCard'
import { HitlCard } from './HitlCard'
import { TypingIndicator } from './TypingIndicator'

export function MessageList() {
  const { messages, isTyping } = useWidgetStore()
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length, isTyping])

  return (
    <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden scrollbar-thin">
      <div className="flex flex-col gap-3.5 px-3.5 pb-2 pt-4">
        <div className="text-center text-[11px] text-muted-foreground">Hôm nay · 09:45</div>
        {messages.map((m) => (
          <motion.div key={m.id} variants={bubbleVariants} initial="hidden" animate="show">
            <MessageBubble role={m.role} time={m.time} text={m.text} html={m.html}>
              {m.kind === 'taskInline' && m.taskInline && <TaskInlineCard payload={m.taskInline} />}
              {m.kind === 'hitl' && m.hitl && <HitlCard messageId={m.id} payload={m.hitl} />}
              {m.showTools && (
                <div className="mt-1 flex gap-0.5">
                  {[Copy, ThumbsUp, ThumbsDown].map((Icon, i) => (
                    <Button key={i} size="icon" variant="ghost" className="h-6 w-6">
                      <Icon />
                    </Button>
                  ))}
                </div>
              )}
            </MessageBubble>
          </motion.div>
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={endRef} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the task/widget suites**

Run: `yarn vitest run src/components/tasks/TasksPanel.test.tsx src/components/tasks/TaskCard.test.tsx src/components/ChangWidget.test.tsx`
Expected: PASS. (Wrapping items in `motion.div` does not change queried text/roles; `TaskCard`'s click handler still fires.)

- [ ] **Step 5: Commit**

```bash
git add src/components/tasks/TasksPanel.tsx src/components/noti/NotificationsPanel.tsx src/components/chat/MessageList.tsx
git commit -m "feat: stagger list entrance + animate message bubbles"
```

---

## Task 8: Widget open/minimize polish + full verification

**Files:**
- Modify: `src/components/ChangWidget.tsx` (easing only)

**Interfaces:** none new.

**Rationale (deviation note):** The spec proposed upgrading the widget container to a `motion` spring. The container relies on `max-[480px]:!translate-y-0 / !scale-100 / !opacity-100` important overrides to force full-screen on mobile; a `motion` `animate` would write inline transforms that fight those overrides and risk breaking the mobile layout. We therefore keep the container CSS-driven and only refine the easing/duration for a spring-like open/minimize. This preserves the Global Constraint "mobile override must keep working." If a true motion spring on the container is desired later, it needs a media-query-guarded `animate` target and is out of scope here.

- [ ] **Step 1: Refine the minimize/open transition easing**

In `src/components/ChangWidget.tsx`, change the container transition class from `'transition-all duration-200'` to a spring-like cubic-bezier with a slightly longer duration:
```tsx
        'transition-all duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
```
(Replace the single existing `'transition-all duration-200',` line in the `cn(...)` list with the line above. Leave every other class untouched.)

- [ ] **Step 2: Run the full test suite**

Run: `yarn test`
Expected: ALL suites PASS — `motion.test`, `BottomSheet.test`, `ChangWidget.test`, `TasksView.test`, `TabBar.test`, `TasksPanel.test`, `TaskCard.test`, `useWidgetStore.test`.

- [ ] **Step 3: Lint**

Run: `yarn lint`
Expected: no errors. (Watch for unused imports left over from earlier edits, e.g. a stray `TabsContent`.)

- [ ] **Step 4: Production build**

Run: `yarn build`
Expected: succeeds.

- [ ] **Step 5: Manual verification in a mobile viewport**

Run `yarn dev`, open the app, and set the browser to a narrow viewport (≤480px, e.g. DevTools device toolbar). Confirm:
- Switching chat → tasks → noti slides in the correct direction (rightward tabs slide in from the right; back slides from the left).
- The TabBar pill glides smoothly to the focused tab, including when opening/closing the history/quick sheets.
- Opening a sheet springs up with a fading backdrop; closing (tap backdrop, tap tab, or **drag the grabber down**) animates back down.
- Drag the sheet grabber down a little and release → it springs back; drag far/fast → it dismisses.
- Opening a task pushes the detail in from the right; back button pops it to the right.
- Task list / notifications stagger in; new chat messages animate in.
- With OS "Reduce Motion" enabled, transitions are effectively instant (no large slides).

- [ ] **Step 6: Commit**

```bash
git add src/components/ChangWidget.tsx
git commit -m "polish: spring-like widget open/minimize easing"
```

---

## Self-Review Notes

- **Spec coverage:** Foundation/MotionConfig/reduced-motion (Task 1) ✓; tab slide (Task 4) ✓; TabBar indicator + tap (Task 6) ✓; sheet enter/exit + drag-to-dismiss (Tasks 2–3) ✓; list→detail push/pop (Task 5) ✓; list & message stagger (Task 7) ✓; widget open/minimize (Task 8, with documented CSS deviation) ✓; testing + manual verification (Task 8) ✓.
- **Type consistency:** `getDirection`, `shouldDismiss`, `TAB_ORDER`, and all variant names are defined in Task 1 and referenced identically thereafter. `BottomSheet`'s `onDismiss` prop is introduced in Task 2 and supplied in Tasks 3–4.
- **Out of scope (per spec):** horizontal swipe-between-tabs, multi-detent/resizable sheet, broader shared-element transitions.
