# Chang Webview React Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Chang SCC assistant webview (Vietnamese AI-assistant chat widget) as a React + Vite + shadcn/ui app — a 1:1 port of the prototype's layout and behavior, restyled with a medium-intensity Liquid Glass UI.

**Architecture:** Single-page React app. All UI state and simulated behavior live in one Zustand store (`useWidgetStore`). Mock data seeds the store; no backend. Tailwind + shadcn/ui provide primitives; theme is driven by CSS variables (shadcn `.dark` convention) plus custom tokens for glass, chat bubbles, and status colors. Components are small and single-responsibility, grouped by feature (chat / tasks / noti).

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, lucide-react, Zustand, Vitest + React Testing Library.

**Reference:** The source prototype is `/Users/nghiepbui/Downloads/chang-webview.html` (1260 lines). Line numbers below (e.g. `proto:910-961`) point at the exact prototype source to match for fidelity. Preserve all Vietnamese copy verbatim.

---

## File Structure

```
chang-webview/                    (project root = /Users/nghiepbui/Desktop/PERSONAL/superpowers-demo)
├─ index.html                     fonts + root div
├─ package.json, vite.config.ts, tsconfig*.json
├─ tailwind.config.ts, postcss.config.js, components.json
├─ vitest.config.ts, src/test/setup.ts
├─ src/
│  ├─ main.tsx                    React root + theme bootstrap
│  ├─ App.tsx                     Stage + Launcher + ChangWidget
│  ├─ index.css                   Tailwind layers, theme tokens (light/.dark), glass utilities
│  ├─ types.ts                    Task, Message, Notification, ...
│  ├─ lib/utils.ts                cn() helper
│  ├─ store/useWidgetStore.ts     Zustand store: state + all actions
│  ├─ data/
│  │  ├─ tasks.ts                 8 seed tasks
│  │  ├─ notifications.ts         5 seed notifications
│  │  └─ messages.ts              initial chat thread + greeting
│  └─ components/
│     ├─ ui/                      shadcn primitives (generated)
│     ├─ Stage.tsx, Launcher.tsx, ChangWidget.tsx, Header.tsx, TabBar.tsx
│     ├─ shared/                  StatusBadge.tsx, Chip.tsx, MessageBubble.tsx
│     ├─ chat/                    ChatPanel, QuickSuggestions, MessageList, TaskInlineCard,
│     │                           HitlCard, TypingIndicator, Composer, HistoryDrawer
│     ├─ tasks/                   TasksPanel, SubTabs, TaskCard, EmptyState, TaskDetailPanel
│     └─ noti/                    NotificationsPanel, NotificationItem
└─ docs/superpowers/...           spec + this plan
```

---

## Task 1: Scaffold project & install dependencies

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`

- [ ] **Step 1: Scaffold Vite React-TS into the (non-empty) project dir**

The project root already contains `docs/`. Scaffold into the current directory using a temp dir to avoid the "directory not empty" prompt:

```bash
cd /Users/nghiepbui/Desktop/PERSONAL/superpowers-demo
npm create vite@latest .vite-tmp -- --template react-ts
cp -R .vite-tmp/. . && rm -rf .vite-tmp
```

- [ ] **Step 2: Install runtime + dev dependencies**

```bash
npm install
npm install zustand lucide-react class-variance-authority clsx tailwind-merge tailwindcss-animate
npm install -D tailwindcss@3 postcss autoprefixer @types/node
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Replace `index.html` with fonts + Vietnamese lang**

```html
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Chang Webview</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Verify the scaffold runs**

Run: `npm run build`
Expected: Vite build succeeds (TypeScript compiles, `dist/` produced).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS project"
```

---

## Task 2: Tailwind, shadcn config, theme tokens & glass utilities

**Files:**
- Create: `tailwind.config.ts`, `postcss.config.js`, `components.json`, `src/lib/utils.ts`
- Modify: `src/index.css` (full replace), `tsconfig.json` (add path alias), `vite.config.ts` (add alias)

- [ ] **Step 1: `postcss.config.js`**

```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
```

- [ ] **Step 2: `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Noto Sans'", 'system-ui', 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        status: {
          pending: 'hsl(var(--status-pending))',
          running: 'hsl(var(--status-running))',
          done: 'hsl(var(--status-done))',
        },
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 4px)', sm: 'calc(var(--radius) - 8px)' },
      keyframes: {
        blink: { '0%,60%,100%': { opacity: '.25', transform: 'translateY(0)' }, '30%': { opacity: '1', transform: 'translateY(-3px)' } },
        'drift': { '0%,100%': { transform: 'translate(0,0)' }, '50%': { transform: 'translate(-3%, 2%)' } },
      },
      animation: { blink: 'blink 1.2s infinite', drift: 'drift 18s ease-in-out infinite' },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

- [ ] **Step 3: `components.json`** (shadcn config, new-york style)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": { "config": "tailwind.config.ts", "css": "src/index.css", "baseColor": "zinc", "cssVariables": true, "prefix": "" },
  "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui" }
}
```

- [ ] **Step 4: `src/lib/utils.ts`**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 5: Path alias in `tsconfig.json`** — add inside `compilerOptions`:

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

- [ ] **Step 6: Path alias in `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
```

- [ ] **Step 7: `src/index.css`** — Tailwind layers, theme tokens, glass utilities (full replace). Colors are ports of the prototype tokens (`proto:15-70`): violet `#7C3AED`, blue `#2563EB`, green `#16A34A`, amber `#D97706`.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 6% 10%;          /* #18181B */
    --card: 0 0% 100%;
    --card-foreground: 240 6% 10%;
    --primary: 262 83% 58%;            /* #7C3AED violet */
    --primary-foreground: 0 0% 100%;
    --muted: 240 5% 96%;               /* #F4F4F5 surface */
    --muted-foreground: 240 4% 34%;    /* #52525B */
    --border: 240 6% 90%;              /* #E4E4E7 */
    --input: 240 6% 90%;
    --ring: 262 83% 58%;
    --radius: 0.9rem;

    --status-pending: 32 94% 44%;      /* amber #D97706 */
    --status-running: 221 83% 53%;     /* blue  #2563EB */
    --status-done: 142 71% 45%;        /* green #16A34A */
    --status-alert: 0 72% 51%;         /* red   #DC2626 */

    --bubble-bot-text: 240 6% 10%;
    --header-grad-a: 262 83% 58%;
    --header-grad-b: 263 70% 50%;      /* #6D28D9 */

    /* glass (light) */
    --glass-bg: 255 255 255 / 0.55;
    --glass-border: 255 255 255 / 0.65;
    --glass-blur: 18px;
    --glass-shadow: 0 12px 40px rgba(80, 40, 160, 0.16);
    --sheen: linear-gradient(135deg, rgba(255,255,255,0.5), rgba(255,255,255,0) 40%);
    /* host backdrop */
    --stage-grad: radial-gradient(900px 600px at 80% -8%, rgba(124,58,237,0.30), transparent 60%),
                  radial-gradient(700px 500px at 5% 110%, rgba(37,99,235,0.22), transparent 60%),
                  linear-gradient(160deg, #f4f0ff, #eef2ff 60%, #faf5ff);
  }

  .dark {
    --background: 240 6% 10%;          /* #18181B */
    --foreground: 0 0% 98%;
    --card: 240 4% 16%;                /* #27272A */
    --card-foreground: 0 0% 98%;
    --primary: 262 83% 62%;
    --primary-foreground: 0 0% 100%;
    --muted: 240 4% 16%;
    --muted-foreground: 240 5% 65%;
    --border: 240 5% 22%;              /* #34343A */
    --input: 240 5% 22%;
    --ring: 262 83% 62%;

    --bubble-bot-text: 0 0% 96%;
    --header-grad-a: 263 70% 50%;
    --header-grad-b: 258 70% 42%;

    --glass-bg: 30 30 36 / 0.55;
    --glass-border: 255 255 255 / 0.10;
    --glass-blur: 20px;
    --glass-shadow: 0 14px 44px rgba(0, 0, 0, 0.5);
    --sheen: linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 40%);
    --stage-grad: radial-gradient(900px 600px at 80% -8%, rgba(124,58,237,0.28), transparent 60%),
                  radial-gradient(700px 500px at 5% 110%, rgba(37,99,235,0.18), transparent 60%),
                  linear-gradient(160deg, #16131f, #131625 60%, #1a1430);
  }

  * { -webkit-tap-highlight-color: transparent; }
  body {
    @apply text-foreground;
    font-family: 'Noto Sans', system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
}

@layer components {
  /* medium-intensity liquid glass surface */
  .glass {
    background: rgb(var(--glass-bg));
    backdrop-filter: blur(var(--glass-blur)) saturate(160%) brightness(1.04);
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%) brightness(1.04);
    border: 1px solid rgb(var(--glass-border));
    box-shadow: var(--glass-shadow);
  }
  /* specular sheen overlay; put on a relatively-positioned element */
  .glass-sheen { position: relative; }
  .glass-sheen::before {
    content: '';
    position: absolute; inset: 0;
    background: var(--sheen);
    pointer-events: none;
    border-radius: inherit;
  }
}

