# host-demo Chatbot Iframe Embedding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone React + Vite "host" demo app that embeds the FTEL chatbot widget via iframe, passing a hardcoded `tenantId` (env constant) into the widget — reproducing the `aichatbot-cms` integration 1:1.

**Architecture:** A mock portal page (`App.tsx`) renders a `ChatbotWidget` React component that outputs the `#chatbot-root` markup (bubble iframe + dialog iframe) pointing at `VITE_APP_CHATBOT_URL`. The cross-frame message relay/orchestration is kept as **vanilla JS in `index.html`**, ported verbatim from the CMS, using Vite's native `%VITE_APP_CHATBOT_URL%` HTML env replacement. No auth, no API calls.

**Tech Stack:** React 19, Vite, TypeScript, plain CSS.

## Global Constraints

- Project location: `/Users/nghiepbui/Desktop/FTEL/Web/host-demo` (sibling of `aichatbot-cms`).
- Dev server port: Vite default **5173** (must not clash with CMS:3000 or widget:9000).
- `tenantId` comes ONLY from `VITE_TENANT_ID`; chatbot URL ONLY from `VITE_APP_CHATBOT_URL`.
- The message relay lives in `index.html` as vanilla JS — NOT in a React hook/`useEffect`.
- Dialog iframe URL must be exactly: `${chatbotUrl}/ai-agent/sdk/?tenant_id=<id>&isCustomBotInfo=true&isAllowExpandBot=true&isStream=true`.
- Bubble iframe URL must be exactly: `${chatbotUrl}/ai-agent/sdk/bubble`.
- No authentication, no backend/API calls, no React Query, no MUI.

---

### Task 1: Scaffold the Vite + React + TS project

**Files:**
- Create: `/Users/nghiepbui/Desktop/FTEL/Web/host-demo/package.json`
- Create: `/Users/nghiepbui/Desktop/FTEL/Web/host-demo/vite.config.ts`
- Create: `/Users/nghiepbui/Desktop/FTEL/Web/host-demo/tsconfig.json`
- Create: `/Users/nghiepbui/Desktop/FTEL/Web/host-demo/tsconfig.node.json`
- Create: `/Users/nghiepbui/Desktop/FTEL/Web/host-demo/src/vite-env.d.ts`
- Create: `/Users/nghiepbui/Desktop/FTEL/Web/host-demo/.gitignore`
- Create: `/Users/nghiepbui/Desktop/FTEL/Web/host-demo/.env`

**Interfaces:**
- Produces: a runnable Vite project; `import.meta.env.VITE_APP_CHATBOT_URL` and `import.meta.env.VITE_TENANT_ID` available to `src/`.

- [ ] **Step 1: Create the project directory and `package.json`**

`/Users/nghiepbui/Desktop/FTEL/Web/host-demo/package.json`:

```json
{
  "name": "host-demo",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.2",
    "vite": "^6.0.5"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`**

`/Users/nghiepbui/Desktop/FTEL/Web/host-demo/vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 3: Create `tsconfig.json` and `tsconfig.node.json`**

`/Users/nghiepbui/Desktop/FTEL/Web/host-demo/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`/Users/nghiepbui/Desktop/FTEL/Web/host-demo/tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Create `src/vite-env.d.ts` with typed env**

`/Users/nghiepbui/Desktop/FTEL/Web/host-demo/src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_CHATBOT_URL: string;
  readonly VITE_TENANT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 5: Create `.gitignore` and `.env`**

`/Users/nghiepbui/Desktop/FTEL/Web/host-demo/.gitignore`:

```
node_modules
dist
*.local
.DS_Store
```

`/Users/nghiepbui/Desktop/FTEL/Web/host-demo/.env`:

```
VITE_APP_CHATBOT_URL=http://localhost:9000
VITE_TENANT_ID=demo-tenant-0001
```

- [ ] **Step 6: Install dependencies**

