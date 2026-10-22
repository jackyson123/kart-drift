'use client'

import { useMemo, useSyncExternalStore } from 'react'
import { Banana, Bomb, Crosshair, Disc3, Flag, RotateCcw, Star, X, Zap, type LucideIcon } from 'lucide-react'
import { ITEM_LABELS, ITEM_TYPES, type ItemType, type Race } from '@/lib/game/engine'
import { TRACK, trackBounds } from '@/lib/game/track'
import { cn } from '@/lib/utils'

export const ITEM_ICONS: Record<ItemType, { icon: LucideIcon; className: string }> = {
  boost: { icon: Zap, className: 'text-primary' },
  banana: { icon: Banana, className: 'text-primary' },
  green: { icon: Disc3, className: 'text-success' },
  red: { icon: Crosshair, className: 'text-accent' },
  bomb: { icon: Bomb, className: 'text-foreground' },
  star: { icon: Star, className: 'text-primary' },
}

function ordinal(n: number) {
  if (n === 1) return 'ST'
  if (n === 2) return 'ND'
  if (n === 3) return 'RD'
  return 'TH'
}

export function formatTime(t: number) {
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  const c = Math.floor((t * 100) % 100)
  return `${m}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`
}

function Minimap({ dots }: { dots: { x: number; z: number; color: string; isPlayer: boolean }[] }) {
  const { viewBox, points } = useMemo(() => {
    const b = trackBounds()
    const pad = 24
    const pts = TRACK.filter((_, i) => i % 4 === 0)
      .map((s) => `${s.x.toFixed(1)},${s.z.toFixed(1)}`)
      .join(' ')
    return {
      viewBox: `${b.minX - pad} ${b.minZ - pad} ${b.maxX - b.minX + pad * 2} ${b.maxZ - b.minZ + pad * 2}`,
      points: pts,
    }
  }, [])

  return (
    <svg viewBox={viewBox} className="h-32 w-32 md:h-44 md:w-44" role="img" aria-label="賽道小地圖">
      <polygon points={points} fill="none" stroke="var(--hud-panel)" strokeWidth={24} strokeLinejoin="round" />
      <polygon points={points} fill="none" stroke="var(--foreground)" strokeOpacity={0.85} strokeWidth={9} strokeLinejoin="round" />
      {dots
        .slice()
        .sort((a, b) => Number(a.isPlayer) - Number(b.isPlayer))
        .map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.z}
            r={d.isPlayer ? 11 : 8}
            fill={d.color}
            stroke="var(--hud-panel)"
            strokeWidth={d.isPlayer ? 5 : 3}
          />
        ))}
    </svg>
  )
}

function ItemSlot({ item, rolling }: { item: ItemType | null; rolling: boolean }) {
  const shown = rolling ? ITEM_TYPES[Math.floor(Date.now() / 90) % ITEM_TYPES.length] : item
  const entry = shown ? ITEM_ICONS[shown] : null
  const Icon = entry?.icon
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          'flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-foreground bg-hud-panel/80 md:h-24 md:w-24',
          item && !rolling && 'animate-pulse',
        )}
      >
        {Icon ? (
          <Icon className={cn('h-10 w-10 md:h-12 md:w-12', entry.className)} strokeWidth={2.5} aria-hidden="true" />
        ) : null}
      </div>
      <span className="rounded-md bg-hud-panel/80 px-2 py-0.5 text-xs font-bold text-foreground">
        {rolling ? '抽取中…' : item ? `${ITEM_LABELS[item]}・空白鍵` : '沒有道具'}
      </span>
    </div>
  )
}

