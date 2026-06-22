# Voice (Speech-to-Text) Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the inert `<Mic/>` button in the chat Composer to browser-native speech-to-text, showing an animated recording overlay with confirm/cancel.

**Architecture:** A `useSpeechRecognition` hook owns the Web Speech API lifecycle (start/stop/cancel, interim streaming, auto-restart, error handling). `Composer` consumes it: the mic starts a session, a recording overlay streams the live transcript into the textarea, ✓ keeps the text for manual Send, ✕ restores the pre-record text.

**Tech Stack:** React 19 + TypeScript, Vite, Tailwind 3, shadcn-style `Button`, `lucide-react` icons, Vitest + React Testing Library.

## Global Constraints

- Speech engine: browser-native `window.SpeechRecognition || window.webkitSpeechRecognition` only — no backend/cloud STT.
- Language: `vi-VN` (hardcoded default).
- Icons: `lucide-react` only (`Mic`, `X`, `Check`).
- Buttons: use the existing `@/components/ui/button` `Button` (`size="icon"`, `variant="ghost"` for icon actions).
- Styling: Tailwind utility classes + existing CSS variables (`--primary` etc.); no inline hex colors.
- No changes to the `onSend` / `sendChatMessage` flow — voice only populates the textarea. No auto-send.
- No new `Message` kind, no Zustand store changes.
- Test command: `npx vitest run <file>` (project script: `vitest run`).

---

### Task 1: `useSpeechRecognition` hook

**Files:**
- Create: `src/hooks/useSpeechRecognition.ts`
- Test: `src/hooks/useSpeechRecognition.test.ts`

**Interfaces:**
- Consumes: nothing (leaf module).
- Produces:
  ```ts
  interface UseSpeechRecognition {
    isSupported: boolean
    isListening: boolean
    transcript: string
    start: () => void
    stop: () => void     // commit: fold interim into transcript, stop listening
    cancel: () => void   // discard: clear transcript, stop listening
    reset: () => void    // clear transcript only
  }
  function useSpeechRecognition(lang?: string): UseSpeechRecognition  // lang defaults to 'vi-VN'
  ```

- [ ] **Step 1: Write the failing test**

Create `src/hooks/useSpeechRecognition.test.ts`:

```ts
import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSpeechRecognition } from './useSpeechRecognition'

class MockSpeechRecognition {
  static instances: MockSpeechRecognition[] = []
  lang = ''
  continuous = false
  interimResults = false
  maxAlternatives = 1
  onresult: ((e: unknown) => void) | null = null
  onerror: ((e: unknown) => void) | null = null
  onend: (() => void) | null = null
  start = vi.fn()
  stop = vi.fn()
  abort = vi.fn()
  constructor() {
    MockSpeechRecognition.instances.push(this)
  }
}

// Builds an event shaped like SpeechRecognitionEvent: results[i][0].transcript + results[i].isFinal
function resultEvent(items: { transcript: string; isFinal: boolean }[], resultIndex = 0) {
  const results = items.map((it) => {
    const alt = [{ transcript: it.transcript }] as unknown as { isFinal: boolean } & Array<{ transcript: string }>
    alt.isFinal = it.isFinal
    return alt
  })
  return { resultIndex, results }
}

const lastInstance = () => MockSpeechRecognition.instances.at(-1)!

beforeEach(() => {
  MockSpeechRecognition.instances = []
  ;(window as unknown as Record<string, unknown>).SpeechRecognition = MockSpeechRecognition
  ;(window as unknown as Record<string, unknown>).webkitSpeechRecognition = MockSpeechRecognition
})

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).SpeechRecognition
  delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition
})

describe('useSpeechRecognition', () => {
  it('reports unsupported when the API is absent', () => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    const { result } = renderHook(() => useSpeechRecognition())
    expect(result.current.isSupported).toBe(false)
  })

  it('starts listening and configures vi-VN with interim results', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.start())
    expect(result.current.isListening).toBe(true)
    const rec = lastInstance()
    expect(rec.lang).toBe('vi-VN')
    expect(rec.interimResults).toBe(true)
    expect(rec.start).toHaveBeenCalled()
  })

  it('accumulates interim then final results into transcript', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.start())
    const rec = lastInstance()
    act(() => rec.onresult!(resultEvent([{ transcript: 'xin chào', isFinal: false }])))
    expect(result.current.transcript).toBe('xin chào')
    act(() => rec.onresult!(resultEvent([{ transcript: 'xin chào bạn', isFinal: true }])))
    expect(result.current.transcript).toBe('xin chào bạn')
  })

  it('cancel clears the transcript and stops listening', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.start())
    act(() => lastInstance().onresult!(resultEvent([{ transcript: 'bỏ đi', isFinal: true }])))
    act(() => result.current.cancel())
    expect(result.current.transcript).toBe('')
    expect(result.current.isListening).toBe(false)
  })

  it('stop keeps the transcript and stops listening', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.start())
    act(() => lastInstance().onresult!(resultEvent([{ transcript: 'giữ lại', isFinal: true }])))
    act(() => result.current.stop())
    expect(result.current.transcript).toBe('giữ lại')
    expect(result.current.isListening).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useSpeechRecognition.test.ts`
