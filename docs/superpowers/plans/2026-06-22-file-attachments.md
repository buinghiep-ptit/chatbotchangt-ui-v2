# Composer File Attachments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add file attachments (picker + drag-drop + image paste) to the chat Composer, show them as removable chips while drafting, carry them with the sent message, and render them read-only in the message bubble — plus a taller textarea auto-grow.

**Architecture:** Dropzone + file-list logic lives in a reusable `useFileAttachments` hook (mirroring the existing `useSpeechRecognition`); object-URL lifecycle lives in `useObjectUrl`. A single `FileChips` view renders both the removable composer chips and the read-only bubble chips. The Zustand store's `sendChatMessage` gains an optional `files` argument and stores them as `Attachment[]` on the message.

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind 3, `react-dropzone`, lucide-react, Zustand, Vitest + React Testing Library.

## Global Constraints

- No backend/upload: files live only in memory for the mock chat.
- Accept set (verbatim): `image/*`, `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
- Dedup attachments by filename (`File.name`).
- Caps: `MAX_FILES = 10`, `MAX_FILE_BYTES = 10 * 1024 * 1024`. Over-limit files dropped silently with a single `console.warn`.
- Colors/radii use design-system tokens (`border-border`, `bg-muted`, `text-muted-foreground`, etc.) — no hard-coded hex / no raw Tailwind palette classes.
- `kind` stays `'text'`; attachments are an additive `Message.attachments` field, not a new kind.
- The lucide `File` icon MUST be imported aliased (`File as FileIcon`) so it does not shadow the DOM `File` type.
- Vietnamese UI copy, matching the existing composer.

---

### Task 1: `useObjectUrl` hook + test-env object-URL stub

**Files:**
- Create: `src/hooks/useObjectUrl.ts`
- Create: `src/hooks/useObjectUrl.test.ts`
- Modify: `src/test/setup.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `function useObjectUrl(file: File): string | null` — creates an object URL for `file`, revokes it on unmount or when `file` changes.

- [ ] **Step 1: Add the object-URL stub to the test setup**

jsdom does not implement `URL.createObjectURL`. Add a stub so component tests that render image thumbnails don't throw. Append to `src/test/setup.ts`:

```ts
// jsdom does not implement object URLs; stub them so attachment thumbnails render.
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'blob:mock'
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = () => {}
}
```

- [ ] **Step 2: Write the failing test**

Create `src/hooks/useObjectUrl.test.ts`:

```ts
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useObjectUrl } from './useObjectUrl'

describe('useObjectUrl', () => {
  it('creates an object URL for the file', () => {
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:abc')
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    const { result } = renderHook(() => useObjectUrl(file))
    expect(createSpy).toHaveBeenCalledWith(file)
    expect(result.current).toBe('blob:abc')
    createSpy.mockRestore()
  })

  it('revokes the URL on unmount', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:abc')
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    const { unmount } = renderHook(() => useObjectUrl(file))
    unmount()
    expect(revokeSpy).toHaveBeenCalledWith('blob:abc')
    vi.restoreAllMocks()
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/hooks/useObjectUrl.test.ts`
Expected: FAIL — `Failed to resolve import "./useObjectUrl"` / `useObjectUrl is not a function`.

- [ ] **Step 4: Write the implementation**

Create `src/hooks/useObjectUrl.ts`:

```ts
import { useEffect, useState } from 'react'

/** Create an object URL for a File and revoke it on unmount / file change. */
export function useObjectUrl(file: File): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/hooks/useObjectUrl.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useObjectUrl.ts src/hooks/useObjectUrl.test.ts src/test/setup.ts
git commit -m "feat: add useObjectUrl hook + jsdom object-URL stub"
```

---

### Task 2: `useFileAttachments` hook (+ install react-dropzone)

**Files:**
- Create: `src/hooks/useFileAttachments.ts`
- Create: `src/hooks/useFileAttachments.test.ts`
- Modify: `package.json` (adds `react-dropzone` dependency)