Run: `cd /Users/nghiepbui/Desktop/FTEL/Web/host-demo && yarn install`
Expected: `node_modules/` created, no errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/nghiepbui/Desktop/FTEL/Web/host-demo
git init
git add -A
git commit -m "chore: scaffold host-demo vite + react + ts project"
```

---

### Task 2: Entry HTML with the vanilla-JS relay + React bootstrap

**Files:**
- Create: `/Users/nghiepbui/Desktop/FTEL/Web/host-demo/index.html`
- Create: `/Users/nghiepbui/Desktop/FTEL/Web/host-demo/src/main.tsx`

**Interfaces:**
- Consumes: nothing yet (App created in Task 4 — this task uses a temporary placeholder render).
- Produces: `#root` mount point; the global `message` relay listener bound to `%VITE_APP_CHATBOT_URL%`.

- [ ] **Step 1: Create `index.html` with the ported relay script**

This is a verbatim port of `aichatbot-cms/index.html` lines 10–60. The `%VITE_APP_CHATBOT_URL%` placeholders are substituted by Vite's HTML env replacement.

`/Users/nghiepbui/Desktop/FTEL/Web/host-demo/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Host Demo — Chatbot Embed</title>

    <script>
      window.addEventListener('message', function (event) {
        if (event.origin !== '%VITE_APP_CHATBOT_URL%') return;

        const message = event.data;
        const chatIframe = document.querySelector('.chatbot-dialog')?.querySelector('iframe');

        const bubbleIframe = document.querySelector('.chatbot-bubble')?.querySelector('iframe');

        const targetFrame =
          message.target === 'chat-frame' ? chatIframe?.contentWindow : bubbleIframe?.contentWindow;

        if (chatIframe && bubbleIframe) {
          switch (message.type) {
            case 'INIT_CHAT':
              setTimeout(function () {
                bubbleIframe.style.display = 'block';
              }, 1000);
              setTimeout(function () {
                bubbleIframe.style.width = '80px';
              }, 6000);
              break;
            case 'TOGGLE_CHAT':
              if (message.isOpen) {
                chatIframe.classList.remove('chat-dialog-out');
                chatIframe.classList.add('chat-dialog-in');
                chatIframe.style.display = 'block';
              } else {
                chatIframe.classList.remove('chat-dialog-in');
                chatIframe.classList.add('chat-dialog-out');
              }
              break;

            case 'MAXIMIZE_CHAT':
              bubbleIframe.style.width = '800px';
              chatIframe.style.width = '800px';
              break;

            case 'MINIMIZE_CHAT':
              bubbleIframe.style.width = '392px';
              chatIframe.style.width = '392px';
              break;

            default:
              break;
          }
        }

        if (targetFrame) {
          targetFrame.postMessage(message, '%VITE_APP_CHATBOT_URL%');
        }
      });
    </script>
  </head>

  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Note: optional chaining was added on `.chatbot-bubble?` and a `targetFrame` null-guard around the relay `postMessage` — the only deviations from the CMS original, hardening against the iframe not being mounted yet. All message handling is otherwise identical.

- [ ] **Step 2: Create `src/main.tsx` with a temporary placeholder render**

`/Users/nghiepbui/Desktop/FTEL/Web/host-demo/src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div>host-demo bootstrap OK</div>
  </StrictMode>,
);
```

- [ ] **Step 3: Run the dev server and verify boot**

Run: `cd /Users/nghiepbui/Desktop/FTEL/Web/host-demo && yarn dev`
Expected: server starts on `http://localhost:5173`; opening it shows "host-demo bootstrap OK". No console errors. Stop the server (Ctrl-C) after verifying.

- [ ] **Step 4: Verify the env placeholder was substituted**

Run: `cd /Users/nghiepbui/Desktop/FTEL/Web/host-demo && yarn build && grep -c "localhost:9000" dist/index.html`
Expected: build succeeds; grep returns `2` (both `%VITE_APP_CHATBOT_URL%` occurrences replaced with `http://localhost:9000`). Confirms Vite HTML env replacement works.

- [ ] **Step 5: Commit**

```bash
cd /Users/nghiepbui/Desktop/FTEL/Web/host-demo
git add -A
git commit -m "feat: add index.html with vanilla-js chatbot relay + react bootstrap"
```

