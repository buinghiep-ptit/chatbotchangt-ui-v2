import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it } from 'vitest'
import { TabBar } from './TabBar'
import { useWidgetStore } from '@/store/useWidgetStore'

beforeEach(() => useWidgetStore.getState().__resetForTest())

it('clicking the Thông báo tab switches the active tab', async () => {
  render(<TabBar />)
  await userEvent.click(screen.getByText('Thông báo'))
  expect(useWidgetStore.getState().activeTab).toBe('noti')
})

it('shows the pending task badge (2) and unread noti badge (3)', () => {
  render(<TabBar />)
  expect(screen.getByText('2')).toBeInTheDocument()
  expect(screen.getByText('3')).toBeInTheDocument()
})
