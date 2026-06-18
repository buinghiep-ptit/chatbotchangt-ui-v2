import { Route, CircleCheck, TriangleAlert, BellRing, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import type { Notification, NotiKind } from '@/types'

const ICONS: Record<string, LucideIcon> = { Route, CircleCheck, TriangleAlert, BellRing }
const TONE: Record<NotiKind, string> = {
  task: 'bg-status-running/10 text-status-running',
  done: 'bg-status-done/10 text-status-done',
  hitl: 'bg-status-pending/10 text-status-pending',
  alert: 'bg-[hsl(var(--status-alert))]/10 text-[hsl(var(--status-alert))]',
}

export function NotificationItem({ noti }: { noti: Notification }) {
  const markNotiRead = useWidgetStore((s) => s.markNotiRead)
  const Icon = ICONS[noti.icon] ?? BellRing
  return (
    <button type="button" onClick={() => markNotiRead(noti.id)}
      className="relative flex w-full items-start gap-2.5 border-b border-border/60 px-4 py-3 text-left hover:bg-muted">
      {noti.unread && <span className="absolute left-1.5 top-[18px] h-[7px] w-[7px] rounded-full bg-primary" />}
      <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]', TONE[noti.kind])}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] leading-snug" dangerouslySetInnerHTML={{ __html: noti.html }} />
        <div className="mt-0.5 text-[11px] text-muted-foreground">{noti.time}</div>
      </div>
    </button>
  )
}
