import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Bot, FileText, Lightbulb, ChevronDown, Activity, CircleCheck, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '../shared/StatusBadge'
import { MessageBubble } from '../shared/MessageBubble'
import { Composer } from '../chat/Composer'
import { Chip } from '../shared/Chip'

const SUGGESTIONS = ['Việc đến đâu rồi?', 'Khi nào xong?', 'Có vướng gì không?']

export function TaskDetailPanel() {
  const { tasks, currentTaskId, closeTask, taskConversations, sendTaskMessage } = useWidgetStore()
  const task = tasks.find((t) => t.id === currentTaskId)
  const [infoCollapsed, setInfoCollapsed] = useState(false)
  const convo = currentTaskId ? taskConversations[currentTaskId] ?? [] : []
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [convo.length])
  if (!task) return null

  const latestTone = task.status === 'done' ? 'bg-status-done/10 text-status-done'
    : task.status === 'running' ? 'bg-status-running/10 text-status-running'
    : 'bg-status-pending/10 text-status-pending'

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center gap-2.5 border-b border-border/60 px-3 py-3">
        <Button size="icon" variant="ghost" onClick={closeTask} title="Quay lại">
          <ArrowLeft className="h-[19px] w-[19px]" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-bold leading-tight">{task.name}</div>
          <div className="mt-0.5 flex items-center gap-1 text-[11.5px] text-muted-foreground"><Bot className="h-[13px] w-[13px]" />{task.by}</div>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3.5 pb-1.5 pt-3.5">
        {/* collapsible info cluster */}
        <div className="mb-4 overflow-hidden rounded-[14px] border border-border">
          <Button variant="ghost" onClick={() => setInfoCollapsed((v) => !v)}
            className="flex h-auto w-full items-center justify-start gap-2 rounded-none bg-muted/40 px-3 py-2.5 text-[12.5px] font-semibold text-muted-foreground hover:bg-muted/60">
            <FileText className="h-4 w-4" /> Thông tin công việc
            <ChevronDown className={cn('ml-auto h-4 w-4 transition-transform', infoCollapsed && '-rotate-90')} />
          </Button>
          {!infoCollapsed && (
            <div className="flex flex-col">
              <div className="border-t border-border p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary"><FileText className="h-3.5 w-3.5" /> Tóm tắt</div>
                <div className="text-[13px] leading-relaxed text-muted-foreground">{task.summary}</div>
              </div>
              <div className="border-t border-border p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-status-running"><Lightbulb className="h-3.5 w-3.5" /> Chang đang làm gì</div>
                <div className="text-[13px] leading-relaxed text-muted-foreground">{task.thinking}</div>
              </div>
            </div>
          )}
        </div>

        {/* latest status strip */}
        <div className="mb-[18px] flex items-start gap-2.5 rounded-[14px] border border-border bg-muted/40 p-3">
          <div className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px]', latestTone)}>
            {task.status === 'done' ? <CircleCheck className="h-[17px] w-[17px]" /> : <Activity className="h-[17px] w-[17px]" />}
          </div>
          <div>
            <div className="mb-0.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">Cập nhật mới nhất</div>
            <div className="text-[13px] leading-snug">{task.lastUpdate}</div>
          </div>
        </div>

        {/* status Q&A */}
        <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" /> Hỏi Chang về tình trạng công việc
        </div>
        <div className="flex flex-col gap-3">
          {convo.map((m, i) => <MessageBubble key={i} role={m.role} time={m.time} text={m.text} />)}
        </div>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => <Chip key={s} onClick={() => sendTaskMessage(task.id, s)}>{s}</Chip>)}
        </div>
        <div ref={endRef} />
      </div>

      <Composer placeholder="Trao đổi thêm về công việc này…" onSend={(t) => sendTaskMessage(task.id, t)} />
    </div>
  )
}
