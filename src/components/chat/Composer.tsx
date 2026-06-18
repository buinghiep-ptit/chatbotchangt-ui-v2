import { useState } from 'react'
import { Paperclip, Mic, Send } from 'lucide-react'

export function Composer({ placeholder, onSend }: { placeholder: string; onSend: (text: string) => void }) {
  const [value, setValue] = useState('')
  const submit = () => { const t = value.trim(); if (!t) return; onSend(t); setValue('') }
  return (
    <div className="flex-shrink-0 border-t border-border/60 px-3 py-2">
      <div className="flex items-end gap-2 rounded-[14px] border border-border bg-muted/60 py-1 pl-2.5 pr-1.5 focus-within:border-primary">
        <button type="button" title="Đính kèm" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] text-muted-foreground hover:bg-muted">
          <Paperclip className="h-[19px] w-[19px]" />
        </button>
        <textarea
          rows={1}
          value={value}
          placeholder={placeholder}
          onChange={(e) => { setValue(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 90)}px` }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
          className="max-h-[90px] flex-1 resize-none bg-transparent py-1.5 text-[13.5px] outline-none placeholder:text-muted-foreground"
        />
        <button type="button" title="Nhập bằng giọng nói" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] text-muted-foreground hover:bg-muted">
          <Mic className="h-[19px] w-[19px]" />
        </button>
        <button type="button" title="Gửi" onClick={submit} className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] bg-primary text-white hover:opacity-90">
          <Send className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  )
}
