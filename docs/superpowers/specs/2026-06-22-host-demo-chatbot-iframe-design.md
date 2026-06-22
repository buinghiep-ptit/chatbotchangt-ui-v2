# Design: `host-demo` — React + Vite host embedding the chatbot widget

**Date:** 2026-06-22
**Status:** Approved (pending spec review)

## Purpose

A standalone demo **host** application that embeds the FTEL chatbot widget via
iframe. It reproduces the exact integration contract already used inside
`aichatbot-cms` (`src/sections/chatbots/view/chatbot-dragable.jsx` +
`index.html` relay + `src/components/chatbot-sdk/style.css`), with one key
difference: the `tenantId` is supplied as a **hardcoded env constant** instead
of being fetched from the backend after a JWT login.

The demo proves that any host application that already knows a `tenantId` can
embed the chatbot widget with **zero authentication** and no API calls.

## Reference: the contract extracted from `aichatbot-cms`

Two iframes pointing at `VITE_APP_CHATBOT_URL`:

- **Bubble:** `${VITE_APP_CHATBOT_URL}/ai-agent/sdk/bubble`
- **Dialog:** `${VITE_APP_CHATBOT_URL}/ai-agent/sdk/?tenant_id=<id>&isCustomBotInfo=true&isAllowExpandBot=true&isStream=true`

A `window` `message` listener (origin-checked against the chatbot URL) that:

- `INIT_CHAT` → show bubble after 1s, set bubble width to `80px` after 6s
- `TOGGLE_CHAT` (`message.isOpen`) → show/hide the dialog using
  `chat-dialog-in` / `chat-dialog-out` animation classes
- `MAXIMIZE_CHAT` → set bubble + dialog width to `800px`
- `MINIMIZE_CHAT` → set bubble + dialog width to `392px`
- After handling, **relay** the message to the target frame:
  `message.target === 'chat-frame'` → dialog iframe, otherwise → bubble iframe,
  via `targetFrame.postMessage(message, chatbotUrl)`

CSS contract (ported from `chatbot-sdk/style.css`):

- Dialog iframe: `392px × 710px`, fixed bottom-right, `border-radius: 20px`,
  `z-index: 9999`, `transition: width 0.5s`, initially `display: none`
- Bubble iframe: `395px × 96px`, fixed bottom-right (`bottom:24px; right:24px`),
  `z-index: 9998`, `transition: width 0.5s`
- `@keyframes chat-dialog-in` / `chat-dialog-out` (scale from bottom-right)

## Architecture

```
host-demo/
├── .env                    VITE_APP_CHATBOT_URL, VITE_TENANT_ID
├── index.html              Contains the vanilla-JS message relay <script>
├── src/
│   ├── main.tsx            React bootstrap
│   ├── App.tsx             Mock portal page (header + sample content)
│   ├── config.ts           Reads env → { chatbotUrl, tenantId } constants
│   ├── ChatbotWidget.tsx   Renders the two iframes (#chatbot-root structure)
│   └── chatbot-widget.css  Positioning + animation (ported from style.css)
└── (vite.config.ts, tsconfig*, package.json)
```

### Units

1. **`index.html` relay `<script>`** — the chatbot communication, kept as
   **vanilla JS**, ported verbatim from the CMS `index.html`. It installs the
   `window` `message` listener that selects the iframes via
   `document.querySelector('.chatbot-dialog'/'.chatbot-bubble')`, performs the
   origin check against the chatbot URL, handles `INIT_CHAT` / `TOGGLE_CHAT` /
   `MAXIMIZE_CHAT` / `MINIMIZE_CHAT` (resize + animation classes), and relays the
   message to the target frame. The origin/target chatbot URL is injected with
   Vite's native HTML env replacement — the same `%VITE_APP_CHATBOT_URL%`
   placeholder the CMS uses, which Vite substitutes at build/serve time. So the
   script is a verbatim port, including the `event.origin !==
   '%VITE_APP_CHATBOT_URL%'` check.

2. **`ChatbotWidget`** — a thin React component that renders the DOM structure
   the relay script depends on: `#chatbot-root` containing `.chatbot-dialog >
   iframe` (dialog) and `.chatbot-bubble > iframe` (bubble), with the correct
   `src` URLs. It does **not** own any messaging logic — that lives in
   `index.html`. The React side only produces the markup + iframe `src`.
   - **Inputs:** `chatbotUrl`, `tenantId` (props). **Depends on:** the widget app
     being served at `chatbotUrl`, and the `index.html` relay script. **Output:**
     the iframe markup.

2. **`App` (mock portal)** — a thin host shell: a top header bar and some
   placeholder dashboard content so the floating widget visibly sits "inside a
   host". Renders `<ChatbotWidget chatbotUrl={config.chatbotUrl}
   tenantId={config.tenantId} />` exactly once.

3. **`config.ts`** — reads `import.meta.env.VITE_APP_CHATBOT_URL` and
   `VITE_TENANT_ID`, exports a typed `config` constant. Single source of truth
   for the env constants.

### Data flow

`.env` → `config.ts` → props to `ChatbotWidget` → composed into the dialog
iframe `src` (`?tenant_id=<config.tenantId>…`). No network/auth in the host.
Cross-frame messaging: widget iframes → host `message` listener (orchestrate +
relay) → target iframe.

### Implementation choice: relay stays vanilla JS in `index.html`

The relay is kept exactly where and how the CMS keeps it — a plain `<script>` in
`index.html` using `document.querySelector` and `%VITE_APP_CHATBOT_URL%`. This
is a deliberate decision to match the original integration 1:1: no React hook,
no refs, no `useEffect`. The React side (`ChatbotWidget`) only renders the
`#chatbot-root` markup that this script queries.

## Configuration / assumptions

- Host dev server runs on the **Vite default (5173)** to avoid clashing with the
  CMS (3000) and the widget app (9000).
- `VITE_APP_CHATBOT_URL` defaults to `http://localhost:9000` (matching the CMS
  `.env.local`); the widget app must be running for the iframes to load.
- `VITE_TENANT_ID` is hardcoded by the operator in `.env`.
- Origin check uses `VITE_APP_CHATBOT_URL` verbatim, matching the original
  (`event.origin !== chatbotUrl`).
- TypeScript + React 19 + Vite (modern default). The CMS is JS, but the contract
  is small and re-types cleanly.
- Created at `/Users/nghiepbui/Desktop/FTEL/Web/host-demo` (sibling of the CMS).

## Out of scope (YAGNI)

- No login / JWT / `AuthGuard`, no API calls, no tenant fetching.
- No React Query, no MUI, no app theme — plain CSS for the mock portal.
- No draggable behavior beyond the original's fixed positioning.
- No tests. The relay is a verbatim vanilla-JS port living in `index.html`
  (driven by the live widget iframes), so there is no isolated React unit worth
  unit-testing; correctness is verified by running the demo against the widget.

## Success criteria

1. `yarn dev` in `host-demo` serves a mock portal page with a floating chatbot
   bubble bottom-right.
2. With the widget app running at `VITE_APP_CHATBOT_URL`, the bubble appears
   (`INIT_CHAT`), the dialog opens/closes (`TOGGLE_CHAT`), and
   maximize/minimize resize the iframes — identical behavior to the CMS.
3. The dialog iframe URL contains the hardcoded `tenant_id` from `VITE_TENANT_ID`.
4. No authentication or backend call is made by the host.
