import { ChevronUp, FileText, Search, BellRing, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import { QUICK_SUGGESTIONS } from '@/data/messages'
import { Chip } from '../shared/Chip'

const ICONS = { FileText, Search, BellRing, Mail } as const

export function QuickSuggestions() {
  const { quickCollapsed, toggleQuick, sendChatMessage } = useWidgetStore()
  return (
    <div className="flex-shrink-0 border-b border-border/60">
      <button type="button" onClick={toggleQuick}
        className="flex w-full items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-primary">
        <span>Gợi ý nhanh</span>
        <ChevronUp className={cn('h-3.5 w-3.5 transition-transform', quickCollapsed && 'rotate-180')} />
      </button>
      <div className={cn('flex flex-wrap gap-2 overflow-hidden px-3.5 transition-all', quickCollapsed ? 'max-h-0 pb-0 opacity-0' : 'max-h-52 pb-3 opacity-100')}>
        {QUICK_SUGGESTIONS.map(({ icon, label }) => {
          const Icon = ICONS[icon as keyof typeof ICONS]
          return (
            <Chip key={label} onClick={() => sendChatMessage(label)}>
              <Icon className="h-[15px] w-[15px]" />{label}
            </Chip>
          )
        })}
      </div>
    </div>
  )
}
