# shadcn Tabs Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the shadcn Tabs component and lift tab structure into ChangWidget so TabBar uses Radix UI `TabsList`/`TabsTrigger` with proper semantics and keyboard navigation.

**Architecture:** Run `shadcn add tabs` to get `@radix-ui/react-tabs`; restructure `ChangWidget` so a `<Tabs>` root wraps the panel content and `<TabBar>`; `TabBar` renders a `<TabsList>` with `<TabsTrigger>` items whose active state is managed by Radix (not manually via store comparison).

**Tech Stack:** React 19, Radix UI (`@radix-ui/react-tabs`), shadcn, CVA, Tailwind CSS, Zustand, Vitest + Testing Library

## Global Constraints

- Package manager: `yarn` (yarn.lock present — shadcn CLI auto-detects it)
- shadcn style: `new-york`, tsx: true, no RSC (`components.json` already present)
- Tailwind dark mode: `class` strategy (toggled via `.dark` on `<html>`)
- No changes to Zustand store (`useWidgetStore`) — navigation logic stays as-is
- No changes to panel components (`ChatPanel`, `TasksPanel`, `NotificationsPanel`, `TaskDetailPanel`)
- Existing tests must continue to pass after each task

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/components/ui/tabs.tsx` | **Create** (shadcn CLI) | Radix Tabs primitives wrapped with shadcn styling |
| `src/index.css` | **Modify** | Add missing CSS variables (`--secondary`, `--accent`, `--destructive`, `--popover`) |
| `src/components/ChangWidget.tsx` | **Modify** | Owns `<Tabs>` root; wraps panels in `<TabsContent>` |
| `src/components/TabBar.tsx` | **Modify** | Renders `<TabsList>` + `<TabsTrigger>`; drops manual active-state logic |
| `src/components/TabBar.test.tsx` | **Modify** | Wraps `<TabBar>` in a `<Tabs>` provider for isolated testing |

---

## Task 1: Add missing CSS variables

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Produces: `--secondary`, `--secondary-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--popover`, `--popover-foreground` CSS variables in both `:root` and `.dark`

- [ ] **Step 1: Add variables to `:root`**

In `src/index.css`, inside the `:root { ... }` block, add after `--ring`:

```css
    --secondary: 240 5% 96%;
    --secondary-foreground: 240 6% 10%;
    --accent: 240 5% 96%;
    --accent-foreground: 240 6% 10%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 6% 10%;
```

- [ ] **Step 2: Add variables to `.dark`**

Inside the `.dark { ... }` block, add after `--ring`:

```css
    --secondary: 240 4% 16%;
    --secondary-foreground: 0 0% 98%;
    --accent: 240 4% 16%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --popover: 240 4% 16%;
    --popover-foreground: 0 0% 98%;
```

- [ ] **Step 3: Run tests to confirm nothing broke**

```bash
yarn test
```

Expected: all tests pass (green).

- [ ] **Step 4: Commit**

```bash
git add src/index.css
git commit -m "fix: add missing shadcn CSS variables (secondary, accent, destructive, popover)"
```

---

## Task 2: Install Radix Tabs via shadcn CLI

**Files:**
- Create: `src/components/ui/tabs.tsx`
- Update: `package.json`, `yarn.lock`

**Interfaces:**
- Produces: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` exported from `@/components/ui/tabs`

- [ ] **Step 1: Run shadcn add**

```bash
npx shadcn@latest add tabs
```

When prompted "Would you like to add and install dependencies?", answer **yes**. The CLI will:
- Install `@radix-ui/react-tabs` via yarn
- Write `src/components/ui/tabs.tsx`

- [ ] **Step 2: Verify the generated file exports the four components**

```bash
grep "^export" src/components/ui/tabs.tsx
```

Expected output:
```
export { Tabs, TabsList, TabsTrigger, TabsContent }
```

- [ ] **Step 3: Run tests**

```bash
yarn test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/tabs.tsx package.json yarn.lock
git commit -m "feat: add shadcn Tabs component (@radix-ui/react-tabs)"
```

---

## Task 3: Migrate TabBar to Radix TabsList + TabsTrigger

**Files:**
- Modify: `src/components/TabBar.tsx`
- Modify: `src/components/TabBar.test.tsx`

**Interfaces:**
- Consumes: `Tabs`, `TabsList`, `TabsTrigger` from `@/components/ui/tabs`
- Consumes: `pendingTaskCount`, `unreadNotiCount` from `useWidgetStore` (badge display only)
- Produces: `<TabBar />` — renders a `<TabsList>` that must be used inside a `<Tabs>` parent

Note: `TabBar` no longer reads `activeTab`, `currentTaskId`, or `switchTab` from the store. Active state is managed by the parent `<Tabs>` root in `ChangWidget`. `onValueChange` (which calls `switchTab`) lives on the `<Tabs>` in `ChangWidget`.

- [ ] **Step 1: Update the test to wrap TabBar in a Tabs context**

