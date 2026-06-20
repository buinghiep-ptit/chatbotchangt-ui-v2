import { ArrowLeft, SquarePen, Search, MessageSquare, Pin } from 'lucide-react'
import { cn } from '@/lib/utils'
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

export function HistoryDrawer() {
  const { historyOpen, toggleHistory, newChat } = useWidgetStore()
  return (
    <div className={cn('glass absolute inset-0 z-20 flex flex-col transition-transform duration-200', historyOpen ? 'translate-x-0' : 'translate-x-full')}>
      <div className="flex flex-shrink-0 items-center gap-2.5 border-b border-border/60 px-3.5 py-3">
        <Button size="icon" variant="ghost" onClick={() => toggleHistory(false)}>
          <ArrowLeft />
        </Button>
        <div className="flex-1 text-[15px] font-bold">Lịch sử hội thoại</div>
        <Button size="icon" variant="ghost" onClick={newChat}>
          <SquarePen />
        </Button>
      </div>
      <div className="mx-3.5 mb-1 mt-3 flex items-center gap-2 rounded-[10px] border border-border bg-muted/60 px-2.5 py-2">
        <Search className="h-[17px] w-[17px] text-muted-foreground" />
        <Input
          className="h-auto flex-1 border-0 bg-transparent px-0 py-0 rounded-none text-[13px] shadow-none focus-visible:ring-0"
          placeholder="Tìm trong hội thoại…"
        />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <Group title="Đã ghim" items={PINNED} Icon={Pin} onPick={() => toggleHistory(false)} />
        <Group title="Hôm nay" items={TODAY} Icon={MessageSquare} onPick={() => toggleHistory(false)} />
        <Group title="7 ngày qua" items={WEEK} Icon={MessageSquare} onPick={() => toggleHistory(false)} />
      </div>
    </div>
  )
}

function Group({ title, items, Icon, onPick }: { title: string; items: { title: string; snip: string }[]; Icon: typeof Pin; onPick: () => void }) {
  return (
    <>
      <div className="px-4 pb-1.5 pt-3.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      {items.map((it) => (
        <Button key={it.title} variant="ghost" onClick={onPick}
          className="flex h-auto w-full items-start justify-start gap-2.5 rounded-none px-4 py-2.5 text-left">
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
