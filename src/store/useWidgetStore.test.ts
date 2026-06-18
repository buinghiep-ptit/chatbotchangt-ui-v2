import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useWidgetStore } from './useWidgetStore'

const reset = () => useWidgetStore.getState().__resetForTest()

describe('navigation', () => {
  beforeEach(reset)

  it('starts on the chat tab, not minimized, no detail', () => {
    const s = useWidgetStore.getState()
    expect(s.activeTab).toBe('chat')
    expect(s.minimized).toBe(false)
    expect(s.currentTaskId).toBeNull()
  })

  it('switchTab changes the active tab', () => {
    useWidgetStore.getState().switchTab('noti')
    expect(useWidgetStore.getState().activeTab).toBe('noti')
  })

  it('openTask sets currentTaskId; closeTask clears it', () => {
    useWidgetStore.getState().openTask('t1')
    expect(useWidgetStore.getState().currentTaskId).toBe('t1')
    useWidgetStore.getState().closeTask()
    expect(useWidgetStore.getState().currentTaskId).toBeNull()
  })

  it('openTask ignores unknown ids', () => {
    useWidgetStore.getState().openTask('nope')
    expect(useWidgetStore.getState().currentTaskId).toBeNull()
  })

  it('switching tab while in detail leaves the detail view', () => {
    useWidgetStore.getState().openTask('t1')
    useWidgetStore.getState().switchTab('tasks')
    expect(useWidgetStore.getState().currentTaskId).toBeNull()
  })

  it('pendingTaskCount counts tasks in the pending bucket', () => {
    expect(useWidgetStore.getState().pendingTaskCount()).toBe(2)
  })

  it('filteredTasks returns tasks for the active filter', () => {
    const s = useWidgetStore.getState()
    expect(s.filteredTasks().every((t) => t.bucket.includes('pending'))).toBe(true)
    s.setTaskFilter('done')
    expect(useWidgetStore.getState().filteredTasks().length).toBe(5)
  })
})

describe('chat', () => {
  beforeEach(() => { reset(); vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('sendChatMessage appends a user message and shows typing', () => {
    const before = useWidgetStore.getState().messages.length
    useWidgetStore.getState().sendChatMessage('Xin chào')
    const s = useWidgetStore.getState()
    expect(s.messages.length).toBe(before + 1)
    expect(s.messages.at(-1)).toMatchObject({ role: 'user', text: 'Xin chào' })
    expect(s.isTyping).toBe(true)
  })

  it('ignores empty / whitespace-only input', () => {
    const before = useWidgetStore.getState().messages.length
    useWidgetStore.getState().sendChatMessage('   ')
    expect(useWidgetStore.getState().messages.length).toBe(before)
  })

  it('after the delay it appends a bot reply and stops typing', () => {
    useWidgetStore.getState().sendChatMessage('Xin chào')
    vi.advanceTimersByTime(1200)
    const s = useWidgetStore.getState()
    expect(s.isTyping).toBe(false)
    expect(s.messages.at(-1)?.role).toBe('bot')
  })

  it('newChat resets the thread to a single greeting and reopens suggestions', () => {
    useWidgetStore.getState().sendChatMessage('Xin chào')
    useWidgetStore.getState().newChat()
    const s = useWidgetStore.getState()
    expect(s.messages).toHaveLength(1)
    expect(s.messages[0]).toMatchObject({ role: 'bot', kind: 'text' })
    expect(s.quickCollapsed).toBe(false)
    expect(s.historyOpen).toBe(false)
    expect(s.activeTab).toBe('chat')
  })

  it('approveHitl flips the targeted hitl message to approved', () => {
    useWidgetStore.getState().approveHitl('m4')
    const m = useWidgetStore.getState().messages.find((x) => x.id === 'm4')
    expect(m?.hitl?.approved).toBe(true)
  })
})

describe('task conversation', () => {
  beforeEach(() => { reset(); vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('appends the user question immediately', () => {
    const before = useWidgetStore.getState().taskConversations['t1'].length
    useWidgetStore.getState().sendTaskMessage('t1', 'Việc đến đâu rồi?')
    expect(useWidgetStore.getState().taskConversations['t1'].length).toBe(before + 1)
    expect(useWidgetStore.getState().taskConversations['t1'].at(-1)).toMatchObject({ role: 'user', text: 'Việc đến đâu rồi?' })
  })

  it('adds a status bot reply after the delay (in-progress task)', () => {
    useWidgetStore.getState().sendTaskMessage('t1', 'Khi nào xong?')
    vi.advanceTimersByTime(1000)
    const last = useWidgetStore.getState().taskConversations['t1'].at(-1)
    expect(last?.role).toBe('bot')
    expect(last?.text.toLowerCase()).toContain('cập nhật mới nhất')
  })

  it('done tasks get a completed-style reply', () => {
    useWidgetStore.getState().sendTaskMessage('t4', 'Xong chưa em?')
    vi.advanceTimersByTime(1000)
    const last = useWidgetStore.getState().taskConversations['t4'].at(-1)
    expect(last?.text).toContain('đã hoàn thành')
  })

  it('ignores empty input', () => {
    const before = useWidgetStore.getState().taskConversations['t1'].length
    useWidgetStore.getState().sendTaskMessage('t1', '  ')
    expect(useWidgetStore.getState().taskConversations['t1'].length).toBe(before)
  })
})

describe('notifications + theme', () => {
  beforeEach(reset)

  it('seed has 3 unread', () => {
    expect(useWidgetStore.getState().unreadNotiCount()).toBe(3)
  })

  it('markNotiRead clears one', () => {
    useWidgetStore.getState().markNotiRead('n1')
    expect(useWidgetStore.getState().unreadNotiCount()).toBe(2)
  })

  it('markAllNotisRead clears all', () => {
    useWidgetStore.getState().markAllNotisRead()
    expect(useWidgetStore.getState().unreadNotiCount()).toBe(0)
  })

  it('setTheme + cycleTheme toggle the theme', () => {
    useWidgetStore.getState().setTheme('dark')
    expect(useWidgetStore.getState().theme).toBe('dark')
    useWidgetStore.getState().cycleTheme()
    expect(useWidgetStore.getState().theme).toBe('light')
  })
})