Replace the entire content of `src/components/TabBar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it } from 'vitest'
import { TabBar } from './TabBar'
import { Tabs } from '@/components/ui/tabs'
import { useWidgetStore } from '@/store/useWidgetStore'
import type { Tab } from '@/types'

function renderTabBar(activeTab: Tab = 'chat') {
  return render(
    <Tabs
      value={activeTab}
      onValueChange={(v) => useWidgetStore.getState().switchTab(v as Tab)}
    >
      <TabBar />
    </Tabs>,
  )
}

beforeEach(() => useWidgetStore.getState().__resetForTest())

it('clicking the Thông báo tab switches the active tab', async () => {
  renderTabBar()
  await userEvent.click(screen.getByText('Thông báo'))
  expect(useWidgetStore.getState().activeTab).toBe('noti')
})

it('shows the pending task badge (2) and unread noti badge (3)', () => {
  renderTabBar()
  expect(screen.getByText('2')).toBeInTheDocument()
  expect(screen.getByText('3')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test — confirm it fails**

```bash
yarn test TabBar
```

Expected: FAIL — `TabBar` still renders native `<button>` elements, not `TabsTrigger`, so clicking may work but `Tabs` context is missing.

- [ ] **Step 3: Rewrite TabBar.tsx**

Replace the entire content of `src/components/TabBar.tsx`:

```tsx
import { MessageCircle, ListChecks, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Tab } from '@/types'

const TABS: { id: Tab; label: string; Icon: typeof Bell }[] = [
  { id: 'chat', label: 'Trò chuyện', Icon: MessageCircle },
  { id: 'tasks', label: 'Công việc', Icon: ListChecks },
  { id: 'noti', label: 'Thông báo', Icon: Bell },
]

export function TabBar() {
  const { pendingTaskCount, unreadNotiCount } = useWidgetStore()
  const badge: Partial<Record<Tab, number>> = {
    tasks: pendingTaskCount(),
    noti: unreadNotiCount(),
  }

  return (
    <TabsList className="flex h-auto rounded-none border-t border-border/60 bg-card px-1 py-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))]">
      {TABS.map(({ id, label, Icon }) => {
        const count = badge[id]
        return (
          <TabsTrigger
            key={id}
            value={id}
            className={cn(
              'relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5',
              'font-semibold text-muted-foreground',
              'data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none',
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
```

- [ ] **Step 4: Run the TabBar tests — confirm they pass**

```bash
yarn test TabBar
```

Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/TabBar.tsx src/components/TabBar.test.tsx
git commit -m "feat: migrate TabBar to Radix TabsList + TabsTrigger"
```

---

## Task 4: Lift Tabs root to ChangWidget

**Files:**
- Modify: `src/components/ChangWidget.tsx`

**Interfaces:**
- Consumes: `Tabs`, `TabsContent` from `@/components/ui/tabs`
- Consumes: `activeTab`, `currentTaskId`, `switchTab`, `minimized` from `useWidgetStore`
- Consumes: `TabBar` (now renders `<TabsList>` internally, must be inside `<Tabs>`)

- [ ] **Step 1: Rewrite ChangWidget.tsx**

Replace the entire content of `src/components/ChangWidget.tsx`:

```tsx
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Header } from './Header'
import { TabBar } from './TabBar'
import { ChatPanel } from './chat/ChatPanel'
import { TasksPanel } from './tasks/TasksPanel'
import { TaskDetailPanel } from './tasks/TaskDetailPanel'
import { NotificationsPanel } from './noti/NotificationsPanel'
import type { Tab } from '@/types'

export function ChangWidget() {
  const { minimized, activeTab, currentTaskId, switchTab } = useWidgetStore()
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
        className="relative flex flex-1 flex-col overflow-hidden"
      >
        <TabsContent value="chat" className="m-0 flex-1 overflow-hidden">
          <ChatPanel />
        </TabsContent>
        <TabsContent value="tasks" className="m-0 flex-1 overflow-hidden">
          {currentTaskId ? <TaskDetailPanel /> : <TasksPanel />}
        </TabsContent>
        <TabsContent value="noti" className="m-0 flex-1 overflow-hidden">
          <NotificationsPanel />
        </TabsContent>
        <TabBar />
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 2: Run the full test suite**

```bash
yarn test
```

Expected: all tests pass — `TabBar.test.tsx`, `TaskCard.test.tsx`, `TasksPanel.test.tsx`, `useWidgetStore.test.ts`.

- [ ] **Step 3: Start the dev server and verify manually**

```bash
yarn dev
```

Open the app and verify the checklist:
- [ ] Chat / Công việc / Thông báo tabs switch panels correctly
- [ ] Badge counts (2 on Công việc, 3 on Thông báo) visible
- [ ] Click a task card → TaskDetailPanel appears, Công việc tab stays highlighted
- [ ] Back button from task detail → TasksPanel returns
- [ ] Dark mode toggle (sun/moon icon in Header) works
- [ ] Arrow keys navigate between tabs (Radix keyboard support)

- [ ] **Step 4: Commit**

```bash
git add src/components/ChangWidget.tsx
git commit -m "feat: lift Tabs root to ChangWidget, panels in TabsContent"
```
