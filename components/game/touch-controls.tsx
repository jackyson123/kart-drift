'use client'

import { ArrowLeft, ArrowRight, ChevronsUp, Package, Wind, ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TouchKey } from '@/lib/game/use-keyboard-input'
import { cn } from '@/lib/utils'

function Pad({
  k,
  icon: Icon,
  label,
  setKey,
  className,
}: {
  k: TouchKey
  icon: LucideIcon
  label: string
  setKey: (k: TouchKey, down: boolean) => void
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'flex touch-none items-center justify-center rounded-full border-4 border-foreground/80 bg-hud-panel/70 text-foreground active:bg-primary active:text-primary-foreground',
        className,
      )}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        setKey(k, true)
      }}
      onPointerUp={() => setKey(k, false)}
      onPointerCancel={() => setKey(k, false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Icon className="h-8 w-8" aria-hidden="true" />
    </button>
  )
}

export function TouchControls({ setKey }: { setKey: (k: TouchKey, down: boolean) => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden items-end justify-between p-4 [@media(pointer:coarse)]:flex">
      <div className="pointer-events-auto flex gap-3">
        <Pad k="left" icon={ArrowLeft} label="左轉" setKey={setKey} className="h-20 w-20" />
        <Pad k="right" icon={ArrowRight} label="右轉" setKey={setKey} className="h-20 w-20" />
      </div>
      <div className="pointer-events-auto grid grid-cols-2 gap-3">
        <Pad k="item" icon={Package} label="使用道具" setKey={setKey} className="h-16 w-16" />
        <Pad k="drift" icon={Wind} label="甩尾" setKey={setKey} className="h-16 w-16" />
        <Pad k="brake" icon={ChevronDown} label="煞車" setKey={setKey} className="h-20 w-20" />
        <Pad k="throttle" icon={ChevronsUp} label="油門" setKey={setKey} className="h-20 w-20 border-primary" />
      </div>
    </div>
  )
}