Expected: FAIL — cannot resolve `./useSpeechRecognition` / `useSpeechRecognition is not a function`.

- [ ] **Step 3: Write the hook**

Create `src/hooks/useSpeechRecognition.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from 'react'

type RecognitionCtor = new () => {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: unknown) => void) | null
  onerror: ((e: unknown) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, RecognitionCtor | undefined>
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function isAndroid(): boolean {
  return typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)
}

function joinText(...parts: string[]): string {
  return parts.map((p) => p.trim()).filter(Boolean).join(' ')
}

export interface UseSpeechRecognition {
  isSupported: boolean
  isListening: boolean
  transcript: string
  start: () => void
  stop: () => void
  cancel: () => void
  reset: () => void
}

export function useSpeechRecognition(lang = 'vi-VN'): UseSpeechRecognition {
  const isSupported = getRecognitionCtor() !== null

  const recognitionRef = useRef<InstanceType<RecognitionCtor> | null>(null)
  const isListeningRef = useRef(false)
  const isCancellingRef = useRef(false)
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sessionRef = useRef('') // finalized phrases this session
  const interimRef = useRef('') // latest partial phrase

  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')

  const syncTranscript = useCallback(() => {
    setTranscript(joinText(sessionRef.current, interimRef.current))
  }, [])

  const buildRecognition = useCallback(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return null
    const rec = new Ctor()
    rec.lang = lang
    rec.continuous = !isAndroid()
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onresult = (event: unknown) => {
      if (isCancellingRef.current) return
      const e = event as { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }
      let newFinal = ''
      let newInterim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) newFinal += t + ' '
        else newInterim += t
      }
      if (newFinal) sessionRef.current = joinText(sessionRef.current, newFinal)
      interimRef.current = newInterim.trim()
      syncTranscript()
    }

    rec.onerror = (event: unknown) => {
      const err = (event as { error?: string }).error
      if (err === 'no-speech') return
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        isListeningRef.current = false
        setIsListening(false)
      }
    }

    rec.onend = () => {
      if (!isListeningRef.current || isCancellingRef.current) return
      if (interimRef.current) {
        sessionRef.current = joinText(sessionRef.current, interimRef.current)
        interimRef.current = ''
        syncTranscript()
      }
      const delay = isAndroid() ? 150 : 50
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
      restartTimerRef.current = setTimeout(() => {
        if (!isListeningRef.current) return
        try {
          rec.start()
        } catch {
          /* already running */
        }
      }, delay)
    }

    return rec
  }, [lang, syncTranscript])

  const teardown = useCallback(() => {
    isListeningRef.current = false
    setIsListening(false)
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    const rec = recognitionRef.current
    if (rec) {
      try {
        rec.stop()
      } catch {
        /* not running */
      }
    }
  }, [])

  const start = useCallback(() => {
    if (!isSupported || isListeningRef.current) return
    isCancellingRef.current = false
    sessionRef.current = ''
    interimRef.current = ''
    setTranscript('')
    const rec = buildRecognition()
    if (!rec) return
    recognitionRef.current = rec
    isListeningRef.current = true
    setIsListening(true)
    try {
      rec.start()
    } catch {
      /* already running */
    }
  }, [isSupported, buildRecognition])

  const stop = useCallback(() => {
    if (interimRef.current) {
      sessionRef.current = joinText(sessionRef.current, interimRef.current)
      interimRef.current = ''
      syncTranscript()
    }
    teardown()
  }, [teardown, syncTranscript])

  const cancel = useCallback(() => {
    isCancellingRef.current = true
    sessionRef.current = ''
    interimRef.current = ''
    setTranscript('')
    teardown()
  }, [teardown])

  const reset = useCallback(() => {
    sessionRef.current = ''
    interimRef.current = ''
    setTranscript('')
  }, [])

  useEffect(() => {
    return () => {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
      const rec = recognitionRef.current
      if (rec) {
        try {
          rec.abort()
        } catch {
          /* noop */
        }
      }
    }
  }, [])

  return { isSupported, isListening, transcript, start, stop, cancel, reset }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/useSpeechRecognition.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useSpeechRecognition.ts src/hooks/useSpeechRecognition.test.ts
git commit -m "feat: add useSpeechRecognition hook (Web Speech API, vi-VN)"
```

