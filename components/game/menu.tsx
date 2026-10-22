'use client'

import Image from 'next/image'
import { Flag } from 'lucide-react'
import { ITEM_LABELS, ITEM_TYPES, ROSTER, type Difficulty } from '@/lib/game/engine'
import { ITEM_ICONS } from './hud'
import { cn } from '@/lib/utils'

const ITEM_DESC: Record<(typeof ITEM_TYPES)[number], string> = {
  boost: '瞬間加速衝刺',
  banana: '丟在身後，踩中會打滑',
  green: '直線射出，會在牆壁反彈',
  red: '自動追蹤前一名',
  bomb: '向前拋出，落地後爆炸',
  star: '無敵 7 秒，撞飛對手',
}

const TRAPS = [
  { name: '油漬', desc: '駛過會失控打轉' },
  { name: '地雷', desc: '觸發後炸飛附近賽車' },
  { name: '壓扁石塊', desc: '看準影子，落下時會壓扁你' },
  { name: '加速帶', desc: '橙色箭頭，駛過自動加速' },
]

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: '簡單' },
  { value: 'normal', label: '普通' },
  { value: 'hard', label: '困難' },
]

export function Menu({
  colorIndex,
  difficulty,
  onColor,
  onDifficulty,
  onStart,
}: {
  colorIndex: number
  difficulty: Difficulty
  onColor: (i: number) => void
  onDifficulty: (d: Difficulty) => void
  onStart: () => void
}) {
  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-background text-foreground">
      <Image
        src="/images/kart-hero.png"
        alt=""
        fill
        priority
        className="object-cover opacity-45"
        sizes="100vw"
      />
      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-5 py-8 md:py-12 lg:flex-row lg:items-center">
        <section className="flex flex-1 flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="w-fit rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">
              3 圈・6 架賽車・道具亂鬥
            </p>
            <h1 className="font-display text-6xl leading-none text-primary drop-shadow-[0_6px_0_var(--hud-panel)] md:text-8xl">
              TURBO
              <br />
              KART
            </h1>
            <p className="text-2xl font-black md:text-3xl">極速道具賽車</p>
            <p className="max-w-md text-pretty leading-relaxed text-foreground/90">
              撞開道具箱抽道具、閃避賽道上的陷阱、用甩尾儲氣加速，衝線拿第一！
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border-4 border-foreground bg-card/90 p-5">
            <h2 className="font-bold">選擇你的賽車</h2>
            <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="賽車顏色">
              {ROSTER.map((r, i) => (
                <button
                  key={r.color}
                  type="button"
                  role="radio"
                  aria-checked={colorIndex === i}
                  aria-label={r.name}
                  onClick={() => onColor(i)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-2xl border-4 px-3 py-2 transition-transform',
                    colorIndex === i ? 'scale-105 border-primary bg-muted' : 'border-transparent hover:bg-muted',
                  )}
                >
                  <span className="h-10 w-10 rounded-full border-4 border-foreground" style={{ backgroundColor: r.color }} />
                  <span className="text-sm font-bold">{r.name}</span>
                </button>
              ))}
            </div>

            <h2 className="mt-2 font-bold">難度</h2>
            <div className="flex gap-2" role="radiogroup" aria-label="難度">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  role="radio"
                  aria-checked={difficulty === d.value}
                  onClick={() => onDifficulty(d.value)}
                  className={cn(
                    'flex-1 rounded-xl border-2 px-4 py-2 font-bold',
                    difficulty === d.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-foreground/40 hover:bg-muted',
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onStart}
              className="mt-3 flex items-center justify-center gap-3 rounded-2xl bg-accent px-6 py-4 font-display text-2xl text-accent-foreground shadow-[0_6px_0_var(--hud-panel)] transition-transform hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
            >
              <Flag className="h-6 w-6" aria-hidden="true" />
              START
            </button>
          </div>
        </section>

        <section className="flex flex-1 flex-col gap-4 rounded-3xl bg-card/90 p-5 lg:max-w-md">
          <div>
            <h2 className="mb-2 font-bold text-primary">操作</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm leading-relaxed">
              <dt className="font-bold text-primary">↑ / W</dt>
              <dd>加速</dd>
              <dt className="font-bold text-primary">↓ / S</dt>
              <dd>煞車 / 倒車</dd>
              <dt className="font-bold text-primary">← → / A D</dt>
              <dd>轉向</dd>
              <dt className="font-bold text-primary">Shift + 轉向</dt>
              <dd>甩尾儲氣，放開噴射（藍火 → 橙火更快）</dd>
              <dt className="font-bold text-primary">空白鍵</dt>
              <dd>使用道具</dd>
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">倒數時按住加速，起步會有火箭衝刺！手機可用畫面按鈕操作。</p>
          </div>

          <div>
            <h2 className="mb-2 font-bold text-primary">道具</h2>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ITEM_TYPES.map((t) => {
                const { icon: Icon, className } = ITEM_ICONS[t]
                return (
                  <li key={t} className="flex items-start gap-2 rounded-xl bg-muted p-2">
                    <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', className)} aria-hidden="true" />
                    <div className="text-sm leading-snug">
                      <p className="font-bold">{ITEM_LABELS[t]}</p>
                      <p className="text-muted-foreground">{ITEM_DESC[t]}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <h2 className="mb-2 font-bold text-primary">賽道陷阱</h2>
            <ul className="grid grid-cols-2 gap-2">
              {TRAPS.map((t) => (
                <li key={t.name} className="rounded-xl bg-muted p-2 text-sm leading-snug">
                  <p className="font-bold">{t.name}</p>
                  <p className="text-muted-foreground">{t.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  )
}
