# History & Quick Suggestions — Bottom Sheet Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move "Lịch sử hội thoại" and "Gợi ý nhanh" from an overlay drawer / collapsible header into two new bottom-tab-bar tabs that open a slide-up bottom sheet with a dim overlay.

**Architecture:** Extend the `Tab` type with `'history' | 'quick'`; add `sheetTab` state to the store so sheet tabs coexist with the content tabs without changing `activeTab`; render a `BottomSheet` wrapper plus a dim overlay inside `ChangWidget`'s content area (above `TabBar`).

**Tech Stack:** React 18, TypeScript, Zustand, shadcn/ui (Tabs, Button, Input), Tailwind CSS, Vitest + @testing-library/react

## Global Constraints

- Test runner: `npm test` (= `vitest run`)
- All Tailwind classes must match the existing pattern — no inline styles except the `boxShadow` already present
- Vietnamese copy is unchanged from existing components
- No new dependencies — use only what is already installed
- File paths are relative to `src/`

---

### Task 1: Extend Tab type + update store

**Files:**
- Modify: `src/types.ts`
- Modify: `src/store/useWidgetStore.ts`
- Modify: `src/store/useWidgetStore.test.ts`

**Interfaces:**
- Produces: `Tab` extended with `'history' | 'quick'`; store exposes `sheetTab: 'history' | 'quick' | null` and `closeSheet: () => void`; `switchTab` handles sheet tabs; `historyOpen`, `quickCollapsed`, `toggleHistory`, `toggleQuick` removed

---

- [ ] **Step 1: Write failing tests**

Add to the `navigation` describe block in `src/store/useWidgetStore.test.ts`:

```ts
it('starts with sheetTab null', () => {
  expect(useWidgetStore.getState().sheetTab).toBeNull()
})

it('switchTab history opens sheet without changing activeTab', () => {
  useWidgetStore.getState().switchTab('history')
  const s = useWidgetStore.getState()
  expect(s.sheetTab).toBe('history')
  expect(s.activeTab).toBe('chat')
})

it('switchTab history twice closes sheet and goes back to chat', () => {
  useWidgetStore.getState().switchTab('history')
  useWidgetStore.getState().switchTab('history')
  const s = useWidgetStore.getState()
  expect(s.sheetTab).toBeNull()
  expect(s.activeTab).toBe('chat')
})

it('switchTab quick opens quick sheet', () => {
  useWidgetStore.getState().switchTab('quick')
  expect(useWidgetStore.getState().sheetTab).toBe('quick')
})

it('switchTab noti while sheet open closes sheet and switches tab', () => {
  useWidgetStore.getState().switchTab('history')
  useWidgetStore.getState().switchTab('noti')
  const s = useWidgetStore.getState()
  expect(s.sheetTab).toBeNull()
  expect(s.activeTab).toBe('noti')
})

it('closeSheet sets sheetTab null and activeTab to chat', () => {
  useWidgetStore.getState().switchTab('history')
  useWidgetStore.getState().closeSheet()
  const s = useWidgetStore.getState()
  expect(s.sheetTab).toBeNull()
  expect(s.activeTab).toBe('chat')
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: 6 new tests fail with "sheetTab is not a property" or "closeSheet is not a function".

- [ ] **Step 3: Extend Tab type in `src/types.ts`**

Change the last line:

```ts
export type Tab = 'chat' | 'tasks' | 'noti' | 'history' | 'quick'
```

- [ ] **Step 4: Update `src/store/useWidgetStore.ts`**

In `WidgetState` interface, replace `historyOpen` and `quickCollapsed` with:

```ts
sheetTab: 'history' | 'quick' | null

// remove: toggleHistory, toggleQuick (delete those two lines from the interface)
closeSheet: () => void
```

In `initialState()`, replace `historyOpen: false, quickCollapsed: false` with:

```ts
sheetTab: null as 'history' | 'quick' | null,
```

Replace the `switchTab` implementation:

```ts
switchTab: (tab) => {
  if (tab === 'history' || tab === 'quick') {
    const alreadyOpen = get().sheetTab === tab
    if (alreadyOpen) {
      set({ sheetTab: null, activeTab: 'chat' })
    } else {
      set({ sheetTab: tab })
    }
    return
  }
  set({ activeTab: tab, sheetTab: null, currentTaskId: null })
},
```

Add `closeSheet` after `switchTab`:

```ts
closeSheet: () => set({ sheetTab: null, activeTab: 'chat' }),
```

Replace `toggleHistory` and `toggleQuick` implementations with nothing (delete both).

Update `newChat` — replace `historyOpen: false, quickCollapsed: false` with `sheetTab: null`:

```ts
newChat: () =>
  set({
    activeTab: 'chat',
    currentTaskId: null,
    sheetTab: null,
    isTyping: false,
    messages: [{ id: nextId(), role: 'bot', time: nowTime(), kind: 'text', html: GREETING_HTML }],
  }),
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
npm test
```

Expected: all tests pass (the 6 new + all pre-existing).

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/store/useWidgetStore.ts src/store/useWidgetStore.test.ts
git commit -m "feat: extend Tab type and add sheetTab / closeSheet to store"
```