@layer utilities {
  .scrollbar-thin::-webkit-scrollbar { width: 6px; }
  .scrollbar-thin::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 6px; }
}
```

- [ ] **Step 8: Verify build still compiles**

Run: `npm run build`
Expected: success.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: tailwind + shadcn config, theme tokens, glass utilities"
```

---

## Task 3: Generate shadcn UI primitives

**Files:**
- Create: `src/components/ui/{button,badge,input,textarea,scroll-area,avatar}.tsx`

- [ ] **Step 1: Generate primitives via shadcn CLI**

```bash
npx shadcn@latest add button badge input textarea scroll-area avatar --yes
```

If the CLI prompts or fails on alias detection, confirm `components.json` from Task 2 exists. These files are generated verbatim by shadcn and require no manual edits.

- [ ] **Step 2: Verify the generated files import `@/lib/utils`**

Run: `npm run build`
Expected: success (the `@` alias resolves; primitives compile).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add shadcn ui primitives"
```

---

## Task 4: Types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write `src/types.ts`** (ports the prototype data shapes, `proto:910-978`)

```ts
export type TaskType = 'workflow' | 'skill'
export type TaskStatus = 'pending' | 'running' | 'done' | 'watch'
export type TaskFilter = 'pending' | 'watch' | 'mine' | 'done'
export type Role = 'user' | 'bot'

export interface ConvoMessage {
  role: Role
  text: string
  time: string
}

export interface Task {
  id: string
  name: string
  type: TaskType
  by: string
  time: string
  lastUpdate: string
  status: TaskStatus
  bucket: TaskFilter[]
  summary: string
  thinking: string
  convo: ConvoMessage[]
}

export type MessageKind = 'text' | 'taskInline' | 'hitl'

export interface HitlPayload {
  title: string
  text: string
  targetTaskId: string
  approved?: boolean
}

export interface TaskInlinePayload {
  title: string
  meta: string
  targetTaskId: string
}

export interface Message {
  id: string
  role: Role
  time: string
  kind: MessageKind
  /** rich text content (may contain pre-authored <b>/<ul> markup from seed data, never user input) */
  html?: string
  /** plain text content (user-entered; rendered escaped) */
  text?: string
  taskInline?: TaskInlinePayload
  hitl?: HitlPayload
  showTools?: boolean
}

export type NotiKind = 'task' | 'done' | 'hitl' | 'alert'

export interface Notification {
  id: string
  kind: NotiKind
  /** lucide icon name resolved in NotificationItem */
  icon: string
  /** pre-authored markup (contains <b>), never user input */
  html: string
  time: string
  unread: boolean
}

export type Theme = 'light' | 'dark'
export type Tab = 'chat' | 'tasks' | 'noti'
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: domain types"
```

---

## Task 5: Mock data

**Files:**
- Create: `src/data/tasks.ts`, `src/data/notifications.ts`, `src/data/messages.ts`

- [ ] **Step 1: `src/data/tasks.ts`** (verbatim port of `proto:910-961`)

```ts
import type { Task } from '@/types'

export const SEED_TASKS: Task[] = [
  { id: 't1', name: 'Báo cáo SLA tháng 5 — 15 đơn vị', type: 'workflow', by: 'Chang SCC',
    time: '9 phút trước', lastUpdate: 'Đang tính chỉ số cho 2 đơn vị breach', status: 'running', bucket: ['pending', 'mine', 'watch'],
    summary: 'Tổng hợp số liệu SLA tháng 5 cho 15 đơn vị, tính chỉ số breach và soạn email báo cáo theo template chuẩn.',
    thinking: 'Đã lấy dữ liệu SLA từ Google Sheet nguồn và phát hiện 2 đơn vị breach (FTQ, INFMN-KH). Đang đối chiếu ngưỡng cam kết từng đơn vị, sau đó sẽ soạn email gửi anh review.',
    convo: [
      { role: 'user', text: 'Việc này đang đến đâu rồi em?', time: '09:58' },
      { role: 'bot', text: 'Dạ em đã tổng hợp xong số liệu và phát hiện 2 đơn vị breach (FTQ, INFMN-KH). Hiện em đang tính chỉ số chi tiết cho 2 đơn vị này, dự kiến xong trong khoảng 5 phút nữa rồi em soạn email gửi anh review ạ.', time: '09:58' },
    ] },
  { id: 't2', name: 'Soạn email giải trình breach — FTQ, INFMN-KH', type: 'skill', by: 'Chang SCC',
    time: '12 phút trước', lastUpdate: 'Đã soạn xong, chờ anh duyệt', status: 'pending', bucket: ['pending', 'mine'],
    summary: 'Soạn 2 email giải trình SLA breach cho FTQ và INFMN-KH kèm số liệu và nguyên nhân. Nội dung đã hoàn tất, đang chờ duyệt trước khi gửi.',
    thinking: 'Đã trích nguyên nhân breach từ log ticket: FTQ do nghẽn hàng đợi giờ cao điểm, INFMN-KH do sự cố hệ thống tiếp nhận. Email đã soạn theo giọng văn chuẩn, đính kèm bảng số liệu. Vì gửi ra ngoài đơn vị nên em dừng lại chờ anh xác nhận ở phần Trò chuyện.',
    convo: [
      { role: 'user', text: 'Email soạn xong chưa em?', time: '09:55' },
      { role: 'bot', text: 'Dạ xong rồi ạ. Cả 2 email đã có đủ số liệu và nguyên nhân breach. Em đang chờ anh duyệt ở phần Trò chuyện trước khi gửi ra cho FTQ và INFMN-KH ạ.', time: '09:55' },
    ] },
  { id: 't3', name: 'Cảnh báo ticket quá hạn SLA hôm nay', type: 'workflow', by: 'Chang SCC',
    time: '1 giờ trước', lastUpdate: 'Đang theo dõi hàng đợi, quét mỗi 15 phút', status: 'running', bucket: ['watch'],
    summary: 'Theo dõi liên tục các ticket sắp/đã quá hạn SLA trong ngày, gom theo đội và gửi cảnh báo vào group Fchat.',
    thinking: 'Em quét hàng đợi ticket mỗi 15 phút. Lần gần nhất phát hiện 3 ticket đội Q.7 sắp quá hạn và đã gửi cảnh báo. Em tiếp tục theo dõi đến hết ca.',
    convo: [
      { role: 'bot', text: 'Cập nhật: lần quét gần nhất lúc 08:12 — đã cảnh báo 3 ticket đội Q.7 sắp quá hạn vào group. Em đang tiếp tục theo dõi.', time: '08:12' },
    ] },
  { id: 't4', name: 'Tổng hợp năng suất nhân sự VH tháng 4', type: 'workflow', by: 'Chang SCC',
    time: 'Hôm qua', lastUpdate: 'Đã hoàn thành và gửi các đơn vị', status: 'done', bucket: ['mine', 'done'],
    summary: 'Tổng hợp năng suất nhân sự vận hành từ Ticket, Fproject và CSOC, tính điểm theo công thức và gửi báo cáo các đơn vị giám sát.',
    thinking: 'Đã hợp nhất dữ liệu 3 nguồn, xử lý trùng và tính điểm năng suất. Bảng tổng quan đã được tạo và đính kèm email gửi các đơn vị.',
    convo: [
      { role: 'bot', text: 'Báo cáo năng suất tháng 4 đã hoàn thành và gửi các đơn vị giám sát từ hôm qua. Anh xem file đính kèm trong email nhé.', time: 'Hôm qua · 16:40' },
    ] },
  { id: 't5', name: 'Tổng hợp FAQ từ ticket tháng 4', type: 'skill', by: 'Chang SCC',
    time: '2 ngày trước', lastUpdate: 'Đã cập nhật 23 mục lên SDK', status: 'done', bucket: ['done'],
    summary: 'Đọc và phân tích ticket tháng 4, tổng hợp thành bộ FAQ và cập nhật lên SDK.',
    thinking: 'Đã phân cụm 5.000 ticket theo chủ đề, chọn 23 vấn đề phổ biến nhất và sinh câu trả lời chuẩn.',
    convo: [{ role: 'bot', text: 'Đã tạo 23 mục FAQ mới và cập nhật lên SDK từ 2 ngày trước ạ.', time: '2 ngày trước' }] },
  { id: 't6', name: 'Tra cứu ticket vi phạm tuần 19', type: 'skill', by: 'Chang SCC',
    time: '3 ngày trước', lastUpdate: 'Đã xuất danh sách 12 ticket breach', status: 'done', bucket: ['done', 'mine'],
    summary: 'Tra cứu và gom nhóm các ticket vi phạm SLA trong tuần 19 theo đơn vị.',
    thinking: 'Đã lọc 12 ticket breach, gom theo đơn vị và xuất danh sách.',
    convo: [{ role: 'bot', text: 'Có 12 ticket breach tuần 19, em đã gom theo đơn vị và xuất danh sách (đính kèm).', time: '3 ngày trước' }] },
  { id: 't7', name: 'Báo cáo cuối ca giám sát hệ thống', type: 'workflow', by: 'Chang SCC',
    time: '4 ngày trước', lastUpdate: 'Đã gửi lãnh đạo, 2 cảnh báo trong ca', status: 'done', bucket: ['done'],
    summary: 'Tổng hợp lỗi và chỉ số trong ca, tạo báo cáo cuối ca gửi lãnh đạo.',
    thinking: 'Đã thu thập dữ liệu 5 hệ thống thành phần, tổng hợp các lỗi vượt ngưỡng trong ca.',
    convo: [{ role: 'bot', text: 'Báo cáo cuối ca đã gửi lãnh đạo. Trong ca có 2 cảnh báo vượt ngưỡng ạ.', time: '4 ngày trước' }] },
  { id: 't8', name: 'Cảnh báo lỗi autocall ngoài giờ', type: 'workflow', by: 'Chang SCC',
    time: '5 ngày trước', lastUpdate: 'Đã thông báo nhóm kỹ thuật', status: 'done', bucket: ['done'],
    summary: 'Phát hiện lỗi hệ thống autocall ngoài giờ hành chính và thông báo nhóm kỹ thuật.',
    thinking: 'Phát hiện autocall không kết nối được lúc 21:30, đã gửi cảnh báo kèm traceID cho nhóm kỹ thuật.',
    convo: [{ role: 'bot', text: 'Em đã thông báo nhóm kỹ thuật lúc 21:30 — autocall mất kết nối, kèm traceID ạ.', time: '5 ngày trước' }] },
]

