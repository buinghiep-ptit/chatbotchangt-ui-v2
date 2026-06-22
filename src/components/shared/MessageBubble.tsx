import { Bot } from 'lucide-react'
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
      {!isUser && (
        <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] text-white"
          style={{ background: 'linear-gradient(135deg, hsl(var(--header-grad-a)), hsl(var(--header-grad-b)))' }}>
          <Bot className="h-[15px] w-[15px]" />
        </div>
      )}
      <div className={cn('flex flex-col gap-0.5', isUser ? 'max-w-[88%] items-end' : 'max-w-[78%]')}>
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
