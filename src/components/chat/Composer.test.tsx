import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Composer } from './Composer'

class MockSpeechRecognition {
  lang = ''
  continuous = false
  interimResults = false
  maxAlternatives = 1
  onresult: ((e: unknown) => void) | null = null
  onerror: ((e: unknown) => void) | null = null
  onend: (() => void) | null = null
  start = vi.fn()
  stop = vi.fn()
  abort = vi.fn()
}

beforeEach(() => {
  ;(window as unknown as Record<string, unknown>).SpeechRecognition = MockSpeechRecognition
  ;(window as unknown as Record<string, unknown>).webkitSpeechRecognition = MockSpeechRecognition
})

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).SpeechRecognition
  delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition
})

describe('Composer voice input', () => {
  it('shows the recording overlay and hides the mic when recording starts', async () => {
    const user = userEvent.setup()
    render(<Composer placeholder="Nhắn…" onSend={vi.fn()} />)
    await user.click(screen.getByTitle('Nhập bằng giọng nói'))
    expect(screen.getByTestId('recording-overlay')).toBeInTheDocument()
    expect(screen.queryByTitle('Nhập bằng giọng nói')).not.toBeInTheDocument()
  })

  it('restores the pre-record text when recording is cancelled', async () => {
    const user = userEvent.setup()
    render(<Composer placeholder="Nhắn…" onSend={vi.fn()} />)
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'đã gõ sẵn')
    await user.click(screen.getByTitle('Nhập bằng giọng nói'))
    await user.click(screen.getByLabelText('Hủy ghi âm'))
    expect(textarea).toHaveValue('đã gõ sẵn')
  })

  it('disables the mic button when speech recognition is unsupported', () => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    render(<Composer placeholder="Nhắn…" onSend={vi.fn()} />)
    expect(screen.getByTitle('Trình duyệt không hỗ trợ ghi âm')).toBeDisabled()
  })
})
