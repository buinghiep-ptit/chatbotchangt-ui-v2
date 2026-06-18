import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it } from 'vitest'
import { TasksPanel } from './TasksPanel'
import { useWidgetStore } from '@/store/useWidgetStore'

beforeEach(() => useWidgetStore.getState().__resetForTest())

// Regression: subscribing to `filteredTasks()` directly returned a fresh array
// each render, tripping Zustand's getSnapshot check and causing an infinite
// update loop ("Maximum update depth exceeded"). Rendering the panel at all
// would throw if that regressed.
it('renders the default (pending) tasks without an infinite render loop', () => {
  render(<TasksPanel />)
  // pending bucket = t1, t2
  expect(screen.getByText('Báo cáo SLA tháng 5 — 15 đơn vị')).toBeInTheDocument()
  expect(screen.getByText('Soạn email giải trình breach — FTQ, INFMN-KH')).toBeInTheDocument()
})

it('switching the sub-tab filter changes the visible tasks', async () => {
  render(<TasksPanel />)
  // "Theo dõi" (watch) bucket = t1, t3
  await userEvent.click(screen.getByRole('button', { name: /Theo dõi/ }))
  expect(screen.getByText('Cảnh báo ticket quá hạn SLA hôm nay')).toBeInTheDocument()
})
