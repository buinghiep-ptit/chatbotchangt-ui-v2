import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { BottomSheet } from './BottomSheet'

it('is visually hidden when open=false', () => {
  render(<BottomSheet open={false}><div>content</div></BottomSheet>)
  expect(screen.getByText('content').closest('[class*="translate"]')).toHaveClass('translate-y-full')
})

it('is visible when open=true', () => {
  render(<BottomSheet open={true}><div>content</div></BottomSheet>)
  expect(screen.getByText('content').closest('[class*="translate"]')).toHaveClass('translate-y-0')
})
