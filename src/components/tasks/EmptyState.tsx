import { ClipboardCheck } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-10 text-center text-muted-foreground">
      <ClipboardCheck className="h-11 w-11 opacity-50" />
      <div className="text-[14px] font-semibold text-foreground/70">Chưa có công việc</div>
      <div className="max-w-[240px] text-[12.5px]">Giao việc cho Chang trong tab Trò chuyện, công việc sẽ xuất hiện ở đây.</div>
    </div>
  )
}
