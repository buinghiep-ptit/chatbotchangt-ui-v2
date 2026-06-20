# shadcn UI Components Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all native `<button>`, `<input>`, `<textarea>` elements in app components with the shadcn `Button`, `Input`, `Textarea` components already defined in `src/components/ui/`.

**Architecture:** Mechanical import-and-replace across 15 files. Icon buttons standardise to `size="icon"` (h-9 w-9). Custom styles that deviate from shadcn defaults are preserved via `className` overrides using `cn()`. No store or logic changes.

**Tech Stack:** React 19, shadcn (Button/Input/Textarea from `@/components/ui/`), Tailwind CSS, CVA

## Global Constraints

- Shadcn components from: `@/components/ui/button` → `Button`, `@/components/ui/input` → `Input`, `@/components/ui/textarea` → `Textarea`
- Icon buttons: standardise to `size="icon"` (h-9 w-9) — **no** `h-8 w-8` overrides
- Exception: MessageList tool buttons stay `h-6 w-6` (in-message actions, h-9 would break layout)
- No changes to store, types, test files, or `src/components/ui/` files
- All 25 existing tests must continue to pass
- `cn()` from `@/lib/utils` for multi-class merges

---

## File Map

| File | Changes |
|---|---|
| `src/components/chat/Composer.tsx` | `<textarea>` → `<Textarea>`, 3× `<button>` → `<Button>` |
| `src/components/chat/HistoryDrawer.tsx` | `<input>` → `<Input>`, remove `IconBtn` helper, 3× `<button>` → `<Button>` |
| `src/components/Header.tsx` | `HeaderButton` helper uses `<Button size="icon" variant="ghost">` |
| `src/components/chat/HitlCard.tsx` | 2× `<button>` → `<Button>` |
| `src/components/tasks/TaskDetailPanel.tsx` | 2× `<button>` → `<Button>` |
| `src/components/chat/TaskInlineCard.tsx` | `<button>` → `<Button>` |
| `src/components/chat/MessageList.tsx` | 3× `<button>` → `<Button size="icon" variant="ghost" className="h-6 w-6">` |
| `src/components/chat/QuickSuggestions.tsx` | `<button>` → `<Button variant="ghost">` |
| `src/components/tasks/TaskCard.tsx` | `<button>` → `<Button variant="ghost">` |
| `src/components/tasks/SubTabs.tsx` | `<button>` → `<Button variant="ghost">` |
| `src/components/shared/Chip.tsx` | `<button>` → `<Button variant="outline">` |
| `src/components/noti/NotificationsPanel.tsx` | `<button>` → `<Button variant="link">` |
| `src/components/noti/NotificationItem.tsx` | `<button>` → `<Button variant="ghost">` |
| `src/components/Launcher.tsx` | `<button>` → `<Button>` |
| `src/components/Stage.tsx` | `<button>` → `<Button variant="ghost">` |

---

## Task 1: Composer + HistoryDrawer