---

### Task 3: Config constant + ChatbotWidget component + widget CSS

**Files:**
- Create: `/Users/nghiepbui/Desktop/FTEL/Web/host-demo/src/config.ts`
- Create: `/Users/nghiepbui/Desktop/FTEL/Web/host-demo/src/ChatbotWidget.tsx`
- Create: `/Users/nghiepbui/Desktop/FTEL/Web/host-demo/src/chatbot-widget.css`

**Interfaces:**
- Consumes: `import.meta.env.VITE_APP_CHATBOT_URL`, `import.meta.env.VITE_TENANT_ID` (Task 1).
- Produces:
  - `config: { chatbotUrl: string; tenantId: string }` (named export from `src/config.ts`).
  - `ChatbotWidget` — a named React component export (no props), used by `App` in Task 4.
  - DOM structure `#chatbot-root > .chatbot-dialog > iframe` and `#chatbot-root > .chatbot-bubble > iframe` that the Task 2 relay queries.

- [ ] **Step 1: Create `src/config.ts`**

`/Users/nghiepbui/Desktop/FTEL/Web/host-demo/src/config.ts`:

```ts
// Single source of truth for the host's env constants.
// The host "already has" the tenantId — here it is hardcoded via env.
export const config = {
  chatbotUrl: import.meta.env.VITE_APP_CHATBOT_URL,
  tenantId: import.meta.env.VITE_TENANT_ID,
} as const;
```

- [ ] **Step 2: Create `src/chatbot-widget.css` (ported from CMS `chatbot-sdk/style.css`)**

`/Users/nghiepbui/Desktop/FTEL/Web/host-demo/src/chatbot-widget.css`:

```css
#chatbot-root .chatbot-dialog iframe {
  display: none;
  width: 392px;
  height: 710px;
  position: fixed;
  max-height: calc(100% - 96px);
  min-height: 250px;
  border-radius: 20px;
  top: auto;
  bottom: 0;
  right: 0;
  margin: 12px;
  z-index: 9999 !important;
  filter: drop-shadow(0px 10px 30px rgba(0, 0, 0, 0.1));
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

#chatbot-root .chatbot-bubble iframe {
  width: 395px;
  height: 96px;
  position: fixed;
  overflow: visible;
  top: auto;
  bottom: 24px;
  right: 24px;
  z-index: 9998 !important;
  filter: drop-shadow(0px 10px 30px rgba(0, 0, 0, 0.1));
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

iframe.chat-dialog-out {
  animation-duration: 300ms;
  animation-name: chat-dialog-out;
  animation-timing-function: ease-in;
  animation-fill-mode: forwards;
}

iframe.chat-dialog-in {
  animation-duration: 300ms;
  animation-name: chat-dialog-in;
  animation-timing-function: ease-in;
  animation-fill-mode: forwards;
}

@keyframes chat-dialog-in {
  0% {
    opacity: 0;
    transform: scale(0, 0);
    transform-origin: bottom right;
  }

  50% {
    transform: scale(1.03, 1.03);
    transform-origin: bottom right;
  }
  100% {
    opacity: 1;
    transform: scale(1, 1);
    transform-origin: bottom right;
  }
}

@keyframes chat-dialog-out {
  0% {
    opacity: 1;
    transform: scale(1, 1);
    transform-origin: bottom right;
  }

  100% {
    opacity: 0;
    transform: scale(0, 0);
    transform-origin: bottom right;
  }
}
```

- [ ] **Step 3: Create `src/ChatbotWidget.tsx`**

Mirrors `aichatbot-cms/src/sections/chatbots/view/chatbot-dragable.jsx`, but reads `tenantId` from `config` instead of a fetched `tenant` prop.

`/Users/nghiepbui/Desktop/FTEL/Web/host-demo/src/ChatbotWidget.tsx`:

