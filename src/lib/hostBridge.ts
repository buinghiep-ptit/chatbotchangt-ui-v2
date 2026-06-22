export type HostMessage =
  | { type: 'INIT_CHAT'; data: string; target: 'bubble-frame' }
  | { type: 'TOGGLE_CHAT'; data: string; target: 'chat-frame' | 'bubble-frame'; isOpen: boolean }
  | { type: 'MAXIMIZE_CHAT' | 'MINIMIZE_CHAT'; data: string; target: 'chat-frame' }

function post(message: HostMessage): void {
  window.parent.postMessage(message, '*')
}

export const hostBridge = {
  initChat(): void {
    post({ type: 'INIT_CHAT', data: 'Data from chat-frame', target: 'bubble-frame' })
  },
  openChat(): void {
    post({ type: 'TOGGLE_CHAT', data: 'Data from bubble-frame', target: 'chat-frame', isOpen: true })
  },
  closeChat(): void {
    post({ type: 'TOGGLE_CHAT', data: 'Data from chat-frame', target: 'bubble-frame', isOpen: false })
  },
  maximize(): void {
    post({ type: 'MAXIMIZE_CHAT', data: 'Data from chat-frame', target: 'chat-frame' })
  },
  minimize(): void {
    post({ type: 'MINIMIZE_CHAT', data: 'Data from chat-frame', target: 'chat-frame' })
  },
}
