import { TriangleAlert, Check } from 'lucide-react'
import { useWidgetStore } from '@/store/useWidgetStore'
import type { HitlPayload } from '@/types'

export function HitlCard({ messageId, payload }: { messageId: string; payload: HitlPayload }) {
  const { approveHitl, openTask } = useWidgetStore()
  if (payload.approved) {
    return (
      <div className="mt-2 rounded-xl border border-status-done bg-status-done/10 p-3">
        <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-status-done">
          <Check className="h-[15px] w-[15px]" /> Đã duyệt — Chang đang gửi email
        </div>
      </div>
    )
  }
  return (
    <div className="mt-2 rounded-xl border border-status-pending bg-status-pending/10 p-3">
      <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-status-pending">
        <TriangleAlert className="h-[15px] w-[15px]" /> {payload.title}
      </div>
      <div className="my-2.5 text-[12.5px] text-muted-foreground">{payload.text}</div>
      <div className="flex gap-2">
        <button type="button" onClick={() => approveHitl(messageId)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[9px] bg-status-done py-2 text-[12.5px] font-semibold text-white">
          <Check className="h-[15px] w-[15px]" /> Duyệt &amp; gửi
        </button>
        <button type="button" onClick={() => openTask(payload.targetTaskId)}
          className="flex-1 rounded-[9px] border border-border bg-background/60 py-2 text-[12.5px] font-semibold text-muted-foreground">
          Xem chi tiết
        </button>
      </div>
    </div>
  )
}