export const STATUS_LABEL: Record<Task['status'], string> = {
  pending: 'Cần xử lý', running: 'Đang chạy', done: 'Hoàn thành', watch: 'Theo dõi',
}
```

- [ ] **Step 2: `src/data/notifications.ts`** (port of `proto:967-978`; icon names are lucide equivalents)

```ts
import type { Notification } from '@/types'

export const SEED_NOTIFICATIONS: Notification[] = [
  { id: 'n1', kind: 'hitl', icon: 'TriangleAlert', unread: true,
    html: '<b>Chang SCC</b> cần anh duyệt email giải trình breach cho FTQ và INFMN-KH', time: '2 phút trước' },
  { id: 'n2', kind: 'done', icon: 'CircleCheck', unread: true,
    html: 'Báo cáo <b>năng suất nhân sự VH tháng 4</b> đã hoàn thành và gửi các đơn vị', time: '25 phút trước' },
  { id: 'n3', kind: 'alert', icon: 'BellRing', unread: true,
    html: '<b>3 ticket</b> sắp quá hạn SLA trong 30 phút tới — đội Q.7', time: '1 giờ trước' },
  { id: 'n4', kind: 'task', icon: 'Route', unread: false,
    html: '<b>Chang SCC</b> bắt đầu chạy "Báo cáo SLA tháng 5"', time: '2 giờ trước' },
  { id: 'n5', kind: 'done', icon: 'CircleCheck', unread: false,
    html: 'FAQ tháng 4 đã cập nhật lên SDK — <b>23 mục mới</b>', time: 'Hôm qua' },
]
```

- [ ] **Step 3: `src/data/messages.ts`** (port of the initial thread `proto:697-764` and the `newChat` greeting `proto:1156-1163`)

```ts
import type { Message } from '@/types'

export const GREETING_HTML =
  'Chào anh 👋 Em là <b>Chang SCC</b>. Em hỗ trợ tổng hợp báo cáo SLA, tra cứu ticket vi phạm, cảnh báo quá hạn và soạn email cho các đơn vị. Anh cần em giúp gì ạ?'

export const SEED_MESSAGES: Message[] = [
  { id: 'm1', role: 'bot', time: '09:45', kind: 'text',
    html: 'Chào anh Quang 👋 Em là <b>Chang SCC</b>. Em hỗ trợ tổng hợp báo cáo SLA, tra cứu ticket vi phạm, cảnh báo quá hạn và soạn email cho các đơn vị. Anh cần em giúp gì ạ?' },
  { id: 'm2', role: 'user', time: '09:46', kind: 'text',
    text: 'Tổng hợp giúp anh báo cáo SLA tháng 5 cho 15 đơn vị, gửi anh review trước nhé.' },
  { id: 'm3', role: 'bot', time: '09:47', kind: 'taskInline', showTools: true,
    html: 'Em đã nhận. Em sẽ kéo dữ liệu SLA, tính chỉ số theo từng đơn vị rồi soạn email theo template chuẩn. Em tạo một công việc để anh theo dõi tình trạng nhé:',
    taskInline: { title: 'Báo cáo SLA tháng 5 — 15 đơn vị', meta: 'Đang tính chỉ số cho 2 đơn vị breach', targetTaskId: 't1' } },
  { id: 'm4', role: 'bot', time: '09:49', kind: 'hitl',
    html: 'Em đã soạn xong email cho cả 15 đơn vị. Có <b>2 đơn vị breach SLA</b> cần anh xác nhận nội dung giải trình trước khi gửi:',
    hitl: { title: 'Cần anh duyệt', text: 'Email cho INFMN-KH và FTQ có đính kèm phần giải trình breach. Duyệt để gửi, hoặc mở ra chỉnh sửa.', targetTaskId: 't2' } },
]

export const QUICK_SUGGESTIONS = [
  { icon: 'FileText', label: 'Tổng hợp SLA tháng này' },
  { icon: 'Search', label: 'Tra cứu ticket vi phạm' },
  { icon: 'BellRing', label: 'Cảnh báo quá hạn' },
  { icon: 'Mail', label: 'Soạn email đơn vị' },
]
```

- [ ] **Step 4: Verify type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/data
git commit -m "feat: seed mock data (tasks, notifications, messages)"
```

---

## Task 6: Vitest setup + store skeleton & navigation actions (TDD)

**Files:**
- Create: `vitest.config.ts`, `src/test/setup.ts`, `src/store/useWidgetStore.ts`, `src/store/useWidgetStore.test.ts`

- [ ] **Step 1: `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: { globals: true, environment: 'jsdom', setupFiles: './src/test/setup.ts' },
})
```

- [ ] **Step 2: `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 3: Add test script to `package.json`** — in `"scripts"` add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write the failing navigation test** — `src/store/useWidgetStore.test.ts`

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { useWidgetStore } from './useWidgetStore'

const reset = () => useWidgetStore.getState().__resetForTest()

describe('navigation', () => {
  beforeEach(reset)

  it('starts on the chat tab, not minimized, no detail', () => {
    const s = useWidgetStore.getState()
    expect(s.activeTab).toBe('chat')
    expect(s.minimized).toBe(false)
    expect(s.currentTaskId).toBeNull()
  })

  it('switchTab changes the active tab', () => {
    useWidgetStore.getState().switchTab('noti')
    expect(useWidgetStore.getState().activeTab).toBe('noti')
  })

  it('openTask sets currentTaskId; closeTask clears it', () => {
    useWidgetStore.getState().openTask('t1')
    expect(useWidgetStore.getState().currentTaskId).toBe('t1')
    useWidgetStore.getState().closeTask()
    expect(useWidgetStore.getState().currentTaskId).toBeNull()
  })

  it('openTask ignores unknown ids', () => {
    useWidgetStore.getState().openTask('nope')
    expect(useWidgetStore.getState().currentTaskId).toBeNull()
  })

  it('switching tab while in detail leaves the detail view', () => {
    useWidgetStore.getState().openTask('t1')
    useWidgetStore.getState().switchTab('tasks')
    expect(useWidgetStore.getState().currentTaskId).toBeNull()
  })

  it('pendingTaskCount counts tasks in the pending bucket', () => {
    expect(useWidgetStore.getState().pendingTaskCount()).toBe(2)
  })

  it('filteredTasks returns tasks for the active filter', () => {
    const s = useWidgetStore.getState()
    expect(s.filteredTasks().every((t) => t.bucket.includes('pending'))).toBe(true)
    s.setTaskFilter('done')
    expect(useWidgetStore.getState().filteredTasks().length).toBe(5)
  })
})
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm test -- src/store/useWidgetStore.test.ts`
Expected: FAIL — cannot import `useWidgetStore` (module not found).

- [ ] **Step 6: Implement the store skeleton + navigation** — `src/store/useWidgetStore.ts`

