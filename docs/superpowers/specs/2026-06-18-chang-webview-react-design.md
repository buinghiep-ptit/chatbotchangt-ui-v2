# Chang Webview — React Rebuild Design

**Date:** 2026-06-18
**Status:** Approved design → ready for implementation plan
**Source:** `/Users/nghiepbui/Downloads/chang-webview.html` (1260-line self-contained HTML prototype)

## 1. Goal

Rebuild the **Chang SCC** assistant webview — a Vietnamese AI-assistant chat widget — as a
React + Vite + shadcn/ui application. The rebuild is a **1:1 port of the prototype's layout and
behavior** with **higher code quality** (TypeScript, clean component boundaries, typed mock data),
plus a **Liquid Glass UI** restyle of the surfaces.

Non-goals:
- No backend / real API. All data is mock and behavior is simulated (canned replies, fake typing).
- No authentication, routing, or persistence beyond theme preference.

## 2. Stack

| Concern | Choice |
|---|---|
| Build | Vite + React 18 + TypeScript |
| Styling | Tailwind CSS + shadcn/ui (CSS-variable theming) |
| Icons | `lucide-react` (replaces the inline SVG `<symbol>` sprite; near 1:1 with the tabler icons used) |
| State | **Zustand** store (single widget store) |
| Fonts | Noto Sans + JetBrains Mono (Google Fonts `<link>` in `index.html`) |
| Tests | Vitest + React Testing Library |

## 3. Visual Direction — Liquid Glass (medium intensity)

The prototype's flat violet-on-white surfaces are restyled as translucent glass:

- **Surfaces** (widget shell, header, cards, composer, tab bar, drawers, bot bubbles): semi-transparent
  background + `backdrop-blur` + `saturate`/`brightness` frost, a thin light inner border for the edge
  highlight, layered shadows for depth, and a subtle gradient "sheen" overlay.
- **Backdrop:** the demo host page gets an enriched multi-stop violet gradient with soft light blooms
  so the glass translucency is visible (a near-white background would make glass invisible).
- **Legibility guards:** user chat bubbles stay solid violet (white text); status/brand text keeps
  sufficient contrast over glass. Medium intensity = clearly glassy but readable.
- **Dark mode:** dark translucent glass (low-alpha dark surfaces over the gradient), via shadcn `.dark`.

### Theme system

- Adopt shadcn's `.dark` class convention on `<html>` (replaces the prototype's `data-theme`).
- Map brand colors into shadcn CSS variables: violet → `--primary`; plus `--background`, `--card`,
  `--muted`, `--border`, `--foreground`, etc. for light and `.dark`.
- Add **custom tokens** shadcn lacks: chat bubble colors, header gradient stops, status colors
  (pending/running/done/watch), glass alpha/blur values, sheen gradient.
- **Theme persistence:** selected theme saved to `localStorage` (small improvement over prototype).
  Header theme button cycles; demo-stage Sáng/Tối toggle sets explicitly.

## 4. Architecture

### 4.1 State — Zustand store

A single `useWidgetStore` (Zustand) holds all cross-cutting UI state and actions. Mock data seeds
the initial state; the store mutates in-memory only.

State shape:

```ts
interface WidgetState {
  // navigation
  activeTab: 'chat' | 'tasks' | 'noti';   // 'detail' is derived from currentTaskId
  currentTaskId: string | null;            // non-null => task-detail sub-view of Tasks
  minimized: boolean;
  taskFilter: TaskFilter;                  // 'pending' | 'watch' | 'mine' | 'done'
  historyOpen: boolean;

  // data
  messages: Message[];                     // current chat thread
  isTyping: boolean;
  tasks: Task[];
  taskConversations: Record<string, ConvoMessage[]>;  // per-task status Q&A
  notifications: Notification[];

  // theme
  theme: 'light' | 'dark';
}
```

Actions (selectors/setters): `switchTab`, `openTask`, `closeTask`, `setTaskFilter`, `toggleHistory`,
`setMinimized`, `sendChatMessage`, `newChat`, `approveHitl`, `sendTaskMessage`, `markAllNotisRead`,
`markNotiRead`, `setTheme`, `cycleTheme`.