**Files:**
- Modify: `src/components/chat/Composer.tsx`
- Modify: `src/components/chat/HistoryDrawer.tsx`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button`, `Input` from `@/components/ui/input`, `Textarea` from `@/components/ui/textarea`

- [ ] **Step 1: Replace Composer.tsx**

Replace entire file content:

```tsx
import { useState } from 'react'
import { Paperclip, Mic, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function Composer({ placeholder, onSend }: { placeholder: string; onSend: (text: string) => void }) {
  const [value, setValue] = useState('')
  const submit = () => { const t = value.trim(); if (!t) return; onSend(t); setValue('') }
  return (
    <div className="flex-shrink-0 border-t border-border/60 px-3 py-2">
      <div className="flex items-end gap-2 rounded-[14px] border border-border bg-muted/60 py-1 pl-2.5 pr-1.5 focus-within:border-primary">
        <Button type="button" size="icon" variant="ghost" title="Đính kèm" className="flex-shrink-0">
          <Paperclip className="h-[19px] w-[19px]" />
        </Button>
        <Textarea
          rows={1}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = `${Math.min(e.target.scrollHeight, 90)}px`
          }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
          className="min-h-0 max-h-[90px] flex-1 resize-none border-0 bg-transparent py-1.5 text-[13.5px] shadow-none focus-visible:ring-0"
        />
        <Button type="button" size="icon" variant="ghost" title="Nhập bằng giọng nói" className="flex-shrink-0">
          <Mic className="h-[19px] w-[19px]" />
        </Button>
        <Button type="button" size="icon" title="Gửi" onClick={submit} className="flex-shrink-0">
          <Send className="h-[18px] w-[18px]" />
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace HistoryDrawer.tsx**

Replace entire file content:

```tsx
import { ArrowLeft, SquarePen, Search, MessageSquare, Pin } from 'lucide-react'
import { cn } from '@/lib/utils'
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

export function HistoryDrawer() {
  const { historyOpen, toggleHistory, newChat } = useWidgetStore()
  return (
    <div className={cn('glass absolute inset-0 z-20 flex flex-col transition-transform duration-200', historyOpen ? 'translate-x-0' : 'translate-x-full')}>
      <div className="flex flex-shrink-0 items-center gap-2.5 border-b border-border/60 px-3.5 py-3">
        <Button size="icon" variant="ghost" onClick={() => toggleHistory(false)}>
          <ArrowLeft className="h-[19px] w-[19px]" />
        </Button>
        <div className="flex-1 text-[15px] font-bold">Lịch sử hội thoại</div>
        <Button size="icon" variant="ghost" onClick={newChat}>
          <SquarePen className="h-[19px] w-[19px]" />
        </Button>
      </div>
      <div className="mx-3.5 mb-1 mt-3 flex items-center gap-2 rounded-[10px] border border-border bg-muted/60 px-2.5 py-2">
        <Search className="h-[17px] w-[17px] text-muted-foreground" />
        <Input
          className="h-auto flex-1 border-0 bg-transparent px-0 py-0 text-[13px] shadow-none focus-visible:ring-0"
          placeholder="Tìm trong hội thoại…"
        />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <Group title="Đã ghim" items={PINNED} Icon={Pin} onPick={() => toggleHistory(false)} />
        <Group title="Hôm nay" items={TODAY} Icon={MessageSquare} onPick={() => toggleHistory(false)} />
        <Group title="7 ngày qua" items={WEEK} Icon={MessageSquare} onPick={() => toggleHistory(false)} />
      </div>
    </div>
  )
}

function Group({ title, items, Icon, onPick }: { title: string; items: { title: string; snip: string }[]; Icon: typeof Pin; onPick: () => void }) {
  return (
    <>
      <div className="px-4 pb-1.5 pt-3.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
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

- [ ] **Step 3: Run tests**

```bash
yarn test --run
```

Expected: 25 passed (4 files).

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/Composer.tsx src/components/chat/HistoryDrawer.tsx
git commit -m "feat: replace native textarea/input/button with shadcn components in Composer and HistoryDrawer"
```

---

## Task 2: Header + HitlCard + TaskDetailPanel + TaskInlineCard + MessageList + QuickSuggestions

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/components/chat/HitlCard.tsx`
- Modify: `src/components/tasks/TaskDetailPanel.tsx`
- Modify: `src/components/chat/TaskInlineCard.tsx`
- Modify: `src/components/chat/MessageList.tsx`
- Modify: `src/components/chat/QuickSuggestions.tsx`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button`

- [ ] **Step 1: Replace Header.tsx**

Replace entire file content:

```tsx
import { Bot, History, Minus, Moon, SquarePen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Button } from '@/components/ui/button'

export function Header() {
  const { activeTab, newChat, toggleHistory, cycleTheme, setMinimized } = useWidgetStore()
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
          <>
            <HeaderButton title="Trò chuyện mới" onClick={newChat}><SquarePen className="h-[18px] w-[18px]" /></HeaderButton>
            <HeaderButton title="Lịch sử trò chuyện" onClick={() => toggleHistory(true)}><History className="h-[18px] w-[18px]" /></HeaderButton>
          </>
        )}
        <HeaderButton title="Đổi giao diện" onClick={cycleTheme}><Moon className="h-[18px] w-[18px]" /></HeaderButton>
        <HeaderButton title="Thu nhỏ" className="max-[480px]:hidden" onClick={() => setMinimized(true)}><Minus className="h-[18px] w-[18px]" /></HeaderButton>
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

- [ ] **Step 2: Replace HitlCard.tsx**

Replace entire file content:

```tsx
import { TriangleAlert, Check } from 'lucide-react'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Button } from '@/components/ui/button'
import type { HitlPayload } from '@/types'

export function HitlCard({ messageId, payload }: { messageId: string; payload: HitlPayload }) {
  const { approveHitl, openTask } = useWidgetStore()
  if (payload.approved) {
    return (
      <div className="mt-2 rounded-xl border border-status-done bg-status-done/10 p-3">
        <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-status-done">
          <Check className="h-[15px] w-[15px]" /> Đã duyệt — Chang đang gửi email
        </div>
      </div>
    )
  }
  return (
    <div className="mt-2 rounded-xl border border-status-pending bg-status-pending/10 p-3">
      <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-status-pending">
        <TriangleAlert className="h-[15px] w-[15px]" /> {payload.title}
      </div>
      <div className="my-2.5 text-[12.5px] text-muted-foreground">{payload.text}</div>
      <div className="flex gap-2">
        <Button onClick={() => approveHitl(messageId)}
          className="flex h-auto flex-1 items-center justify-center gap-1.5 rounded-[9px] bg-status-done py-2 text-[12.5px] font-semibold text-white hover:bg-status-done/90">
          <Check className="h-[15px] w-[15px]" /> Duyệt &amp; gửi
        </Button>
        <Button variant="outline" onClick={() => openTask(payload.targetTaskId)}
          className="h-auto flex-1 rounded-[9px] py-2 text-[12.5px] font-semibold">
          Xem chi tiết
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Replace TaskDetailPanel.tsx**

Modify only the two `<button>` elements. Keep everything else identical.

Back button (line ~28) — replace:
```tsx
<button type="button" onClick={closeTask} title="Quay lại" className="flex h-8 w-8 items-center justify-center rounded-[9px] text-muted-foreground hover:bg-muted">
  <ArrowLeft className="h-[19px] w-[19px]" />
</button>
```
with:
```tsx
<Button size="icon" variant="ghost" onClick={closeTask} title="Quay lại">
  <ArrowLeft className="h-[19px] w-[19px]" />
</Button>
```

Collapse button (line ~41) — replace:
```tsx
<button type="button" onClick={() => setInfoCollapsed((v) => !v)}
  className="flex w-full items-center gap-2 bg-muted/40 px-3 py-2.5 text-[12.5px] font-semibold text-muted-foreground">
  <FileText className="h-4 w-4" /> Thông tin công việc
  <ChevronDown className={cn('ml-auto h-4 w-4 transition-transform', infoCollapsed && '-rotate-90')} />
</button>
```
with:
```tsx
<Button variant="ghost" onClick={() => setInfoCollapsed((v) => !v)}
  className="flex h-auto w-full items-center justify-start gap-2 rounded-none bg-muted/40 px-3 py-2.5 text-[12.5px] font-semibold text-muted-foreground hover:bg-muted/60">
  <FileText className="h-4 w-4" /> Thông tin công việc
  <ChevronDown className={cn('ml-auto h-4 w-4 transition-transform', infoCollapsed && '-rotate-90')} />
</Button>
```

Add import at top: `import { Button } from '@/components/ui/button'`

- [ ] **Step 4: Replace TaskInlineCard.tsx**

Replace entire file content:

```tsx
import { Route, ArrowRight } from 'lucide-react'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Button } from '@/components/ui/button'
import type { TaskInlinePayload } from '@/types'

export function TaskInlineCard({ payload }: { payload: TaskInlinePayload }) {
  const openTask = useWidgetStore((s) => s.openTask)
  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-border bg-background/50">
      <div className="flex items-start gap-2.5 p-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] bg-status-running/10 text-status-running">
          <Route className="h-[17px] w-[17px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold">{payload.title}</div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">{payload.meta}</div>
        </div>
      </div>
      <Button variant="ghost" onClick={() => openTask(payload.targetTaskId)}
        className="flex h-auto w-full items-center justify-between rounded-t-none border-t border-border px-3 py-2.5 text-[12.5px] font-semibold text-primary hover:bg-primary/10">
        <span>Mở trong Công việc</span><ArrowRight className="h-[15px] w-[15px]" />
      </Button>
    </div>
  )
}
```

- [ ] **Step 5: Update MessageList.tsx**

Add import: `import { Button } from '@/components/ui/button'`

Replace the three icon buttons:
```tsx
{[Copy, ThumbsUp, ThumbsDown].map((Icon, i) => (
  <button key={i} type="button" className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
    <Icon className="h-[15px] w-[15px]" />
  </button>
))}
```
with:
```tsx
{[Copy, ThumbsUp, ThumbsDown].map((Icon, i) => (
  <Button key={i} size="icon" variant="ghost" className="h-6 w-6">
    <Icon className="h-[15px] w-[15px]" />
  </Button>
))}
```

- [ ] **Step 6: Replace QuickSuggestions.tsx**

Replace the collapse `<button>` only. Add import `Button`. Replace:
```tsx
<button type="button" onClick={toggleQuick}
  className="flex w-full items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-primary">
  <span>Gợi ý nhanh</span>
  <ChevronUp className={cn('h-3.5 w-3.5 transition-transform', quickCollapsed && 'rotate-180')} />
</button>
```
with:
```tsx
<Button variant="ghost" onClick={toggleQuick}
  className="flex h-auto w-full items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-primary hover:bg-transparent hover:text-primary">
  <span>Gợi ý nhanh</span>
  <ChevronUp className={cn('h-3.5 w-3.5 transition-transform', quickCollapsed && 'rotate-180')} />
</Button>
```

- [ ] **Step 7: Run tests**

```bash
yarn test --run
```

Expected: 25 passed (4 files).

- [ ] **Step 8: Commit**

```bash
git add src/components/Header.tsx src/components/chat/HitlCard.tsx src/components/tasks/TaskDetailPanel.tsx src/components/chat/TaskInlineCard.tsx src/components/chat/MessageList.tsx src/components/chat/QuickSuggestions.tsx
git commit -m "feat: replace native buttons with shadcn Button in chat and detail components"
```

---

## Task 3: TaskCard + SubTabs + Chip + NotificationsPanel + NotificationItem + Launcher + Stage

**Files:**
- Modify: `src/components/tasks/TaskCard.tsx`
- Modify: `src/components/tasks/SubTabs.tsx`
- Modify: `src/components/shared/Chip.tsx`
- Modify: `src/components/noti/NotificationsPanel.tsx`
- Modify: `src/components/noti/NotificationItem.tsx`
- Modify: `src/components/Launcher.tsx`
- Modify: `src/components/Stage.tsx`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button`

- [ ] **Step 1: Replace TaskCard.tsx**

Replace the outer `<button>` element. Add `import { Button }`. Replace:
```tsx
<button type="button" onClick={() => openTask(task.id)}
  className="w-full rounded-[14px] border border-border bg-muted/50 p-3 text-left transition-colors hover:bg-muted">
```
with:
```tsx
<Button variant="ghost" onClick={() => openTask(task.id)}
  className="h-auto w-full rounded-[14px] border border-border bg-muted/50 p-3 text-left transition-colors hover:bg-muted">
```
And replace the closing `</button>` with `</Button>`.

- [ ] **Step 2: Replace SubTabs.tsx**

Replace entire file content:

```tsx
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Button } from '@/components/ui/button'
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
        <Button key={id} variant="ghost" onClick={() => setTaskFilter(id)}
          className={cn(
            'h-auto whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] font-semibold',
            taskFilter === id
              ? 'bg-primary/15 text-primary hover:bg-primary/15 hover:text-primary'
              : 'text-muted-foreground',
          )}>
          {label}<span className="ml-1 opacity-70">{count(id)}</span>
        </Button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Replace Chip.tsx**

Replace entire file content:

```tsx
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function Chip({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <Button variant="outline" onClick={onClick}
      className={cn(
        'h-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5',
        'text-[12.5px] font-medium text-muted-foreground',
        'hover:border-primary hover:bg-primary/10 hover:text-primary',
        className,
      )}>
      {children}
    </Button>
  )
}
```

- [ ] **Step 4: Replace NotificationsPanel.tsx**

Add `import { Button }`. Replace:
```tsx
<button type="button" onClick={markAllNotisRead} className="text-[12px] font-semibold text-primary">Đánh dấu đã đọc</button>
```
with:
```tsx
<Button variant="link" onClick={markAllNotisRead} className="h-auto p-0 text-[12px] font-semibold">
  Đánh dấu đã đọc
</Button>
```

- [ ] **Step 5: Replace NotificationItem.tsx**

Add `import { Button }`. Replace the outer `<button>` element:
```tsx
<button type="button" onClick={() => markNotiRead(noti.id)}
  className="relative flex w-full items-start gap-2.5 border-b border-border/60 px-4 py-3 text-left hover:bg-muted">
```
with:
```tsx
<Button variant="ghost" onClick={() => markNotiRead(noti.id)}
  className="relative flex h-auto w-full items-start justify-start gap-2.5 rounded-none border-b border-border/60 px-4 py-3 text-left hover:bg-muted">
```
And closing `</button>` → `</Button>`.

- [ ] **Step 6: Replace Launcher.tsx**

Replace entire file content:

```tsx
import { MessageCircle } from 'lucide-react'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Button } from '@/components/ui/button'

export function Launcher() {
  const { minimized, setMinimized } = useWidgetStore()
  if (!minimized) return null
  return (
    <Button onClick={() => setMinimized(false)}
      className="fixed bottom-6 right-6 z-20 hidden h-[60px] w-[60px] items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 hover:opacity-90 sm:flex max-[480px]:!hidden"
      style={{ background: 'linear-gradient(135deg, hsl(var(--header-grad-a)), hsl(var(--header-grad-b)))' }}>
      <MessageCircle className="h-6 w-6" />
      <span className="absolute right-3 top-3 h-3 w-3 rounded-full border-2 border-white bg-[hsl(var(--status-alert))]" />
    </Button>
  )
}
```

- [ ] **Step 7: Replace Stage.tsx**

Add `import { Button }`. Replace the two theme-picker `<button>` elements:
```tsx
<button key={t} type="button" onClick={() => setTheme(t)}
  className={cn('rounded-full px-3 py-1.5 text-xs font-semibold',
    theme === t ? 'bg-primary text-white' : 'text-muted-foreground')}>
  {t === 'light' ? 'Sáng' : 'Tối'}
</button>
```
with:
```tsx
<Button key={t} variant="ghost" onClick={() => setTheme(t)}
  className={cn(
    'h-auto rounded-full px-3 py-1.5 text-xs font-semibold',
    theme === t ? 'bg-primary text-white hover:bg-primary hover:text-white' : 'text-muted-foreground',
  )}>
  {t === 'light' ? 'Sáng' : 'Tối'}
</Button>
```

- [ ] **Step 8: Run full test suite**

```bash
yarn test --run
```

Expected: 25 passed (4 files).

- [ ] **Step 9: Commit**

```bash
git add src/components/tasks/TaskCard.tsx src/components/tasks/SubTabs.tsx src/components/shared/Chip.tsx src/components/noti/NotificationsPanel.tsx src/components/noti/NotificationItem.tsx src/components/Launcher.tsx src/components/Stage.tsx
git commit -m "feat: replace native buttons with shadcn Button in task, noti, shared, and launcher components"
```
