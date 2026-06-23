import type { Message, QuickSuggestion } from '@/types'

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

/**
 * Quick-suggestion categories. Mirrors the chatbot-sdk TabBar tabs:
 *  - `fill` categories (info / service / task) hold query templates with an
 *    `{input}` placeholder → selecting a query fills the composer so the user
 *    keeps typing the value.
 *  - `dynamic` categories (FAQ categories, fetched from API in chatbot-sdk —
 *    mocked here) hold question/answer entries → selecting one only shows info.
 */
export const QUICK_SUGGESTIONS: QuickSuggestion[] = [
  {
    icon: 'Search',
    label: 'Tra cứu HĐ',
    type: 'fill',
    items: [
      { id: 'info-1', title: 'Tìm thông tin HĐ từ SĐT', command: 'Tra cứu sdt {input}' },
      { id: 'info-2', title: 'Kiểm tra trùng KHTN từ SĐT', command: 'Kiểm tra trùng KHTN {input}' },
      { id: 'info-3', title: 'Tình trạng hợp đồng', command: 'Tra cứu {input}' },
      { id: 'info-4', title: 'Tiền cước NET theo HĐ', command: 'Tra cứu cước NET {input}' },
      { id: 'info-5', title: 'Tiền thiết bị theo HĐ', command: 'Tra cứu tiền thiết bị {input}' },
      { id: 'info-6', title: '5 PTC gần nhất theo HĐ', command: 'Tra cứu PTC {input}' },
      { id: 'info-7', title: 'Các lần kết nối NET theo HĐ', command: 'Các lần kết nối {input}' },
      { id: 'info-8', title: 'Thông số thi công theo HĐ', command: 'Thông số đầu nhảy HĐ {input}' },
      { id: 'info-9', title: 'Chi nhánh quản lý hợp đồng', command: 'Chi nhánh quản lý {input}' },
      { id: 'info-10', title: 'Thông tin số tài khoản ngân hàng của CN', command: 'Số tài khoản chi nhánh {input}' },
      { id: 'info-11', title: 'Tìm thông tin HĐ từ CCCD/Hộ chiếu/...', command: 'Tra cứu HĐ từ mã định danh {input}' },
    ],
  },
  {
    icon: 'Tv',
    label: 'Tra cứu FPT Play',
    type: 'fill',
    items: [
      { id: 'play-1', title: 'Các giải đấu thể thao', command: 'Các giải đấu thể thao trên FPT Play' },
      { id: 'play-2', title: 'Lịch phát sóng theo kênh', command: 'Lịch phát sóng kênh {input}' },
      { id: 'play-3', title: 'Top 10 kênh độc quyền', command: '10 kênh VOD độc quyền' },
      { id: 'play-4', title: 'Top 10 kênh mới theo thể loại', command: '10 kênh VOD mới {input}' },
      { id: 'play-5', title: 'Top 10 kênh sắp chiếu theo thể loại', command: '10 kênh VOD sắp chiếu {input}' },
      { id: 'play-6', title: 'Gói dịch vụ theo SĐT', command: 'Tra cứu gói dịch vụ FPT Play {input}' },
      { id: 'play-7', title: 'Lịch sử giao dịch theo SĐT', command: 'Tra cứu lịch sử giao dịch FPT Play {input}' },
      { id: 'play-8', title: 'Thông tin dịch vụ theo MAC Box', command: 'Mac thiết bị {input}' },
      { id: 'play-9', title: 'Thông tin thiết bị BOX theo SĐT', command: 'Thông tin MAC gắn với {input}' },
      { id: 'play-10', title: 'Thông tin dịch vụ theo HĐ', command: 'Thông tin MAC của {input}' },
      { id: 'play-11', title: 'Tìm SĐT sử dụng dịch vụ', command: 'SĐT FPT Play liên kết với {input}' },
      { id: 'play-12', title: 'Thông tin kích hoạt gói SA từ MAC box', command: 'Tra cứu kích hoạt gói 0đ {input}' },
    ],
  },
  {
    icon: 'Wrench',
    label: 'Xử lý tác vụ',
    type: 'fill',
    items: [
      { id: 'task-1', title: 'Clear checklist bảo trì tạo sai', command: 'Clear checklist {input}' },
      { id: 'task-2', title: 'Clear tín hiệu online NET', command: 'Clear tín hiệu {input}' },
      { id: 'task-3', title: 'Tạo QR báo hỏng nhanh', command: 'Báo hỏng nhanh cho mã hợp đồng {input}' },
      { id: 'task-4', title: 'Tạo QR báo hỏng trực tiếp', command: 'Báo hỏng trực tiếp cho mã hợp đồng {input}' },
    ],
  },
  {
    icon: 'HelpCircle',
    label: 'Câu hỏi thường gặp',
    type: 'dynamic',
    items: [
      {
        id: 'faq-1',
        question: 'Làm sao tra cứu thông tin hợp đồng từ số điện thoại?',
        answer: 'Anh chọn mục "Tra cứu HĐ" → "Tìm thông tin HĐ từ SĐT", hệ thống sẽ điền sẵn cú pháp "Tra cứu sdt ", anh chỉ cần nhập số điện thoại của khách hàng rồi gửi. Chang sẽ trả về danh sách hợp đồng gắn với số đó.',
      },
      {
        id: 'faq-2',
        question: 'Cú pháp tra cứu cước NET như thế nào?',
        answer: 'Cú pháp là "Tra cứu cước NET {mã hợp đồng}", ví dụ: "Tra cứu cước NET HNH661487". Kết quả gồm cước tháng hiện tại, lịch sử thanh toán và công nợ (nếu có).',
      },
      {
        id: 'faq-3',
        question: 'Tra cứu MAC Box FPT Play bằng cách nào?',
        answer: 'Có 3 cách: theo MAC Box ("Mac thiết bị {MAC}"), theo SĐT ("Thông tin MAC gắn với {SĐT}"), hoặc theo hợp đồng ("Thông tin MAC của {mã HĐ}"). Chọn cú pháp phù hợp trong mục "Tra cứu FPT Play".',
      },
      {
        id: 'faq-4',
        question: 'Khi nào dùng "Clear tín hiệu online NET"?',
        answer: 'Dùng khi khách báo mất kết nối nhưng hệ thống vẫn hiển thị online, gây sai trạng thái. Cú pháp "Clear tín hiệu {mã HĐ}" sẽ reset trạng thái tín hiệu để kỹ thuật xử lý lại.',
      },
      {
        id: 'faq-5',
        question: 'Báo hỏng nhanh và báo hỏng trực tiếp khác nhau thế nào?',
        answer: 'Báo hỏng nhanh tạo mã QR để khách tự quét và xác nhận sự cố. Báo hỏng trực tiếp tạo phiếu xử lý ngay trên hệ thống cho đội kỹ thuật, không cần khách thao tác thêm.',
      },
    ],
  },
]
