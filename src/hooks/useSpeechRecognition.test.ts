import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSpeechRecognition } from './useSpeechRecognition'

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

// Builds an event shaped like SpeechRecognitionEvent: results[i][0].transcript + results[i].isFinal
function resultEvent(items: { transcript: string; isFinal: boolean }[], resultIndex = 0) {
  const results = items.map((it) => {
    const alt = [{ transcript: it.transcript }] as unknown as { isFinal: boolean } & Array<{ transcript: string }>
    alt.isFinal = it.isFinal
    return alt
  })
  return { resultIndex, results }
}

const lastInstance = () => MockSpeechRecognition.instances.at(-1)!

beforeEach(() => {
  MockSpeechRecognition.instances = []
  ;(window as unknown as Record<string, unknown>).SpeechRecognition = MockSpeechRecognition
  ;(window as unknown as Record<string, unknown>).webkitSpeechRecognition = MockSpeechRecognition
})

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).SpeechRecognition
  delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition
})

describe('useSpeechRecognition', () => {
  it('reports unsupported when the API is absent', () => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    const { result } = renderHook(() => useSpeechRecognition())
    expect(result.current.isSupported).toBe(false)
  })

  it('starts listening and configures vi-VN with interim results', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.start())
    expect(result.current.isListening).toBe(true)
    const rec = lastInstance()
    expect(rec.lang).toBe('vi-VN')
    expect(rec.interimResults).toBe(true)
    expect(rec.start).toHaveBeenCalled()
  })

  it('accumulates interim then final results into transcript', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.start())
    const rec = lastInstance()
    act(() => rec.onresult!(resultEvent([{ transcript: 'xin chào', isFinal: false }])))
    expect(result.current.transcript).toBe('xin chào')
    act(() => rec.onresult!(resultEvent([{ transcript: 'xin chào bạn', isFinal: true }])))
    expect(result.current.transcript).toBe('xin chào bạn')
  })

  it('cancel clears the transcript and stops listening', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.start())
    act(() => lastInstance().onresult!(resultEvent([{ transcript: 'bỏ đi', isFinal: true }])))
    act(() => result.current.cancel())
    expect(result.current.transcript).toBe('')
    expect(result.current.isListening).toBe(false)
  })

  it('stop keeps the transcript and stops listening', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.start())
    act(() => lastInstance().onresult!(resultEvent([{ transcript: 'giữ lại', isFinal: true }])))
    act(() => result.current.stop())
    expect(result.current.transcript).toBe('giữ lại')
    expect(result.current.isListening).toBe(false)
  })
})
