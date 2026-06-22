import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FileChips } from './FileChips'

const img = new File(['x'], 'photo.png', { type: 'image/png' })
const pdf = new File(['x'], 'doc.pdf', { type: 'application/pdf' })

describe('FileChips', () => {
  it('renders image thumbnails and file chips', () => {
    render(<FileChips files={[img, pdf]} />)
    expect(screen.getByRole('img', { name: 'photo.png' })).toBeInTheDocument()
    expect(screen.getByText('doc.pdf')).toBeInTheDocument()
  })

  it('shows remove buttons when onRemove is provided and fires with the original index', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(<FileChips files={[img, pdf]} onRemove={onRemove} />)
    await user.click(screen.getByLabelText('Xoá doc.pdf'))
    expect(onRemove).toHaveBeenCalledWith(1)
  })

  it('renders read-only (no remove buttons) when onRemove is omitted', () => {
    render(<FileChips files={[pdf]} />)
    expect(screen.queryByLabelText('Xoá doc.pdf')).not.toBeInTheDocument()
  })

  it('renders nothing for an empty file list', () => {
    const { container } = render(<FileChips files={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
