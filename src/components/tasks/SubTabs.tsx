import { useState } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { useWidgetStore } from '@/store/useWidgetStore'
import { Button } from '@/components/ui/button'
import { SEED_TASKS } from '@/data/tasks'
import { SOFT_SPRING } from '@/lib/motion'
import type { TaskFilter } from '@/types'

const SUBTABS: { id: TaskFilter; label: string }[] = [
  { id: 'pending', label: 'Cần xử lý' },
  { id: 'watch', label: 'Theo dõi' },
  { id: 'mine', label: 'Khởi tạo' },
  { id: 'done', label: 'Hoàn thành' },
]
const count = (f: TaskFilter) => SEED_TASKS.filter((t) => t.bucket.includes(f)).length

export function SubTabs() {
  const { taskFilter, setTaskFilter } = useWidgetStore()
  const [hoveredId, setHoveredId] = useState<TaskFilter | null>(null)

  return (
    <div className="flex flex-shrink-0 gap-1 overflow-x-auto border-b border-border/60 px-3 py-2.5 [&::-webkit-scrollbar]:hidden">
      {SUBTABS.map(({ id, label }) => {
        const isActive = taskFilter === id
        return (
          <Button
            key={id}
            variant="ghost"
            onClick={() => setTaskFilter(id)}
            onMouseEnter={() => setHoveredId(id)}
            onMouseLeave={() => setHoveredId(null)}
            className={cn(
              'relative h-auto whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] font-semibold',
              'hover:bg-transparent',
              isActive ? 'text-primary hover:text-primary' : 'text-muted-foreground',
            )}
          >
            {/* Active pill — slides between tabs on filter change */}
            {isActive && (
              <motion.div
                layoutId="subtab-pill"
                transition={SOFT_SPRING}
                className="absolute inset-0 rounded-full bg-primary/15"
              />
            )}
            {/* Hover pill — slides between inactive tabs as the pointer moves */}
            {!isActive && hoveredId === id && (
              <motion.div
                layoutId="subtab-hover"
                transition={SOFT_SPRING}
                className="absolute inset-0 rounded-full bg-accent"
              />
            )}
            {/* Text sits above the absolutely-positioned pills */}
            <span className="relative">
              {label}
              <span className="ml-1 opacity-70">{count(id)}</span>
            </span>
          </Button>
        )
      })}
    </div>
  )
}
