import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { BottomSheet } from './BottomSheet'

it('renders its children', () => {
  render(<BottomSheet><div>content</div></BottomSheet>)
  expect(screen.getByText('content')).toBeInTheDocument()
})

it('slides in from the bottom on mount', () => {
  render(<BottomSheet><div>content</div></BottomSheet>)
  expect(screen.getByText('content').closest('[class*="slide-in"]')).toHaveClass(
    'animate-in',
    'slide-in-from-bottom-[100%]',
  )
})