Derived/selectors: `unreadNotiCount`, `pendingTaskCount` (tasks badge), `filteredTasks`,
`isDetailView` (`currentTaskId !== null`).

Simulated async behavior (typing → canned reply, status reply) lives in store actions using
`setTimeout`; components stay declarative. `setTimeout` use is isolated to the store for testability.

### 4.2 Types — `src/types.ts`

```ts
type TaskType = 'workflow' | 'skill';
type TaskStatus = 'pending' | 'running' | 'done' | 'watch';
type TaskFilter = 'pending' | 'watch' | 'mine' | 'done';

interface Task {
  id: string; name: string; type: TaskType; by: string;
  time: string; lastUpdate: string; status: TaskStatus;
  bucket: TaskFilter[]; summary: string; thinking: string;
  convo: ConvoMessage[];
}
interface ConvoMessage { role: 'user' | 'bot'; text: string; time: string; }

interface Message {
  id: string; role: 'user' | 'bot'; time: string;
  text?: string;                 // bubble HTML/text content
  kind?: 'text' | 'taskInline' | 'hitl';
  taskRef?: string;              // for taskInline -> task id
  hitl?: HitlPayload;            // for hitl card
  showTools?: boolean;           // copy / like / dislike row
}
interface HitlPayload { title: string; text: string; targetTaskId: string; approved?: boolean; }

interface Notification {
  id: string; iconKind: NotiKind; icon: string;
  text: string; time: string; unread: boolean;
}
type NotiKind = 'task' | 'done' | 'hitl' | 'alert';
```

### 4.3 Mock data — `src/data/`

- `tasks.ts` — the 8 seed tasks (t1–t8) typed as `Task[]`.
- `notifications.ts` — the 5 seed notifications.
- `messages.ts` — the initial chat thread (greeting, user SLA request, bot task-inline card, HITL card)
  and the `newChat` greeting.

### 4.4 Component tree

```
App
└─ Stage                         host-page background + stage hint + demo Sáng/Tối toggle
   ├─ Launcher                   floating bubble shown when minimized (desktop)
   └─ ChangWidget                glass shell; hidden/animated when minimized
      ├─ Header                  avatar+status, name/sub, actions (new chat, history, theme, minimize)
      ├─ Body
      │  ├─ ChatPanel
      │  │  ├─ QuickSuggestions  collapsible chip row
      │  │  ├─ MessageList       renders Message | TaskInlineCard | HitlCard | TypingIndicator
      │  │  ├─ Composer          attach · Textarea · voice · send
      │  │  └─ HistoryDrawer     slide-in: search + grouped history items
      │  ├─ TasksPanel           SubTabs (filter+counts) · TaskCard[] · EmptyState
      │  ├─ TaskDetailPanel      InfoCluster (summary + "Chang đang làm gì") · LatestStatus
      │  │                       · StatusConversation · SuggestChips · Composer
      │  └─ NotificationsPanel   header (mark-all-read) · NotificationItem[]
      └─ TabBar                  3 tabs (Chat/Tasks/Noti) with badges
```

Each component is one focused file under `src/components/`. shadcn primitives live in
`src/components/ui/`. Shared building blocks: `MessageBubble`, `StatusBadge`, `IconButton`, `Chip`.

### 4.5 shadcn usage

| Prototype element | Implementation |
|---|---|
| Send / icon / chip / HITL buttons | shadcn `Button` variants |
| Status / count / tab badges | shadcn `Badge` (+ custom status variants) |
| Composer input | shadcn `Textarea` |
| History search | shadcn `Input` |
| Scroll regions | shadcn `ScrollArea` |
| Avatars | shadcn `Avatar` |
| Bottom tab bar, sub-tabs, chat/task/noti cards, drawer | bespoke components styled with theme tokens + glass utilities |

Glass styling is provided via Tailwind utility classes / a small `glass` className helper, not
per-component CSS files.

## 5. Behaviors to reproduce (1:1)

