import { useState } from 'react'
import { Paperclip, Mic, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function Composer({ placeholder, onSend }: { placeholder: string; onSend: (text: string) => void }) {
  const [value, setValue] = useState('')
  const submit = () => { const t = value.trim(); if (!t) return; onSend(t); setValue('') }
  return (
    <div className="flex-shrink-0 border-t border-border/60 px-3 py-2">
      <div className="flex items-end gap-2 rounded-[14px] border border-border bg-muted/60 py-1 pl-2.5 pr-1.5 focus-within:border-primary">
        <Button type="button" size="icon" variant="ghost" title="Đính kèm" className="flex-shrink-0">
          <Paperclip className="h-[19px] w-[19px]" />
        </Button>
        <Textarea
          rows={1}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = `${Math.min(e.target.scrollHeight, 90)}px`
          }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
          className="min-h-0 max-h-[90px] flex-1 resize-none border-0 bg-transparent py-1.5 text-[13.5px] shadow-none focus-visible:ring-0"
        />
        <Button type="button" size="icon" variant="ghost" title="Nhập bằng giọng nói" className="flex-shrink-0">
          <Mic className="h-[19px] w-[19px]" />
        </Button>
        <Button type="button" size="icon" title="Gửi" onClick={submit} className="flex-shrink-0">
          <Send className="h-[18px] w-[18px]" />
        </Button>
      </div>
    </div>
  )
}
