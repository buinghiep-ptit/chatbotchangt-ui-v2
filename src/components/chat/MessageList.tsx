import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { useWidgetStore } from '@/store/useWidgetStore'
import { bubbleVariants } from '@/lib/motion'
import { MessageBubble } from '../shared/MessageBubble'
import { MessageActions } from './MessageActions'
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
          <motion.div key={m.id} variants={bubbleVariants} initial="hidden" animate="show">
            <MessageBubble role={m.role} time={m.time} text={m.text} html={m.html} attachments={m.attachments}>
              {m.kind === 'taskInline' && m.taskInline && <TaskInlineCard payload={m.taskInline} />}
              {m.kind === 'hitl' && m.hitl && <HitlCard messageId={m.id} payload={m.hitl} />}
            </MessageBubble>
            {m.role === 'bot' && (
              <MessageActions text={m.text} html={m.html} />
            )}
          </motion.div>
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={endRef} />
      </div>
    </div>
  )
}