---

### Task 2: Wire the Composer mic button + recording overlay

**Files:**
- Modify: `src/components/chat/Composer.tsx` (full rewrite, currently lines 1-36)
- Modify: `src/index.css` (add `wave` keyframes to the `@layer utilities` block, ends at line 85)
- Test: `src/components/chat/Composer.test.tsx`

**Interfaces:**
- Consumes: `useSpeechRecognition` from `@/hooks/useSpeechRecognition` (see Task 1 Produces block).
- Produces: no exported API change — `Composer({ placeholder, onSend })` signature is unchanged.

- [ ] **Step 1: Add the waveform animation to `src/index.css`**

Replace the existing `@layer utilities` block (lines 82-85):

```css
@layer utilities {
  .scrollbar-thin::-webkit-scrollbar { width: 6px; }
  .scrollbar-thin::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 6px; }
}
```

with:

```css
@layer utilities {
  .scrollbar-thin::-webkit-scrollbar { width: 6px; }
  .scrollbar-thin::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 6px; }

  @keyframes wave {
    0%, 100% { transform: scaleY(0.35); }
    50% { transform: scaleY(1); }
  }
  .animate-wave {
    transform-origin: center;
    animation: wave 0.8s ease-in-out infinite;
  }
}
```

- [ ] **Step 2: Write the failing test**

Create `src/components/chat/Composer.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Composer } from './Composer'

class MockSpeechRecognition {
  lang = ''
  continuous = false
  interimResults = false
  maxAlternatives = 1
  onresult: ((e: unknown) => void) | null = null
  onerror: ((e: unknown) => void) | null = null
  onend: (() => void) | null = null
  start = vi.fn()
  stop = vi.fn()
  abort = vi.fn()
}

beforeEach(() => {
  ;(window as unknown as Record<string, unknown>).SpeechRecognition = MockSpeechRecognition
  ;(window as unknown as Record<string, unknown>).webkitSpeechRecognition = MockSpeechRecognition
})

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).SpeechRecognition
  delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition
})

describe('Composer voice input', () => {
  it('shows the recording overlay and hides the mic when recording starts', async () => {
    const user = userEvent.setup()
    render(<Composer placeholder="Nhắn…" onSend={vi.fn()} />)
    await user.click(screen.getByTitle('Nhập bằng giọng nói'))
    expect(screen.getByTestId('recording-overlay')).toBeInTheDocument()
    expect(screen.queryByTitle('Nhập bằng giọng nói')).not.toBeInTheDocument()
  })

  it('restores the pre-record text when recording is cancelled', async () => {
    const user = userEvent.setup()
    render(<Composer placeholder="Nhắn…" onSend={vi.fn()} />)
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'đã gõ sẵn')
    await user.click(screen.getByTitle('Nhập bằng giọng nói'))
    await user.click(screen.getByLabelText('Hủy ghi âm'))
    expect(textarea).toHaveValue('đã gõ sẵn')
  })

  it('disables the mic button when speech recognition is unsupported', () => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    render(<Composer placeholder="Nhắn…" onSend={vi.fn()} />)
    expect(screen.getByTitle('Trình duyệt không hỗ trợ ghi âm')).toBeDisabled()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/chat/Composer.test.tsx`
