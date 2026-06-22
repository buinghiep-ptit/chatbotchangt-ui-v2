import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it } from 'vitest'
import { TabBar } from './TabBar'
import { Tabs } from '@/components/ui/tabs'
import { useWidgetStore } from '@/store/useWidgetStore'
import type { Tab } from '@/types'

function TabBarWrapper({ initialActiveTab = 'chat' }: { initialActiveTab?: Tab }) {
  // Mirror ChangWidget: Tabs value is always the real panel tab (chat/tasks/noti),
  // never a sheet tab. Sheet tabs toggle via onValueChange from that base value.
  const PANEL_TABS = new Set(['chat', 'tasks', 'noti'])
  const [activeTab, setActiveTab] = React.useState(initialActiveTab)
  return (
    <Tabs
      value={activeTab}
      activationMode="manual"
      onValueChange={(v) => {
        useWidgetStore.getState().switchTab(v as Tab)
        if (PANEL_TABS.has(v)) setActiveTab(v as Tab)
      }}
    >
      <TabBar />
    </Tabs>
  )
}

function renderTabBar(activeTab: Tab = 'chat') {
  return render(<TabBarWrapper initialActiveTab={activeTab} />)
}

beforeEach(() => useWidgetStore.getState().__resetForTest())

it('clicking the Thông báo tab switches the active tab', async () => {
  renderTabBar()
  await userEvent.click(screen.getByText('Thông báo'))
  expect(useWidgetStore.getState().activeTab).toBe('noti')
})

it('shows the pending task badge (2) and unread noti badge (3)', () => {
  renderTabBar()
  expect(screen.getByText('2')).toBeInTheDocument()
  expect(screen.getByText('3')).toBeInTheDocument()
})

it('renders 6 tabs including Lịch sử, Gợi ý and Thêm', () => {
  renderTabBar()
  expect(screen.getByText('Lịch sử')).toBeInTheDocument()
  expect(screen.getByText('Gợi ý')).toBeInTheDocument()
  expect(screen.getByText('Thêm')).toBeInTheDocument()
})

it('clicking Lịch sử opens the history sheet', async () => {
  renderTabBar()
  await userEvent.click(screen.getByText('Lịch sử'))
  expect(useWidgetStore.getState().sheetTab).toBe('history')
})

it('clicking Gợi ý opens the quick sheet', async () => {
  renderTabBar()
  await userEvent.click(screen.getByText('Gợi ý'))
  expect(useWidgetStore.getState().sheetTab).toBe('quick')
})

it('clicking Thêm opens the more sheet', async () => {
  renderTabBar()
  await userEvent.click(screen.getByText('Thêm'))
  expect(useWidgetStore.getState().sheetTab).toBe('more')
})

it('clicking Thêm again closes the more sheet', async () => {
  renderTabBar()
  await userEvent.click(screen.getByText('Thêm'))
  await userEvent.click(screen.getByText('Thêm'))
  expect(useWidgetStore.getState().sheetTab).toBeNull()
})
