import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { BottomSheet } from './BottomSheet'

it('renders its children', () => {
  render(<BottomSheet onDismiss={vi.fn()}><div>content</div></BottomSheet>)
  expect(screen.getByText('content')).toBeInTheDocument()
})

it('renders a drag grabber that initiates dismissal', () => {
  render(<BottomSheet onDismiss={vi.fn()}><div>content</div></BottomSheet>)
  expect(screen.getByTestId('sheet-grabber')).toBeInTheDocument()
})