---

### Task 2: Create BottomSheet component

**Files:**
- Create: `src/components/BottomSheet.tsx`

**Interfaces:**
- Produces: `BottomSheet({ open: boolean; children: React.ReactNode })` — renders `absolute bottom-0` slide-up panel; `open=false` → `translate-y-full` (hidden); `open=true` → `translate-y-0` (visible)

---

- [ ] **Step 1: Write failing test**

Create `src/components/BottomSheet.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { BottomSheet } from './BottomSheet'

it('is visually hidden when open=false', () => {
  render(<BottomSheet open={false}><div>content</div></BottomSheet>)
  expect(screen.getByText('content').closest('[class*="translate"]')).toHaveClass('translate-y-full')
})

it('is visible when open=true', () => {
  render(<BottomSheet open={true}><div>content</div></BottomSheet>)
  expect(screen.getByText('content').closest('[class*="translate"]')).toHaveClass('translate-y-0')
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test
```

Expected: FAIL — "BottomSheet" module not found.

- [ ] **Step 3: Create `src/components/BottomSheet.tsx`**

```tsx
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  children: React.ReactNode
}

export function BottomSheet({ open, children }: BottomSheetProps) {
  return (
    <div
      className={cn(
        'absolute bottom-0 left-0 right-0 z-20',
        'max-h-[60%] overflow-y-auto',
        'rounded-t-2xl bg-card border-t border-border',
        'transition-transform duration-200 ease-out',
        open ? 'translate-y-0' : 'translate-y-full',
      )}
    >
      <div className="mx-auto my-2 h-1 w-10 rounded-full bg-border/60 flex-shrink-0" />
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/BottomSheet.tsx src/components/BottomSheet.test.tsx
git commit -m "feat: add BottomSheet component with slide-up animation"
```

---

### Task 3: Extract HistorySheetContent; update Header

**Files:**
- Create: `src/components/chat/HistorySheetContent.tsx`
- Delete: `src/components/chat/HistoryDrawer.tsx`
- Modify: `src/components/Header.tsx`

**Interfaces:**
- Consumes: `closeSheet` from store (Task 1); `newChat` from store (existing)
- Produces: `HistorySheetContent()` — search bar + pinned/today/week groups; calls `closeSheet()` when a conversation is picked

---

- [ ] **Step 1: Create `src/components/chat/HistorySheetContent.tsx`**

```tsx
import { SquarePen, Search, MessageSquare, Pin } from 'lucide-react'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PINNED = [{ title: 'Báo cáo SLA tháng 5 — 15 đơn vị', snip: 'Em đã soạn xong email cho cả 15 đơn vị…' }]
const TODAY = [
  { title: 'Tra cứu ticket vi phạm tuần qua', snip: 'Có 12 ticket breach, đã gom theo đơn vị…' },
  { title: 'Cảnh báo hệ thống autocall', snip: 'Đã thông báo nhóm kỹ thuật lúc 08:12…' },
]
const WEEK = [
  { title: 'Tổng hợp FAQ từ ticket tháng 4', snip: 'Đã tạo 23 mục FAQ, cập nhật lên SDK…' },
  { title: 'Năng suất nhân sự VH tháng 4', snip: 'Bảng tổng quan đã gửi các đơn vị giám sát…' },
]

export function HistorySheetContent() {
  const { newChat, closeSheet } = useWidgetStore()
  return (
    <div className="flex flex-col pb-2">
      <div className="flex items-center gap-2.5 px-3.5 pt-1 pb-2">
        <div className="flex-1 text-[14px] font-bold">Lịch sử hội thoại</div>
        <Button size="icon" variant="ghost" onClick={newChat}>
          <SquarePen />
        </Button>
      </div>
      <div className="mx-3.5 mb-1 flex items-center gap-2 rounded-[10px] border border-border bg-muted/60 px-2.5 py-2">
        <Search className="h-[17px] w-[17px] text-muted-foreground" />
        <Input
          className="h-auto flex-1 border-0 bg-transparent px-0 py-0 rounded-none text-[13px] shadow-none focus-visible:ring-0"
          placeholder="Tìm trong hội thoại…"
        />
      </div>
      <HistoryGroup title="Đã ghim" items={PINNED} Icon={Pin} onPick={closeSheet} />
      <HistoryGroup title="Hôm nay" items={TODAY} Icon={MessageSquare} onPick={closeSheet} />
      <HistoryGroup title="7 ngày qua" items={WEEK} Icon={MessageSquare} onPick={closeSheet} />
    </div>
  )
}

function HistoryGroup({
  title, items, Icon, onPick,
}: { title: string; items: { title: string; snip: string }[]; Icon: typeof Pin; onPick: () => void }) {
  return (
    <>
      <div className="px-4 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      {items.map((it) => (
        <Button key={it.title} variant="ghost" onClick={onPick}
          className="flex h-auto w-full items-start justify-start gap-2.5 rounded-none px-4 py-2.5 text-left">
          <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium">{it.title}</div>
            <div className="mt-0.5 truncate text-[12px] text-muted-foreground">{it.snip}</div>
          </div>
        </Button>
      ))}
    </>
  )
}
```