**Interfaces:**
- Consumes: `react-dropzone`'s `useDropzone`.
- Produces:
  ```ts
  const MAX_FILES = 10
  const MAX_FILE_BYTES = 10 * 1024 * 1024
  interface UseFileAttachments {
    files: File[]
    getRootProps: () => Record<string, unknown>
    getInputProps: () => Record<string, unknown>
    open: () => void
    addFiles: (incoming: File[]) => void
    removeFile: (index: number) => void
    clear: () => void
  }
  function useFileAttachments(): UseFileAttachments
  ```

- [ ] **Step 1: Install react-dropzone**

Run: `npm install react-dropzone`
Expected: `package.json` `dependencies` gains `react-dropzone` (latest, compatible with React 19). If npm prints a peer-dependency warning about React, that is acceptable — the library supports React ≥16.8.

- [ ] **Step 2: Write the failing test**

Create `src/hooks/useFileAttachments.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useFileAttachments, MAX_FILES, MAX_FILE_BYTES } from './useFileAttachments'

const f = (name: string, size = 10, type = 'image/png') => {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('useFileAttachments', () => {
  it('appends added files', () => {
    const { result } = renderHook(() => useFileAttachments())
    act(() => result.current.addFiles([f('a.png'), f('b.pdf', 10, 'application/pdf')]))
    expect(result.current.files.map((x) => x.name)).toEqual(['a.png', 'b.pdf'])
  })

  it('ignores duplicate filenames', () => {
    const { result } = renderHook(() => useFileAttachments())
    act(() => result.current.addFiles([f('a.png')]))
    act(() => result.current.addFiles([f('a.png')]))
    expect(result.current.files).toHaveLength(1)
  })

  it('drops files over the size cap and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() => useFileAttachments())
    act(() => result.current.addFiles([f('big.png', MAX_FILE_BYTES + 1)]))
    expect(result.current.files).toHaveLength(0)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('caps the number of files at MAX_FILES', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() => useFileAttachments())
    const many = Array.from({ length: MAX_FILES + 3 }, (_, i) => f(`f${i}.png`))
    act(() => result.current.addFiles(many))
    expect(result.current.files).toHaveLength(MAX_FILES)
    warn.mockRestore()
  })

  it('removes a file by index and clears all', () => {
    const { result } = renderHook(() => useFileAttachments())
    act(() => result.current.addFiles([f('a.png'), f('b.png')]))
    act(() => result.current.removeFile(0))
    expect(result.current.files.map((x) => x.name)).toEqual(['b.png'])
    act(() => result.current.clear())
    expect(result.current.files).toHaveLength(0)
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/hooks/useFileAttachments.test.ts`
Expected: FAIL — cannot resolve `./useFileAttachments`.

- [ ] **Step 4: Write the implementation**

Create `src/hooks/useFileAttachments.ts`:

```ts
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

export const MAX_FILES = 10
export const MAX_FILE_BYTES = 10 * 1024 * 1024

const ACCEPT = {
  'image/*': [],
  'application/pdf': [],
  'application/msword': [],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
}

export function useFileAttachments() {
  const [files, setFiles] = useState<File[]>([])

  const addFiles = useCallback((incoming: File[]) => {
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name))
      const next = [...prev]
      const rejected: string[] = []
      for (const file of incoming) {
        if (names.has(file.name)) continue
        if (file.size > MAX_FILE_BYTES) { rejected.push(`${file.name} (quá lớn)`); continue }
        if (next.length >= MAX_FILES) { rejected.push(`${file.name} (vượt giới hạn ${MAX_FILES} tệp)`); continue }
        next.push(file)
        names.add(file.name)
      }
      if (rejected.length) console.warn('Đã bỏ qua tệp đính kèm:', rejected.join(', '))
      return next
    })
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clear = useCallback(() => setFiles([]), [])

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop: addFiles,
    noClick: true,
    noKeyboard: true,
    accept: ACCEPT,
  })

  return { files, getRootProps, getInputProps, open, addFiles, removeFile, clear }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/hooks/useFileAttachments.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/hooks/useFileAttachments.ts src/hooks/useFileAttachments.test.ts
git commit -m "feat: add useFileAttachments hook (dropzone, dedup, caps)"
```

---

### Task 3: `FileChips` display component

**Files:**
- Create: `src/components/chat/FileChips.tsx`
- Create: `src/components/chat/FileChips.test.tsx`

