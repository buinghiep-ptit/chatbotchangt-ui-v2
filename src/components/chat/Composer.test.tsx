import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Composer } from './Composer'

class MockSpeechRecognition {
  static instances: MockSpeechRecognition[] = []
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
  constructor() {
    MockSpeechRecognition.instances.push(this)
  }
}

function resultEvent(items: { transcript: string; isFinal: boolean }[], resultIndex = 0) {
  const results = items.map((it) => {
    const alt = [{ transcript: it.transcript }] as unknown as { isFinal: boolean } & Array<{ transcript: string }>
    alt.isFinal = it.isFinal
    return alt
  })
  return { resultIndex, results }
}

beforeEach(() => {
  MockSpeechRecognition.instances = []
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
    expect(screen.queryByTestId('recording-overlay')).not.toBeInTheDocument()
  })

  it('confirm keeps transcript text without auto-sending', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<Composer placeholder="Nhắn…" onSend={onSend} />)
    await user.click(screen.getByTitle('Nhập bằng giọng nói'))
    const rec = MockSpeechRecognition.instances.at(-1)!
    await act(async () => {
      rec.onresult!(resultEvent([{ transcript: 'xin chào', isFinal: true }]))
    })
    await user.click(screen.getByLabelText('Lưu ghi âm'))
    expect(screen.getByRole('textbox')).toHaveValue('xin chào')
    expect(onSend).not.toHaveBeenCalled()
    expect(screen.queryByTestId('recording-overlay')).not.toBeInTheDocument()
  })

  it('disables the mic button when speech recognition is unsupported', () => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    render(<Composer placeholder="Nhắn…" onSend={vi.fn()} />)
    expect(screen.getByTitle('Trình duyệt không hỗ trợ ghi âm')).toBeDisabled()
  })
})
