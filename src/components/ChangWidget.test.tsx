import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it } from 'vitest'
import { ChangWidget } from './ChangWidget'
import { useWidgetStore } from '@/store/useWidgetStore'

beforeEach(() => useWidgetStore.getState().__resetForTest())

it('does not mount the bottom sheet when no sheet tab is active', () => {
  render(<ChangWidget />)
  expect(useWidgetStore.getState().sheetTab).toBeNull()
  expect(screen.queryByText('Lịch sử hội thoại')).not.toBeInTheDocument()
})

it('mounts the history sheet only while the history tab is active', () => {
  render(<ChangWidget />)
  act(() => useWidgetStore.getState().switchTab('history'))
  expect(screen.getByText('Lịch sử hội thoại')).toBeInTheDocument()

  act(() => useWidgetStore.getState().closeSheet())
  expect(screen.queryByText('Lịch sử hội thoại')).not.toBeInTheDocument()
})

it('closes the sheet and highlights chat when the chat tab is clicked while a sheet is open', async () => {
  render(<ChangWidget />)
  // Opening a sheet parks the background tab at 'chat', so the chat trigger is
  // already the active Radix value — Radix won't fire onValueChange on re-click.
  act(() => useWidgetStore.getState().switchTab('history'))
  expect(screen.getByText('Lịch sử hội thoại')).toBeInTheDocument()

  await userEvent.click(screen.getByText('Trò chuyện'))

  expect(useWidgetStore.getState().sheetTab).toBeNull()
  expect(useWidgetStore.getState().activeTab).toBe('chat')
  expect(screen.queryByText('Lịch sử hội thoại')).not.toBeInTheDocument()
})
