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
            if (speech.isListening) return
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
              className="flex-shrink-0 text-[hsl(var(--status-done))] hover:text-[hsl(var(--status-done))]"
            >
              <Check />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
