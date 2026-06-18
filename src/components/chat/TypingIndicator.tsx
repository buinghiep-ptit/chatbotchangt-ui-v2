import { Bot } from 'lucide-react'

export function TypingIndicator() {
  return (
    <div className="flex max-w-full gap-2.5">
      <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] text-white"
        style={{ background: 'linear-gradient(135deg, hsl(var(--header-grad-a)), hsl(var(--header-grad-b)))' }}>
        <Bot className="h-[15px] w-[15px]" />
      </div>
      <div className="glass flex items-center gap-1 rounded-[14px] rounded-bl-[4px] px-3.5 py-3">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-[7px] w-[7px] animate-blink rounded-full bg-muted-foreground"
            style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  )
}
