import { render, screen, act } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import { TasksView } from './TasksView'
import { useWidgetStore } from '@/store/useWidgetStore'
import { SEED_TASKS } from '@/data/tasks'

beforeEach(() => useWidgetStore.getState().__resetForTest())

it('renders the task list when no task is open', () => {
  render(<TasksView />)
  // 'Khởi tạo' is a SubTabs filter label that only appears in TasksPanel's sub-tab row
  // (not in STATUS_LABEL), so it uniquely identifies the list view.
  expect(screen.getByRole('button', { name: /Khởi tạo/ })).toBeInTheDocument()
})

it('renders the task detail when a task is open', () => {
  const id = SEED_TASKS[0].id
  act(() => useWidgetStore.getState().openTask(id))
  render(<TasksView />)
  expect(screen.getByTitle('Quay lại')).toBeInTheDocument()
})