- [ ] **Step 2: Update `src/components/Header.tsx`**

Remove `toggleHistory` from the destructured store values and delete the `<History />` button. The updated `Header` becomes:

```tsx
import { Bot, Minus, Moon, SquarePen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Button } from '@/components/ui/button'

export function Header() {
  const { activeTab, newChat, cycleTheme, setMinimized } = useWidgetStore()
  const chatOnly = activeTab === 'chat'
  return (
    <div className="flex flex-shrink-0 items-center gap-3 px-4 py-3.5 text-white"
         style={{ background: 'linear-gradient(135deg, hsl(var(--header-grad-a)), hsl(var(--header-grad-b)))' }}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-xl">
        <Bot className="h-5 w-5" />
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[hsl(var(--header-grad-b))] bg-green-400" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-bold leading-tight">Chang SCC</div>
        <div className="flex items-center gap-1.5 text-[11.5px] opacity-80">Nhân sự số · Sẵn sàng</div>
      </div>
      <div className="flex gap-0.5">
        {chatOnly && (
          <HeaderButton title="Trò chuyện mới" onClick={newChat}><SquarePen /></HeaderButton>
        )}
        <HeaderButton title="Đổi giao diện" onClick={cycleTheme}><Moon /></HeaderButton>
        <HeaderButton title="Thu nhỏ" className="max-[480px]:hidden" onClick={() => setMinimized(true)}><Minus /></HeaderButton>
      </div>
    </div>
  )
}

function HeaderButton({ children, onClick, title, className = '' }: { children: React.ReactNode; onClick: () => void; title: string; className?: string }) {
  return (
    <Button size="icon" variant="ghost" title={title} onClick={onClick}
      className={cn('text-white/90 hover:bg-white/15 hover:text-white', className)}>
      {children}
    </Button>
  )
}
```

- [ ] **Step 3: Delete `src/components/chat/HistoryDrawer.tsx`**

```bash
rm src/components/chat/HistoryDrawer.tsx
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npm test
```

Expected: all pass (HistoryDrawer is not imported by any test).

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/HistorySheetContent.tsx src/components/Header.tsx
git rm src/components/chat/HistoryDrawer.tsx
git commit -m "feat: extract HistorySheetContent; remove History button from Header"
```

---

### Task 4: Extract QuickSheetContent; update ChatPanel

**Files:**
- Create: `src/components/chat/QuickSheetContent.tsx`
- Delete: `src/components/chat/QuickSuggestions.tsx`
- Modify: `src/components/chat/ChatPanel.tsx`

**Interfaces:**
- Consumes: `sendChatMessage`, `closeSheet` from store (Task 1); `QUICK_SUGGESTIONS` from `@/data/messages` (existing)
- Produces: `QuickSheetContent()` — chip grid; clicking a chip calls `sendChatMessage` + `closeSheet`

---

- [ ] **Step 1: Create `src/components/chat/QuickSheetContent.tsx`**

```tsx
import { FileText, Search, BellRing, Mail } from 'lucide-react'
import { useWidgetStore } from '@/store/useWidgetStore'
import { QUICK_SUGGESTIONS } from '@/data/messages'
import { Chip } from '../shared/Chip'

const ICONS = { FileText, Search, BellRing, Mail } as const

