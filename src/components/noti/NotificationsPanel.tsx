import { motion } from 'motion/react'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Button } from '@/components/ui/button'
import { listContainer, listItem } from '@/lib/motion'
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
      <motion.div
        variants={listContainer}
        initial="hidden"
        animate="show"
        className="flex-1 overflow-y-auto scrollbar-thin pb-3"
      >
        {notifications.map((n) => (
          <motion.div key={n.id} variants={listItem}>
            <NotificationItem noti={n} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