```tsx
import { config } from './config';
import './chatbot-widget.css';

export function ChatbotWidget() {
  const { chatbotUrl, tenantId } = config;

  const dialogSrc =
    `${chatbotUrl}/ai-agent/sdk/?tenant_id=${encodeURIComponent(tenantId)}` +
    `&isCustomBotInfo=true&isAllowExpandBot=true&isStream=true`;
  const bubbleSrc = `${chatbotUrl}/ai-agent/sdk/bubble`;

  if (!tenantId) return null;

  return (
    <div id="chatbot-root">
      <div className="chatbot-dialog">
        <iframe src={dialogSrc} title="chatbot" frameBorder={0} scrolling="no" />
      </div>
      <div className="chatbot-bubble">
        <iframe
          src={bubbleSrc}
          title="chatbot"
          style={{ display: 'none' }}
          frameBorder={0}
          scrolling="no"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Type-check**

Run: `cd /Users/nghiepbui/Desktop/FTEL/Web/host-demo && yarn build`
Expected: `tsc -b` passes with no errors; `vite build` succeeds. (Component not yet mounted — this only proves it compiles.)

- [ ] **Step 5: Commit**

```bash
cd /Users/nghiepbui/Desktop/FTEL/Web/host-demo
git add -A
git commit -m "feat: add config constant, ChatbotWidget iframes, and widget css"
```

---

### Task 4: Mock portal page wiring the widget in

**Files:**
- Create: `/Users/nghiepbui/Desktop/FTEL/Web/host-demo/src/App.tsx`
- Create: `/Users/nghiepbui/Desktop/FTEL/Web/host-demo/src/App.css`
- Modify: `/Users/nghiepbui/Desktop/FTEL/Web/host-demo/src/main.tsx`

**Interfaces:**
- Consumes: `ChatbotWidget` (Task 3), `config` (Task 3).
- Produces: `App` — the default export rendered by `main.tsx`.

- [ ] **Step 1: Create `src/App.css`**

`/Users/nghiepbui/Desktop/FTEL/Web/host-demo/src/App.css`:

```css
:root {
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  color: #1a1a2e;
}

body {
  margin: 0;
  background: #f4f5fb;
}

.host-header {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: #1a1a2e;
  color: #fff;
  font-weight: 600;
  font-size: 18px;
}

.host-header .badge {
  margin-left: auto;
  font-size: 13px;
  font-weight: 500;
  opacity: 0.8;
}

.host-main {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px;
}

.host-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.host-card h2 {
  margin-top: 0;
}
```

- [ ] **Step 2: Create `src/App.tsx` (mock portal + widget)**

`/Users/nghiepbui/Desktop/FTEL/Web/host-demo/src/App.tsx`:

```tsx
import './App.css';
import { config } from './config';
import { ChatbotWidget } from './ChatbotWidget';

export default function App() {
  return (
    <>
      <header className="host-header">
        Host Portal Demo
        <span className="badge">tenantId: {config.tenantId}</span>
      </header>

      <main className="host-main">
        <div className="host-card">
          <h2>Trang chủ Portal</h2>
          <p>
            Đây là một trang host giả lập. Chatbot widget được nhúng qua iframe ở
            góc dưới bên phải, nhận <code>tenantId</code> cố định từ biến môi
            trường <code>VITE_TENANT_ID</code>.
          </p>
        </div>
        <div className="host-card">
          <h2>Nội dung mẫu</h2>
          <p>
            Host không gọi API hay đăng nhập. Nó chỉ truyền tenantId xuống iframe
            chatbot tại <code>{config.chatbotUrl}</code>.
          </p>
        </div>
      </main>

      <ChatbotWidget />
    </>
  );
}
```

- [ ] **Step 3: Update `src/main.tsx` to render `App`**

Replace the entire file contents of `/Users/nghiepbui/Desktop/FTEL/Web/host-demo/src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 4: Type-check and build**

