import { useWidgetStore } from '@/store/useWidgetStore'
import { Button } from '@/components/ui/button'
import { NotificationItem } from './NotificationItem'

export function NotificationsPanel() {
  const { notifications, markAllNotisRead } = useWidgetStore()
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between px-3.5 pb-2 pt-3">
        <div className="text-[14px] font-bold">Thông báo</div>
        <Button variant="link" onClick={markAllNotisRead} className="h-auto p-0 text-[12px] font-semibold">
          Đánh dấu đã đọc
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin pb-3">
        {notifications.map((n) => <NotificationItem key={n.id} noti={n} />)}
      </div>
    </div>
  )
}
