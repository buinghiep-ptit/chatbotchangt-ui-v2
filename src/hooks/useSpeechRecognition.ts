import { useCallback, useEffect, useRef, useState } from 'react'

type RecognitionCtor = new () => {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: unknown) => void) | null
  onerror: ((e: unknown) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, RecognitionCtor | undefined>
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function isAndroid(): boolean {
  return typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)
}

function joinText(...parts: string[]): string {
  return parts.map((p) => p.trim()).filter(Boolean).join(' ')
}

export interface UseSpeechRecognition {
  isSupported: boolean
  isListening: boolean
  transcript: string
  start: () => void
  stop: () => void
  cancel: () => void
  reset: () => void
}

export function useSpeechRecognition(lang = 'vi-VN'): UseSpeechRecognition {
  const isSupported = getRecognitionCtor() !== null

  const recognitionRef = useRef<InstanceType<RecognitionCtor> | null>(null)
  const isListeningRef = useRef(false)
  const isCancellingRef = useRef(false)
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sessionRef = useRef('') // finalized phrases this session
  const interimRef = useRef('') // latest partial phrase

  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')

  const syncTranscript = useCallback(() => {
    setTranscript(joinText(sessionRef.current, interimRef.current))
  }, [])

  const buildRecognition = useCallback(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return null
    const rec = new Ctor()
    rec.lang = lang
    rec.continuous = !isAndroid()
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onresult = (event: unknown) => {
      if (isCancellingRef.current) return
      const e = event as { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }
      let newFinal = ''
      let newInterim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) newFinal += t + ' '
        else newInterim += t
      }
      if (newFinal) sessionRef.current = joinText(sessionRef.current, newFinal)
      interimRef.current = newInterim.trim()
      syncTranscript()
    }

    rec.onerror = (event: unknown) => {
      const err = (event as { error?: string }).error
      if (err === 'no-speech') return
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        isListeningRef.current = false
        setIsListening(false)
      } else {
        console.warn('Speech recognition error:', err)
      }
    }

    rec.onend = () => {
      if (!isListeningRef.current || isCancellingRef.current) return
      if (interimRef.current) {
        sessionRef.current = joinText(sessionRef.current, interimRef.current)
        interimRef.current = ''
        syncTranscript()
      }
      const delay = isAndroid() ? 150 : 50
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
      restartTimerRef.current = setTimeout(() => {
        if (!isListeningRef.current) return
        try {
          rec.start()
        } catch {
          /* already running */
        }
      }, delay)
    }

    return rec
  }, [lang, syncTranscript])

  const teardown = useCallback(() => {
    isListeningRef.current = false
    setIsListening(false)
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    const rec = recognitionRef.current
    if (rec) {
      try {
        rec.stop()
      } catch {
        /* not running */
      }
    }
  }, [])

  const start = useCallback(() => {
    if (!isSupported || isListeningRef.current) return
    isCancellingRef.current = false
    sessionRef.current = ''
    interimRef.current = ''
    setTranscript('')
    const rec = buildRecognition()
    if (!rec) return
    recognitionRef.current = rec
    isListeningRef.current = true
    setIsListening(true)
    try {
      rec.start()
    } catch {
      /* already running */
    }
  }, [isSupported, buildRecognition])

  const stop = useCallback(() => {
    if (interimRef.current) {
      sessionRef.current = joinText(sessionRef.current, interimRef.current)
      interimRef.current = ''
      syncTranscript()
    }
    teardown()
  }, [teardown, syncTranscript])

  const cancel = useCallback(() => {
    isCancellingRef.current = true
    sessionRef.current = ''
    interimRef.current = ''
    setTranscript('')
    teardown()
  }, [teardown])

  const reset = useCallback(() => {
    sessionRef.current = ''
    interimRef.current = ''
    setTranscript('')
  }, [])

  useEffect(() => {
    return () => {
      isListeningRef.current = false
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
      const rec = recognitionRef.current
      if (rec) {
        try {
          rec.abort()
        } catch {
          /* noop */
        }
      }
    }
  }, [])

  return { isSupported, isListening, transcript, start, stop, cancel, reset }
}
