import type { Skill } from '@/types'

/**
 * Fake skill catalogue for the composer's slash-command popup.
 *
 * In chatbot-sdk this list is fetched from
 * `/api/sdk/chatbot/skills?keyword=…`; here it is static and filtered
 * client-side by {@link filterSkills}. Commands are ASCII tokens so they
 * survive being typed/inserted into the textarea; names/descriptions are VN.
 */
export const SKILLS: Skill[] = [
  { id: 'sla', name: 'Báo cáo SLA', slashCommand: '/sla', description: 'Tổng hợp báo cáo SLA theo tháng cho các đơn vị' },
  { id: 'ticket', name: 'Tra cứu ticket', slashCommand: '/ticket', description: 'Tìm ticket vi phạm SLA theo mã hoặc đơn vị' },
  { id: 'canhbao', name: 'Cảnh báo quá hạn', slashCommand: '/canhbao', description: 'Liệt kê các ticket sắp/đã quá hạn xử lý' },
  { id: 'email', name: 'Soạn email', slashCommand: '/email', description: 'Soạn email gửi đơn vị theo template chuẩn' },
  { id: 'tracuu', name: 'Tra cứu hợp đồng', slashCommand: '/tracuu', description: 'Tra cứu thông tin hợp đồng từ SĐT hoặc mã HĐ' },
  { id: 'baohong', name: 'Báo hỏng nhanh', slashCommand: '/baohong', description: 'Tạo phiếu báo hỏng nhanh cho một hợp đồng' },
  { id: 'fptplay', name: 'Tra cứu FPT Play', slashCommand: '/fptplay', description: 'Tra cứu gói dịch vụ, thiết bị BOX theo SĐT' },
  { id: 'thongke', name: 'Thống kê', slashCommand: '/thongke', description: 'Thống kê số lượng ticket, tỉ lệ breach theo đơn vị' },
]

/**
 * Filter skills by the keyword typed after `/`. Empty keyword → full list.
 * Matches case-insensitively against the command, name and description.
 */
export function filterSkills(keyword: string): Skill[] {
  const k = keyword.trim().toLowerCase()
  if (!k) return SKILLS
  return SKILLS.filter(
    (s) =>
      s.slashCommand.toLowerCase().includes(k) ||
      s.name.toLowerCase().includes(k) ||
      s.description.toLowerCase().includes(k),
  )
}
