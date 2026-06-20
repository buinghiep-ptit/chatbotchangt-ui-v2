import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Button } from '@/components/ui/button'

export function Stage({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useWidgetStore()
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: 'var(--stage-grad)' }}>
      <div className="absolute left-6 top-5 flex items-center gap-3.5 text-xs text-muted-foreground max-[480px]:hidden">
        <span><b className="font-semibold text-foreground/80">Demo host page</b> — webview nhúng góc phải</span>
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-card p-1 shadow-sm">
          {(['light', 'dark'] as const).map((t) => (
            <Button key={t} variant="ghost" onClick={() => setTheme(t)}
              className={cn(
                'h-auto rounded-full px-3 py-1.5 text-xs font-semibold',
                theme === t ? 'bg-primary text-white hover:bg-primary hover:text-white' : 'text-muted-foreground',
              )}>
              {t === 'light' ? 'Sáng' : 'Tối'}
            </Button>
          ))}
        </div>
      </div>
      {children}
    </div>
  )
}