```ts
import { create } from 'zustand'
import type { Message, Notification, Task, TaskFilter, Tab, Theme } from '@/types'
import { SEED_TASKS } from '@/data/tasks'
import { SEED_NOTIFICATIONS } from '@/data/notifications'
import { SEED_MESSAGES } from '@/data/messages'

interface WidgetState {
  activeTab: Tab
  currentTaskId: string | null
  minimized: boolean
  taskFilter: TaskFilter
  historyOpen: boolean
  quickCollapsed: boolean

  messages: Message[]
  isTyping: boolean
  tasks: Task[]
  taskConversations: Record<string, { role: 'user' | 'bot'; text: string; time: string }[]>
  notifications: Notification[]
  theme: Theme

  // navigation
  switchTab: (tab: Tab) => void
  openTask: (id: string) => void
  closeTask: () => void
  setTaskFilter: (f: TaskFilter) => void
  toggleHistory: (open?: boolean) => void
  toggleQuick: () => void
  setMinimized: (m: boolean) => void

  // selectors
  pendingTaskCount: () => number
  unreadNotiCount: () => number
  filteredTasks: () => Task[]

  // chat (Task 7)
  sendChatMessage: (text: string) => void
  newChat: () => void
  approveHitl: (messageId: string) => void
  // task detail (Task 8)
  sendTaskMessage: (taskId: string, text: string) => void
  // notifications (Task 9)
  markNotiRead: (id: string) => void
  markAllNotisRead: () => void
  // theme (Task 9)
  setTheme: (t: Theme) => void
  cycleTheme: () => void

  __resetForTest: () => void
}

const nowTime = () =>
  new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

let idSeq = 1000
const nextId = () => `g${idSeq++}`

const initialConversations = () =>
  Object.fromEntries(SEED_TASKS.map((t) => [t.id, t.convo.map((c) => ({ ...c }))]))

const initialState = () => ({
  activeTab: 'chat' as Tab,
  currentTaskId: null as string | null,
  minimized: false,
  taskFilter: 'pending' as TaskFilter,
  historyOpen: false,
  quickCollapsed: false,
  messages: SEED_MESSAGES.map((m) => ({ ...m })),
  isTyping: false,
  tasks: SEED_TASKS,
  taskConversations: initialConversations(),
  notifications: SEED_NOTIFICATIONS.map((n) => ({ ...n })),
  theme: 'light' as Theme,
})

export const useWidgetStore = create<WidgetState>((set, get) => ({
  ...initialState(),

  switchTab: (tab) => set({ activeTab: tab, currentTaskId: null, historyOpen: false }),
  openTask: (id) => {
    if (!get().tasks.some((t) => t.id === id)) return
    set({ currentTaskId: id, activeTab: 'tasks' })
  },
  closeTask: () => set({ currentTaskId: null }),
  setTaskFilter: (f) => set({ taskFilter: f }),
  toggleHistory: (open) =>
    set((s) => ({ historyOpen: open === undefined ? !s.historyOpen : open })),
  toggleQuick: () => set((s) => ({ quickCollapsed: !s.quickCollapsed })),
  setMinimized: (m) => set({ minimized: m }),

  pendingTaskCount: () => get().tasks.filter((t) => t.bucket.includes('pending')).length,
  unreadNotiCount: () => get().notifications.filter((n) => n.unread).length,
  filteredTasks: () => get().tasks.filter((t) => t.bucket.includes(get().taskFilter)),

  // implemented in later tasks — temporary no-ops so the type is satisfied
  sendChatMessage: () => {},
  newChat: () => {},
  approveHitl: () => {},
  sendTaskMessage: () => {},
  markNotiRead: () => {},
  markAllNotisRead: () => {},
  setTheme: () => {},
  cycleTheme: () => {},

  __resetForTest: () => set(initialState()),
}))

export { nowTime, nextId }
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm test -- src/store/useWidgetStore.test.ts`
Expected: PASS (navigation describe block green).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: zustand store skeleton + navigation (TDD)"
```

---

## Task 7: Store — chat actions (TDD)

**Files:**
- Modify: `src/store/useWidgetStore.ts`, `src/store/useWidgetStore.test.ts`

- [ ] **Step 1: Add failing chat tests** — append to `useWidgetStore.test.ts`

```ts
import { afterEach, vi } from 'vitest'