**Interfaces:**
- Consumes: `useObjectUrl` (Task 1).
- Produces: `function FileChips({ files, onRemove }: { files: File[]; onRemove?: (index: number) => void }): JSX.Element | null`. When `onRemove` is supplied, each item shows a remove button (`aria-label={`Xoá ${file.name}`}`) that calls `onRemove(originalIndex)`. When omitted, items are read-only.

- [ ] **Step 1: Write the failing test**

Create `src/components/chat/FileChips.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FileChips } from './FileChips'

const img = new File(['x'], 'photo.png', { type: 'image/png' })
const pdf = new File(['x'], 'doc.pdf', { type: 'application/pdf' })

describe('FileChips', () => {
  it('renders image thumbnails and file chips', () => {
    render(<FileChips files={[img, pdf]} />)
    expect(screen.getByRole('img', { name: 'photo.png' })).toBeInTheDocument()
    expect(screen.getByText('doc.pdf')).toBeInTheDocument()
  })

  it('shows remove buttons when onRemove is provided and fires with the original index', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(<FileChips files={[img, pdf]} onRemove={onRemove} />)
    await user.click(screen.getByLabelText('Xoá doc.pdf'))
    expect(onRemove).toHaveBeenCalledWith(1)
  })

  it('renders read-only (no remove buttons) when onRemove is omitted', () => {
    render(<FileChips files={[pdf]} />)
    expect(screen.queryByLabelText('Xoá doc.pdf')).not.toBeInTheDocument()
  })

  it('renders nothing for an empty file list', () => {
    const { container } = render(<FileChips files={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/chat/FileChips.test.tsx`
Expected: FAIL — cannot resolve `./FileChips`.

- [ ] **Step 3: Write the implementation**

Create `src/components/chat/FileChips.tsx`:

```tsx
import { FileText, Music2, X, File as FileIcon, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useObjectUrl } from '@/hooks/useObjectUrl'

export function FileChips({
  files,
  onRemove,
}: {
  files: File[]
  onRemove?: (index: number) => void
}) {
  if (files.length === 0) return null
  const indexed = files.map((file, idx) => ({ file, idx }))
  const images = indexed.filter(({ file }) => file.type.startsWith('image/'))
  const others = indexed.filter(({ file }) => !file.type.startsWith('image/'))

  return (
    <div className="flex flex-col gap-2 px-1 pb-2 pt-1">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map(({ file, idx }) => (
            <ImageThumb key={`${file.name}-${idx}`} file={file} onRemove={onRemove && (() => onRemove(idx))} />
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {others.map(({ file, idx }) => (
            <FileChip key={`${file.name}-${idx}`} file={file} onRemove={onRemove && (() => onRemove(idx))} />
          ))}
        </div>
      )}
    </div>
  )
}

function ImageThumb({ file, onRemove }: { file: File; onRemove?: () => void }) {
  const url = useObjectUrl(file)
  return (
    <div className="group relative h-16 w-16 overflow-hidden rounded-[10px] border border-border bg-muted">
      {url && <img src={url} alt={file.name} className="absolute inset-0 h-full w-full object-cover" />}
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={`Xoá ${file.name}`}
          className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100"
        >
          <X />
        </Button>
      )}
    </div>
  )
}

function FileChip({ file, onRemove }: { file: File; onRemove?: () => void }) {
  const Icon = getFileIcon(file)
  return (
    <div className="group inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-border bg-background px-2.5">
      <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <span className="max-w-[160px] truncate text-[12.5px] font-medium text-muted-foreground">{file.name}</span>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={`Xoá ${file.name}`}
          className="ml-0.5 h-4 w-4 rounded-full bg-muted hover:bg-foreground/15"
        >
          <X />
        </Button>
      )}
    </div>
  )
}

function getFileIcon(file: File): LucideIcon {
  if (file.type.startsWith('audio/')) return Music2
  if (
    file.type === 'application/pdf' ||
    file.type.startsWith('text/') ||
    /\.(md|txt|doc|docx)$/i.test(file.name)
  )
    return FileText
  return FileIcon
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/chat/FileChips.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/FileChips.tsx src/components/chat/FileChips.test.tsx
git commit -m "feat: add FileChips component (image thumbs + file chips)"
```

