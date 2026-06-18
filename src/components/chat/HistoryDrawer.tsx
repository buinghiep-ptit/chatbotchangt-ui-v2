import { ArrowLeft, SquarePen, Search, MessageSquare, Pin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'

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
        <IconBtn onClick={() => toggleHistory(false)}><ArrowLeft className="h-[19px] w-[19px]" /></IconBtn>
        <div className="flex-1 text-[15px] font-bold">Lịch sử hội thoại</div>
        <IconBtn onClick={newChat}><SquarePen className="h-[19px] w-[19px]" /></IconBtn>
      </div>
      <div className="mx-3.5 mb-1 mt-3 flex items-center gap-2 rounded-[10px] border border-border bg-muted/60 px-2.5 py-2">
        <Search className="h-[17px] w-[17px] text-muted-foreground" />
        <input className="flex-1 bg-transparent text-[13px] outline-none" placeholder="Tìm trong hội thoại…" />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <Group title="Đã ghim" items={PINNED} Icon={Pin} onPick={() => toggleHistory(false)} />
        <Group title="Hôm nay" items={TODAY} Icon={MessageSquare} onPick={() => toggleHistory(false)} />
        <Group title="7 ngày qua" items={WEEK} Icon={MessageSquare} onPick={() => toggleHistory(false)} />
      </div>
    </div>
  )
}

function IconBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex h-8 w-8 items-center justify-center rounded-[9px] text-muted-foreground hover:bg-muted">{children}</button>
}
function Group({ title, items, Icon, onPick }: { title: string; items: { title: string; snip: string }[]; Icon: typeof Pin; onPick: () => void }) {
  return (
    <>
      <div className="px-4 pb-1.5 pt-3.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      {items.map((it) => (
        <button key={it.title} type="button" onClick={onPick} className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left hover:bg-muted">
          <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium">{it.title}</div>
            <div className="mt-0.5 truncate text-[12px] text-muted-foreground">{it.snip}</div>
          </div>
        </button>
      ))}
    </>
  )
}
