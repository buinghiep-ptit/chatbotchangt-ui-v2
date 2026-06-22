import { SquarePen, Sun, Moon } from 'lucide-react'
import { useWidgetStore } from '@/store/useWidgetStore'

export function MoreSheetContent() {
  const { newChat, cycleTheme, theme, closeSheet } = useWidgetStore()

  const actions = [
    {
      icon: SquarePen,
      label: 'Tạo cuộc trò chuyện mới',
      onClick: () => { newChat(); closeSheet() },
    },
    {
      icon: theme === 'dark' ? Sun : Moon,
      label: theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối',
      onClick: () => { cycleTheme(); closeSheet() },
    },
  ]

  return (
    <div className="px-4 pb-6 pt-2">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Tùy chọn
      </p>
      <div className="flex flex-col gap-1">
        {actions.map(({ icon: Icon, label, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-accent active:bg-accent"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-4.5 w-4.5" />
            </span>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
