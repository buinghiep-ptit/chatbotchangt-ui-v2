import { Route, ArrowRight } from 'lucide-react'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Button } from '@/components/ui/button'
import type { TaskInlinePayload } from '@/types'

export function TaskInlineCard({ payload }: { payload: TaskInlinePayload }) {
  const openTask = useWidgetStore((s) => s.openTask)
  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-border bg-background/50">
      <div className="flex items-start gap-2.5 p-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] bg-status-running/10 text-status-running">
          <Route className="h-[17px] w-[17px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold">{payload.title}</div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">{payload.meta}</div>
        </div>
      </div>
      <Button variant="ghost" onClick={() => openTask(payload.targetTaskId)}
        className="flex h-auto w-full items-center justify-between rounded-t-none border-t border-border px-3 py-2.5 text-[12.5px] font-semibold text-primary hover:bg-primary/10">
        <span>Mở trong Công việc</span><ArrowRight className="h-[15px] w-[15px]" />
      </Button>
    </div>
  )
}
