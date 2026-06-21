# Native-feel Mobile Transitions for Chang Widget

**Date:** 2026-06-21
**Status:** Approved — ready for planning

## Goal

Make the Chang webview feel like a native iOS/Android app by adding smooth,
physics-based transitions for tab switching, tab focus, bottom-sheet
visibility, list/detail navigation, and list entrance. All motion must stay at
60fps inside a mobile webview and respect `prefers-reduced-motion`.

## Decisions (confirmed with user)

- **Scope:** Comprehensive — tab switch, TabBar active indicator, bottom sheet
  enter/exit, task list→detail push/pop, and stagger for lists & message bubbles.
- **Gestures:** Drag-to-dismiss for the bottom sheet only. No horizontal
  swipe-between-tabs (avoids scroll conflicts).
- **Library:** `motion` (the current name for framer-motion), React 19 compatible.

## Foundation

- Add dependency **`motion`**; import from `motion/react`.
- Wrap the app in **`<MotionConfig reducedMotion="user">`** in `main.tsx` so
  users with OS-level reduced-motion get no motion automatically.
- Create **`src/lib/motion.ts`** holding shared constants and reusable variants:
  - `SPRING = { type: 'spring', stiffness: 380, damping: 32 }` (snappy native feel)
  - `SOFT_SPRING` for the drag snap-back and layout indicator
  - tab-slide variants (enter-from-direction / exit-to-direction)
  - stagger container + item variants
  - a `getDirection(prevIndex, nextIndex)` helper
- **Performance rule:** animate only `transform` and `opacity`. No layout-thrashing
  properties (width/height/top/left) in transitions.

## Component-by-component design

### 1. Tab content transitions — directional slide
- Keep Radix `Tabs` Root + `TabsList`/`TabsTrigger` (TabBar) for a11y/keyboard.
- Replace the panel body in `ChangWidget` with an `AnimatePresence` (`mode="popLayout"`)
  keyed on the active view (`chat` | `tasks` | `noti`).
- Tab order `[chat, tasks, noti]` defines direction: moving to a higher index →
  new content enters from the right, old exits left; lower index → reverse.
- Track previous index via a ref to compute direction at render time.

### 2. TabBar active indicator
- A `motion.div` with **`layoutId="tab-indicator"`** renders a soft rounded pill
  behind the icon+label of the active item; it slides smoothly between tabs using
  shared-layout animation — including when the active item is `history`/`quick`.
- `whileTap={{ scale: 0.9 }}` on each trigger's icon for native tap feedback.
- Active color logic from the current TabBar is preserved.

### 3. Bottom sheet — enter/exit + drag-to-dismiss
- Move the sheet's mount into an `AnimatePresence` in `ChangWidget` so **exit
  animates** (today closing unmounts instantly).
- Sheet: `initial { y: '100%' }` → `animate { y: 0 }` (SPRING) → `exit { y: '100%' }`.
  Backdrop is a `motion.div` fading `opacity` 0↔1 in parallel.
- **Drag-to-dismiss:** use `dragControls` + `dragListener={false}` so only the
  top grabber bar starts the drag; inner content scrolls normally.
  - `drag="y"`, `dragConstraints={{ top: 0 }}`, `dragElastic={0.2}`.
  - `onDragEnd`: if `offset.y > 100` OR `velocity.y > 500` → `closeSheet()`,
    else spring back to `y: 0`.

### 4. Task list → task detail — iOS push/pop
- Inside the `tasks` view, a nested `AnimatePresence` keyed on `currentTaskId`:
  - open detail → detail slides in from the right; list shifts slightly left
    (subtle parallax) and fades.
  - back button → reverse (pop).
- This nests cleanly inside the tab-content `AnimatePresence` (outer key stays
  `tasks` while inner key toggles between list and `currentTaskId`).

### 5. Stagger for lists & messages
- Task cards (`TasksPanel`) and notifications (`NotificationsPanel`): wrap the list
  in a container with `staggerChildren`; each item fades + slides up on enter.
- New message bubbles (chat `MessageList` and task-detail conversation): slide-up +
  fade on appear. `TypingIndicator` unchanged.
- Keep durations short (~0.18–0.25s) so lists feel responsive, not sluggish.

### 6. Widget open/minimize
- Upgrade the existing CSS translate/scale/opacity transition to a light `motion`
  spring for consistency. Minor, non-blocking; behavior (minimize → Launcher)
  unchanged. The `max-[480px]` full-screen override must keep working.

## Files affected

- `package.json` — add `motion`
- `src/main.tsx` — `MotionConfig` wrapper
- `src/lib/motion.ts` — **new**: shared springs, variants, direction helper
- `src/components/ChangWidget.tsx` — tab-panel `AnimatePresence` + sheet `AnimatePresence`
- `src/components/BottomSheet.tsx` — motion + drag-to-dismiss via grabber
- `src/components/TabBar.tsx` — `layoutId` indicator + `whileTap`
- `src/components/tasks/TasksPanel.tsx` (+ detail) — nested push/pop + card stagger
- `src/components/chat/MessageList.tsx` — message entrance
- `src/components/noti/NotificationsPanel.tsx` — list stagger

## Testing

- Existing tests: `TabBar.test`, `BottomSheet.test`, `ChangWidget.test`,
  `TasksPanel.test`, `TaskCard.test`, `useWidgetStore.test`.
- motion renders normal DOM, but `AnimatePresence` exit and `MotionConfig` may
  affect timing-sensitive assertions. Run the full suite after each change and
  adjust assertions (e.g. await exit completion) only where animation genuinely
  changes the DOM lifecycle. Do not weaken behavioral coverage.
- Manual verification in a narrow (≤480px) viewport via the dev server /
  Playwright: confirm tab slide direction, indicator glide, sheet open/close +
  drag-to-dismiss, and push/pop.

## Out of scope (YAGNI)

- Horizontal swipe-between-tabs gesture.
- Drag-to-resize / multi-detent bottom sheet (only dismiss).
- Page-level shared-element transitions beyond the tab indicator.
