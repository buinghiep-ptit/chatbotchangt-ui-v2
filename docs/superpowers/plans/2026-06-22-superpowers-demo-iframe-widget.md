# superpowers-demo → iframe Widget Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `superpowers-demo` from a self-contained demo (host page + widget on one screen) into a pure iframe-embeddable chatbot widget with two surfaces (`/bubble`, `/`) that coordinate with a parent host via `window.postMessage`, matching the `chatbot-sdk` protocol.

**Architecture:** A lightweight pathname switch in `App.tsx` renders either the bubble surface or the chat surface. A `hostBridge` module wraps the postMessage protocol. The chat surface fills its iframe and emits `INIT_CHAT` on mount; header actions emit `TOGGLE_CHAT`/`MAXIMIZE_CHAT`/`MINIMIZE_CHAT`. The simulated host (`Stage`, `Launcher`, internal `minimized` state) is removed. UI/communication only — no backend.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind, Zustand, motion, Vitest.

## Global Constraints

- Project: `/Users/nghiepbui/Desktop/PERSONAL/superpowers-demo` (the current repo).
- Vite `base` must be `/ai-agent/sdk/` so surfaces live at `/ai-agent/sdk/` (chat) and `/ai-agent/sdk/bubble` (bubble).
- All host messages use `window.parent.postMessage(msg, '*')`. Message shapes are EXACTLY:
  - `INIT_CHAT`: `{ type:'INIT_CHAT', data:'Data from chat-frame', target:'bubble-frame' }`
  - `TOGGLE_CHAT` open: `{ type:'TOGGLE_CHAT', data:'Data from bubble-frame', target:'chat-frame', isOpen:true }`
  - `TOGGLE_CHAT` close: `{ type:'TOGGLE_CHAT', data:'Data from chat-frame', target:'bubble-frame', isOpen:false }`
  - `MAXIMIZE_CHAT`: `{ type:'MAXIMIZE_CHAT', data:'Data from chat-frame', target:'chat-frame' }`
  - `MINIMIZE_CHAT`: `{ type:'MINIMIZE_CHAT', data:'Data from chat-frame', target:'chat-frame' }`
- `isAllowExpandBot` is a URL presence check (param present → true), matching `chatbot-sdk`.
- No backend/API calls, no auth, no `tenant_id` exchange. `tenant_id` is read-only.
- Keep all existing chat UI (tabs chat/tasks/noti, bottom sheets, seed data) intact.
- Run all commands from the repo root. Test runner: `yarn test` (vitest run). Build: `yarn build`.

---

### Task 1: `hostBridge` communication layer (TDD)

**Files:**
- Create: `src/lib/hostBridge.ts`
- Test: `src/lib/hostBridge.test.ts`

**Interfaces:**
- Produces: `hostBridge` with `initChat()`, `openChat()`, `closeChat()`, `maximize()`, `minimize()` (all `(): void`); exported type `HostMessage`.

- [ ] **Step 1: Write the failing test**

`src/lib/hostBridge.test.ts`:

