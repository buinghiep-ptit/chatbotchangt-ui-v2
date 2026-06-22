import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useFileAttachments, MAX_FILES, MAX_FILE_BYTES } from './useFileAttachments'

const f = (name: string, size = 10, type = 'image/png') => {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('useFileAttachments', () => {
  it('appends added files', () => {
    const { result } = renderHook(() => useFileAttachments())
    act(() => result.current.addFiles([f('a.png'), f('b.pdf', 10, 'application/pdf')]))
    expect(result.current.files.map((x) => x.name)).toEqual(['a.png', 'b.pdf'])
  })

  it('ignores duplicate filenames', () => {
    const { result } = renderHook(() => useFileAttachments())
    act(() => result.current.addFiles([f('a.png')]))
    act(() => result.current.addFiles([f('a.png')]))
    expect(result.current.files).toHaveLength(1)
  })

  it('dedupes duplicate filenames within a single addFiles call', () => {
    const { result } = renderHook(() => useFileAttachments())
    act(() => result.current.addFiles([f('a.png'), f('a.png')]))
    expect(result.current.files).toHaveLength(1)
  })

  it('drops files over the size cap and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() => useFileAttachments())
    act(() => result.current.addFiles([f('big.png', MAX_FILE_BYTES + 1)]))
    expect(result.current.files).toHaveLength(0)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('caps the number of files at MAX_FILES', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() => useFileAttachments())
    const many = Array.from({ length: MAX_FILES + 3 }, (_, i) => f(`f${i}.png`))
    act(() => result.current.addFiles(many))
    expect(result.current.files).toHaveLength(MAX_FILES)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('removes a file by index and clears all', () => {
    const { result } = renderHook(() => useFileAttachments())
    act(() => result.current.addFiles([f('a.png'), f('b.png')]))
    act(() => result.current.removeFile(0))
    expect(result.current.files.map((x) => x.name)).toEqual(['b.png'])
    act(() => result.current.clear())
    expect(result.current.files).toHaveLength(0)
  })
})
