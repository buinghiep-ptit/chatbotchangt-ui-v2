import type { Task } from '@/types'

export const SEED_TASKS: Task[] = [
  { id: 't1', name: 'Báo cáo SLA tháng 5 — 15 đơn vị', type: 'workflow', by: 'Chang SCC',
    time: '9 phút trước', lastUpdate: 'Đang tính chỉ số cho 2 đơn vị breach', status: 'running', bucket: ['pending', 'mine', 'watch'],
    summary: 'Tổng hợp số liệu SLA tháng 5 cho 15 đơn vị, tính chỉ số breach và soạn email báo cáo theo template chuẩn.',
    thinking: 'Đã lấy dữ liệu SLA từ Google Sheet nguồn và phát hiện 2 đơn vị breach (FTQ, INFMN-KH). Đang đối chiếu ngưỡng cam kết từng đơn vị, sau đó sẽ soạn email gửi anh review.',
    convo: [
      { role: 'user', text: 'Việc này đang đến đâu rồi em?', time: '09:58' },
      { role: 'bot', text: 'Dạ em đã tổng hợp xong số liệu và phát hiện 2 đơn vị breach (FTQ, INFMN-KH). Hiện em đang tính chỉ số chi tiết cho 2 đơn vị này, dự kiến xong trong khoảng 5 phút nữa rồi em soạn email gửi anh review ạ.', time: '09:58' },
    ] },
  { id: 't2', name: 'Soạn email giải trình breach — FTQ, INFMN-KH', type: 'skill', by: 'Chang SCC',
    time: '12 phút trước', lastUpdate: 'Đã soạn xong, chờ anh duyệt', status: 'pending', bucket: ['pending', 'mine'],
    summary: 'Soạn 2 email giải trình SLA breach cho FTQ và INFMN-KH kèm số liệu và nguyên nhân. Nội dung đã hoàn tất, đang chờ duyệt trước khi gửi.',
    thinking: 'Đã trích nguyên nhân breach từ log ticket: FTQ do nghẽn hàng đợi giờ cao điểm, INFMN-KH do sự cố hệ thống tiếp nhận. Email đã soạn theo giọng văn chuẩn, đính kèm bảng số liệu. Vì gửi ra ngoài đơn vị nên em dừng lại chờ anh xác nhận ở phần Trò chuyện.',
    convo: [
      { role: 'user', text: 'Email soạn xong chưa em?', time: '09:55' },
      { role: 'bot', text: 'Dạ xong rồi ạ. Cả 2 email đã có đủ số liệu và nguyên nhân breach. Em đang chờ anh duyệt ở phần Trò chuyện trước khi gửi ra cho FTQ và INFMN-KH ạ.', time: '09:55' },
    ] },
  { id: 't3', name: 'Cảnh báo ticket quá hạn SLA hôm nay', type: 'workflow', by: 'Chang SCC',
    time: '1 giờ trước', lastUpdate: 'Đang theo dõi hàng đợi, quét mỗi 15 phút', status: 'running', bucket: ['watch'],
    summary: 'Theo dõi liên tục các ticket sắp/đã quá hạn SLA trong ngày, gom theo đội và gửi cảnh báo vào group Fchat.',
    thinking: 'Em quét hàng đợi ticket mỗi 15 phút. Lần gần nhất phát hiện 3 ticket đội Q.7 sắp quá hạn và đã gửi cảnh báo. Em tiếp tục theo dõi đến hết ca.',
    convo: [
      { role: 'bot', text: 'Cập nhật: lần quét gần nhất lúc 08:12 — đã cảnh báo 3 ticket đội Q.7 sắp quá hạn vào group. Em đang tiếp tục theo dõi.', time: '08:12' },
    ] },
  { id: 't4', name: 'Tổng hợp năng suất nhân sự VH tháng 4', type: 'workflow', by: 'Chang SCC',
    time: 'Hôm qua', lastUpdate: 'Đã hoàn thành và gửi các đơn vị', status: 'done', bucket: ['mine', 'done'],
    summary: 'Tổng hợp năng suất nhân sự vận hành từ Ticket, Fproject và CSOC, tính điểm theo công thức và gửi báo cáo các đơn vị giám sát.',
    thinking: 'Đã hợp nhất dữ liệu 3 nguồn, xử lý trùng và tính điểm năng suất. Bảng tổng quan đã được tạo và đính kèm email gửi các đơn vị.',
    convo: [
      { role: 'bot', text: 'Báo cáo năng suất tháng 4 đã hoàn thành và gửi các đơn vị giám sát từ hôm qua. Anh xem file đính kèm trong email nhé.', time: 'Hôm qua · 16:40' },
    ] },
  { id: 't5', name: 'Tổng hợp FAQ từ ticket tháng 4', type: 'skill', by: 'Chang SCC',
    time: '2 ngày trước', lastUpdate: 'Đã cập nhật 23 mục lên SDK', status: 'done', bucket: ['done'],
    summary: 'Đọc và phân tích ticket tháng 4, tổng hợp thành bộ FAQ và cập nhật lên SDK.',
    thinking: 'Đã phân cụm 5.000 ticket theo chủ đề, chọn 23 vấn đề phổ biến nhất và sinh câu trả lời chuẩn.',
    convo: [{ role: 'bot', text: 'Đã tạo 23 mục FAQ mới và cập nhật lên SDK từ 2 ngày trước ạ.', time: '2 ngày trước' }] },
  { id: 't6', name: 'Tra cứu ticket vi phạm tuần 19', type: 'skill', by: 'Chang SCC',
    time: '3 ngày trước', lastUpdate: 'Đã xuất danh sách 12 ticket breach', status: 'done', bucket: ['done', 'mine'],
    summary: 'Tra cứu và gom nhóm các ticket vi phạm SLA trong tuần 19 theo đơn vị.',
    thinking: 'Đã lọc 12 ticket breach, gom theo đơn vị và xuất danh sách.',
    convo: [{ role: 'bot', text: 'Có 12 ticket breach tuần 19, em đã gom theo đơn vị và xuất danh sách (đính kèm).', time: '3 ngày trước' }] },
  { id: 't7', name: 'Báo cáo cuối ca giám sát hệ thống', type: 'workflow', by: 'Chang SCC',
    time: '4 ngày trước', lastUpdate: 'Đã gửi lãnh đạo, 2 cảnh báo trong ca', status: 'done', bucket: ['done'],
    summary: 'Tổng hợp lỗi và chỉ số trong ca, tạo báo cáo cuối ca gửi lãnh đạo.',
    thinking: 'Đã thu thập dữ liệu 5 hệ thống thành phần, tổng hợp các lỗi vượt ngưỡng trong ca.',
    convo: [{ role: 'bot', text: 'Báo cáo cuối ca đã gửi lãnh đạo. Trong ca có 2 cảnh báo vượt ngưỡng ạ.', time: '4 ngày trước' }] },
  { id: 't8', name: 'Cảnh báo lỗi autocall ngoài giờ', type: 'workflow', by: 'Chang SCC',
    time: '5 ngày trước', lastUpdate: 'Đã thông báo nhóm kỹ thuật', status: 'done', bucket: ['done'],
    summary: 'Phát hiện lỗi hệ thống autocall ngoài giờ hành chính và thông báo nhóm kỹ thuật.',
    thinking: 'Phát hiện autocall không kết nối được lúc 21:30, đã gửi cảnh báo kèm traceID cho nhóm kỹ thuật.',
    convo: [{ role: 'bot', text: 'Em đã thông báo nhóm kỹ thuật lúc 21:30 — autocall mất kết nối, kèm traceID ạ.', time: '5 ngày trước' }] },
]

export const STATUS_LABEL: Record<Task['status'], string> = {
  pending: 'Cần xử lý', running: 'Đang chạy', done: 'Hoàn thành', watch: 'Theo dõi',
}
