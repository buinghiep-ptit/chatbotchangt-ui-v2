import { create } from 'zustand'
import type { Message, Notification, Task, TaskFilter, Tab, Theme } from '@/types'
import { SEED_TASKS } from '@/data/tasks'
import { SEED_NOTIFICATIONS } from '@/data/notifications'
import { SEED_MESSAGES, GREETING_HTML } from '@/data/messages'

interface WidgetState {
  activeTab: Tab
  currentTaskId: string | null
  minimized: boolean
  taskFilter: TaskFilter
  historyOpen: boolean
  quickCollapsed: boolean

  messages: Message[]
  isTyping: boolean
  tasks: Task[]
  taskConversations: Record<string, { role: 'user' | 'bot'; text: string; time: string }[]>
  notifications: Notification[]
  theme: Theme

  // navigation
  switchTab: (tab: Tab) => void
  openTask: (id: string) => void
  closeTask: () => void
  setTaskFilter: (f: TaskFilter) => void
  toggleHistory: (open?: boolean) => void
  toggleQuick: () => void
  setMinimized: (m: boolean) => void

  // selectors
  pendingTaskCount: () => number
  unreadNotiCount: () => number
  filteredTasks: () => Task[]

  // chat (Task 7)
  sendChatMessage: (text: string) => void
  newChat: () => void
  approveHitl: (messageId: string) => void
  // task detail (Task 8)
  sendTaskMessage: (taskId: string, text: string) => void
  // notifications (Task 9)
  markNotiRead: (id: string) => void
  markAllNotisRead: () => void
  // theme (Task 9)
  setTheme: (t: Theme) => void
  cycleTheme: () => void

  __resetForTest: () => void
}

const nowTime = () =>
  new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

let idSeq = 1000
const nextId = () => `g${idSeq++}`

const initialConversations = () =>
  Object.fromEntries(SEED_TASKS.map((t) => [t.id, t.convo.map((c) => ({ ...c }))]))

const initialState = () => ({
  activeTab: 'chat' as Tab,
  currentTaskId: null as string | null,
  minimized: false,
  taskFilter: 'pending' as TaskFilter,
  historyOpen: false,
  quickCollapsed: false,
  messages: SEED_MESSAGES.map((m) => ({ ...m })),
  isTyping: false,
  tasks: SEED_TASKS,
  taskConversations: initialConversations(),
  notifications: SEED_NOTIFICATIONS.map((n) => ({ ...n })),
  theme: 'light' as Theme,
})

export const useWidgetStore = create<WidgetState>((set, get) => ({
  ...initialState(),

  switchTab: (tab) => set({ activeTab: tab, currentTaskId: null, historyOpen: false }),
  openTask: (id) => {
    if (!get().tasks.some((t) => t.id === id)) return
    set({ currentTaskId: id, activeTab: 'tasks' })
  },
  closeTask: () => set({ currentTaskId: null }),
  setTaskFilter: (f) => set({ taskFilter: f }),
  toggleHistory: (open) =>
    set((s) => ({ historyOpen: open === undefined ? !s.historyOpen : open })),
  toggleQuick: () => set((s) => ({ quickCollapsed: !s.quickCollapsed })),
  setMinimized: (m) => set({ minimized: m }),

  pendingTaskCount: () => get().tasks.filter((t) => t.bucket.includes('pending')).length,
  unreadNotiCount: () => get().notifications.filter((n) => n.unread).length,
  filteredTasks: () => get().tasks.filter((t) => t.bucket.includes(get().taskFilter)),

  sendChatMessage: (text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const time = nowTime()
    set((s) => ({
      messages: [...s.messages, { id: nextId(), role: 'user', time, kind: 'text', text: trimmed }],
      isTyping: true,
    }))
    setTimeout(() => {
      set((s) => ({
        isTyping: false,
        messages: [
          ...s.messages,
          {
            id: nextId(), role: 'bot', time: nowTime(), kind: 'text',
            html: 'Em đã nhận yêu cầu và đang xử lý. Em sẽ tạo công việc để anh theo dõi tiến độ và báo lại khi cần anh xác nhận nhé.',
          },
        ],
      }))
    }, 1100)
  },

  newChat: () =>
    set({
      activeTab: 'chat',
      currentTaskId: null,
      historyOpen: false,
      quickCollapsed: false,
      isTyping: false,
      messages: [{ id: nextId(), role: 'bot', time: nowTime(), kind: 'text', html: GREETING_HTML }],
    }),

  approveHitl: (messageId) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId && m.hitl ? { ...m, hitl: { ...m.hitl, approved: true } } : m,
      ),
    })),
  sendTaskMessage: (taskId, text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const task = get().tasks.find((t) => t.id === taskId)
    const time = nowTime()
    set((s) => ({
      taskConversations: {
        ...s.taskConversations,
        [taskId]: [...(s.taskConversations[taskId] ?? []), { role: 'user', text: trimmed, time }],
      },
    }))
    const reply =
      task && task.status === 'done'
        ? `Công việc này đã hoàn thành rồi ạ. ${task.lastUpdate}. Anh cần em gửi lại kết quả không ạ?`
        : `Cập nhật mới nhất: ${task ? task.lastUpdate.toLowerCase() : 'đang xử lý'}. Em sẽ báo ngay khi có tiến triển mới ạ.`
    setTimeout(() => {
      set((s) => ({
        taskConversations: {
          ...s.taskConversations,
          [taskId]: [...(s.taskConversations[taskId] ?? []), { role: 'bot', text: reply, time: nowTime() }],
        },
      }))
    }, 900)
  },
  markNotiRead: () => {},
  markAllNotisRead: () => {},
  setTheme: () => {},
  cycleTheme: () => {},

  __resetForTest: () => set(initialState()),
}))

export { nowTime, nextId }
