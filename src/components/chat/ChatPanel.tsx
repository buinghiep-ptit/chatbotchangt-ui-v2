import { useWidgetStore } from '@/store/useWidgetStore'
import { MessageList } from './MessageList'
import { Composer } from './Composer'

export function ChatPanel() {
  const sendChatMessage = useWidgetStore((s) => s.sendChatMessage)
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <MessageList />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
      </div>
      <Composer placeholder="Nhắn cho Chang…" onSend={sendChatMessage} />
    </div>
  )
}