export function Hud({ race, onRestart, onMenu }: { race: Race; onRestart: () => void; onMenu: () => void }) {
  const hud = useSyncExternalStore(race.subscribe, race.getHud, race.getHud)
  const driftPct = Math.min(1, hud.driftCharge / 2.2)

  return (
    <div className="pointer-events-none absolute inset-0 select-none font-sans text-foreground">
      <div className="flex items-start justify-between gap-2 p-3 md:p-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMenu}
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-hud-panel/80 text-foreground hover:bg-hud-panel"
              aria-label="返回選單"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="rounded-xl bg-hud-panel/80 px-3 py-1">
              <span className="font-display text-sm text-muted-foreground">LAP </span>
              <span className="font-display text-2xl text-primary md:text-3xl">{hud.lap}</span>
              <span className="font-display text-lg text-foreground">/{hud.laps}</span>
            </div>
          </div>
          <div className="w-fit rounded-xl bg-hud-panel/80 px-3 py-1 font-display text-lg tabular-nums md:text-xl">
            {formatTime(hud.time)}
          </div>
        </div>

        <ItemSlot item={hud.item} rolling={hud.rolling} />

        <div className="rounded-2xl bg-hud-panel/60 p-1">
          <Minimap dots={hud.dots} />
        </div>
      </div>

      <div className="absolute inset-x-0 top-1/3 flex justify-center px-4" aria-live="polite">
        {hud.phase === 'countdown' ? (
          <span
            key={hud.countdown}
            className="animate-in zoom-in-50 fade-in font-display text-8xl text-primary drop-shadow-[0_6px_0_var(--hud-panel)] duration-300 md:text-9xl"
          >
            {hud.countdown > 3 ? 'READY' : hud.countdown}
          </span>
        ) : hud.message && !hud.results ? (
          <span
            key={hud.message}
            className="animate-in zoom-in-75 fade-in text-balance text-center font-display text-4xl text-primary drop-shadow-[0_4px_0_var(--hud-panel)] duration-200 md:text-6xl"
          >
            {hud.message}
          </span>
        ) : null}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3 md:p-5 [@media(pointer:coarse)]:bottom-44">
        <div className="flex items-baseline drop-shadow-[0_5px_0_var(--hud-panel)]">
          <span className="font-display text-7xl leading-none text-primary md:text-8xl">{hud.place}</span>
          <span className="font-display text-2xl text-foreground md:text-3xl">{ordinal(hud.place)}</span>
          <span className="ml-1 font-display text-lg text-muted-foreground">/{hud.total}</span>
        </div>
        <div className="flex flex-col items-end gap-2">
          {hud.star ? (
            <span className="rounded-md bg-primary px-2 py-0.5 text-sm font-bold text-primary-foreground">無敵中</span>
          ) : hud.boosting ? (
            <span className="rounded-md bg-accent px-2 py-0.5 text-sm font-bold text-accent-foreground">加速中</span>
          ) : null}
          {hud.drifting ? (
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-bold">甩尾充能</span>
              <div className="h-3 w-36 overflow-hidden rounded-full bg-hud-panel/80">
                <div
                  className={cn(
                    'h-full rounded-full transition-[width]',
                    driftPct >= 1 ? 'bg-accent' : driftPct > 0.45 ? 'bg-sky' : 'bg-foreground',
                  )}
                  style={{ width: `${driftPct * 100}%` }}
                />
              </div>
            </div>
          ) : null}
          <div className="rounded-xl bg-hud-panel/80 px-3 py-1 text-right">
            <span className="font-display text-3xl tabular-nums md:text-4xl">{hud.speed}</span>
            <span className="ml-1 text-xs font-bold text-muted-foreground">km/h</span>
          </div>
        </div>
      </div>

      {hud.results ? (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-hud-panel/60 p-4">
          <div className="animate-in fade-in zoom-in-95 w-full max-w-md rounded-3xl border-4 border-foreground bg-card p-6 text-card-foreground duration-300">
            <div className="mb-4 flex items-center gap-2">
              <Flag className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2 className="font-display text-2xl">比賽結果</h2>
            </div>
            <ol className="flex flex-col gap-2">
              {hud.results.map((r) => (
                <li
                  key={r.name}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2',
                    r.isPlayer ? 'bg-primary text-primary-foreground' : 'bg-muted',
                  )}
                >
                  <span className="w-8 font-display text-xl">{r.place}</span>
                  <span className="h-4 w-4 rounded-full border-2 border-foreground" style={{ backgroundColor: r.color }} />
                  <span className="flex-1 font-bold">{r.name}</span>
                  <span className="font-display text-sm tabular-nums">{r.time !== null ? formatTime(r.time) : '比賽中…'}</span>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onRestart}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-bold text-accent-foreground hover:opacity-90"
              >
                <RotateCcw className="h-5 w-5" aria-hidden="true" />
                再玩一次
              </button>
              <button
                type="button"
                onClick={onMenu}
                className="flex-1 rounded-xl border-2 border-foreground px-4 py-3 font-bold hover:bg-muted"
              >
                返回選單
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
