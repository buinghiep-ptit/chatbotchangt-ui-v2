import { useState } from 'react'
import { Copy, Check, ThumbsUp } from 'lucide-react'
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
          <BrickIcon />
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

function BrickIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m21.12 6.4-6.05-4.06a2 2 0 0 0-2.17-.05L2.95 8.41a2 2 0 0 0-.95 1.7v5.82a2 2 0 0 0 .88 1.66l6.05 4.07a2 2 0 0 0 2.17.05l9.95-6.12a2 2 0 0 0 .95-1.7V8.06a2 2 0 0 0-.88-1.66Z" />
      <path d="M10 22v-8L2.25 9.15" />
      <path d="m10 14 11.77-6.87" />
    </svg>
  )
}
