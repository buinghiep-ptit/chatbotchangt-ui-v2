import { SquarePen, Search, MessageSquareText, Pin } from 'lucide-react'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PINNED = [{ title: 'Báo cáo SLA tháng 5 — 15 đơn vị', snip: 'Em đã soạn xong email cho cả 15 đơn vị…' }]
const TODAY = [
  { title: 'Tra cứu ticket vi phạm tuần qua', snip: 'Có 12 ticket breach, đã gom theo đơn vị…' },
  { title: 'Cảnh báo hệ thống autocall', snip: 'Đã thông báo nhóm kỹ thuật lúc 08:12…' },
]
const WEEK = [
  { title: 'Tổng hợp FAQ từ ticket tháng 4', snip: 'Đã tạo 23 mục FAQ, cập nhật lên SDK…' },
  { title: 'Năng suất nhân sự VH tháng 4', snip: 'Bảng tổng quan đã gửi các đơn vị giám sát…' },
]

export function HistorySheetContent() {
  const { newChat, closeSheet } = useWidgetStore()
  return (
    <div className="flex flex-col pb-2">
      <div className="flex items-center gap-2.5 px-3.5 pt-1 pb-2">
        <div className="flex-1 text-[14px] font-bold">Lịch sử hội thoại</div>
        <Button size="icon" variant="ghost" onClick={newChat}>
          <SquarePen />
        </Button>
      </div>
      <div className="mx-3.5 mb-1 flex items-center gap-2 rounded-[10px] border border-border bg-muted/60 px-2.5 py-2">
        <Search className="h-[17px] w-[17px] text-muted-foreground" />
        <Input
          className="h-auto flex-1 border-0 bg-transparent px-0 py-0 rounded-none text-[13px] shadow-none focus-visible:ring-0"
          placeholder="Tìm trong hội thoại…"
        />
      </div>
      <HistoryGroup title="Đã ghim" items={PINNED} Icon={Pin} onPick={closeSheet} />
      <HistoryGroup title="Hôm nay" items={TODAY} Icon={MessageSquareText} onPick={closeSheet} />
      <HistoryGroup title="7 ngày qua" items={WEEK} Icon={MessageSquareText} onPick={closeSheet} />
    </div>
  )
}

function HistoryGroup({
  title, items, Icon, onPick,
}: { title: string; items: { title: string; snip: string }[]; Icon: typeof Pin; onPick: () => void }) {
  return (
    <>
      <div className="px-4 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      {items.map((it) => (
        <Button key={it.title} variant="ghost" onClick={onPick}
          className="flex h-auto w-full items-start justify-start gap-2.5 rounded-none px-4 py-2.5 text-left hover:bg-foreground/5 active:bg-foreground/10">
          <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium">{it.title}</div>
            <div className="mt-0.5 truncate text-[12px] text-muted-foreground">{it.snip}</div>
          </div>
        </Button>
      ))}
    </>
  )
}
