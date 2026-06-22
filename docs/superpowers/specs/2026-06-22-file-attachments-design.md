# File Attachments for the Composer

**Date:** 2026-06-22
**Status:** Approved design — ready for implementation plan

## Summary

Add file attachments to the chat Composer. The user can attach files via the
existing paperclip button (opens a file picker), by drag-and-drop onto the
composer, or by pasting an image. Attached files show as removable chips
(image thumbnails + file chips) above the textarea. On send, the files travel
with the message and render read-only inside the user's message bubble.

Alongside this, the composer's textarea auto-grow is improved: it grows with
typed content up to a larger maximum (~160px) instead of the current cramped
90px, so multi-line input displays comfortably.

The behavior is modeled on the existing implementation in the
`aichatbot-ui-v1` project (`src/components/chang/composer.tsx`,
`composer-file-chips.tsx`, `hooks/use-object-url.ts`), re-expressed in this
project's design system (lucide icons, the shadcn-style `Button`, Tailwind +
CSS variables) and with the dropzone/file-list logic extracted into a reusable
hook.

## Goals

- Wire the currently-inert `<Paperclip/>` button in
  `src/components/chat/Composer.tsx` to a file picker.
- Support drag-and-drop onto the composer and image paste.
- Show attached files as removable chips/thumbnails in the composer while
  drafting.
- Carry attachments with the sent message and render them read-only in the
  user's message bubble.
- Improve textarea auto-grow so typed content displays optimally (taller max).

## Non-Goals

- No real upload / backend. Files live only in memory for the mock chat.
- No file editing, renaming, or reordering.
- No bot-side attachments (assistant messages stay text/html as today).
- No new dropdown "plus menu" — the reference's `PlusMenu` is not ported; the
  existing single paperclip button is reused.
- No progress bars, retries, or virus scanning.

## Architecture

### Decision: extract a hook, don't inline

The reference keeps all dropzone logic (file state, dedup, `useDropzone`)
inside its composer component. This project favors smaller, testable units —
the same reasoning that produced `useSpeechRecognition` — so the
attachment lifecycle lives in a dedicated hook and `Composer` stays a view
that consumes it.

- **Alternative — inline in `Composer`:** faster to port verbatim, but bloats
  the component and is hard to unit-test. Rejected.
- **Alternative — file state in the Zustand store:** draft files are ephemeral
  UI state, not application state. Rejected.

### Library

`react-dropzone` (latest version compatible with React 19; the reference uses
`^15.0.0`). Configured with `noClick: true` and `noKeyboard: true` so the
dropzone wraps the composer for drag-and-drop only; clicks are handled by the
explicit paperclip button via the hook's `open()`.

### Components

#### 1. `src/hooks/useObjectUrl.ts` (new)

Ported from the reference. Creates an object URL for a `File` and revokes it on
unmount / file change.

```ts
function useObjectUrl(file: File): string | null
```

Used by both the composer chips and the message bubble (each consumer gets its
own URL; revoking one does not affect the other).

#### 2. `src/hooks/useFileAttachments.ts` (new)

Wraps `useDropzone`. Owns the draft `File[]` state.

Public API:

```ts
interface UseFileAttachments {
  files: File[]
  getInputProps: () => Record<string, unknown> // spread onto hidden <input>
  open: () => void                              // open the OS file picker
  addFiles: (incoming: File[]) => void          // dedup + cap, then append
  removeFile: (index: number) => void
  clear: () => void
}

function useFileAttachments(): UseFileAttachments
```

Rules:
- **Accept** (mirrors the reference): `image/*`, `application/pdf`,
  `application/msword`,
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
- **Dedup** by filename — a file whose `name` already exists is ignored.
- **Caps:** max **10** files total; max **10 MB** per file
  (`MAX_FILE_BYTES = 10 * 1024 * 1024`, `MAX_FILES = 10`). Files that exceed
  the size cap, or that overflow the count cap, are dropped silently and a
  single `console.warn` is emitted naming what was dropped.
- `useDropzone` is configured `noClick: true, noKeyboard: true`, with `onDrop`
  delegating to `addFiles`.

#### 3. `src/components/chat/FileChips.tsx` (new)

Display component, ported and re-skinned from the reference's
`composer-file-chips.tsx`. Splits attachments into **images** (square
thumbnails via `useObjectUrl`) and **other files** (a chip with a type icon +
truncated filename).

```ts
function FileChips({
  files,
  onRemove,
}: {
  files: File[]
  onRemove?: (index: number) => void
}): JSX.Element
```

- When `onRemove` is provided, each item shows a remove (✕) button — composer
  use.
- When `onRemove` is omitted, items render read-only — message-bubble use.
- File-type icon: `Music2` for `audio/*`; `FileText` for PDF, `text/*`, or a
  `.md/.txt/.doc/.docx` name; otherwise `File` (lucide).
- Colors and radii use design-system tokens (`border-border`, `bg-muted`,
  `text-muted-foreground`) — no hard-coded hex.

#### 4. `src/components/chat/Composer.tsx` (edit)

- Instantiate `useFileAttachments()` alongside the existing
  `useSpeechRecognition()`.