describe('chat', () => {
  beforeEach(() => { reset(); vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('sendChatMessage appends a user message and shows typing', () => {
    const before = useWidgetStore.getState().messages.length
    useWidgetStore.getState().sendChatMessage('Xin chào')
    const s = useWidgetStore.getState()
    expect(s.messages.length).toBe(before + 1)
    expect(s.messages.at(-1)).toMatchObject({ role: 'user', text: 'Xin chào' })
    expect(s.isTyping).toBe(true)
  })

  it('ignores empty / whitespace-only input', () => {
    const before = useWidgetStore.getState().messages.length
    useWidgetStore.getState().sendChatMessage('   ')
    expect(useWidgetStore.getState().messages.length).toBe(before)
  })

  it('after the delay it appends a bot reply and stops typing', () => {
    useWidgetStore.getState().sendChatMessage('Xin chào')
    vi.advanceTimersByTime(1200)
    const s = useWidgetStore.getState()
    expect(s.isTyping).toBe(false)
    expect(s.messages.at(-1)?.role).toBe('bot')
  })

  it('newChat resets the thread to a single greeting and reopens suggestions', () => {
    useWidgetStore.getState().sendChatMessage('Xin chào')
    useWidgetStore.getState().newChat()
    const s = useWidgetStore.getState()
    expect(s.messages).toHaveLength(1)
    expect(s.messages[0]).toMatchObject({ role: 'bot', kind: 'text' })
    expect(s.quickCollapsed).toBe(false)
    expect(s.historyOpen).toBe(false)
    expect(s.activeTab).toBe('chat')
  })

  it('approveHitl flips the targeted hitl message to approved', () => {
    useWidgetStore.getState().approveHitl('m4')
    const m = useWidgetStore.getState().messages.find((x) => x.id === 'm4')
    expect(m?.hitl?.approved).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify the new tests fail**

Run: `npm test -- src/store/useWidgetStore.test.ts`
Expected: FAIL — `sendChatMessage`/`newChat`/`approveHitl` are no-ops.

- [ ] **Step 3: Implement chat actions** — in `useWidgetStore.ts` replace the three temporary no-ops (`sendChatMessage`, `newChat`, `approveHitl`) with:

```ts
  sendChatMessage: (text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const time = nowTime()
    set((s) => ({
      messages: [...s.messages, { id: nextId(), role: 'user', time, kind: 'text', text: trimmed }],
      isTyping: true,
    }))
    setTimeout(() => {
      set((s) => ({
        isTyping: false,
        messages: [
          ...s.messages,
          {
            id: nextId(), role: 'bot', time: nowTime(), kind: 'text',
            html: 'Em đã nhận yêu cầu và đang xử lý. Em sẽ tạo công việc để anh theo dõi tiến độ và báo lại khi cần anh xác nhận nhé.',
          },
        ],
      }))
    }, 1100)
  },

  newChat: () =>
    set({
      activeTab: 'chat',
      currentTaskId: null,
      historyOpen: false,
      quickCollapsed: false,
      isTyping: false,
      messages: [{ id: nextId(), role: 'bot', time: nowTime(), kind: 'text', html: GREETING_HTML }],
    }),

  approveHitl: (messageId) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId && m.hitl ? { ...m, hitl: { ...m.hitl, approved: true } } : m,
      ),
    })),
```

Add the import at the top (extend the existing messages import):

```ts
import { SEED_MESSAGES, GREETING_HTML } from '@/data/messages'
```

- [ ] **Step 4: Run to verify all store tests pass**

Run: `npm test -- src/store/useWidgetStore.test.ts`
Expected: PASS (navigation + chat blocks green).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: store chat actions — send/typing/newChat/approveHitl (TDD)"
```

---

## Task 8: Store — task-detail conversation (TDD)

**Files:**
- Modify: `src/store/useWidgetStore.ts`, `src/store/useWidgetStore.test.ts`

- [ ] **Step 1: Add failing test** — append to `useWidgetStore.test.ts`

```ts
describe('task conversation', () => {
  beforeEach(() => { reset(); vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('appends the user question immediately', () => {
    const before = useWidgetStore.getState().taskConversations['t1'].length
    useWidgetStore.getState().sendTaskMessage('t1', 'Việc đến đâu rồi?')
    expect(useWidgetStore.getState().taskConversations['t1'].length).toBe(before + 1)
    expect(useWidgetStore.getState().taskConversations['t1'].at(-1)).toMatchObject({ role: 'user', text: 'Việc đến đâu rồi?' })
  })

  it('adds a status bot reply after the delay (in-progress task)', () => {
    useWidgetStore.getState().sendTaskMessage('t1', 'Khi nào xong?')
    vi.advanceTimersByTime(1000)
    const last = useWidgetStore.getState().taskConversations['t1'].at(-1)
    expect(last?.role).toBe('bot')
    expect(last?.text.toLowerCase()).toContain('cập nhật mới nhất')
  })

  it('done tasks get a completed-style reply', () => {
    useWidgetStore.getState().sendTaskMessage('t4', 'Xong chưa em?')
    vi.advanceTimersByTime(1000)
    const last = useWidgetStore.getState().taskConversations['t4'].at(-1)
    expect(last?.text).toContain('đã hoàn thành')
  })

  it('ignores empty input', () => {
    const before = useWidgetStore.getState().taskConversations['t1'].length
    useWidgetStore.getState().sendTaskMessage('t1', '  ')
    expect(useWidgetStore.getState().taskConversations['t1'].length).toBe(before)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/store/useWidgetStore.test.ts`
Expected: FAIL — `sendTaskMessage` is a no-op.

- [ ] **Step 3: Implement** — replace the `sendTaskMessage` no-op in `useWidgetStore.ts` with (logic ported from `proto:1116-1133`):

```ts
  sendTaskMessage: (taskId, text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const task = get().tasks.find((t) => t.id === taskId)
    const time = nowTime()
    set((s) => ({
      taskConversations: {
        ...s.taskConversations,
        [taskId]: [...(s.taskConversations[taskId] ?? []), { role: 'user', text: trimmed, time }],
      },
    }))
    const reply =
      task && task.status === 'done'
        ? `Công việc này đã hoàn thành rồi ạ. ${task.lastUpdate}. Anh cần em gửi lại kết quả không ạ?`
        : `Cập nhật mới nhất: ${task ? task.lastUpdate.toLowerCase() : 'đang xử lý'}. Em sẽ báo ngay khi có tiến triển mới ạ.`
    setTimeout(() => {
      set((s) => ({
        taskConversations: {
          ...s.taskConversations,
          [taskId]: [...(s.taskConversations[taskId] ?? []), { role: 'bot', text: reply, time: nowTime() }],
        },
      }))
    }, 900)
  },
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- src/store/useWidgetStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: store task-detail status conversation (TDD)"
```

---

## Task 9: Store — notifications + theme (TDD)

**Files:**
- Modify: `src/store/useWidgetStore.ts`, `src/store/useWidgetStore.test.ts`

- [ ] **Step 1: Add failing test** — append to `useWidgetStore.test.ts`

```ts
describe('notifications + theme', () => {
  beforeEach(reset)

  it('seed has 3 unread', () => {
    expect(useWidgetStore.getState().unreadNotiCount()).toBe(3)
  })

  it('markNotiRead clears one', () => {
    useWidgetStore.getState().markNotiRead('n1')
    expect(useWidgetStore.getState().unreadNotiCount()).toBe(2)
  })

  it('markAllNotisRead clears all', () => {
    useWidgetStore.getState().markAllNotisRead()
    expect(useWidgetStore.getState().unreadNotiCount()).toBe(0)
  })

  it('setTheme + cycleTheme toggle the theme', () => {
    useWidgetStore.getState().setTheme('dark')
    expect(useWidgetStore.getState().theme).toBe('dark')
    useWidgetStore.getState().cycleTheme()
    expect(useWidgetStore.getState().theme).toBe('light')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/store/useWidgetStore.test.ts`
Expected: FAIL — noti/theme actions are no-ops.

- [ ] **Step 3: Implement** — replace the `markNotiRead`, `markAllNotisRead`, `setTheme`, `cycleTheme` no-ops:

```ts
  markNotiRead: (id) =>
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)) })),
  markAllNotisRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, unread: false })) })),

  setTheme: (t) => {
    applyTheme(t)
    set({ theme: t })
  },
  cycleTheme: () => {
    const next: Theme = get().theme === 'light' ? 'dark' : 'light'
    applyTheme(next)
    set({ theme: next })
  },
```

Add this helper above `export const useWidgetStore` (persists + applies the `.dark` class; guarded for non-DOM test env):

```ts
const THEME_KEY = 'chang-theme'
function applyTheme(t: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', t === 'dark')
  try { localStorage.setItem(THEME_KEY, t) } catch { /* ignore */ }
}
export function loadInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const saved = (() => { try { return localStorage.getItem(THEME_KEY) } catch { return null } })()
  const t: Theme = saved === 'dark' ? 'dark' : 'light'
  applyTheme(t)
  return t
}
```

- [ ] **Step 4: Run to verify all store tests pass**

Run: `npm test`
Expected: PASS (all describe blocks green).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: store notifications + theme actions (TDD)"
```

---

## Task 10: Theme bootstrap in entry point

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Replace `src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { loadInitialTheme, useWidgetStore } from '@/store/useWidgetStore'

useWidgetStore.setState({ theme: loadInitialTheme() })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/main.tsx
git commit -m "feat: bootstrap theme from localStorage on startup"
```

---

## Task 11: Shell — shared components, App, Stage, Launcher, ChangWidget, Header, TabBar (+ smoke test)

**Files:**
- Create: `src/components/shared/StatusBadge.tsx`, `src/components/shared/Chip.tsx`, `src/components/Stage.tsx`, `src/components/Launcher.tsx`, `src/components/ChangWidget.tsx`, `src/components/Header.tsx`, `src/components/TabBar.tsx`, `src/components/TabBar.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: `src/components/shared/StatusBadge.tsx`** (status pill, ports `proto:430-439`)

```tsx
import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/types'
import { STATUS_LABEL } from '@/data/tasks'

const TONE: Record<TaskStatus, string> = {
  pending: 'bg-status-pending/15 text-status-pending',
  running: 'bg-status-running/15 text-status-running',
  done: 'bg-status-done/15 text-status-done',
  watch: 'bg-muted text-muted-foreground',
}

export function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap', TONE[status], className)}>
      {STATUS_LABEL[status]}
    </span>
  )
}
```

- [ ] **Step 2: `src/components/shared/Chip.tsx`** (pill button, ports `proto:220-229`)

```tsx
import { cn } from '@/lib/utils'

export function Chip({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5',
        'text-[12.5px] font-medium text-muted-foreground transition-colors',
        'hover:border-primary hover:text-primary hover:bg-primary/10',
        className,
      )}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 3: `src/components/Header.tsx`** (ports `proto:660-674`; glass + violet gradient retained)

```tsx
import { Bot, History, Minus, Moon, SquarePen } from 'lucide-react'
import { useWidgetStore } from '@/store/useWidgetStore'

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
    <button type="button" title={title} onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-[9px] text-white/90 transition-colors hover:bg-white/15 hover:text-white ${className}`}>
      {children}
    </button>
  )
}
```

- [ ] **Step 4: `src/components/TabBar.tsx`** (ports `proto:880-890`)

```tsx
import { MessageCircle, ListChecks, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import type { Tab } from '@/types'

const TABS: { id: Tab; label: string; Icon: typeof Bell }[] = [
  { id: 'chat', label: 'Trò chuyện', Icon: MessageCircle },
  { id: 'tasks', label: 'Công việc', Icon: ListChecks },
  { id: 'noti', label: 'Thông báo', Icon: Bell },
]

export function TabBar() {
  const { activeTab, currentTaskId, switchTab, pendingTaskCount, unreadNotiCount } = useWidgetStore()
  // detail view keeps the Tasks tab highlighted
  const highlight: Tab = currentTaskId ? 'tasks' : activeTab
  const badge: Partial<Record<Tab, number>> = { tasks: pendingTaskCount(), noti: unreadNotiCount() }

  return (
    <div className="flex flex-shrink-0 border-t border-border/60 bg-background/40 px-1 py-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] backdrop-blur">
      {TABS.map(({ id, label, Icon }) => {
        const count = badge[id]
        return (
          <button key={id} type="button" onClick={() => switchTab(id)}
            className={cn('relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 font-semibold',
              highlight === id ? 'text-primary' : 'text-muted-foreground')}>
            <span className="relative inline-flex">
              <Icon className="h-[21px] w-[21px]" />
              {!!count && (
                <span className="absolute -top-1.5 left-full -ml-2 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-background bg-[hsl(var(--status-alert))] px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </span>
            <span className="text-[10px]">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 5: `src/components/ChangWidget.tsx`** (shell, ports `proto:118-134`, `657-891`; panels imported in later tasks — import them now so wiring is complete)

```tsx
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
```

- [ ] **Step 6: `src/components/Launcher.tsx`** (ports `proto:137-153`, `650-654`)

```tsx
import { MessageCircle } from 'lucide-react'
import { useWidgetStore } from '@/store/useWidgetStore'

export function Launcher() {
  const { minimized, setMinimized } = useWidgetStore()
  if (!minimized) return null
  return (
    <button type="button" onClick={() => setMinimized(false)}
      className="fixed bottom-6 right-6 z-20 hidden h-[60px] w-[60px] items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 sm:flex max-[480px]:!hidden"
      style={{ background: 'linear-gradient(135deg, hsl(var(--header-grad-a)), hsl(var(--header-grad-b)))' }}>
      <MessageCircle className="h-6 w-6" />
      <span className="absolute right-3 top-3 h-3 w-3 rounded-full border-2 border-white bg-[hsl(var(--status-alert))]" />
    </button>
  )
}
```

- [ ] **Step 7: `src/components/Stage.tsx`** (host page sim, ports `proto:89-113`, `640-648`)

```tsx
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'

export function Stage({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useWidgetStore()
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: 'var(--stage-grad)' }}>
      <div className="absolute left-6 top-5 flex items-center gap-3.5 text-xs text-muted-foreground max-[480px]:hidden">
        <span><b className="font-semibold text-foreground/80">Demo host page</b> — webview nhúng góc phải</span>
        <div className="glass flex items-center gap-1.5 rounded-full p-1">
          {(['light', 'dark'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTheme(t)}
              className={cn('rounded-full px-3 py-1.5 text-xs font-semibold',
                theme === t ? 'bg-primary text-white' : 'text-muted-foreground')}>
              {t === 'light' ? 'Sáng' : 'Tối'}
            </button>
          ))}
        </div>
      </div>
      {children}
    </div>
  )
}
```

- [ ] **Step 8: Replace `src/App.tsx`**

```tsx
import { Stage } from './components/Stage'
import { Launcher } from './components/Launcher'
import { ChangWidget } from './components/ChangWidget'

export default function App() {
  return (
    <Stage>
      <ChangWidget />
      <Launcher />
    </Stage>
  )
}
```

- [ ] **Step 9: Write the TabBar smoke test** — `src/components/TabBar.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it } from 'vitest'
import { TabBar } from './TabBar'
import { useWidgetStore } from '@/store/useWidgetStore'

beforeEach(() => useWidgetStore.getState().__resetForTest())

it('clicking the Thông báo tab switches the active tab', async () => {
  render(<TabBar />)
  await userEvent.click(screen.getByText('Thông báo'))
  expect(useWidgetStore.getState().activeTab).toBe('noti')
})

it('shows the pending task badge (2) and unread noti badge (3)', () => {
  render(<TabBar />)
  expect(screen.getByText('2')).toBeInTheDocument()
  expect(screen.getByText('3')).toBeInTheDocument()
})
```

> NOTE: Steps 5 and 8 import panels created in Tasks 12–15. Implement Task 11 through Task 15 as a group before running the full build; the TabBar test (Step 10) does not import those panels and can run immediately.

- [ ] **Step 10: Run the TabBar test**

Run: `npm test -- src/components/TabBar.test.tsx`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: widget shell — Stage, Launcher, Header, TabBar, ChangWidget (+ smoke test)"
```

---

## Task 12: Chat panel

**Files:**
- Create: `src/components/shared/MessageBubble.tsx`, `src/components/chat/ChatPanel.tsx`, `QuickSuggestions.tsx`, `MessageList.tsx`, `TaskInlineCard.tsx`, `HitlCard.tsx`, `TypingIndicator.tsx`, `Composer.tsx`, `HistoryDrawer.tsx`

- [ ] **Step 1: `src/components/shared/MessageBubble.tsx`** (shared by chat + detail, ports `proto:234-265`, `1136-1143`). User text renders as plain text (auto-escaped); bot `html` renders pre-authored markup.

```tsx
import { Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Role } from '@/types'

export function MessageBubble({
  role, time, text, html, children,
}: { role: Role; time?: string; text?: string; html?: string; children?: React.ReactNode }) {
  const isUser = role === 'user'
  return (
    <div className={cn('flex max-w-full gap-2.5', isUser && 'flex-row-reverse')}>
      <div className={cn('flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] text-white',
        isUser ? 'bg-muted text-muted-foreground' : '')}
        style={isUser ? undefined : { background: 'linear-gradient(135deg, hsl(var(--header-grad-a)), hsl(var(--header-grad-b)))' }}>
        {isUser ? <User className="h-[15px] w-[15px]" /> : <Bot className="h-[15px] w-[15px]" />}
      </div>
      <div className={cn('flex max-w-[78%] flex-col gap-0.5', isUser && 'items-end')}>
        <div className={cn('rounded-[14px] px-3 py-2.5 text-[13.5px] leading-relaxed break-words',
          isUser ? 'rounded-br-[4px] bg-primary text-primary-foreground'
                 : 'glass rounded-bl-[4px] text-[hsl(var(--bubble-bot-text))]')}>
          {html ? <span dangerouslySetInnerHTML={{ __html: html }} /> : text}
          {children}
        </div>
        {time && <div className="px-1 text-[10.5px] text-muted-foreground">{time}</div>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `src/components/chat/TaskInlineCard.tsx`** (ports `proto:724-735`)

```tsx
import { Route, ArrowRight } from 'lucide-react'
import { useWidgetStore } from '@/store/useWidgetStore'
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
      <button type="button" onClick={() => openTask(payload.targetTaskId)}
        className="flex w-full items-center justify-between border-t border-border px-3 py-2.5 text-[12.5px] font-semibold text-primary hover:bg-primary/10">
        <span>Mở trong Công việc</span><ArrowRight className="h-[15px] w-[15px]" />
      </button>
    </div>
  )
}
```

- [ ] **Step 3: `src/components/chat/HitlCard.tsx`** (ports `proto:752-759`, `1209-1214`)

```tsx
import { TriangleAlert, Check } from 'lucide-react'
import { useWidgetStore } from '@/store/useWidgetStore'
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
        <button type="button" onClick={() => approveHitl(messageId)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[9px] bg-status-done py-2 text-[12.5px] font-semibold text-white">
          <Check className="h-[15px] w-[15px]" /> Duyệt &amp; gửi
        </button>
        <button type="button" onClick={() => openTask(payload.targetTaskId)}
          className="flex-1 rounded-[9px] border border-border bg-background/60 py-2 text-[12.5px] font-semibold text-muted-foreground">
          Xem chi tiết
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: `src/components/chat/TypingIndicator.tsx`** (ports `proto:317-320`)

```tsx
import { Bot } from 'lucide-react'

export function TypingIndicator() {
  return (
    <div className="flex max-w-full gap-2.5">
      <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] text-white"
        style={{ background: 'linear-gradient(135deg, hsl(var(--header-grad-a)), hsl(var(--header-grad-b)))' }}>
        <Bot className="h-[15px] w-[15px]" />
      </div>
      <div className="glass flex items-center gap-1 rounded-[14px] rounded-bl-[4px] px-3.5 py-3">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-[7px] w-[7px] animate-blink rounded-full bg-muted-foreground"
            style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: `src/components/chat/MessageList.tsx`** (renders messages + typing; ports `proto:695-765`)

```tsx
import { useEffect, useRef } from 'react'
import { Copy, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useWidgetStore } from '@/store/useWidgetStore'
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
          <MessageBubble key={m.id} role={m.role} time={m.time} text={m.text} html={m.html}>
            {m.kind === 'taskInline' && m.taskInline && <TaskInlineCard payload={m.taskInline} />}
            {m.kind === 'hitl' && m.hitl && <HitlCard messageId={m.id} payload={m.hitl} />}
            {m.showTools && (
              <div className="mt-1 flex gap-0.5">
                {[Copy, ThumbsUp, ThumbsDown].map((Icon, i) => (
                  <button key={i} type="button" className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                    <Icon className="h-[15px] w-[15px]" />
                  </button>
                ))}
              </div>
            )}
          </MessageBubble>
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={endRef} />
      </div>
    </div>
  )
}
```

> The bot tool-row buttons are visual-only in the prototype (`proto:737-741`) — no handlers.

- [ ] **Step 6: `src/components/chat/QuickSuggestions.tsx`** (ports `proto:682-692`, icons from `QUICK_SUGGESTIONS`)

```tsx
import { ChevronUp, FileText, Search, BellRing, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import { QUICK_SUGGESTIONS } from '@/data/messages'
import { Chip } from '../shared/Chip'

const ICONS = { FileText, Search, BellRing, Mail } as const

export function QuickSuggestions() {
  const { quickCollapsed, toggleQuick, sendChatMessage } = useWidgetStore()
  return (
    <div className="flex-shrink-0 border-b border-border/60">
      <button type="button" onClick={toggleQuick}
        className="flex w-full items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-primary">
        <span>Gợi ý nhanh</span>
        <ChevronUp className={cn('h-3.5 w-3.5 transition-transform', quickCollapsed && 'rotate-180')} />
      </button>
      <div className={cn('flex flex-wrap gap-2 overflow-hidden px-3.5 transition-all', quickCollapsed ? 'max-h-0 pb-0 opacity-0' : 'max-h-52 pb-3 opacity-100')}>
        {QUICK_SUGGESTIONS.map(({ icon, label }) => {
          const Icon = ICONS[icon as keyof typeof ICONS]
          return (
            <Chip key={label} onClick={() => sendChatMessage(label)}>
              <Icon className="h-[15px] w-[15px]" />{label}
            </Chip>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: `src/components/chat/Composer.tsx`** (shared composer; ports `proto:768-775`)

```tsx
import { useState } from 'react'
import { Paperclip, Mic, Send } from 'lucide-react'

export function Composer({ placeholder, onSend }: { placeholder: string; onSend: (text: string) => void }) {
  const [value, setValue] = useState('')
  const submit = () => { const t = value.trim(); if (!t) return; onSend(t); setValue('') }
  return (
    <div className="flex-shrink-0 border-t border-border/60 px-3 py-2">
      <div className="flex items-end gap-2 rounded-[14px] border border-border bg-muted/60 py-1 pl-2.5 pr-1.5 focus-within:border-primary">
        <button type="button" title="Đính kèm" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] text-muted-foreground hover:bg-muted">
          <Paperclip className="h-[19px] w-[19px]" />
        </button>
        <textarea
          rows={1}
          value={value}
          placeholder={placeholder}
          onChange={(e) => { setValue(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 90)}px` }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
          className="max-h-[90px] flex-1 resize-none bg-transparent py-1.5 text-[13.5px] outline-none placeholder:text-muted-foreground"
        />
        <button type="button" title="Nhập bằng giọng nói" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] text-muted-foreground hover:bg-muted">
          <Mic className="h-[19px] w-[19px]" />
        </button>
        <button type="button" title="Gửi" onClick={submit} className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] bg-primary text-white hover:opacity-90">
          <Send className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: `src/components/chat/HistoryDrawer.tsx`** (ports `proto:777-828`; static list seeded inline)

```tsx
import { ArrowLeft, SquarePen, Search, MessageSquare, Pin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'

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
        <IconBtn onClick={() => toggleHistory(false)}><ArrowLeft className="h-[19px] w-[19px]" /></IconBtn>
        <div className="flex-1 text-[15px] font-bold">Lịch sử hội thoại</div>
        <IconBtn onClick={newChat}><SquarePen className="h-[19px] w-[19px]" /></IconBtn>
      </div>
      <div className="mx-3.5 mb-1 mt-3 flex items-center gap-2 rounded-[10px] border border-border bg-muted/60 px-2.5 py-2">
        <Search className="h-[17px] w-[17px] text-muted-foreground" />
        <input className="flex-1 bg-transparent text-[13px] outline-none" placeholder="Tìm trong hội thoại…" />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <Group title="Đã ghim" items={PINNED} Icon={Pin} onPick={() => toggleHistory(false)} />
        <Group title="Hôm nay" items={TODAY} Icon={MessageSquare} onPick={() => toggleHistory(false)} />
        <Group title="7 ngày qua" items={WEEK} Icon={MessageSquare} onPick={() => toggleHistory(false)} />
      </div>
    </div>
  )
}

function IconBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex h-8 w-8 items-center justify-center rounded-[9px] text-muted-foreground hover:bg-muted">{children}</button>
}
function Group({ title, items, Icon, onPick }: { title: string; items: { title: string; snip: string }[]; Icon: typeof Pin; onPick: () => void }) {
  return (
    <>
      <div className="px-4 pb-1.5 pt-3.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      {items.map((it) => (
        <button key={it.title} type="button" onClick={onPick} className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left hover:bg-muted">
          <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium">{it.title}</div>
            <div className="mt-0.5 truncate text-[12px] text-muted-foreground">{it.snip}</div>
          </div>
        </button>
      ))}
    </>
  )
}
```

- [ ] **Step 9: `src/components/chat/ChatPanel.tsx`** (composes the chat tab; ports `proto:680-829`)

```tsx
import { useWidgetStore } from '@/store/useWidgetStore'
import { QuickSuggestions } from './QuickSuggestions'
import { MessageList } from './MessageList'
import { Composer } from './Composer'
import { HistoryDrawer } from './HistoryDrawer'

export function ChatPanel() {
  const sendChatMessage = useWidgetStore((s) => s.sendChatMessage)
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <QuickSuggestions />
      <MessageList />
      <Composer placeholder="Nhắn cho Chang…" onSend={sendChatMessage} />
      <HistoryDrawer />
    </div>
  )
}
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: chat panel (messages, quick suggestions, composer, history, HITL, task-inline)"
```

---

## Task 13: Tasks panel (+ smoke test)

**Files:**
- Create: `src/components/tasks/TasksPanel.tsx`, `SubTabs.tsx`, `TaskCard.tsx`, `EmptyState.tsx`, `src/components/tasks/TaskCard.test.tsx`

- [ ] **Step 1: `src/components/tasks/EmptyState.tsx`** (ports `proto:986-991`)

```tsx
import { ClipboardCheck } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-10 text-center text-muted-foreground">
      <ClipboardCheck className="h-11 w-11 opacity-50" />
      <div className="text-[14px] font-semibold text-foreground/70">Chưa có công việc</div>
      <div className="max-w-[240px] text-[12.5px]">Giao việc cho Chang trong tab Trò chuyện, công việc sẽ xuất hiện ở đây.</div>
    </div>
  )
}
```

- [ ] **Step 2: `src/components/tasks/SubTabs.tsx`** (ports `proto:833-838`; counts from data)

```tsx
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
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
        <button key={id} type="button" onClick={() => setTaskFilter(id)}
          className={cn('whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] font-semibold',
            taskFilter === id ? 'bg-primary/15 text-primary' : 'text-muted-foreground')}>
          {label}<span className="ml-1 opacity-70">{count(id)}</span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: `src/components/tasks/TaskCard.tsx`** (ports `proto:994-1011`)

```tsx
import { Route, Sparkles, Bot, Clock, Activity } from 'lucide-react'
import { useWidgetStore } from '@/store/useWidgetStore'
import { StatusBadge } from '../shared/StatusBadge'
import type { Task } from '@/types'

export function TaskCard({ task }: { task: Task }) {
  const openTask = useWidgetStore((s) => s.openTask)
  const TypeIcon = task.type === 'workflow' ? Route : Sparkles
  const typeTone = task.type === 'workflow' ? 'bg-status-running/10 text-status-running' : 'bg-primary/10 text-primary'
  return (
    <button type="button" onClick={() => openTask(task.id)}
      className="glass w-full rounded-[14px] p-3 text-left transition-shadow hover:shadow-md">
      <div className="flex items-start gap-2.5">
        <div className={`flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px] ${typeTone}`}>
          <TypeIcon className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold leading-tight">{task.name}</div>
          <div className="mt-1 flex flex-wrap gap-2 text-[11.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Bot className="h-[13px] w-[13px]" />{task.by}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-[13px] w-[13px]" />{task.time}</span>
          </div>
        </div>
        <StatusBadge status={task.status} />
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 border-t border-border/60 pt-2.5 text-muted-foreground">
        <Activity className="h-[15px] w-[15px] flex-shrink-0 text-muted-foreground" />
        <div className="truncate text-[12px]">{task.lastUpdate}</div>
      </div>
    </button>
  )
}
```

- [ ] **Step 4: `src/components/tasks/TasksPanel.tsx`** (ports `proto:832-842`, `983-1012`)

```tsx
import { useWidgetStore } from '@/store/useWidgetStore'
import { SubTabs } from './SubTabs'
import { TaskCard } from './TaskCard'
import { EmptyState } from './EmptyState'

export function TasksPanel() {
  const tasks = useWidgetStore((s) => s.filteredTasks())
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <SubTabs />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {tasks.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-2.5 p-3">
            {tasks.map((t) => <TaskCard key={t.id} task={t} />)}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write the smoke test** — `src/components/tasks/TaskCard.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it } from 'vitest'
import { TaskCard } from './TaskCard'
import { SEED_TASKS } from '@/data/tasks'
import { useWidgetStore } from '@/store/useWidgetStore'

beforeEach(() => useWidgetStore.getState().__resetForTest())

it('clicking a task card opens its detail view', async () => {
  render(<TaskCard task={SEED_TASKS[0]} />)
  await userEvent.click(screen.getByText(SEED_TASKS[0].name))
  expect(useWidgetStore.getState().currentTaskId).toBe('t1')
})
```

- [ ] **Step 6: Run the test**

Run: `npm test -- src/components/tasks/TaskCard.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: tasks panel (sub-tabs, task cards, empty state) + smoke test"
```

---

## Task 14: Task detail panel

**Files:**
- Create: `src/components/tasks/TaskDetailPanel.tsx`

- [ ] **Step 1: `src/components/tasks/TaskDetailPanel.tsx`** (ports `proto:844-864`, `1055-1133`)

```tsx
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Bot, FileText, Lightbulb, ChevronDown, Activity, CircleCheck, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import { StatusBadge } from '../shared/StatusBadge'
import { MessageBubble } from '../shared/MessageBubble'
import { Composer } from '../chat/Composer'
import { Chip } from '../shared/Chip'

const SUGGESTIONS = ['Việc đến đâu rồi?', 'Khi nào xong?', 'Có vướng gì không?']

export function TaskDetailPanel() {
  const { tasks, currentTaskId, closeTask, taskConversations, sendTaskMessage } = useWidgetStore()
  const task = tasks.find((t) => t.id === currentTaskId)
  const [infoCollapsed, setInfoCollapsed] = useState(false)
  const convo = currentTaskId ? taskConversations[currentTaskId] ?? [] : []
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [convo.length])
  if (!task) return null

  const latestTone = task.status === 'done' ? 'bg-status-done/10 text-status-done'
    : task.status === 'running' ? 'bg-status-running/10 text-status-running'
    : 'bg-status-pending/10 text-status-pending'

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center gap-2.5 border-b border-border/60 px-3 py-3">
        <button type="button" onClick={closeTask} title="Quay lại" className="flex h-8 w-8 items-center justify-center rounded-[9px] text-muted-foreground hover:bg-muted">
          <ArrowLeft className="h-[19px] w-[19px]" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-bold leading-tight">{task.name}</div>
          <div className="mt-0.5 flex items-center gap-1 text-[11.5px] text-muted-foreground"><Bot className="h-[13px] w-[13px]" />{task.by}</div>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3.5 pb-1.5 pt-3.5">
        {/* collapsible info cluster */}
        <div className="mb-4 overflow-hidden rounded-[14px] border border-border">
          <button type="button" onClick={() => setInfoCollapsed((v) => !v)}
            className="flex w-full items-center gap-2 bg-muted/40 px-3 py-2.5 text-[12.5px] font-semibold text-muted-foreground">
            <FileText className="h-4 w-4" /> Thông tin công việc
            <ChevronDown className={cn('ml-auto h-4 w-4 transition-transform', infoCollapsed && '-rotate-90')} />
          </button>
          {!infoCollapsed && (
            <div className="flex flex-col">
              <div className="border-t border-border p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary"><FileText className="h-3.5 w-3.5" /> Tóm tắt</div>
                <div className="text-[13px] leading-relaxed text-muted-foreground">{task.summary}</div>
              </div>
              <div className="border-t border-border p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-status-running"><Lightbulb className="h-3.5 w-3.5" /> Chang đang làm gì</div>
                <div className="text-[13px] leading-relaxed text-muted-foreground">{task.thinking}</div>
              </div>
            </div>
          )}
        </div>

        {/* latest status strip */}
        <div className="mb-[18px] flex items-start gap-2.5 rounded-[14px] border border-border bg-muted/40 p-3">
          <div className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px]', latestTone)}>
            {task.status === 'done' ? <CircleCheck className="h-[17px] w-[17px]" /> : <Activity className="h-[17px] w-[17px]" />}
          </div>
          <div>
            <div className="mb-0.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">Cập nhật mới nhất</div>
            <div className="text-[13px] leading-snug">{task.lastUpdate}</div>
          </div>
        </div>

        {/* status Q&A */}
        <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" /> Hỏi Chang về tình trạng công việc
        </div>
        <div className="flex flex-col gap-3">
          {convo.map((m, i) => <MessageBubble key={i} role={m.role} time={m.time} text={m.text} />)}
        </div>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => <Chip key={s} onClick={() => sendTaskMessage(task.id, s)}>{s}</Chip>)}
        </div>
        <div ref={endRef} />
      </div>

      <Composer placeholder="Trao đổi thêm về công việc này…" onSend={(t) => sendTaskMessage(task.id, t)} />
    </div>
  )
}
```

- [ ] **Step 2: Verify type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: task detail panel (info cluster, latest status, status Q&A)"
```

