import { useWidgetStore } from '@/store/useWidgetStore'
import { MessageList } from './MessageList'
import { Composer } from './Composer'

export function ChatPanel() {
  const sendChatMessage = useWidgetStore((s) => s.sendChatMessage)
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <MessageList />
      <Composer placeholder="Nhắn cho Chang…" onSend={sendChatMessage} />
    </div>
  )
}
