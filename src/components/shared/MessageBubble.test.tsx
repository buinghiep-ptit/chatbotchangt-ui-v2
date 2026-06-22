import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MessageBubble } from './MessageBubble'
import type { Attachment } from '@/types'

const att = (name: string, type: string): Attachment => {
  const file = new File(['x'], name, { type })
  return { name, type, size: file.size, file }
}

describe('MessageBubble attachments', () => {
  it('renders attachment chips read-only when attachments are provided', () => {
    render(<MessageBubble role="user" text="có tệp" attachments={[att('doc.pdf', 'application/pdf')]} />)
    expect(screen.getByText('doc.pdf')).toBeInTheDocument()
    expect(screen.queryByLabelText('Xoá doc.pdf')).not.toBeInTheDocument()
  })

  it('renders no chips when there are no attachments', () => {
    render(<MessageBubble role="user" text="không tệp" />)
    expect(screen.queryByText('doc.pdf')).not.toBeInTheDocument()
  })
})
