import { Route, Sparkles, Bot, Clock, Activity } from 'lucide-react'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '../shared/StatusBadge'
import type { Task } from '@/types'

export function TaskCard({ task }: { task: Task }) {
  const openTask = useWidgetStore((s) => s.openTask)
  const TypeIcon = task.type === 'workflow' ? Route : Sparkles
  const typeTone = task.type === 'workflow' ? 'bg-status-running/10 text-status-running' : 'bg-primary/10 text-primary'
  return (
    <Button variant="ghost" onClick={() => openTask(task.id)}
      className="h-auto w-full flex-col items-start justify-start whitespace-normal rounded-[14px] border border-border bg-muted/50 p-3 text-left transition-colors hover:bg-muted">
      <div className="flex items-start gap-2.5">
        <div className={`flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px] ${typeTone}`}>
          <TypeIcon className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold leading-tight">{task.name}</div>
          <div className="mt-1 flex flex-wrap gap-2 text-[11.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Bot className="h-[13px] w-[13px]" />{task.by}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-[13px] w-[13px]" />{task.time}</span>
          </div>
        </div>
        <StatusBadge status={task.status} />
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 border-t border-border/60 pt-2.5 text-muted-foreground">
        <Activity className="h-[15px] w-[15px] flex-shrink-0 text-muted-foreground" />
        <div className="truncate text-[12px]">{task.lastUpdate}</div>
      </div>
    </Button>
  )
}
