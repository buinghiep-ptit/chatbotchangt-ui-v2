import { useEffect, useRef } from 'react'
import { Copy, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useWidgetStore } from '@/store/useWidgetStore'
import { MessageBubble } from '../shared/MessageBubble'
import { TaskInlineCard } from './TaskInlineCard'
import { HitlCard } from './HitlCard'
import { TypingIndicator } from './TypingIndicator'

export function MessageList() {
  const { messages, isTyping } = useWidgetStore()
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length, isTyping])

  return (
    <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden scrollbar-thin">
      <div className="flex flex-col gap-3.5 px-3.5 pb-2 pt-4">
        <div className="text-center text-[11px] text-muted-foreground">Hôm nay · 09:45</div>
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} time={m.time} text={m.text} html={m.html}>
            {m.kind === 'taskInline' && m.taskInline && <TaskInlineCard payload={m.taskInline} />}
            {m.kind === 'hitl' && m.hitl && <HitlCard messageId={m.id} payload={m.hitl} />}
            {m.showTools && (
              <div className="mt-1 flex gap-0.5">
                {[Copy, ThumbsUp, ThumbsDown].map((Icon, i) => (
                  <button key={i} type="button" className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                    <Icon className="h-[15px] w-[15px]" />
                  </button>
                ))}
              </div>
            )}
          </MessageBubble>
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={endRef} />
      </div>
    </div>
  )
}
