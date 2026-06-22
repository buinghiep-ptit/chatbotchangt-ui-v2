import { MessageCircle } from 'lucide-react'
import { hostBridge } from '@/lib/hostBridge'

export function Bubble() {
  return (
    <div className="flex h-full w-full items-end justify-end p-1.5">
      <button
        type="button"
        aria-label="Mở trò chuyện"
        onClick={() => hostBridge.openChat()}
        className="relative flex h-[60px] w-[60px] items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, hsl(var(--header-grad-a)), hsl(var(--header-grad-b)))' }}
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute right-3 top-3 h-3 w-3 rounded-full border-2 border-white bg-[hsl(var(--status-alert))]" />
      </button>
    </div>
  )
}
