# Design: convert `superpowers-demo` into an iframe-embeddable chatbot widget

**Date:** 2026-06-22
**Status:** Approved (pending spec review)

## Purpose

Transform `superpowers-demo` (currently a self-contained "Chang Webview" chat
demo that simulates both a host page and the widget on one screen) into a
**pure embeddable widget** that runs inside an iframe and coordinates its
visibility/size with a parent host via `window.postMessage` — reproducing the
integration contract of the real SDK at `/Users/nghiepbui/Desktop/FTEL/Web/chatbot-sdk`.

This is the widget that the `host-demo` project (separate plan) will embed.

**Scope limit:** UI + cross-frame communication only. No backend/API calls
(no auth, no `tenant_id` exchange, no chat history fetch). Existing seed-data
chat behaviour stays as-is.

## Reference: the contract from `chatbot-sdk`

Two surfaces selected by route (`basename="/ai-agent/sdk"`):

- `/bubble` → floating bubble
- `/` → chat dialog

Outgoing messages, all sent via `window.parent.postMessage(msg, "*")`:

| Type | Trigger | Payload |
| --- | --- | --- |
| `INIT_CHAT` | chat surface mounts | `{ type:'INIT_CHAT', data, target:'bubble-frame' }` |
| `TOGGLE_CHAT` (open) | bubble clicked | `{ type:'TOGGLE_CHAT', data, target:'chat-frame', isOpen:true }` |
| `TOGGLE_CHAT` (close) | close button in dialog | `{ type:'TOGGLE_CHAT', data, target:'bubble-frame', isOpen:false }` |
| `MAXIMIZE_CHAT` | maximize button (only if `isAllowExpandBot`) | `{ type:'MAXIMIZE_CHAT', data, target:'chat-frame' }` |
| `MINIMIZE_CHAT` | minimize button | `{ type:'MINIMIZE_CHAT', data, target:'chat-frame' }` |

The host (see `host-demo` plan, ported from `aichatbot-cms/index.html`) reacts
to these: shows the bubble on `INIT_CHAT`, shows/hides the dialog on
`TOGGLE_CHAT`, resizes both iframes on `MAXIMIZE_CHAT`/`MINIMIZE_CHAT`, and
relays each message to the `target` frame.

`isAllowExpandBot` and `tenant_id` are read from the URL query string. Target
origin is `"*"` and there is no incoming-origin check in the reference SDK.

## Current state of `superpowers-demo` (what changes)

- `src/App.tsx` renders `<Stage><ChangWidget/><Launcher/></Stage>`.
- `Stage.tsx` — the simulated host backdrop ("Demo host page" label + a
  Sáng/Tối theme toggle). **Removed.**
- `Launcher.tsx` — internal bubble button toggling `minimized`. **Removed**
  (replaced by the new `/bubble` surface).
- `ChangWidget.tsx` — floating box `fixed bottom-6 right-6 h-[680px] w-[408px]`
  with `minimized` translate/scale/opacity. **Becomes** a full-iframe-filling
  chat surface; `minimized` removed.
- `Header.tsx` — has a "Thu nhỏ" (`Minus`) button calling `setMinimized(true)`.
  **Repurposed**: that button becomes close → `closeChat()`; a maximize/minimize
  toggle is added (gated by `isAllowExpandBot`).
- `useWidgetStore.ts` — `minimized` / `setMinimized` removed.

## Architecture

### Units

1. **`src/lib/hostBridge.ts`** (new) — the communication layer. Pure functions
   wrapping the protocol; the single place that knows message shapes. Easy to
   unit-test by stubbing `window.parent.postMessage`.

   ```ts
   type HostMessage =
     | { type: 'INIT_CHAT'; data: string; target: 'bubble-frame' }
     | { type: 'TOGGLE_CHAT'; data: string; target: 'chat-frame' | 'bubble-frame'; isOpen: boolean }
     | { type: 'MAXIMIZE_CHAT' | 'MINIMIZE_CHAT'; data: string; target: 'chat-frame' }

   export const hostBridge: {
     initChat(): void
     openChat(): void
     closeChat(): void
     maximize(): void
     minimize(): void
   }
   ```