Run: `cd /Users/nghiepbui/Desktop/FTEL/Web/host-demo && yarn build`
Expected: build passes, no TS errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/nghiepbui/Desktop/FTEL/Web/host-demo
git add -A
git commit -m "feat: add mock portal page and mount ChatbotWidget"
```

---

### Task 5: End-to-end manual verification + README

**Files:**
- Create: `/Users/nghiepbui/Desktop/FTEL/Web/host-demo/README.md`

**Interfaces:**
- Consumes: the full app (Tasks 1–4).
- Produces: run instructions.

- [ ] **Step 1: Create `README.md`**

`/Users/nghiepbui/Desktop/FTEL/Web/host-demo/README.md`:

````markdown
# host-demo

Demo host app nhúng FTEL chatbot widget qua iframe, truyền `tenantId` cố định
qua env. Tái hiện đúng pattern trong `aichatbot-cms`
(`chatbot-dragable.jsx` + relay vanilla JS trong `index.html` +
`chatbot-sdk/style.css`), nhưng không cần đăng nhập / gọi API.

## Cấu hình

`.env`:

```
VITE_APP_CHATBOT_URL=http://localhost:9000
VITE_TENANT_ID=demo-tenant-0001
```

- `VITE_APP_CHATBOT_URL` — URL app chatbot widget (dev: `localhost:9000`).
- `VITE_TENANT_ID` — tenantId set cứng mà host truyền xuống iframe.

## Chạy

```bash
yarn install
yarn dev      # http://localhost:5173
```

App chatbot widget phải đang chạy tại `VITE_APP_CHATBOT_URL` thì iframe mới load.

## Cách hoạt động

- `src/ChatbotWidget.tsx` render 2 iframe (bubble + dialog) trỏ tới widget,
  dialog kèm `?tenant_id=<VITE_TENANT_ID>&isCustomBotInfo=true&isAllowExpandBot=true&isStream=true`.
- `index.html` chứa script vanilla JS lắng nghe `message` từ widget origin và
  relay/điều khiển bubble + dialog (`INIT_CHAT`, `TOGGLE_CHAT`, `MAXIMIZE_CHAT`,
  `MINIMIZE_CHAT`).
````

- [ ] **Step 2: Manual end-to-end check (widget running)**

Prerequisite: start the chatbot widget app so it serves at `http://localhost:9000`.

Run: `cd /Users/nghiepbui/Desktop/FTEL/Web/host-demo && yarn dev`, open `http://localhost:5173`.

Expected:
1. Mock portal page renders (header shows the tenantId badge).
2. After ~1s the chatbot bubble appears bottom-right (`INIT_CHAT`).
3. Clicking the bubble opens the dialog with the scale-in animation (`TOGGLE_CHAT`).
4. Maximize/minimize controls resize the dialog (800px / 392px).
5. Browser devtools → the dialog iframe `src` contains `tenant_id=demo-tenant-0001`.
6. No authentication prompt and no network calls originate from the host itself.

If the widget app is unavailable, verify at minimum steps 1 and 5 (page + iframe `src` with the tenantId); the live messaging (2–4) requires the widget.

- [ ] **Step 3: Commit**

```bash
cd /Users/nghiepbui/Desktop/FTEL/Web/host-demo
git add -A
git commit -m "docs: add host-demo readme and verification steps"
```

---

## Self-Review Notes

- **Spec coverage:** two iframes + exact URLs (Task 3) ✓; relay vanilla JS in `index.html` with all four message types (Task 2) ✓; CSS port (Task 3) ✓; `tenantId`/`chatbotUrl` via env constants (Task 1 `.env`, Task 3 `config.ts`) ✓; mock portal page (Task 4) ✓; port 5173 / no auth / no API (Global Constraints, Task 4) ✓; sibling location (Global Constraints) ✓.
- **Placeholder scan:** every step has concrete file contents or exact commands; no TBD/TODO.
- **Type consistency:** `config` shape `{ chatbotUrl, tenantId }` defined in Task 3 and consumed identically in Task 3 (`ChatbotWidget`) and Task 4 (`App`); `ChatbotWidget` is a named export consumed by `App`; `App` is a default export consumed by `main.tsx`.
- **Deviations from CMS original (documented):** optional chaining on `.chatbot-bubble?` and a `targetFrame` null-guard in the relay (Task 2 Step 1 note); these harden, not change, behavior.