```ts
import { afterEach, expect, it, vi } from 'vitest'
import { hostBridge } from './hostBridge'

afterEach(() => vi.restoreAllMocks())

it('initChat posts INIT_CHAT to the bubble frame', () => {
  const spy = vi.spyOn(window.parent, 'postMessage')
  hostBridge.initChat()
  expect(spy).toHaveBeenCalledWith(
    { type: 'INIT_CHAT', data: 'Data from chat-frame', target: 'bubble-frame' },
    '*',
  )
})

it('openChat posts TOGGLE_CHAT isOpen:true to the chat frame', () => {
  const spy = vi.spyOn(window.parent, 'postMessage')
  hostBridge.openChat()
  expect(spy).toHaveBeenCalledWith(
    { type: 'TOGGLE_CHAT', data: 'Data from bubble-frame', target: 'chat-frame', isOpen: true },
    '*',
  )
})

it('closeChat posts TOGGLE_CHAT isOpen:false to the bubble frame', () => {
  const spy = vi.spyOn(window.parent, 'postMessage')
  hostBridge.closeChat()
  expect(spy).toHaveBeenCalledWith(
    { type: 'TOGGLE_CHAT', data: 'Data from chat-frame', target: 'bubble-frame', isOpen: false },
    '*',
  )
})

it('maximize and minimize post to the chat frame', () => {
  const spy = vi.spyOn(window.parent, 'postMessage')
  hostBridge.maximize()
  hostBridge.minimize()
  expect(spy).toHaveBeenNthCalledWith(
    1,
    { type: 'MAXIMIZE_CHAT', data: 'Data from chat-frame', target: 'chat-frame' },
    '*',
  )
  expect(spy).toHaveBeenNthCalledWith(
    2,
    { type: 'MINIMIZE_CHAT', data: 'Data from chat-frame', target: 'chat-frame' },
    '*',
  )
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `yarn test src/lib/hostBridge.test.ts`
Expected: FAIL — cannot resolve `./hostBridge`.

- [ ] **Step 3: Implement `src/lib/hostBridge.ts`**

```ts
export type HostMessage =
  | { type: 'INIT_CHAT'; data: string; target: 'bubble-frame' }
  | { type: 'TOGGLE_CHAT'; data: string; target: 'chat-frame' | 'bubble-frame'; isOpen: boolean }
  | { type: 'MAXIMIZE_CHAT' | 'MINIMIZE_CHAT'; data: string; target: 'chat-frame' }

function post(message: HostMessage): void {
  window.parent.postMessage(message, '*')
}

