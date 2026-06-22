import { useState } from 'react'
import { Copy, Check, ThumbsUp, Cuboid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Props {
  text?: string
  html?: string
}

export function MessageActions({ text, html }: Props) {
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState(false)
  const [showBrick, setShowBrick] = useState(false)
  const [comment, setComment] = useState('')

  const plainText = text ?? (html ? html.replace(/<[^>]+>/g, '') : '')

  const handleCopy = () => {
    if (!plainText) return
    const write = () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(plainText).then(write).catch(fallback)
    } else {
      fallback()
    }
    function fallback() {
      const ta = document.createElement('textarea')
      ta.value = plainText
      Object.assign(ta.style, { position: 'fixed', opacity: '0', pointerEvents: 'none' })
      document.body.appendChild(ta)
      ta.focus(); ta.select()
      try { document.execCommand('copy') } catch { /* noop */ }
      document.body.removeChild(ta)
      write()
    }
  }

  const closeBrick = () => { setShowBrick(false); setComment('') }

  return (
    <>
      <div className="flex items-center gap-0.5 ml-0.5 mt-1">
        <ActionBtn title={copied ? 'Đã sao chép' : 'Sao chép'} onClick={handleCopy}>
          {copied
            ? <Check className="h-3.5 w-3.5 text-green-500" />
            : <Copy className="h-3.5 w-3.5" />}
        </ActionBtn>

        <ActionBtn
          title={liked ? 'Đã thích' : 'Thích'}
          onClick={() => setLiked(true)}
          disabled={liked}
        >
          <ThumbsUp className={cn('h-3.5 w-3.5', liked && 'fill-current text-violet-500')} />
        </ActionBtn>

        <ActionBtn title="Ném gạch" onClick={() => setShowBrick(true)}>
          <Cuboid className="h-3.5 w-3.5" />
        </ActionBtn>
      </div>

      {showBrick && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={closeBrick}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl bg-background p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-sm font-semibold">Ném gạch</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Nhập câu trả lời, góp ý..."
              className="mb-4 h-28 w-full resize-y rounded-md border border-input bg-transparent p-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={closeBrick}>Đóng</Button>
              <Button
                size="sm"
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={closeBrick}
              >
                Gửi
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ActionBtn({
  children, onClick, title, disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  disabled?: boolean
}) {
  return (
    <Button
      size="icon"
      variant="ghost"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </Button>
  )
}
