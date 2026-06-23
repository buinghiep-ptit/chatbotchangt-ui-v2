import { create } from 'zustand'
import type { Attachment, Message, Notification, Task, TaskFilter, Tab, Theme } from '@/types'
import { SEED_TASKS } from '@/data/tasks'
import { SEED_NOTIFICATIONS } from '@/data/notifications'
import { SEED_MESSAGES, GREETING_HTML } from '@/data/messages'

interface WidgetState {
  activeTab: Tab
  currentTaskId: string | null
  taskFilter: TaskFilter
  sheetTab: 'history' | 'more' | null
  brickSheetOpen: boolean

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
  closeSheet: () => void
  openBrickSheet: () => void
  closeBrickSheet: () => void

  // selectors
  pendingTaskCount: () => number
  unreadNotiCount: () => number
  filteredTasks: () => Task[]

  // chat (Task 7)
  sendChatMessage: (text: string, files?: File[]) => void
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
  taskFilter: 'pending' as TaskFilter,
  sheetTab: null as 'history' | 'more' | null,
  brickSheetOpen: false,
  messages: SEED_MESSAGES.map((m) => ({ ...m })),
  isTyping: false,
  tasks: SEED_TASKS,
  taskConversations: initialConversations(),
  notifications: SEED_NOTIFICATIONS.map((n) => ({ ...n })),
  theme: 'light' as Theme,
})

const THEME_KEY = 'chang-theme'
function applyTheme(t: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', t === 'dark')
  try { localStorage.setItem(THEME_KEY, t) } catch { /* ignore */ }
}
export function loadInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const saved = (() => { try { return localStorage.getItem(THEME_KEY) } catch { return null } })()
  const t: Theme = saved === 'dark' ? 'dark' : 'light'
  applyTheme(t)
  return t
}

export const useWidgetStore = create<WidgetState>((set, get) => ({
  ...initialState(),

  switchTab: (tab) => {
    if (tab === 'history' || tab === 'more') {
      const alreadyOpen = get().sheetTab === tab
      if (alreadyOpen) {
        set({ sheetTab: null, activeTab: 'chat' })
      } else {
        set({ sheetTab: tab, activeTab: 'chat', currentTaskId: null })
      }
      return
    }
    set({ activeTab: tab, sheetTab: null, currentTaskId: null })
  },
  openTask: (id) => {
    if (!get().tasks.some((t) => t.id === id)) return
    set({ currentTaskId: id, activeTab: 'tasks' })
  },
  closeTask: () => set({ currentTaskId: null }),
  setTaskFilter: (f) => set({ taskFilter: f }),
  closeSheet: () => set({ sheetTab: null, activeTab: 'chat' }),
  openBrickSheet: () => set({ brickSheetOpen: true }),
  closeBrickSheet: () => set({ brickSheetOpen: false }),

  pendingTaskCount: () => get().tasks.filter((t) => t.bucket.includes('pending')).length,
  unreadNotiCount: () => get().notifications.filter((n) => n.unread).length,
  filteredTasks: () => get().tasks.filter((t) => t.bucket.includes(get().taskFilter)),

  sendChatMessage: (text, files) => {
    const trimmed = text.trim()
    const attachments: Attachment[] | undefined =
      files && files.length > 0
        ? files.map((f) => ({ name: f.name, type: f.type, size: f.size, file: f }))
        : undefined
    if (!trimmed && !attachments) return
    const time = nowTime()
    set((s) => ({
      messages: [
        ...s.messages,
        { id: nextId(), role: 'user', time, kind: 'text', text: trimmed, attachments },
      ],
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
      sheetTab: null,
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
  markNotiRead: (id) =>
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)) })),
  markAllNotisRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, unread: false })) })),

  setTheme: (t) => {
    applyTheme(t)
    set({ theme: t })
  },
  cycleTheme: () => {
    const next: Theme = get().theme === 'light' ? 'dark' : 'light'
    applyTheme(next)
    set({ theme: next })
  },

  __resetForTest: () => set(initialState()),
}))

export { nowTime, nextId }
