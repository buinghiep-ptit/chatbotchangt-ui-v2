export type TaskType = 'workflow' | 'skill'
export type TaskStatus = 'pending' | 'running' | 'done' | 'watch'
export type TaskFilter = 'pending' | 'watch' | 'mine' | 'done'
export type Role = 'user' | 'bot'

export interface ConvoMessage {
  role: Role
  text: string
  time: string
}

export interface Task {
  id: string
  name: string
  type: TaskType
  by: string
  time: string
  lastUpdate: string
  status: TaskStatus
  bucket: TaskFilter[]
  summary: string
  thinking: string
  convo: ConvoMessage[]
}

export type MessageKind = 'text' | 'taskInline' | 'hitl'

export interface HitlPayload {
  title: string
  text: string
  targetTaskId: string
  approved?: boolean
}

export interface TaskInlinePayload {
  title: string
  meta: string
  targetTaskId: string
}

export interface Message {
  id: string
  role: Role
  time: string
  kind: MessageKind
  /** rich text content (may contain pre-authored <b>/<ul> markup from seed data, never user input) */
  html?: string
  /** plain text content (user-entered; rendered escaped) */
  text?: string
  taskInline?: TaskInlinePayload
  hitl?: HitlPayload
  showTools?: boolean
}

export type NotiKind = 'task' | 'done' | 'hitl' | 'alert'

export interface Notification {
  id: string
  kind: NotiKind
  /** lucide icon name resolved in NotificationItem */
  icon: string
  /** pre-authored markup (contains <b>), never user input */
  html: string
  time: string
  unread: boolean
}

export type Theme = 'light' | 'dark'
export type Tab = 'chat' | 'tasks' | 'noti'
