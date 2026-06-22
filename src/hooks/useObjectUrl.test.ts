import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useObjectUrl } from './useObjectUrl'

describe('useObjectUrl', () => {
  it('creates an object URL for the file', () => {
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:abc')
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    const { result } = renderHook(() => useObjectUrl(file))
    expect(createSpy).toHaveBeenCalledWith(file)
    expect(result.current).toBe('blob:abc')
    createSpy.mockRestore()
  })

  it('revokes the URL on unmount', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:abc')
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    const { unmount } = renderHook(() => useObjectUrl(file))
    unmount()
    expect(revokeSpy).toHaveBeenCalledWith('blob:abc')
    vi.restoreAllMocks()
  })
})
