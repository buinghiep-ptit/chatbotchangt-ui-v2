import { useWidgetStore } from '@/store/useWidgetStore'
import { QuickSuggestions } from './QuickSuggestions'
import { MessageList } from './MessageList'
import { Composer } from './Composer'
import { HistoryDrawer } from './HistoryDrawer'

export function ChatPanel() {
  const sendChatMessage = useWidgetStore((s) => s.sendChatMessage)
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <QuickSuggestions />
      <MessageList />
      <Composer placeholder="Nhắn cho Chang…" onSend={sendChatMessage} />
      <HistoryDrawer />
    </div>
  )
}