---

## Task 15: Notifications panel

**Files:**
- Create: `src/components/noti/NotificationsPanel.tsx`, `src/components/noti/NotificationItem.tsx`

- [ ] **Step 1: `src/components/noti/NotificationItem.tsx`** (ports `proto:1014-1023`, `473-498`; lucide icon resolved by name)

```tsx
import { Route, CircleCheck, TriangleAlert, BellRing, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import type { Notification, NotiKind } from '@/types'

const ICONS: Record<string, LucideIcon> = { Route, CircleCheck, TriangleAlert, BellRing }
const TONE: Record<NotiKind, string> = {
  task: 'bg-status-running/10 text-status-running',
  done: 'bg-status-done/10 text-status-done',
  hitl: 'bg-status-pending/10 text-status-pending',
  alert: 'bg-[hsl(var(--status-alert))]/10 text-[hsl(var(--status-alert))]',
}

export function NotificationItem({ noti }: { noti: Notification }) {
  const markNotiRead = useWidgetStore((s) => s.markNotiRead)
  const Icon = ICONS[noti.icon] ?? BellRing
  return (
    <button type="button" onClick={() => markNotiRead(noti.id)}
      className="relative flex w-full items-start gap-2.5 border-b border-border/60 px-4 py-3 text-left hover:bg-muted">
      {noti.unread && <span className="absolute left-1.5 top-[18px] h-[7px] w-[7px] rounded-full bg-primary" />}
      <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]', TONE[noti.kind])}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] leading-snug" dangerouslySetInnerHTML={{ __html: noti.html }} />
        <div className="mt-0.5 text-[11px] text-muted-foreground">{noti.time}</div>
      </div>
    </button>
  )
}
```