---

### Task 4: `Attachment` type + store `sendChatMessage(text, files?)`

**Files:**
- Modify: `src/types.ts` (add `Attachment` interface + `Message.attachments`)
- Modify: `src/store/useWidgetStore.ts:115-135` (`sendChatMessage`)
- Modify: `src/store/useWidgetStore.test.ts` (add attachment tests to the `chat` describe block)

**Interfaces:**
- Consumes: nothing new.
- Produces:
  ```ts
  interface Attachment { name: string; type: string; size: number; file: File }
  // Message gains: attachments?: Attachment[]
  sendChatMessage: (text: string, files?: File[]) => void
  ```

- [ ] **Step 1: Write the failing tests**

In `src/store/useWidgetStore.test.ts`, add these tests inside the existing `describe('chat', …)` block (it already has `beforeEach(() => { reset(); vi.useFakeTimers() })`):

```ts
  it('sendChatMessage stores attachments on the user message', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    useWidgetStore.getState().sendChatMessage('có tệp', [file])
    const last = useWidgetStore.getState().messages.at(-1)
    expect(last).toMatchObject({ role: 'user', text: 'có tệp' })
    expect(last?.attachments).toHaveLength(1)
    expect(last?.attachments?.[0]).toMatchObject({ name: 'a.png', type: 'image/png' })
    expect(last?.attachments?.[0].file).toBe(file)
  })

  it('allows sending with files and empty text', () => {
    const before = useWidgetStore.getState().messages.length
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    useWidgetStore.getState().sendChatMessage('', [file])
    const s = useWidgetStore.getState()
    expect(s.messages.length).toBe(before + 1)
    expect(s.messages.at(-1)?.attachments).toHaveLength(1)
  })

  it('is still a no-op with empty text and no files', () => {
    const before = useWidgetStore.getState().messages.length
    useWidgetStore.getState().sendChatMessage('   ')
    expect(useWidgetStore.getState().messages.length).toBe(before)
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/store/useWidgetStore.test.ts`
Expected: FAIL — `sendChatMessage('có tệp', [file])` is a type/arity error (2nd arg not accepted) and `attachments` is undefined.

- [ ] **Step 3: Add the `Attachment` type**

In `src/types.ts`, add the interface above `Message` (e.g. right after the `TaskInlinePayload` interface):

```ts
export interface Attachment {
  name: string
  type: string
  size: number
  file: File
}
```

And add the field to `Message` (after the `text?` field):

```ts
  /** files attached to a user message (mock — held in memory, never uploaded) */
  attachments?: Attachment[]
```

- [ ] **Step 4: Update `sendChatMessage`**

In `src/store/useWidgetStore.ts`, import `Attachment` in the existing type import:

```ts
import type { Attachment, Message, Notification, Task, TaskFilter, Tab, Theme } from '@/types'
```

Replace the current `sendChatMessage` (lines ~115-135) with:

```ts
  sendChatMessage: (text, files) => {
    const trimmed = text.trim()
    const attachments: Attachment[] | undefined =
      files && files.length > 0
        ? files.map((f) => ({ name: f.name, type: f.type, size: f.size, file: f }))
        : undefined
    if (!trimmed && !attachments) return
    const time = nowTime()
    set((s) => ({
      messages: [
        ...s.messages,
        { id: nextId(), role: 'user', time, kind: 'text', text: trimmed, attachments },
      ],
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
```

Also update the interface declaration near the top of the file (line ~35):

