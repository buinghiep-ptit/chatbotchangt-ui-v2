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

describe('Composer attachments', () => {
  function fileInput(container: HTMLElement): HTMLInputElement {
    return container.querySelector('input[type="file"]') as HTMLInputElement
  }

  it('opens the file picker when the paperclip is clicked', async () => {
    const user = userEvent.setup()
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click')
    render(<Composer placeholder="Nhắn…" onSend={vi.fn()} />)
    await user.click(screen.getByTitle('Đính kèm'))
    expect(clickSpy).toHaveBeenCalled()
    clickSpy.mockRestore()
  })

  it('shows a chip when a file is added and removes it on ✕', async () => {
    const user = userEvent.setup()
    const { container } = render(<Composer placeholder="Nhắn…" onSend={vi.fn()} />)
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })
    await user.upload(fileInput(container), file)
    expect(await screen.findByText('doc.pdf')).toBeInTheDocument()
    await user.click(screen.getByLabelText('Xoá doc.pdf'))
    expect(screen.queryByText('doc.pdf')).not.toBeInTheDocument()
  })

  it('sends text and files together, then clears', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    const { container } = render(<Composer placeholder="Nhắn…" onSend={onSend} />)
    await user.type(screen.getByRole('textbox'), 'kèm tệp')
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })
    await user.upload(fileInput(container), file)
    await screen.findByText('doc.pdf')
    await user.click(screen.getByTitle('Gửi'))
    expect(onSend).toHaveBeenCalledTimes(1)
    const [text, files] = onSend.mock.calls[0]
    expect(text).toBe('kèm tệp')
    expect(files).toHaveLength(1)
    expect(files[0].name).toBe('doc.pdf')
    expect(screen.getByRole('textbox')).toHaveValue('')
    expect(screen.queryByText('doc.pdf')).not.toBeInTheDocument()
  })

  it('sends with files even when the text is empty', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    const { container } = render(<Composer placeholder="Nhắn…" onSend={onSend} />)
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' })
    await user.upload(fileInput(container), file)
    await screen.findByText('doc.pdf')
    await user.click(screen.getByTitle('Gửi'))
    const [text, files] = onSend.mock.calls[0]
    expect(text).toBe('')
    expect(files).toHaveLength(1)
  })
})