- [ ] **Step 2: `src/components/noti/NotificationsPanel.tsx`** (ports `proto:867-875`, `1014-1023`)

```tsx
import { useWidgetStore } from '@/store/useWidgetStore'
import { NotificationItem } from './NotificationItem'

export function NotificationsPanel() {
  const { notifications, markAllNotisRead } = useWidgetStore()
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between px-3.5 pb-2 pt-3">
        <div className="text-[14px] font-bold">Thông báo</div>
        <button type="button" onClick={markAllNotisRead} className="text-[12px] font-semibold text-primary">Đánh dấu đã đọc</button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin pb-3">
        {notifications.map((n) => <NotificationItem key={n.id} noti={n} />)}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify build (full app now compiles)**

Run: `npm run build`
Expected: success — all panel imports in `ChangWidget` resolve.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: notifications panel"
```

---

## Task 16: Full verification & cleanup

**Files:**
- Modify: `src/App.css` (delete), `src/index.css` (already done), remove unused scaffold assets

- [ ] **Step 1: Remove leftover Vite scaffold styles/assets**

```bash
rm -f src/App.css src/assets/react.svg public/vite.svg
```

Ensure no file imports `./App.css` (the new `App.tsx` from Task 11 does not).

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: all store + component tests PASS.

- [ ] **Step 3: Type-check + production build**

