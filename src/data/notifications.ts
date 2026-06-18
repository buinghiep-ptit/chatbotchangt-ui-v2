import type { Notification } from '@/types'

export const SEED_NOTIFICATIONS: Notification[] = [
  { id: 'n1', kind: 'hitl', icon: 'TriangleAlert', unread: true,
    html: '<b>Chang SCC</b> cần anh duyệt email giải trình breach cho FTQ và INFMN-KH', time: '2 phút trước' },
  { id: 'n2', kind: 'done', icon: 'CircleCheck', unread: true,
    html: 'Báo cáo <b>năng suất nhân sự VH tháng 4</b> đã hoàn thành và gửi các đơn vị', time: '25 phút trước' },
  { id: 'n3', kind: 'alert', icon: 'BellRing', unread: true,
    html: '<b>3 ticket</b> sắp quá hạn SLA trong 30 phút tới — đội Q.7', time: '1 giờ trước' },
  { id: 'n4', kind: 'task', icon: 'Route', unread: false,
    html: '<b>Chang SCC</b> bắt đầu chạy "Báo cáo SLA tháng 5"', time: '2 giờ trước' },
  { id: 'n5', kind: 'done', icon: 'CircleCheck', unread: false,
    html: 'FAQ tháng 4 đã cập nhật lên SDK — <b>23 mục mới</b>', time: 'Hôm qua' },
]