export function QuickSheetContent() {
  const { sendChatMessage, closeSheet } = useWidgetStore()
  return (
    <div className="flex flex-wrap gap-2 p-4">
      {QUICK_SUGGESTIONS.map(({ icon, label }) => {
        const Icon = ICONS[icon as keyof typeof ICONS]
        return (
          <Chip
            key={label}
            onClick={() => {
              sendChatMessage(label)
              closeSheet()
            }}
          >
            <Icon className="h-[15px] w-[15px]" />
            {label}
          </Chip>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Update `src/components/chat/ChatPanel.tsx`**

Remove `QuickSuggestions` and `HistoryDrawer`. The full file becomes:

```tsx
import { useWidgetStore } from '@/store/useWidgetStore'
import { MessageList } from './MessageList'
import { Composer } from './Composer'

export function ChatPanel() {
  const sendChatMessage = useWidgetStore((s) => s.sendChatMessage)
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <MessageList />
      <Composer placeholder="Nhắn cho Chang…" onSend={sendChatMessage} />
    </div>
  )
}
```

- [ ] **Step 3: Delete `src/components/chat/QuickSuggestions.tsx`**

```bash
rm src/components/chat/QuickSuggestions.tsx
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/QuickSheetContent.tsx src/components/chat/ChatPanel.tsx
git rm src/components/chat/QuickSuggestions.tsx
git commit -m "feat: extract QuickSheetContent; simplify ChatPanel"
```

---

### Task 5: Update TabBar with 5 tabs

**Files:**
- Modify: `src/components/TabBar.tsx`
- Modify: `src/components/TabBar.test.tsx`

**Interfaces:**
- Consumes: `sheetTab` from store (Task 1)
- Produces: 5-tab TabBar; sheet tabs show active color when `sheetTab` matches

---

- [ ] **Step 1: Write failing tests**

Add to `src/components/TabBar.test.tsx`:

```tsx
it('renders 5 tabs including Lịch sử and Gợi ý', () => {
  renderTabBar()
  expect(screen.getByText('Lịch sử')).toBeInTheDocument()
  expect(screen.getByText('Gợi ý')).toBeInTheDocument()
})

it('clicking Lịch sử opens the history sheet', async () => {
  renderTabBar()
  await userEvent.click(screen.getByText('Lịch sử'))
  expect(useWidgetStore.getState().sheetTab).toBe('history')
})

it('clicking Gợi ý opens the quick sheet', async () => {
  renderTabBar()
  await userEvent.click(screen.getByText('Gợi ý'))
  expect(useWidgetStore.getState().sheetTab).toBe('quick')
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: 3 new tests fail — "Lịch sử" not found.

- [ ] **Step 3: Update `src/components/TabBar.tsx`**

Full file:

```tsx
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
  const { pendingTaskCount, unreadNotiCount, sheetTab } = useWidgetStore()
  const badge: Partial<Record<Tab, number>> = {
    tasks: pendingTaskCount(),
    noti: unreadNotiCount(),
  }

  return (
    <TabsList className="flex h-auto shrink-0 rounded-none border-t border-border/60 bg-card px-1 py-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))]">
      {TABS.map(({ id, label, Icon }) => {
        const count = badge[id]
        const sheetActive = sheetTab === id
        return (
          <TabsTrigger
            key={id}
            value={id}
            className={cn(
              'relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5',
              'font-semibold text-muted-foreground',
              'data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none',
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected: all pass including the 3 new tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/TabBar.tsx src/components/TabBar.test.tsx
git commit -m "feat: add Lịch sử and Gợi ý tabs to TabBar"
```

---

### Task 6: Update ChangWidget — content wrapper + dim overlay + sheets

**Files:**
- Modify: `src/components/ChangWidget.tsx`

**Interfaces:**
- Consumes: `sheetTab`, `closeSheet` from store (Task 1); `BottomSheet` (Task 2); `HistorySheetContent` (Task 3); `QuickSheetContent` (Task 4)

---

- [ ] **Step 1: Update `src/components/ChangWidget.tsx`**

Full file:

```tsx
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

          {sheetTab && (
            <div
              onClick={closeSheet}
              className="absolute inset-0 z-10 bg-black/30 transition-opacity"
            />
          )}

          <BottomSheet open={sheetTab === 'history'}>
            <HistorySheetContent />
          </BottomSheet>
          <BottomSheet open={sheetTab === 'quick'}>
            <QuickSheetContent />
          </BottomSheet>
        </div>

        <TabBar />
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 2: Run tests — verify all pass**

```bash
npm test
```

Expected: all tests pass with no TypeScript errors.

- [ ] **Step 3: Run the dev server and verify visually**

```bash
npm run dev
```

Checklist:
- TabBar shows 5 tabs: Trò chuyện, Công việc, Thông báo, Lịch sử, Gợi ý
- Clicking "Lịch sử" → bottom sheet slides up with search bar + conversation groups; dim overlay covers content behind; Lịch sử tab turns primary color
- Clicking "Lịch sử" again → sheet closes, returns to chat tab
- Clicking dim overlay → same close + return to chat
- Clicking "Gợi ý" → bottom sheet shows chip grid
- Clicking a chip → message is sent, sheet closes
- Clicking "Thông báo" while history sheet open → sheet closes, Thông báo panel appears
- ChatPanel no longer has a "Gợi ý nhanh" collapsible at the top
- Header no longer shows a History icon button (only SquarePen + Moon + Minus)

- [ ] **Step 4: Commit**

```bash
git add src/components/ChangWidget.tsx
git commit -m "feat: wire BottomSheet + dim overlay into ChangWidget for history and quick tabs"
```