Expected: FAIL — no element with title "Nhập bằng giọng nói" handles clicks / no `recording-overlay` testid (current mic button is inert).

- [ ] **Step 4: Rewrite `src/components/chat/Composer.tsx`**

Replace the entire file with:

```tsx
import { useRef, useState } from 'react'
import { Paperclip, Mic, Send, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'

// Fixed, varied bar heights (px) so the waveform is deterministic, not re-randomized per render.
const WAVE_BARS = [10, 16, 22, 14, 8, 18, 24, 12, 20, 16, 10, 22, 14, 18, 8, 24, 12, 20, 16, 10]

const merge = (...parts: string[]) => parts.map((s) => s.trim()).filter(Boolean).join(' ')

export function Composer({ placeholder, onSend }: { placeholder: string; onSend: (text: string) => void }) {
  const [value, setValue] = useState('')
  const textBeforeRecordRef = useRef('')
  const speech = useSpeechRecognition()

  const submit = () => { const t = value.trim(); if (!t) return; onSend(t); setValue('') }

  // While recording, the textarea shows pre-record text + the live transcript.
  const displayValue = speech.isListening ? merge(textBeforeRecordRef.current, speech.transcript) : value

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
    <div className="flex-shrink-0 border-t border-border/60 px-3 py-2">
      <div className="relative flex items-end gap-2 rounded-[14px] border border-border bg-muted/60 py-1 pl-2.5 pr-1.5 focus-within:border-primary">
        <Button type="button" size="icon" variant="ghost" title="Đính kèm" className="flex-shrink-0">
          <Paperclip />
        </Button>
        <Textarea
          rows={1}
          value={displayValue}
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = `${Math.min(e.target.scrollHeight, 90)}px`
          }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
          className="min-h-0 max-h-[90px] flex-1 resize-none border-0 bg-transparent px-0 py-1.5 text-[13.5px] md:text-[13.5px] shadow-none focus-visible:ring-0"
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
        <Button type="button" size="icon" title="Gửi" onClick={submit} className="flex-shrink-0">
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
              className="flex-shrink-0 text-emerald-600 hover:text-emerald-600"
            >
              <Check />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/chat/Composer.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Run the full test suite + type-check**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests pass, no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/chat/Composer.tsx src/components/chat/Composer.test.tsx src/index.css
git commit -m "feat: voice speech-to-text input with recording overlay in Composer"
```

---

## Manual verification (after both tasks)

In a Chromium-based browser (`npm run dev`): open the chat, tap the mic, grant
permission, speak Vietnamese. The overlay shows an animated waveform; words
stream into the input. ✓ keeps the text (then press Send); ✕ restores whatever
was typed before. In Firefox (no Web Speech API) the mic button is disabled
with the unsupported tooltip.

## Notes for the implementer

- `renderHook`/`act` come from `@testing-library/react` (React 19 compatible).
- The mock `SpeechRecognition` is set on `window` in `beforeEach`; the hook reads the constructor lazily so it must be present before render.
- `speech.transcript` already contains interim text (the hook syncs `session + interim` on every `onresult`), so `confirmRecording` reads it directly — `speech.stop()`'s internal fold is just bookkeeping.