export const hostBridge = {
  initChat(): void {
    post({ type: 'INIT_CHAT', data: 'Data from chat-frame', target: 'bubble-frame' })
  },
  openChat(): void {
    post({ type: 'TOGGLE_CHAT', data: 'Data from bubble-frame', target: 'chat-frame', isOpen: true })
  },
  closeChat(): void {
    post({ type: 'TOGGLE_CHAT', data: 'Data from chat-frame', target: 'bubble-frame', isOpen: false })
  },
  maximize(): void {
    post({ type: 'MAXIMIZE_CHAT', data: 'Data from chat-frame', target: 'chat-frame' })
  },
  minimize(): void {
    post({ type: 'MINIMIZE_CHAT', data: 'Data from chat-frame', target: 'chat-frame' })
  },
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `yarn test src/lib/hostBridge.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/hostBridge.ts src/lib/hostBridge.test.ts
git commit -m "feat: add hostBridge postMessage layer for iframe widget"
```

---

### Task 2: `surface` detection + query params (TDD)

**Files:**
- Create: `src/lib/surface.ts`
- Test: `src/lib/surface.test.ts`

**Interfaces:**
- Produces:
  - `type Surface = 'bubble' | 'chat'`
  - `getSurface(pathname?: string): Surface`
  - `interface WidgetParams { tenantId: string | null; isAllowExpandBot: boolean }`
  - `readWidgetParams(search?: string): WidgetParams`

- [ ] **Step 1: Write the failing test**

`src/lib/surface.test.ts`:

```ts
import { expect, it } from 'vitest'
import { getSurface, readWidgetParams } from './surface'

it('detects the bubble surface from the pathname', () => {
  expect(getSurface('/ai-agent/sdk/bubble')).toBe('bubble')
  expect(getSurface('/ai-agent/sdk/bubble/')).toBe('bubble')
})

it('defaults to the chat surface', () => {
  expect(getSurface('/ai-agent/sdk/')).toBe('chat')
  expect(getSurface('/ai-agent/sdk')).toBe('chat')
})

it('reads tenant_id and isAllowExpandBot from the query string', () => {
  expect(readWidgetParams('?tenant_id=abc-123&isAllowExpandBot=1')).toEqual({
    tenantId: 'abc-123',
    isAllowExpandBot: true,
  })
})

it('returns null tenant and false expand when params are absent', () => {
  expect(readWidgetParams('')).toEqual({ tenantId: null, isAllowExpandBot: false })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `yarn test src/lib/surface.test.ts`
Expected: FAIL — cannot resolve `./surface`.

- [ ] **Step 3: Implement `src/lib/surface.ts`**

```ts
export type Surface = 'bubble' | 'chat'

export function getSurface(pathname: string = window.location.pathname): Surface {
  return pathname.replace(/\/+$/, '').endsWith('/bubble') ? 'bubble' : 'chat'
}

export interface WidgetParams {
  tenantId: string | null
  isAllowExpandBot: boolean
}

export function readWidgetParams(search: string = window.location.search): WidgetParams {
  const params = new URLSearchParams(search)
  return {
    tenantId: params.get('tenant_id'),
    isAllowExpandBot: params.get('isAllowExpandBot') != null,
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `yarn test src/lib/surface.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/surface.ts src/lib/surface.test.ts
git commit -m "feat: add surface detection and widget query-param parsing"
```

---

### Task 3: Bubble surface component

**Files:**
- Create: `src/components/Bubble.tsx`

**Interfaces:**
- Consumes: `hostBridge` (Task 1).
- Produces: `Bubble` — a named React component (no props).

- [ ] **Step 1: Implement `src/components/Bubble.tsx`**

Reuses the `Launcher` visual; click posts `openChat()`. Sits bottom-right inside the bubble iframe.

```tsx
import { MessageCircle } from 'lucide-react'
import { hostBridge } from '@/lib/hostBridge'

export function Bubble() {
  return (
    <div className="flex h-full w-full items-end justify-end p-1.5">
      <button
        type="button"
        aria-label="Mở trò chuyện"
        onClick={() => hostBridge.openChat()}
        className="relative flex h-[60px] w-[60px] items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, hsl(var(--header-grad-a)), hsl(var(--header-grad-b)))' }}
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute right-3 top-3 h-3 w-3 rounded-full border-2 border-white bg-[hsl(var(--status-alert))]" />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `yarn build`
Expected: build passes (component compiles; not yet mounted).

- [ ] **Step 3: Commit**

```bash
git add src/components/Bubble.tsx
git commit -m "feat: add bubble surface that opens chat via host postMessage"
```

---

### Task 4: Surface switch in `App` + remove host simulation + base path

**Files:**
- Modify: `src/App.tsx`
- Modify: `vite.config.ts`
- Delete: `src/components/Stage.tsx`
- Delete: `src/components/Launcher.tsx`

**Interfaces:**
- Consumes: `getSurface` (Task 2), `Bubble` (Task 3), `ChangWidget` (existing).

- [ ] **Step 1: Replace `src/App.tsx`**

Full new contents:

```tsx
import { getSurface } from '@/lib/surface'
import { Bubble } from './components/Bubble'
import { ChangWidget } from './components/ChangWidget'

export default function App() {
  if (getSurface() === 'bubble') return <Bubble />
  return <ChangWidget />
}
```

- [ ] **Step 2: Ensure Vite base has a trailing slash**

In `vite.config.ts`, change line `base: '/ai-agent/sdk',` to:

```ts
  base: '/ai-agent/sdk/',
```

- [ ] **Step 3: Delete the host-simulation components**

Run:

```bash
git rm src/components/Stage.tsx src/components/Launcher.tsx
```

Expected: both files removed. (`ChangWidget` still reads `minimized` from the store at this point — that is removed in Task 7; the app stays compiling because the store still defines it.)

- [ ] **Step 4: Verify build**

Run: `yarn build`
Expected: build passes. No remaining imports of `Stage` or `Launcher` (App no longer references them).

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx vite.config.ts
git commit -m "feat: switch surfaces by path and remove simulated host page"
```

---

### Task 5: Chat surface fills the iframe + emits INIT_CHAT

**Files:**
- Modify: `src/components/ChangWidget.tsx`

**Interfaces:**
- Consumes: `hostBridge` (Task 1).

- [ ] **Step 1: Update imports and emit `INIT_CHAT` on mount**

In `src/components/ChangWidget.tsx`, change the React import on line 1 from:

```tsx
import { useState } from 'react'
```

to:

```tsx
import { useEffect, useState } from 'react'
```

Add the hostBridge import alongside the other `@/` imports (after the `cn` import on line 3):

```tsx
import { hostBridge } from '@/lib/hostBridge'
```

- [ ] **Step 2: Stop reading `minimized`; announce on mount**

Change the store destructure (line 25) from:

```tsx
  const { minimized, activeTab, currentTaskId, switchTab, sheetTab, closeSheet } = useWidgetStore()
```

to:

```tsx
  const { activeTab, currentTaskId, switchTab, sheetTab, closeSheet } = useWidgetStore()
```

Immediately after the `view` line (line 26, `const view = ...`), add:

```tsx
  // Tell the host this chat frame has loaded so it can reveal the bubble.
  useEffect(() => {
    hostBridge.initChat()
  }, [])
```

- [ ] **Step 3: Make the root fill the iframe (remove floating/minimized styles)**

Replace the entire root `<div className={cn(...)} style={{ boxShadow: 'var(--widget-shadow)' }}>` opening tag (lines 41–51) with:

```tsx
    <div className="flex h-full w-full flex-col overflow-hidden bg-card">
```

(The host iframe now owns size, position, border-radius, drop-shadow, and show/hide animation; the widget just fills it.)

- [ ] **Step 4: Verify build**

Run: `yarn build`
Expected: build passes; `cn` is still used elsewhere in the file (panel classes), no unused-import error.

- [ ] **Step 5: Run existing widget tests**

Run: `yarn test src/components/ChangWidget.test.tsx`
Expected: PASS (3 tests — sheet behaviour is unaffected).

- [ ] **Step 6: Commit**

```bash
git add src/components/ChangWidget.tsx
git commit -m "feat: chat surface fills iframe and emits INIT_CHAT on mount"
```

---

### Task 6: Header close + maximize/minimize via host

**Files:**
- Modify: `src/components/Header.tsx`

**Interfaces:**
- Consumes: `hostBridge` (Task 1), `readWidgetParams` (Task 2).

- [ ] **Step 1: Replace `src/components/Header.tsx`**

Full new contents (close button replaces the old "Thu nhỏ"; maximize/minimize toggle gated by `isAllowExpandBot`):

```tsx
import { useState } from 'react'
import { Bot, Maximize2, Minimize2, Moon, SquarePen, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import { hostBridge } from '@/lib/hostBridge'
import { readWidgetParams } from '@/lib/surface'
import { Button } from '@/components/ui/button'

export function Header() {
  const { activeTab, newChat, cycleTheme } = useWidgetStore()
  const { isAllowExpandBot } = readWidgetParams()
  const chatOnly = activeTab === 'chat'
  const [maximized, setMaximized] = useState(false)

  const toggleMaximize = () => {
    const next = !maximized
    setMaximized(next)
    if (next) hostBridge.maximize()
    else hostBridge.minimize()
  }

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
        {isAllowExpandBot && (
          <HeaderButton title={maximized ? 'Thu nhỏ' : 'Phóng to'} onClick={toggleMaximize}>
            {maximized ? <Minimize2 /> : <Maximize2 />}
          </HeaderButton>
        )}
        <HeaderButton title="Đóng" onClick={() => hostBridge.closeChat()}><X /></HeaderButton>
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

- [ ] **Step 2: Verify build**

Run: `yarn build`
Expected: build passes; no reference to `setMinimized` remains in Header.

- [ ] **Step 3: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat: header close + maximize/minimize emit host messages"
```

---

### Task 7: Remove `minimized` from the store + fix its test

**Files:**
- Modify: `src/store/useWidgetStore.ts`
- Modify: `src/store/useWidgetStore.test.ts`

**Interfaces:**
- Produces: `WidgetState` without `minimized` / `setMinimized`.

- [ ] **Step 1: Remove `minimized` from the interface**

In `src/store/useWidgetStore.ts`, delete line 10 (`  minimized: boolean`) and line 27 (`  setMinimized: (m: boolean) => void`).

- [ ] **Step 2: Remove `minimized` from initial state**

Delete line 62 (`  minimized: false,`) from the `initialState` object.

- [ ] **Step 3: Remove the `setMinimized` action**

Delete line 109 (`  setMinimized: (m) => set({ minimized: m }),`).

- [ ] **Step 4: Fix the store test**

In `src/store/useWidgetStore.test.ts`, change the test (lines 9–14) from:

```ts
  it('starts on the chat tab, not minimized, no detail', () => {
    const s = useWidgetStore.getState()
    expect(s.activeTab).toBe('chat')
    expect(s.minimized).toBe(false)
    expect(s.currentTaskId).toBeNull()
  })
```

to:

```ts
  it('starts on the chat tab, no detail', () => {
    const s = useWidgetStore.getState()
    expect(s.activeTab).toBe('chat')
    expect(s.currentTaskId).toBeNull()
  })
```

- [ ] **Step 5: Run the full test suite**

Run: `yarn test`
Expected: PASS — no references to `minimized` remain; all suites green.

- [ ] **Step 6: Commit**

```bash
git add src/store/useWidgetStore.ts src/store/useWidgetStore.test.ts
git commit -m "refactor: drop internal minimized state now host-controlled"
```

---

### Task 8: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Full test + build**

Run: `yarn test && yarn build`
Expected: all tests pass; build succeeds with no TS errors.

- [ ] **Step 2: Manual surface check (dev server)**

Run: `yarn dev`, then open:
- `http://localhost:5173/ai-agent/sdk/` — chat dialog fills the viewport; no "Demo host page" backdrop; no floating launcher. Header shows close (X) button; maximize toggle absent.
- `http://localhost:5173/ai-agent/sdk/?isAllowExpandBot=1` — maximize toggle now present.
- `http://localhost:5173/ai-agent/sdk/bubble` — only the bubble button renders.

In devtools console, run a quick listener to observe messages, then click the bubble / close button / maximize:

```js
window.addEventListener('message', (e) => console.log('msg', e.data))
```

Expected: `INIT_CHAT` on chat load; `TOGGLE_CHAT {isOpen:true}` on bubble click; `TOGGLE_CHAT {isOpen:false}` on close; `MAXIMIZE_CHAT`/`MINIMIZE_CHAT` on the maximize toggle. Stop the server when done.

- [ ] **Step 3: No commit needed** (verification only). If `yarn build` produced `dist/`, it is gitignored.

---

## Self-Review Notes

- **Spec coverage:** surface switch + Vite base (Task 4) ✓; `hostBridge` protocol with exact payloads (Task 1) ✓; `surface`/params (Task 2) ✓; bubble surface (Task 3) ✓; chat fills iframe + `INIT_CHAT` (Task 5) ✓; header close + maximize/minimize gated by `isAllowExpandBot` (Task 6) ✓; remove `Stage`/`Launcher`/`minimized` (Tasks 4, 7) ✓; tests updated + hostBridge/surface tests added (Tasks 1, 2, 7) ✓; no backend (Global Constraints) ✓.
- **Placeholder scan:** every step has concrete code or exact commands; no TBD/TODO.
- **Type consistency:** `hostBridge` method names (`initChat/openChat/closeChat/maximize/minimize`) defined in Task 1 and consumed identically in Tasks 3, 5, 6; `readWidgetParams().isAllowExpandBot` defined in Task 2 and consumed in Task 6; `getSurface` defined in Task 2 and consumed in Task 4.
- **Compile-safety ordering:** `minimized` is removed from the store (Task 7) only after its last consumers (`ChangWidget` Task 5, `Header` Task 6) and `Launcher` (Task 4) are gone, so every intermediate commit builds.
- **Deviation from chatbot-sdk (intentional):** close uses an `X` icon (sdk uses a minimize-style icon); maximize uses `Maximize2`/`Minimize2`. Behaviour/messages identical; icon choice differs to fit the existing lucide-based header.
