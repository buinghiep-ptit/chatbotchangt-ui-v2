import { useWidgetStore } from '@/store/useWidgetStore'
import { NotificationItem } from './NotificationItem'

export function NotificationsPanel() {
  const { notifications, markAllNotisRead } = useWidgetStore()
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between px-3.5 pb-2 pt-3">
        <div className="text-[14px] font-bold">Thông báo</div>
        <button type="button" onClick={markAllNotisRead} className="text-[12px] font-semibold text-primary">Đánh dấu đã đọc</button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin pb-3">
        {notifications.map((n) => <NotificationItem key={n.id} noti={n} />)}
      </div>
    </div>
  )
}
