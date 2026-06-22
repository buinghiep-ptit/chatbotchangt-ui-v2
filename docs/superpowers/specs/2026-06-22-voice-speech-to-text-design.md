# Voice (Speech-to-Text) Input for the Composer

**Date:** 2026-06-22
**Status:** Approved design — ready for implementation plan

## Summary

Add a working voice-input button to the chat Composer. Tapping the mic starts
browser-native speech recognition (Web Speech API, `vi-VN`), streams the
transcript live into the message textarea, and shows a recording overlay with an
animated waveform plus confirm/cancel controls. Confirming keeps the
transcribed text in the input for the user to send manually; cancelling
restores the text that was there before recording.

The behavior is modeled on the existing implementation in the `chatbot-sdk`
project (`src/components/ChatForm.tsx`), re-expressed in this project's design
system (lucide icons, the shadcn-style `Button`, Tailwind + CSS variables) and
with the recording logic extracted into a reusable hook.

## Goals

- Wire the currently-inert `<Mic/>` placeholder button in
  `src/components/chat/Composer.tsx` to real speech-to-text.
- Show clear in-progress feedback while recording: animated waveform, confirm
  (✓) and cancel (✕) controls — "hiển thị trong quá trình thu âm".
- Stream interim results into the textarea live.
- Degrade gracefully on unsupported browsers and denied permissions.

## Non-Goals

- No backend transcription service (no Whisper / cloud STT). Browser-native
  Web Speech API only.
- No audio recording/playback, no storage of audio.
- No auto-send on confirm — the existing Send flow is unchanged.
- No new `Message` kind and no Zustand store changes.
- No multi-language UI; `vi-VN` is hardcoded to match the app.

## Architecture

### Decision: extract a hook, don't inline

The reference keeps all recognition logic (refs, restart timers, manual DOM
writes) inside its form component. This project favors smaller, testable units,
so the recognition lifecycle lives in a dedicated hook and `Composer` stays a
view that consumes it.

- **Alternative considered — inline in `Composer`:** faster to port verbatim,
  but bloats the component and is hard to unit-test. Rejected.

### Components

#### 1. `src/hooks/useSpeechRecognition.ts` (new)

Wraps `window.SpeechRecognition || window.webkitSpeechRecognition`.

Configuration:
- `lang = 'vi-VN'`
- `interimResults = true`
- `maxAlternatives = 1`
- `continuous = true` on non-Android; `false` on Android (UA guard), matching
  the reference. Auto-restart on `onend` while still listening so long
  dictation isn't cut off by the engine.

Public API:

```ts
interface UseSpeechRecognition {
  isSupported: boolean      // API present in this browser
  isListening: boolean      // recognition active
  transcript: string        // committed-session text + current interim, joined
  start: () => void         // begin a session
  stop: () => void          // stop and keep transcript (confirm)
  cancel: () => void        // stop and clear this session's transcript (cancel)
  reset: () => void         // clear transcript back to empty
}
```

Internal state mirrors the reference's split so interim text doesn't duplicate:
- a committed-this-session buffer (finalized phrases),
- an interim buffer (latest partial),
- `transcript` = the two joined with single spaces.

Error handling:
- `no-speech` → ignored.
- `not-allowed` / `service-not-allowed` → stop listening, set `isListening`
  false (overlay drops silently).
- other errors → `console.warn`, keep state consistent.

Cleanup: on unmount, abort recognition and clear any pending restart timer.

#### 2. `src/components/chat/Composer.tsx` (edit)

- Instantiate the hook.
- The existing `<Mic/>` button:
  - `disabled` when `!isSupported`, with title "Trình duyệt không hỗ trợ ghi
    âm". Otherwise `onClick={startRecording}`.
  - Hidden while `isListening` (the overlay owns that space), matching the
    reference.
- On `start`, snapshot the current textarea value
  (`textBeforeRecord`) so cancel can restore it.
- While listening, the textarea `value` shows
  `joinText(textBeforeRecord, hook.transcript)` so dictation appends to any
  text the user already typed.
- **Recording overlay** — absolutely positioned over the input row
  (`position: absolute`, covering the rounded input container), `z` above the
  textarea, rendered only while `isListening`:
  - animated waveform (see below),
  - red ✕ button → `cancel()`: restore `textBeforeRecord`, drop overlay,
  - green ✓ button → `stop()`: keep the streamed text in the textarea, drop
    overlay. User then presses Send as normal.
- Icons: lucide `X` and `Check` for the controls (mic stays lucide `Mic`).

#### 3. Waveform

- 20 vertical bars, fixed staggered heights (deterministic — not the
  reference's render-time `Math.random()`, so it's testable and doesn't
  re-randomize each render).
- CSS `@keyframes wave` (8px ↔ 24px) added to `src/index.css`, staggered via
  per-bar `animation-delay`.
- Bar color uses the design-system primary (`bg-primary` / `--primary`), not a
  hard-coded hex.

### Data flow

```
mic tap → hook.start()  → recognition fires onresult repeatedly
                        → hook.transcript updates (interim + final)
Composer textarea value = join(textBeforeRecord, transcript)   [live]
  ✓ confirm → hook.stop()   → value stays → user presses Send (existing flow)
  ✕ cancel  → hook.cancel() → value restored to textBeforeRecord
```

No changes to `onSend` / `sendChatMessage`; voice only populates the input.

## Edge Cases

| Case | Behavior |
|------|----------|
| Browser lacks Web Speech API | Mic button disabled + tooltip; no overlay, no crash |
| Microphone permission denied | Stop listening, overlay drops silently |
| `no-speech` engine error | Ignored; keep listening |
| Engine ends mid-session (non-Android) | Auto-restart while still listening |
| Component unmounts while recording | Abort recognition, clear restart timer |
| User had typed text before recording | Dictation appends; cancel restores exactly |

## Testing

Vitest + React Testing Library (already configured).

- **`useSpeechRecognition`** with a mocked `SpeechRecognition`:
  - `isSupported` false when the global is absent.
  - `start` sets `isListening`; feeding `onresult` interim + final events
    accumulates `transcript` correctly (no duplication).
  - `cancel` clears the session; `stop` retains transcript.
- **`Composer`**:
  - Mic tap shows the overlay; mic button hidden while recording.
  - ✕ restores pre-record textarea text and hides the overlay.
  - Unsupported browser → mic button disabled.

## Files Touched

- `src/hooks/useSpeechRecognition.ts` — new
- `src/components/chat/Composer.tsx` — edit (wire mic, overlay)
- `src/index.css` — add `@keyframes wave`
- test files for the hook and Composer — new
