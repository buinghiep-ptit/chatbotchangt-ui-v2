import { MessageCircle } from 'lucide-react'
import { useWidgetStore } from '@/store/useWidgetStore'

export function Launcher() {
  const { minimized, setMinimized } = useWidgetStore()
  if (!minimized) return null
  return (
    <button type="button" onClick={() => setMinimized(false)}
      className="fixed bottom-6 right-6 z-20 hidden h-[60px] w-[60px] items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 sm:flex max-[480px]:!hidden"
      style={{ background: 'linear-gradient(135deg, hsl(var(--header-grad-a)), hsl(var(--header-grad-b)))' }}>
      <MessageCircle className="h-6 w-6" />
      <span className="absolute right-3 top-3 h-3 w-3 rounded-full border-2 border-white bg-[hsl(var(--status-alert))]" />
    </button>
  )
}
