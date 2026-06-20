# shadcn Tabs Migration Design

**Date:** 2026-06-20  
**Branch:** feat/chang-webview-react  
**Scope:** Add shadcn Tabs component, lift tab structure to ChangWidget, add missing CSS variables

---

## Context

The app is a floating chat widget embedded in mobile WebView/iframe. Navigation between panels (chat/tasks/notifications, task detail) is managed via Zustand store state — no URL router needed or desired for this embed context.

Existing `src/components/ui/` components (button, input, textarea, avatar, badge, scroll-area) are already written in shadcn/Radix UI pattern. `components.json` already exists — shadcn CLI was initialized previously.

**What's missing:**
- `@radix-ui/react-tabs` package and the shadcn `tabs.tsx` component
- Proper use of Radix Tabs semantics in `TabBar` (currently custom divs/buttons)
- CSS variables: `--secondary`, `--accent`, `--destructive`, `--popover` (referenced by button variants but not defined)

---

## Architecture

### File changes

| File | Action |
|---|---|
| `src/components/ui/tabs.tsx` | Add — generated via `npx shadcn@latest add tabs` |
| `src/components/ChangWidget.tsx` | Modify — wrap content area with `<Tabs>`, panels into `<TabsContent>` |
| `src/components/TabBar.tsx` | Modify — replace custom buttons with `<TabsList>` + `<TabsTrigger>` |
| `src/index.css` | Modify — add missing CSS variables |
| `package.json` + `yarn.lock` | Updated by shadcn CLI (`@radix-ui/react-tabs`) |

### No changes to

- Zustand store (`useWidgetStore`) — `activeTab`, `currentTaskId`, `switchTab` stay as-is
- All panel components: `ChatPanel`, `TasksPanel`, `NotificationsPanel`, `TaskDetailPanel`
- `Header`, `Launcher`, `Stage`
- All other `src/components/ui/` files

---

## Component Design

### ChangWidget.tsx

Wrap the content area (panels) and TabBar together inside a `<Tabs>` root:

```tsx
<Tabs
  value={currentTaskId ? 'tasks' : activeTab}
  onValueChange={(v) => switchTab(v as Tab)}
  className="relative flex flex-1 flex-col overflow-hidden"
>
  <TabsContent value="chat"><ChatPanel /></TabsContent>
  <TabsContent value="tasks">
    {currentTaskId ? <TaskDetailPanel /> : <TasksPanel />}
  </TabsContent>
  <TabsContent value="noti"><NotificationsPanel /></TabsContent>
  <TabBar />
</Tabs>
```

`TaskDetailPanel` is rendered inside `TabsContent value="tasks"` — preserving the existing behavior where the Tasks tab stays highlighted during task detail view.

### TabBar.tsx

Replace the outer `<div>` + `<button>` loop with `<TabsList>` + `<TabsTrigger>`. Visual design stays identical (bottom nav, vertical icon + label, badge count). Active state uses Radix's `data-[state=active]` attribute instead of manual `highlight === id` comparison:

```tsx
<TabsList className="flex border-t border-border/60 bg-card px-1 py-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] h-auto rounded-none">
  {TABS.map(({ id, label, Icon }) => {
    const count = badge[id]
    return (
      <TabsTrigger
        key={id}
        value={id}
        className={cn(
          'relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 font-semibold',
          'text-muted-foreground',
          'data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none',
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
```

The `highlight` variable and manual active state check are removed — Radix manages `data-state` automatically based on the `value` prop on the root `<Tabs>`.

### CSS variables (index.css)

Add to both `:root` and `.dark` blocks:

```css
/* :root */
--secondary: 240 5% 96%;
--secondary-foreground: 240 6% 10%;
--accent: 240 5% 96%;
--accent-foreground: 240 6% 10%;
--destructive: 0 72% 51%;
--destructive-foreground: 0 0% 100%;
--popover: 0 0% 100%;
--popover-foreground: 240 6% 10%;

/* .dark */
--secondary: 240 4% 16%;
--secondary-foreground: 0 0% 98%;
--accent: 240 4% 16%;
--accent-foreground: 0 0% 98%;
--destructive: 0 72% 51%;
--destructive-foreground: 0 0% 100%;
--popover: 240 4% 16%;
--popover-foreground: 0 0% 98%;
```

Values match existing theme: secondary/accent reuse muted colors, destructive reuses `--status-alert`.

---

## Verification Checklist

- [ ] 3 tabs switch correct panels (chat, tasks, noti)
- [ ] Click task card → TaskDetailPanel shows, Tasks tab stays highlighted
- [ ] Back from task detail → TasksPanel
- [ ] Dark mode toggle works
- [ ] Badge counts (tasks pending, noti unread) display correctly
- [ ] Keyboard navigation works (Tab key, arrow keys between triggers)
- [ ] Existing tests pass: `TabBar.test.tsx`, `TaskCard.test.tsx`, `TasksPanel.test.tsx`, `useWidgetStore.test.ts`