```ts
  sendChatMessage: (text: string, files?: File[]) => void
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/store/useWidgetStore.test.ts`
Expected: PASS (all chat tests, including the 3 new ones). The existing `ignores empty / whitespace-only input` test still passes.

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/store/useWidgetStore.ts src/store/useWidgetStore.test.ts
git commit -m "feat: carry attachments through sendChatMessage"
```

---

### Task 5: Wire attachments into the `Composer`

**Files:**
- Modify: `src/components/chat/Composer.tsx`
- Modify: `src/components/chat/Composer.test.tsx` (add attachment tests; existing voice tests must keep passing)

**Interfaces:**
- Consumes: `useFileAttachments` (Task 2), `FileChips` (Task 3). `onSend` prop type becomes `(text: string, files?: File[]) => void`.
- Produces: a composer that opens the picker from the paperclip, shows chips, accepts image paste, sends files, and clears after send. Textarea max-height is 160px.

- [ ] **Step 1: Write the failing tests**

Add to `src/components/chat/Composer.test.tsx` a new describe block (keep the existing `Composer voice input` block untouched):

```tsx
describe('Composer attachments', () => {
  function fileInput(container: HTMLElement): HTMLInputElement {
    return container.querySelector('input[type="file"]') as HTMLInputElement
  }

  it('opens the file picker when the paperclip is clicked', async () => {
    const user = userEvent.setup()
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click')
    render(<Composer placeholder="Nhắn…" onSend={vi.fn()} />)
    await user.click(screen.getByTitle('Đính kèm'))
    expect(clickSpy).toHaveBeenCalled()
    clickSpy.mockRestore()
  })

  it('shows a chip when a file is added and removes it on ✕', async () => {
    const user = userEvent.setup()
    const { container } = render(<Composer placeholder="Nhắn…" onSend={vi.fn()} />)
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })
    await user.upload(fileInput(container), file)
    expect(await screen.findByText('doc.pdf')).toBeInTheDocument()
    await user.click(screen.getByLabelText('Xoá doc.pdf'))
    expect(screen.queryByText('doc.pdf')).not.toBeInTheDocument()
  })

  it('sends text and files together, then clears', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    const { container } = render(<Composer placeholder="Nhắn…" onSend={onSend} />)
    await user.type(screen.getByRole('textbox'), 'kèm tệp')
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })
    await user.upload(fileInput(container), file)
    await screen.findByText('doc.pdf')
    await user.click(screen.getByTitle('Gửi'))
    expect(onSend).toHaveBeenCalledTimes(1)
    const [text, files] = onSend.mock.calls[0]
    expect(text).toBe('kèm tệp')
    expect(files).toHaveLength(1)
    expect(files[0].name).toBe('doc.pdf')
    expect(screen.getByRole('textbox')).toHaveValue('')
    expect(screen.queryByText('doc.pdf')).not.toBeInTheDocument()
  })

  it('sends with files even when the text is empty', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    const { container } = render(<Composer placeholder="Nhắn…" onSend={onSend} />)
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })
    await user.upload(fileInput(container), file)
    await screen.findByText('doc.pdf')
    await user.click(screen.getByTitle('Gửi'))
    const [text, files] = onSend.mock.calls[0]
    expect(text).toBe('')
    expect(files).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/chat/Composer.test.tsx`
Expected: FAIL — no `input[type="file"]`, no `Đính kèm` handler wiring, `onSend` not called with files.

- [ ] **Step 3: Rewrite `Composer.tsx`**

Replace the entire file `src/components/chat/Composer.tsx` with:

```tsx
import { useRef, useState } from 'react'
import { Paperclip, Mic, Send, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useFileAttachments } from '@/hooks/useFileAttachments'
import { FileChips } from './FileChips'

// Fixed, varied bar heights (px) so the waveform is deterministic, not re-randomized per render.
const WAVE_BARS = [10, 16, 22, 14, 8, 18, 24, 12, 20, 16, 10, 22, 14, 18, 8, 24, 12, 20, 16, 10]
const MAX_TEXTAREA_HEIGHT = 160

const merge = (...parts: string[]) => parts.map((s) => s.trim()).filter(Boolean).join(' ')

