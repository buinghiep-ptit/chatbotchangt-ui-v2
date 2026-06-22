import { useState } from 'react'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Button } from '@/components/ui/button'

export function BrickSheetContent() {
  const { closeBrickSheet } = useWidgetStore()
  const [comment, setComment] = useState('')

  const handleSubmit = () => {
    closeBrickSheet()
    setComment('')
  }

  const handleClose = () => {
    closeBrickSheet()
    setComment('')
  }

  return (
    <div className="px-4 pb-6 pt-2">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Ném gạch
      </p>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Nhập câu trả lời, góp ý..."
        className="mb-4 h-28 w-full resize-none rounded-xl border border-input bg-transparent p-3 text-sm outline-none focus:ring-1 focus:ring-ring"
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={handleClose}>Đóng</Button>
        <Button size="sm" className="bg-red-600 text-white hover:bg-red-700" onClick={handleSubmit}>
          Gửi
        </Button>
      </div>
    </div>
  )
}
