import { Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Role } from '@/types'

export function MessageBubble({
  role, time, text, html, children,
}: { role: Role; time?: string; text?: string; html?: string; children?: React.ReactNode }) {
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
          {children}
        </div>
        {time && <div className="px-1 text-[10.5px] text-muted-foreground">{time}</div>}
      </div>
    </div>
  )
}