export function Composer({
  placeholder,
  onSend,
}: {
  placeholder: string
  onSend: (text: string, files?: File[]) => void
}) {
  const [value, setValue] = useState('')
  const textBeforeRecordRef = useRef('')
  const speech = useSpeechRecognition()
  const attach = useFileAttachments()

  const submit = () => {
    const t = value.trim()
    if (!t && attach.files.length === 0) return
    onSend(t, attach.files.length > 0 ? attach.files : undefined)
    setValue('')
    attach.clear()
  }

  // While recording, the textarea shows pre-record text + the live transcript.
  const displayValue = speech.isListening ? merge(textBeforeRecordRef.current, speech.transcript) : value
  const canSend = value.trim().length > 0 || attach.files.length > 0

  const startRecording = () => {
    textBeforeRecordRef.current = value
    speech.start()
  }
  const confirmRecording = () => {
    const merged = merge(textBeforeRecordRef.current, speech.transcript)
    speech.stop()
    setValue(merged)
  }
  const cancelRecording = () => {
    speech.cancel()
    setValue(textBeforeRecordRef.current)
  }

  return (
    <div className="flex-shrink-0 border-t border-border/60 px-3 py-2" {...attach.getRootProps()}>
      <input {...attach.getInputProps()} />
      <div className="rounded-[14px] border border-border bg-muted/60 focus-within:border-primary">
        {attach.files.length > 0 && <FileChips files={attach.files} onRemove={attach.removeFile} />}
        <div className="relative flex items-end gap-2 py-1 pl-2.5 pr-1.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            title="Đính kèm"
            onClick={attach.open}
            className="flex-shrink-0"
          >
            <Paperclip />
          </Button>
          <Textarea
            rows={1}
            value={displayValue}
            placeholder={placeholder}
            onChange={(e) => {
              if (speech.isListening) return
              setValue(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = `${Math.min(e.target.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
            }}
            onPaste={(e) => {
              if (speech.isListening) return
              const images = Array.from(e.clipboardData.items)
                .filter((it) => it.kind === 'file' && it.type.startsWith('image/'))
                .map((it) => it.getAsFile())
                .filter((f): f is File => f !== null)
              if (images.length > 0) {
                e.preventDefault()
                attach.addFiles(images)
              }
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            className="min-h-0 max-h-[160px] flex-1 resize-none border-0 bg-transparent px-0 py-1.5 text-[13.5px] md:text-[13.5px] shadow-none focus-visible:ring-0"
          />
          {!speech.isListening && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              title={speech.isSupported ? 'Nhập bằng giọng nói' : 'Trình duyệt không hỗ trợ ghi âm'}
              disabled={!speech.isSupported}
              onClick={startRecording}
              className="flex-shrink-0"
            >
              <Mic />
            </Button>
          )}
          <Button type="button" size="icon" title="Gửi" onClick={submit} disabled={!canSend} className="flex-shrink-0">
            <Send />
          </Button>

          {speech.isListening && (
            <div
              data-testid="recording-overlay"
              className="absolute inset-0 z-10 flex items-center justify-center gap-3 rounded-[14px] bg-muted"
            >
              <div className="flex flex-1 items-center justify-center gap-[2px]" style={{ maxWidth: 200 }} aria-hidden="true">
                {WAVE_BARS.map((h, i) => (
                  <span
                    key={i}
                    className="w-[3px] rounded-full bg-primary animate-wave"
                    style={{ height: h, animationDelay: `${i * 0.05}s` }}
                  />
                ))}
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                title="Hủy ghi âm"
                aria-label="Hủy ghi âm"
                onClick={cancelRecording}
                className="flex-shrink-0 text-destructive hover:text-destructive"
              >
                <X />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                title="Lưu ghi âm"
                aria-label="Lưu ghi âm"
                onClick={confirmRecording}
                className="flex-shrink-0 text-[hsl(var(--status-done))] hover:text-[hsl(var(--status-done))]"
              >
                <Check />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

Notes for the implementer:
- The recording overlay is `absolute inset-0` over the **input row** (the `relative` flex div), so it covers the textarea/buttons but not the chips above — this matches the prior behavior.
- `getRootProps()` is spread on the outer wrapper so drag-and-drop works anywhere on the composer; `noClick`/`noKeyboard` in the hook prevent it from hijacking clicks/keys.
- The Send button is now `disabled={!canSend}`; during recording the overlay covers it, so this does not affect the voice flow.

- [ ] **Step 4: Run the Composer tests to verify they pass**

Run: `npx vitest run src/components/chat/Composer.test.tsx`
Expected: PASS — the 4 existing voice tests and the 4 new attachment tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/Composer.tsx src/components/chat/Composer.test.tsx
git commit -m "feat: wire file attachments + taller auto-grow into Composer"
```

---

### Task 6: Render attachments in the message bubble

**Files:**
- Modify: `src/components/shared/MessageBubble.tsx`
- Modify: `src/components/chat/MessageList.tsx:23` (pass `attachments`)
- Create: `src/components/shared/MessageBubble.test.tsx`

**Interfaces:**
- Consumes: `FileChips` (Task 3), `Attachment` (Task 4).
- Produces: `MessageBubble` accepts an optional `attachments?: Attachment[]` prop and renders them read-only (no remove buttons).

- [ ] **Step 1: Write the failing test**

Create `src/components/shared/MessageBubble.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MessageBubble } from './MessageBubble'
import type { Attachment } from '@/types'

const att = (name: string, type: string): Attachment => {
  const file = new File(['x'], name, { type })
  return { name, type, size: file.size, file }
}

describe('MessageBubble attachments', () => {
  it('renders attachment chips read-only when attachments are provided', () => {
    render(<MessageBubble role="user" text="có tệp" attachments={[att('doc.pdf', 'application/pdf')]} />)
    expect(screen.getByText('doc.pdf')).toBeInTheDocument()
    expect(screen.queryByLabelText('Xoá doc.pdf')).not.toBeInTheDocument()
  })

  it('renders no chips when there are no attachments', () => {
    render(<MessageBubble role="user" text="không tệp" />)
    expect(screen.queryByText('doc.pdf')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/shared/MessageBubble.test.tsx`
Expected: FAIL — `MessageBubble` does not accept `attachments` / chips not rendered.

- [ ] **Step 3: Update `MessageBubble.tsx`**

Replace `src/components/shared/MessageBubble.tsx` with:

```tsx
import { Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Attachment, Role } from '@/types'
import { FileChips } from '@/components/chat/FileChips'

export function MessageBubble({
  role, time, text, html, attachments, children,
}: {
  role: Role
  time?: string
  text?: string
  html?: string
  attachments?: Attachment[]
  children?: React.ReactNode
}) {
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
          {attachments && attachments.length > 0 && (
            <FileChips files={attachments.map((a) => a.file)} />
          )}
          {children}
        </div>
        {time && <div className="px-1 text-[10.5px] text-muted-foreground">{time}</div>}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Pass `attachments` from `MessageList`**

In `src/components/chat/MessageList.tsx`, update the `MessageBubble` usage (line ~23) to forward attachments:

```tsx
            <MessageBubble role={m.role} time={m.time} text={m.text} html={m.html} attachments={m.attachments}>
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/components/shared/MessageBubble.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Run the full suite + typecheck**

Run: `npx vitest run` then `npx tsc --noEmit`
Expected: all test files pass; `tsc` reports no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/shared/MessageBubble.tsx src/components/shared/MessageBubble.test.tsx src/components/chat/MessageList.tsx
git commit -m "feat: render message attachments read-only in the bubble"
```

---

## Self-Review

**Spec coverage:**
- Paperclip → picker → Task 5 (`onClick={attach.open}`). ✅
- Drag-drop → Task 5 (`getRootProps` on wrapper). ✅
- Image paste → Task 5 (`onPaste`). ✅
- Removable chips in composer → Tasks 3 + 5. ✅
- Attachments carried with message → Task 4. ✅
- Read-only chips in bubble → Tasks 3 + 6. ✅
- Taller auto-grow (90→160) → Task 5. ✅
- `useObjectUrl`, `useFileAttachments`, `FileChips`, accept set, dedup, caps, `console.warn` → Tasks 1-3. ✅
- Edge cases (dup, oversize, over-count, empty-text+files, non-image paste, URL revoke, recording) → covered across tasks/tests. ✅
- All "Files Touched" entries from the spec map to a task. ✅

**Placeholder scan:** No TBD/TODO; every code step contains complete code and exact run commands. ✅

**Type consistency:** `useFileAttachments` returns `{ files, getRootProps, getInputProps, open, addFiles, removeFile, clear }` — consumed exactly so in Task 5. `Attachment { name, type, size, file }` defined in Task 4, consumed in Tasks 4/6 with matching fields. `sendChatMessage(text, files?)` defined in Task 4, matches `Composer.onSend` type in Task 5. `FileChips({ files, onRemove? })` defined in Task 3, consumed read-only (Task 6) and removable (Task 5). lucide `File` aliased to `FileIcon` (Task 3) to avoid shadowing DOM `File`. ✅