2. **`src/lib/surface.ts`** (new) — surface detection.
   `getSurface(): 'bubble' | 'chat'` from `window.location.pathname`
   (`endsWith('/bubble')` → `'bubble'`). Also `readWidgetParams()` returning
   `{ tenantId: string | null; isAllowExpandBot: boolean }` parsed from
   `window.location.search`.

3. **`src/components/Bubble.tsx`** (new) — the `/bubble` surface. Reuses the
   `Launcher` visual (gradient circle + `MessageCircle` icon + alert dot),
   centered/filling the small bubble iframe. Click → `hostBridge.openChat()`.

4. **`src/components/ChangWidget.tsx`** (modified) — the `/` chat surface.
   Fills the iframe (`h-full w-full`, no fixed positioning, no rounded corners,
   no minimized transitions). Calls `hostBridge.initChat()` on mount.

5. **`src/components/Header.tsx`** (modified) — close button → `closeChat()`;
   maximize/minimize toggle (local `isMaximized` state) gated by
   `isAllowExpandBot`, firing `maximize()`/`minimize()`. Keeps newChat + theme.

6. **`src/App.tsx`** (modified) — `getSurface()` → render `<Bubble/>` or the
   chat surface. No `Stage`, no `Launcher`.

7. **`vite.config.ts`** (modified) — `base: '/ai-agent/sdk/'`.

### Data flow

`App` reads the surface from the path. The chat surface posts `INIT_CHAT` on
mount and posts `TOGGLE_CHAT`/`MAXIMIZE_CHAT`/`MINIMIZE_CHAT` from header
actions through `hostBridge`. The bubble surface posts `TOGGLE_CHAT{isOpen:true}`
on click. All messages go to `window.parent`; when not embedded
(`window.parent === window`) they harmlessly post to self. No network.

### Layout change

Inside an iframe the host controls outer size, border-radius (20px), drop
shadow, and show/hide. So the widget renders at `100%` width/height with a
solid `bg-card`, no own fixed positioning, no own rounded corners, no
open/close animation (the host animates the iframe via `chat-dialog-in/out`).

## Out of scope (YAGNI)

- No backend/API, no auth, no `tenant_id` exchange — `tenant_id` is only read
  and surfaced (e.g. shown in header subtitle/console) to prove host→widget
  passing works.
- No `FOXSKILL`, `isWebview`, `isFoxsteps`, `isVoiceChat`, `foxskill` handling
  from the reference SDK.
- No react-router (lightweight pathname switch instead).
- No incoming host→widget message handling beyond an optional no-op listener
  (the reference SDK only echoes an ack; not needed for the demo).

## Impact on the `host-demo` plan

`host-demo`'s `.env` `VITE_APP_CHATBOT_URL` will point at this app's dev origin
(e.g. `http://localhost:5173`); its iframes load `/ai-agent/sdk/?tenant_id=…`
and `/ai-agent/sdk/bubble`. The host-demo plan's `.env` default and the
verification steps will be updated to match when that project is built.

## Success criteria

1. Visiting `/ai-agent/sdk/` renders the chat dialog filling the viewport (no
   "Demo host page" backdrop, no floating launcher).
2. Visiting `/ai-agent/sdk/bubble` renders just the bubble.
3. On chat mount, an `INIT_CHAT` message is posted to `window.parent`
   (verifiable via a spy in tests and via devtools when embedded).
4. Clicking the bubble posts `TOGGLE_CHAT{isOpen:true,target:'chat-frame'}`;
   the dialog close button posts `TOGGLE_CHAT{isOpen:false,target:'bubble-frame'}`.
5. With `?isAllowExpandBot=1`, the maximize/minimize toggle appears and posts
   `MAXIMIZE_CHAT`/`MINIMIZE_CHAT`; without it, the toggle is hidden.
6. `yarn test` and `yarn build` pass (existing tests updated for the removed
   `minimized` logic; new `hostBridge` tests added).