- Render a hidden `<input {...getInputProps()} />`.
- Wrap the input row so drops anywhere on it are accepted (the dropzone root).
- Wire the existing `<Paperclip/>` button: `onClick={open}` (it currently has
  no handler).
- Render `<FileChips files={files} onRemove={removeFile} />` above the textarea
  when `files.length > 0`.
- Add an `onPaste` handler on the textarea: if the clipboard contains image
  files, `preventDefault()` and `addFiles(images)`; otherwise let the paste
  proceed as normal text.
- **Taller auto-grow:** raise the textarea max-height from `90px` to `160px`
  (update both the inline `Math.min(scrollHeight, 90)` and the `max-h-[90px]`
  class to `160`). Beyond the max the textarea scrolls.
- `submit()` sends when there is trimmed text **or** at least one file; it
  calls `onSend(text, files)` then clears both the text and the files
  (`clear()`).
- Recording (voice) interaction is unchanged; while `isListening` the overlay
  still covers the row and the paperclip remains hidden along with the other
  idle controls (it already lives in the `!isListening` group, so no extra
  guard is needed — keep it there).

#### 5. `src/types.ts` (edit)

```ts
export interface Attachment {
  name: string
  type: string
  size: number
  file: File
}
```

Add to `Message`:

```ts
attachments?: Attachment[]
```

`kind` stays `'text'`; attachments are an additive field, not a new kind.

#### 6. `src/store/useWidgetStore.ts` (edit)

- `sendChatMessage` signature becomes `(text: string, files?: File[]) => void`.
- It maps `files` to `Attachment[]` (`{ name, type, size, file }`) and stores
  them on the new user `Message`.
- Send is allowed when `text.trim()` is non-empty **or** `files` is non-empty;
  the existing early-return guard is updated accordingly.
- The bot auto-reply is unchanged.
- `src/components/chat/ChatPanel.tsx` needs **no change**: it already passes
  `onSend={sendChatMessage}`, and the `Composer` `onSend` prop type and
  `sendChatMessage` signature change in tandem, so the wiring still type-checks.

#### 7. `src/components/shared/MessageBubble.tsx` (edit)

- Accept an optional `attachments?: Attachment[]` prop.
- When present, render `<FileChips files={attachments.map(a => a.file)} />`
  (read-only, no `onRemove`) inside the bubble, below the text.
- `MessageList` passes `attachments={m.attachments}` through.

### Data flow

```
paperclip tap / drop / image paste
  → useFileAttachments.addFiles  (dedup by name, drop over-cap)
  → FileChips renders thumbnails + chips in composer (removable)
send (text or files present)
  → onSend(text, files)
  → store appends user Message { text, attachments }
  → MessageBubble renders text + read-only FileChips
  → composer clears text + files
```

## Edge Cases

| Case | Behavior |
|------|----------|
| Duplicate filename added | Ignored (dedup by `name`) |
| File larger than 10 MB | Dropped silently; one `console.warn` |
| More than 10 files | Excess dropped; one `console.warn` |
| Empty text but files attached | Send allowed; bubble shows attachments only |
| Paste a non-image | Normal text paste (handler does not intercept) |
| Paste an image | Intercepted; added as an attachment |
| Component unmounts with object URLs | URLs revoked via `useObjectUrl` cleanup |
| Recording (voice) active | Overlay covers row; paperclip hidden as before |

## Testing

Vitest + React Testing Library (already configured).

- **`useObjectUrl`** — returns a URL for a file; revokes on unmount (spy on
  `URL.createObjectURL` / `revokeObjectURL`).
- **`useFileAttachments`** — `addFiles` appends; duplicate filename ignored;
  file over `MAX_FILE_BYTES` dropped; count capped at `MAX_FILES`;
  `removeFile` removes by index; `clear` empties.
- **`FileChips`** — images render as `<img>` thumbnails, other files as chips
  with the filename; with `onRemove` a remove button appears and fires with the
  right index; without `onRemove` no remove button renders.
- **`Composer`** — paperclip click calls the picker (`open`); a dropped/added
  file shows a chip; clicking remove drops the chip; `submit` calls `onSend`
  with `(text, files)` and clears; send works with files and empty text;
  textarea max-height is 160px (assert the class/style).
- **`useWidgetStore`** — `sendChatMessage(text, files)` appends a user message
  whose `attachments` reflect the files; sending with empty text + files is
  allowed; sending with neither is a no-op.
- **`MessageBubble`** — renders attachment chips read-only when `attachments`
  is provided; no remove buttons.

## Files Touched

- `src/hooks/useObjectUrl.ts` — new
- `src/hooks/useFileAttachments.ts` — new
- `src/components/chat/FileChips.tsx` — new
- `src/components/chat/Composer.tsx` — edit (dropzone, chips, paste, taller grow)
- `src/types.ts` — edit (`Attachment`, `Message.attachments`)
- `src/store/useWidgetStore.ts` — edit (`sendChatMessage` accepts files)
- `src/components/chat/MessageList.tsx` — edit (pass `attachments`)
- `src/components/shared/MessageBubble.tsx` — edit (render attachments)
- `package.json` — add `react-dropzone`
- test files for the hooks, `FileChips`, `Composer`, store, `MessageBubble` — new/edit
