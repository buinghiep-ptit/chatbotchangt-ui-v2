import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it } from 'vitest'
import { TaskCard } from './TaskCard'
import { SEED_TASKS } from '@/data/tasks'
import { useWidgetStore } from '@/store/useWidgetStore'

beforeEach(() => useWidgetStore.getState().__resetForTest())

it('clicking a task card opens its detail view', async () => {
  render(<TaskCard task={SEED_TASKS[0]} />)
  await userEvent.click(screen.getByText(SEED_TASKS[0].name))
  expect(useWidgetStore.getState().currentTaskId).toBe('t1')
})
