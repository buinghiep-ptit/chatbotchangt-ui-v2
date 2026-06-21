import { describe, expect, it } from 'vitest'
import { getDirection, shouldDismiss, DISMISS_OFFSET, DISMISS_VELOCITY } from './motion'

describe('getDirection', () => {
  it('returns 1 when moving to a higher index', () => {
    expect(getDirection(0, 2)).toBe(1)
  })
  it('returns -1 when moving to a lower index', () => {
    expect(getDirection(2, 0)).toBe(-1)
  })
  it('returns 0 when index is unchanged', () => {
    expect(getDirection(1, 1)).toBe(0)
  })
})

describe('shouldDismiss', () => {
  it('dismisses when dragged past the offset threshold', () => {
    expect(shouldDismiss(DISMISS_OFFSET + 1, 0)).toBe(true)
  })
  it('dismisses on a fast downward flick even below the offset threshold', () => {
    expect(shouldDismiss(10, DISMISS_VELOCITY + 1)).toBe(true)
  })
  it('does not dismiss for a small, slow drag', () => {
    expect(shouldDismiss(10, 50)).toBe(false)
  })
})