Run: `npx tsc --noEmit && npm run build`
Expected: no type errors; build succeeds.

- [ ] **Step 4: Manual smoke check in the browser**

Run: `npm run dev`
Open the printed URL and verify against the prototype:
- Glass widget bottom-right over the violet gradient stage; Sáng/Tối toggle and header theme button both switch theme (and the choice survives reload).
- Chat: quick suggestions collapse; sending a message shows typing then a bot reply; "Duyệt & gửi" flips the HITL card to the green approved state; task-inline "Mở trong Công việc" opens detail.
- New chat + history drawer open/close; new chat resets the thread.
- Tasks: sub-tab filters change the list and show counts; empty state appears for a filter with no items (none in seed — verify by temporarily switching filters); a card opens detail; detail info cluster collapses; suggestion chips post a status reply; back returns to the list.
- Notifications: unread dots; clicking one clears its dot and decrements the tab badge; "Đánh dấu đã đọc" clears all.
- Minimize → launcher bubble (desktop); restore from launcher. Resize below 480px → full-screen, no launcher/minimize, stage hint hidden.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove scaffold leftovers; final verification"
```

---

## Self-Review Notes (completed)

- **Spec coverage:** stack (T1–T3), theme tokens + glass + enriched backdrop (T2, T7/Stage), types (T4), mock data (T5), Zustand store with all actions/selectors (T6–T9), theme persistence (T9–T10), shadcn primitives (T3), full component tree incl. demo stage/launcher/mobile (T11–T15), every 1:1 behavior from spec §5 (T6–T15), testing (T6–T9, T11, T13), error handling — unknown task id / empty input / escaping (T6, T7, T8, MessageBubble) — all mapped to tasks.
- **Placeholders:** none — every code/test step has full content.
- **Type consistency:** action names (`sendChatMessage`, `newChat`, `approveHitl`, `sendTaskMessage`, `markNotiRead`, `markAllNotisRead`, `setTheme`, `cycleTheme`), selectors (`pendingTaskCount`, `unreadNotiCount`, `filteredTasks`), and types (`Message`, `Task`, `Notification`, `Tab`, `Theme`, `TaskInlinePayload`, `HitlPayload`) are defined in T4/T6 and used consistently in T11–T15.
- **Known sequencing note:** `ChangWidget` (T11) imports panels built in T12–T15, so the full `npm run build` only passes after T15 — called out explicitly in T11 Step 9; intermediate per-task tests/tsc target only their own files.