- **Tab navigation:** Chat / Tasks / Noti. Task **detail** is a sub-view of Tasks — the bottom bar
  keeps "Công việc" highlighted while in detail. Tapping any bottom tab leaves detail.
- **Header chat-only actions:** "new chat" and "history" buttons show only on the Chat tab.
- **Quick suggestions:** collapsible; chip click fills the composer and sends.
- **Chat send:** append user bubble → show typing indicator → after delay append canned bot reply.
- **HITL approve:** "Duyệt & gửi" replaces the card with an "Đã duyệt — đang gửi" confirmation
  (green); "Xem chi tiết" opens the referenced task detail. Approving updates the noti badge.
- **History drawer:** open/close slide-in; `newChat` resets the thread to the greeting, reopens quick
  suggestions, clears input, closes the drawer.
- **Tasks filter:** sub-tabs filter by `bucket` (pending/watch/mine/done) with live counts; empty
  state when a filter has no tasks.
- **Task detail:** open from a card or task-inline/HITL CTA; back returns to Tasks. Collapsible info
  cluster (summary + "Chang đang làm gì"); latest-status strip; status Q&A thread with suggestion
  chips ("Việc đến đâu rồi?" / "Khi nào xong?" / "Có vướng gì không?"). Status reply differs for
  `done` vs in-progress tasks.
- **Notifications:** unread dot + per-item read-on-click; "Đánh dấu đã đọc" clears all; the Noti tab
  badge reflects unread count. Tasks tab badge = pending count (2 in seed data).
- **Theme:** light/dark; header button cycles; demo-stage toggle sets explicitly; persisted.
- **Widget chrome:** minimize → launcher bubble (desktop); restore from launcher. Mobile (<480px):
  full-screen, no launcher/minimize, stage hint hidden.

## 6. Error handling

Minimal — this is a mock UI:
- Guard `openTask` against unknown ids (no-op).
- Ignore empty/whitespace-only composer sends.
- `escapeHtml` equivalent: render user-entered text as plain text (React escapes by default), so no
  manual escaping needed; bot/seed content that contains intentional markup (`<b>`, `<ul>`) is
  authored as React nodes or sanitized constants, never via raw user input.

## 7. Testing

Vitest + React Testing Library, focused on logic-bearing units (mostly the Zustand store):

- `sendChatMessage`: adds user message, sets typing, then adds bot reply (fake timers).
- `newChat`: resets thread to greeting, reopens suggestions.
- `filteredTasks` / `setTaskFilter`: returns correct tasks per bucket; counts correct.
- `approveHitl`: flips the HITL message to approved.
- notifications: `markNotiRead` / `markAllNotisRead` update `unreadNotiCount`.
- A couple of component smoke tests: TabBar switches panels; TaskCard click opens detail.

## 8. Project structure

```
chang-webview/
├─ index.html                 fonts + root
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ index.css               Tailwind layers + theme tokens (light/.dark) + glass utilities
│  ├─ types.ts
│  ├─ store/useWidgetStore.ts
│  ├─ data/{tasks,notifications,messages}.ts
│  ├─ lib/utils.ts            cn() + glass helper
│  └─ components/
│     ├─ ui/                  shadcn primitives
│     ├─ Stage.tsx, Launcher.tsx, ChangWidget.tsx, Header.tsx, TabBar.tsx
│     ├─ chat/                ChatPanel, QuickSuggestions, MessageList, MessageBubble,
│     │                       TaskInlineCard, HitlCard, TypingIndicator, Composer, HistoryDrawer
│     ├─ tasks/               TasksPanel, SubTabs, TaskCard, EmptyState, TaskDetailPanel, ...
│     └─ noti/                NotificationsPanel, NotificationItem
├─ tailwind.config.ts, postcss.config.js, components.json
├─ tsconfig*.json, vite.config.ts
└─ docs/superpowers/specs/2026-06-18-chang-webview-react-design.md
```

## 9. Open assumptions (defaults chosen, easy to revisit)

- Theme persistence via `localStorage` is added (prototype had none).
- `lucide-react` icons substitute for the bespoke SVG sprite; visually near-identical.
- Vietnamese copy is preserved verbatim from the prototype.
