import { FileText, Search, BellRing, Mail } from 'lucide-react'
import { useWidgetStore } from '@/store/useWidgetStore'
import { QUICK_SUGGESTIONS } from '@/data/messages'
import { Chip } from '../shared/Chip'

const ICONS = { FileText, Search, BellRing, Mail } as const

export function QuickSheetContent() {
  const { sendChatMessage, closeSheet } = useWidgetStore()
  return (
    <div className="flex flex-wrap gap-2 p-4">
      {QUICK_SUGGESTIONS.map(({ icon, label }) => {
        const Icon = ICONS[icon as keyof typeof ICONS]
        return (
          <Chip
            key={label}
            onClick={() => {
              sendChatMessage(label)
              closeSheet()
            }}
          >
            <Icon className="h-[15px] w-[15px]" />
            {label}
          </Chip>
        )
      })}
    </div>
  )
}
