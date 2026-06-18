import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/types'
import { STATUS_LABEL } from '@/data/tasks'

const TONE: Record<TaskStatus, string> = {
  pending: 'bg-status-pending/15 text-status-pending',
  running: 'bg-status-running/15 text-status-running',
  done: 'bg-status-done/15 text-status-done',
  watch: 'bg-muted text-muted-foreground',
}

export function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap', TONE[status], className)}>
      {STATUS_LABEL[status]}
    </span>
  )
}
