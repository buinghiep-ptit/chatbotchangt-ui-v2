import type { Message } from '@/types'

export const GREETING_HTML =
  'Chào anh 👋 Em là <b>Chang SCC</b>. Em hỗ trợ tổng hợp báo cáo SLA, tra cứu ticket vi phạm, cảnh báo quá hạn và soạn email cho các đơn vị. Anh cần em giúp gì ạ?'

export const SEED_MESSAGES: Message[] = [
  { id: 'm1', role: 'bot', time: '09:45', kind: 'text',
    html: 'Chào anh Quang 👋 Em là <b>Chang SCC</b>. Em hỗ trợ tổng hợp báo cáo SLA, tra cứu ticket vi phạm, cảnh báo quá hạn và soạn email cho các đơn vị. Anh cần em giúp gì ạ?' },
  { id: 'm2', role: 'user', time: '09:46', kind: 'text',
    text: 'Tổng hợp giúp anh báo cáo SLA tháng 5 cho 15 đơn vị, gửi anh review trước nhé.' },
  { id: 'm3', role: 'bot', time: '09:47', kind: 'taskInline', showTools: true,
    html: 'Em đã nhận. Em sẽ kéo dữ liệu SLA, tính chỉ số theo từng đơn vị rồi soạn email theo template chuẩn. Em tạo một công việc để anh theo dõi tình trạng nhé:',
    taskInline: { title: 'Báo cáo SLA tháng 5 — 15 đơn vị', meta: 'Đang tính chỉ số cho 2 đơn vị breach', targetTaskId: 't1' } },
  { id: 'm4', role: 'bot', time: '09:49', kind: 'hitl',
    html: 'Em đã soạn xong email cho cả 15 đơn vị. Có <b>2 đơn vị breach SLA</b> cần anh xác nhận nội dung giải trình trước khi gửi:',
    hitl: { title: 'Cần anh duyệt', text: 'Email cho INFMN-KH và FTQ có đính kèm phần giải trình breach. Duyệt để gửi, hoặc mở ra chỉnh sửa.', targetTaskId: 't2' } },
]

export const QUICK_SUGGESTIONS = [
  { icon: 'FileText', label: 'Tổng hợp SLA tháng này' },
  { icon: 'Search', label: 'Tra cứu ticket vi phạm' },
  { icon: 'BellRing', label: 'Cảnh báo quá hạn' },
  { icon: 'Mail', label: 'Soạn email đơn vị' },
]
