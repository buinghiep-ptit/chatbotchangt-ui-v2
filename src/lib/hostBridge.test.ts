import { afterEach, expect, it, vi } from 'vitest'
import { hostBridge } from './hostBridge'

afterEach(() => vi.restoreAllMocks())

it('initChat posts INIT_CHAT to the bubble frame', () => {
  const spy = vi.spyOn(window.parent, 'postMessage')
  hostBridge.initChat()
  expect(spy).toHaveBeenCalledWith(
    { type: 'INIT_CHAT', data: 'Data from chat-frame', target: 'bubble-frame' },
    '*',
  )
})

it('openChat posts TOGGLE_CHAT isOpen:true to the chat frame', () => {
  const spy = vi.spyOn(window.parent, 'postMessage')
  hostBridge.openChat()
  expect(spy).toHaveBeenCalledWith(
    { type: 'TOGGLE_CHAT', data: 'Data from bubble-frame', target: 'chat-frame', isOpen: true },
    '*',
  )
})

it('closeChat posts TOGGLE_CHAT isOpen:false to the bubble frame', () => {
  const spy = vi.spyOn(window.parent, 'postMessage')
  hostBridge.closeChat()
  expect(spy).toHaveBeenCalledWith(
    { type: 'TOGGLE_CHAT', data: 'Data from chat-frame', target: 'bubble-frame', isOpen: false },
    '*',
  )
})

it('maximize and minimize post to the chat frame', () => {
  const spy = vi.spyOn(window.parent, 'postMessage')
  hostBridge.maximize()
  hostBridge.minimize()
  expect(spy).toHaveBeenNthCalledWith(
    1,
    { type: 'MAXIMIZE_CHAT', data: 'Data from chat-frame', target: 'chat-frame' },
    '*',
  )
  expect(spy).toHaveBeenNthCalledWith(
    2,
    { type: 'MINIMIZE_CHAT', data: 'Data from chat-frame', target: 'chat-frame' },
    '*',
  )
})
