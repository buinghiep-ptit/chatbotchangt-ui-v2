import { beforeEach, describe, expect, it } from 'vitest'
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
