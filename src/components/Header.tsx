import { Bot, Minus, Moon, SquarePen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Button } from '@/components/ui/button'

export function Header() {
  const { activeTab, newChat, cycleTheme, setMinimized } = useWidgetStore()
  const chatOnly = activeTab === 'chat'
  return (
    <div className="flex flex-shrink-0 items-center gap-3 px-4 py-3.5 text-white"
         style={{ background: 'linear-gradient(135deg, hsl(var(--header-grad-a)), hsl(var(--header-grad-b)))' }}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-xl">
        <Bot className="h-5 w-5" />
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[hsl(var(--header-grad-b))] bg-green-400" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-bold leading-tight">Chang SCC</div>
        <div className="flex items-center gap-1.5 text-[11.5px] opacity-80">Nhân sự số · Sẵn sàng</div>
      </div>
      <div className="flex gap-0.5">
        {chatOnly && (
          <HeaderButton title="Trò chuyện mới" onClick={newChat}><SquarePen /></HeaderButton>
        )}
        <HeaderButton title="Đổi giao diện" onClick={cycleTheme}><Moon /></HeaderButton>
        <HeaderButton title="Thu nhỏ" className="max-[480px]:hidden" onClick={() => setMinimized(true)}><Minus /></HeaderButton>
      </div>
    </div>
  )
}

function HeaderButton({ children, onClick, title, className = '' }: { children: React.ReactNode; onClick: () => void; title: string; className?: string }) {
  return (
    <Button size="icon" variant="ghost" title={title} onClick={onClick}
      className={cn('text-white/90 hover:bg-white/15 hover:text-white', className)}>
      {children}
    </Button>
  )
}
