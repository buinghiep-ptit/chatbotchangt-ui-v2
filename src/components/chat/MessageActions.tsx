import { useState } from 'react'
import { Copy, Check, ThumbsUp, Cuboid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useWidgetStore } from '@/store/useWidgetStore'

interface Props {
  text?: string
  html?: string
}

export function MessageActions({ text, html }: Props) {
  const { openBrickSheet } = useWidgetStore()
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState(false)

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

  return (
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

      <ActionBtn title="Ném gạch" onClick={openBrickSheet}>
        <Cuboid className="h-3.5 w-3.5" />
      </ActionBtn>
    </div>
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
