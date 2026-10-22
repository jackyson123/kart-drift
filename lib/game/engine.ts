import { LAPS, ROAD_HALF, SAMPLES, TRACK, WALL_HALF, lateral, locate, pointAt, wrapIndex } from './track'

export type ItemType = 'boost' | 'banana' | 'green' | 'red' | 'bomb' | 'star'
export type Difficulty = 'easy' | 'normal' | 'hard'
type HitKind = 'spin' | 'blast' | 'squash'
type HitSource = 'banana' | 'oil' | 'shell' | 'bomb' | 'mine' | 'crusher' | 'star'

export const ITEM_TYPES: ItemType[] = ['boost', 'banana', 'green', 'red', 'bomb', 'star']

export interface RaceInput {
  throttle: boolean
  brake: boolean
  steer: number
  drift: boolean
  item: boolean
}

export const ROSTER = [
  { name: '阿火', color: '#e63946' },
  { name: '小藍', color: '#1d7bf2' },
  { name: '青蛙', color: '#2bb673' },
  { name: '阿黃', color: '#ffc531' },
  { name: '紫電', color: '#9b5de5' },
  { name: '橙仔', color: '#ff7a1a' },
] as const

export interface Kart {
  id: number
  name: string
  color: string
  isPlayer: boolean
  x: number
  z: number
  y: number
  vy: number
  heading: number
  speed: number
  steerVisual: number
  idx: number
  lat: number
  progress: number
  lapsDone: number
  finished: boolean
  finishTime: number
  place: number
  item: ItemType | null
  roulette: number
  spin: number
  spinAngle: number
  squash: number
  star: number
  boost: number
  invuln: number
  driftDir: number
  driftCharge: number
  wallCooldown: number
  prevItem: boolean
  skill: number
  aiOffset: number
  aiTimer: number
  aiItemTimer: number
  wheelRot: number
}

export interface ItemBox {
  x: number
  z: number
  active: boolean
  timer: number
  seed: number
}
export interface Banana {
  active: boolean
  x: number
  z: number
  idx: number
  lat: number
  rot: number
}
export interface Shell {
  active: boolean
  type: 'green' | 'red'
  x: number
  z: number
  heading: number
  speed: number
  idx: number
  life: number
  age: number
  owner: number
  target: number
  bounces: number
}
export interface Bomb {
  active: boolean
  state: 'fly' | 'armed'
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  timer: number
  owner: number
  idx: number
}
export interface Blast {
  active: boolean
  x: number
  z: number
  t: number
  radius: number
}
export interface Oil {
  x: number
  z: number
  idx: number
  lat: number
  radius: number
}
export interface Mine {
  x: number
  z: number
  idx: number
  lat: number
  active: boolean
  timer: number
}
export interface Crusher {
  x: number
  z: number
  heading: number
  phase: number
  y: number
}
export interface Pad {
  x: number
  z: number
  heading: number
}

export interface HudResult {
  name: string
  color: string
  isPlayer: boolean
  time: number | null
  place: number
}

export interface HudSnapshot {
  phase: 'countdown' | 'racing' | 'finished'
  countdown: number
  place: number
  total: number
  lap: number
  laps: number
  item: ItemType | null
  rolling: boolean
  time: number
  speed: number
  driftCharge: number
  drifting: boolean
  boosting: boolean
  star: boolean
  message: string | null
  dots: { x: number; z: number; color: string; isPlayer: boolean }[]
  results: HudResult[] | null
}

const BASE_SPEED = 30
const ACCEL = 16
const TURN_RATE = 2.1
const CRUSHER_PERIOD = 3.2
const CRUSHER_HEIGHT = 7

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
function wrapAngle(a: number) {
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}
function pool<T>(n: number, make: () => T): T[] {
  return Array.from({ length: n }, make)
}

export function crusherHeight(t: number) {
  const p = ((t % CRUSHER_PERIOD) + CRUSHER_PERIOD) % CRUSHER_PERIOD
  if (p < 1.4) return CRUSHER_HEIGHT
  if (p < 1.65) {
    const f = (p - 1.4) / 0.25
    return CRUSHER_HEIGHT * (1 - f * f)
  }
  if (p < 2.5) return 0
  return CRUSHER_HEIGHT * ((p - 2.5) / 0.7)
}

const HIT_MESSAGES: Record<HitSource, string> = {
  banana: '踩中香蕉皮！',
  oil: '油漬打滑！',
  shell: '被龜殼擊中！',
  bomb: '被炸彈炸飛！',
  mine: '踩中地雷！',
  crusher: '被石塊壓扁！',
  star: '被無敵星撞飛！',
}

export const ITEM_LABELS: Record<ItemType, string> = {
  boost: '加速蘑菇',
  banana: '香蕉皮',
  green: '綠龜殼',
  red: '追蹤紅殼',
  bomb: '炸彈',
  star: '無敵星',
}

export class Race {
  karts: Kart[] = []
  player: Kart
  boxes: ItemBox[] = []
  bananas: Banana[] = pool(40, () => ({ active: false, x: 0, z: 0, idx: 0, lat: 0, rot: 0 }))
  shells: Shell[] = pool(16, () => ({
    active: false,
    type: 'green' as const,
    x: 0,
    z: 0,
    heading: 0,
    speed: 0,
    idx: 0,
    life: 0,
    age: 0,
    owner: -1,
    target: -1,
    bounces: 0,
  }))
  bombs: Bomb[] = pool(10, () => ({
    active: false,
    state: 'fly' as const,
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    timer: 0,
    owner: -1,
    idx: 0,
  }))
  blasts: Blast[] = pool(12, () => ({ active: false, x: 0, z: 0, t: 0, radius: 5 }))
  oils: Oil[] = []
  mines: Mine[] = []
  crushers: Crusher[] = []
  pads: Pad[] = []

  phase: HudSnapshot['phase'] = 'countdown'
  countdown = 3.5
  time = 0
  clock = 0
  message: string | null = null
  messageTime = 0
  finishOrder: Kart[] = []

  private hud: HudSnapshot
  private hudTimer = 0
  private listeners = new Set<() => void>()

  constructor(playerColorIndex: number, difficulty: Difficulty) {
    const skillBase = difficulty === 'easy' ? 0.84 : difficulty === 'normal' ? 0.93 : 1.0
    const order = ROSTER.map((_, i) => i).filter((i) => i !== playerColorIndex)
    order.push(playerColorIndex)

    order.forEach((rosterIdx, gridPos) => {
      const row = Math.floor(gridPos / 2)
      const col = gridPos % 2 === 0 ? -3.5 : 3.5
      const idx = wrapIndex(-6 - row * 7)
      const p = pointAt(idx, col)
      const isPlayer = rosterIdx === playerColorIndex
      this.karts.push({
        id: gridPos,
        name: isPlayer ? '你' : ROSTER[rosterIdx].name,
        color: ROSTER[rosterIdx].color,
        isPlayer,
        x: p.x,
        z: p.z,
        y: 0,
        vy: 0,
        heading: p.heading,
        speed: 0,
        steerVisual: 0,
        idx,
        lat: col,
        progress: idx - SAMPLES,
        lapsDone: -1,
        finished: false,
        finishTime: 0,
        place: gridPos + 1,
        item: null,
        roulette: 0,
        spin: 0,
        spinAngle: 0,
        squash: 0,
        star: 0,
        boost: 0,
        invuln: 0,
        driftDir: 0,
        driftCharge: 0,
        wallCooldown: 0,
        prevItem: false,
        skill: isPlayer ? 1 : skillBase + rand(-0.03, 0.02),
        aiOffset: col,
        aiTimer: rand(1, 3),
        aiItemTimer: 0,
        wheelRot: 0,
      })
    })
    this.player = this.karts[this.karts.length - 1]

    for (const idx of [90, 300, 520, 690]) {
      for (const lat of [-6, -2, 2, 6]) {
        const p = pointAt(idx, lat)
        this.boxes.push({ x: p.x, z: p.z, active: true, timer: 0, seed: Math.random() * 10 })
      }
    }
    for (const [idx, lat, radius] of [
      [170, 3.5, 3.2],
      [430, -4, 3.4],
      [620, 2.5, 3.2],
    ]) {
      const p = pointAt(idx, lat)
      this.oils.push({ x: p.x, z: p.z, idx, lat, radius })
    }
    for (const [idx, lat] of [
      [240, -5],
      [250, 4.5],
      [480, 0],
      [740, -3],
    ]) {
      const p = pointAt(idx, lat)
      this.mines.push({ x: p.x, z: p.z, idx, lat, active: true, timer: 0 })
    }
    for (const [idx, lat, phase] of [
      [370, -4.5, 0],
      [370, 4.5, 1.6],
      [580, 0, 0.8],
    ]) {
      const p = pointAt(idx, lat)
      this.crushers.push({ x: p.x, z: p.z, heading: p.heading, phase, y: CRUSHER_HEIGHT })
    }
    for (const [idx, lat] of [
      [50, 0],
      [455, 5],
      [770, -5],
    ]) {
      const p = pointAt(idx, lat)
      this.pads.push({ x: p.x, z: p.z, heading: p.heading })
    }

    this.hud = this.buildHud()
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  getHud = () => this.hud

  private say(text: string, duration = 1.6) {
    this.message = text
    this.messageTime = duration
  }

  update(rawDt: number, input: RaceInput) {
    const dt = Math.min(rawDt, 0.05)
    this.clock += dt
    if (this.messageTime > 0) {
      this.messageTime -= dt
      if (this.messageTime <= 0) this.message = null
    }

    if (this.phase === 'countdown') {
      this.countdown -= dt
      if (this.countdown <= 0) {
        this.phase = 'racing'
        this.say('GO!', 1)
        if (input.throttle) {
          this.player.boost = 1
        }
      }
    } else {
      this.time += dt
      for (const k of this.karts) {
        const inp = k.isPlayer && !k.finished ? input : this.aiInput(k, dt)
        this.updateKart(k, inp, dt)
      }
      this.collideKarts()
    }

    this.updateWorld(dt)
    this.updatePlaces()

    this.hudTimer -= dt
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.08
      this.hud = this.buildHud()
      this.listeners.forEach((l) => l())
    }
  }

  private updateKart(k: Kart, inp: RaceInput, dt: number) {
    k.invuln = Math.max(0, k.invuln - dt)
    k.boost = Math.max(0, k.boost - dt)
    k.star = Math.max(0, k.star - dt)
    k.spin = Math.max(0, k.spin - dt)
    k.squash = Math.max(0, k.squash - dt)
    k.wallCooldown = Math.max(0, k.wallCooldown - dt)

    if (k.roulette > 0) {
      k.roulette -= dt
      if (k.roulette <= 0) {
        k.roulette = 0
        k.item = this.rollItem(k)
        k.aiItemTimer = rand(0.8, 3)
      }
    }

    if (k.y > 0 || k.vy > 0) {
      k.vy -= 30 * dt
      k.y += k.vy * dt
      if (k.y <= 0) {
        k.y = 0
        k.vy = 0
      }
    }

    const airborne = k.y > 0.01
    const stunned = k.spin > 0 || k.squash > 0 || airborne
    const offroad = Math.abs(k.lat) > ROAD_HALF + 0.5 && k.star <= 0 && k.boost <= 0

    let rubberBand = 0
    if (!k.isPlayer) {
      const gap = this.player.progress - k.progress
      if (gap > 40) rubberBand = Math.min(0.1, gap / 800)
      else if (gap < -60) rubberBand = -Math.min(0.08, -gap / 1000)
    }
    let max = BASE_SPEED * (k.skill + rubberBand)
    if (offroad) max *= 0.45
    if (k.boost > 0) max = Math.max(max, BASE_SPEED * 1.45)
    if (k.star > 0) max = BASE_SPEED * 1.3

    if (stunned) {
      k.speed *= Math.pow(0.15, dt)
      if (k.squash > 0) k.speed = 0
      k.driftDir = 0
    } else {
      if (inp.throttle && k.speed < max) {
        k.speed = Math.min(max, k.speed + ACCEL * dt * (k.boost > 0 ? 3 : 1))
      }
      if (inp.brake) {
        k.speed = Math.max(-10, k.speed - 45 * dt)
      }
      if (!inp.throttle && !inp.brake) {
        k.speed -= Math.sign(k.speed) * Math.min(Math.abs(k.speed), 12 * dt)
      }
      if (k.speed > max) k.speed = Math.max(max, k.speed - 30 * dt)

      const steerIn = clamp(inp.steer, -1, 1)
      if (inp.drift && !k.driftDir && Math.abs(steerIn) > 0.3 && k.speed > 14) {
        k.driftDir = Math.sign(steerIn)
        k.driftCharge = 0
      }
      if (k.driftDir) {
        if (!inp.drift || k.speed < 8) {
          if (k.driftCharge > 2.2) {
            k.boost = Math.max(k.boost, 1.3)
            if (k.isPlayer) this.say('超級甩尾加速！', 1)
          } else if (k.driftCharge > 1) {
            k.boost = Math.max(k.boost, 0.7)
            if (k.isPlayer) this.say('甩尾加速！', 0.8)
          }
          k.driftDir = 0
          k.driftCharge = 0
        } else {
          k.driftCharge += dt * (Math.sign(steerIn) === k.driftDir ? 1.4 : 0.7)
        }
      }
      const steer = k.driftDir ? k.driftDir * 0.75 + steerIn * 0.45 : steerIn
      const speedFactor = Math.min(1, Math.abs(k.speed) / 8)
      const highSpeedDamp = 1 - 0.3 * Math.min(1, Math.abs(k.speed) / BASE_SPEED)
      const turn = TURN_RATE * speedFactor * highSpeedDamp * (k.driftDir ? 1.25 : 1)
      k.heading += steer * turn * dt * (k.speed < 0 ? -1 : 1)
      k.steerVisual += (steerIn - k.steerVisual) * Math.min(1, dt * 10)

      if (inp.item && !k.prevItem && k.item) this.useItem(k)
    }
    k.prevItem = inp.item

    k.spinAngle = k.spin > 0 ? k.spinAngle + dt * 14 : 0
    k.wheelRot += k.speed * dt * 2.5

    k.x += Math.sin(k.heading) * k.speed * dt
    k.z += Math.cos(k.heading) * k.speed * dt

    const newIdx = locate(k.x, k.z, k.idx, 25)
    let delta = newIdx - k.idx
    if (delta > SAMPLES / 2) delta -= SAMPLES
    if (delta < -SAMPLES / 2) delta += SAMPLES
    k.progress += delta
    k.idx = newIdx
    k.lat = lateral(k.x, k.z, k.idx)

    const limit = WALL_HALF - 1.2
    if (Math.abs(k.lat) > limit) {
      const s = TRACK[k.idx]
      const over = Math.abs(k.lat) - limit
      const sign = Math.sign(k.lat)
      k.x -= s.rx * sign * over
      k.z -= s.rz * sign * over
      k.lat = sign * limit
      if (k.wallCooldown <= 0) {
        k.speed *= 0.55
        k.wallCooldown = 0.4
      }
      const along = wrapAngle(s.heading - k.heading)
      const target = Math.abs(along) < Math.PI / 2 ? s.heading : s.heading + Math.PI
      k.heading += wrapAngle(target - k.heading) * 0.25
    }

    const lapsNow = Math.floor(k.progress / SAMPLES)
    if (lapsNow > k.lapsDone) {
      k.lapsDone = lapsNow
      if (lapsNow >= LAPS && !k.finished) {
        k.finished = true
        k.finishTime = this.time
        this.finishOrder.push(k)
        if (k.isPlayer) {
          this.phase = 'finished'
          this.say(`完成！第 ${this.finishOrder.length} 名`, 3)
        }
      } else if (k.isPlayer && lapsNow >= 1) {
        this.say(lapsNow === LAPS - 1 ? '最後一圈！' : `第 ${lapsNow + 1} 圈`, 1.6)
      }
    }
  }

  private aiInput(k: Kart, dt: number): RaceInput {
    k.aiTimer -= dt
    if (k.aiTimer <= 0) {
      k.aiOffset = rand(-4.5, 4.5)
      k.aiTimer = rand(2, 5)
    }
    let offset = k.aiOffset

    const hazards: { idx: number; lat: number }[] = []
    for (const b of this.bananas) if (b.active) hazards.push(b)
    for (const o of this.oils) hazards.push(o)
    for (const m of this.mines) if (m.active) hazards.push(m)
    for (const h of hazards) {
      const ahead = wrapIndex(h.idx - k.idx)
      if (ahead > 2 && ahead < 45 && Math.abs(h.lat - offset) < 4.5) {
        offset = h.lat > 0 ? h.lat - 6 : h.lat + 6
        break
      }
    }
    offset = clamp(offset, -7, 7)

    const look = Math.round(8 + Math.max(0, k.speed) * 0.45)
    const target = pointAt(k.idx + look, offset)
    const desired = Math.atan2(target.x - k.x, target.z - k.z)
    const diff = wrapAngle(desired - k.heading)

    let useItem = false
    if (k.item) {
      k.aiItemTimer -= dt
      if (k.aiItemTimer <= 0) {
        if (k.item === 'green') {
          const fx = Math.sin(k.heading)
          const fz = Math.cos(k.heading)
          const hasTarget = this.karts.some((o) => {
            if (o === k) return false
            const dx = o.x - k.x
            const dz = o.z - k.z
            const fwd = dx * fx + dz * fz
            const side = Math.abs(dx * fz - dz * fx)
            return fwd > 4 && fwd < 40 && side < 3
          })
          useItem = hasTarget || k.aiItemTimer < -6
        } else {
          useItem = true
        }
      }
    }

    return {
      throttle: true,
      brake: Math.abs(diff) > 1.2 && k.speed > 15,
      steer: clamp(diff * 2.5, -1, 1),
      drift: false,
      item: useItem,
    }
  }

  private rollItem(k: Kart): ItemType {
    const f = (k.place - 1) / (this.karts.length - 1)
    const weights: [ItemType, number][] = [
      ['boost', 0.1 + 0.3 * f],
      ['banana', 0.35 - 0.25 * f],
      ['green', 0.3 - 0.15 * f],
      ['red', 0.05 + 0.25 * f],
      ['bomb', 0.15],
      ['star', 0.02 + 0.18 * f],
    ]
    const total = weights.reduce((s, [, w]) => s + w, 0)
    let r = Math.random() * total
    for (const [item, w] of weights) {
      r -= w
      if (r <= 0) return item
    }
    return 'banana'
  }

  private useItem(k: Kart) {
    const item = k.item
    if (!item) return
    k.item = null
    const fx = Math.sin(k.heading)
    const fz = Math.cos(k.heading)

    switch (item) {
      case 'boost':
        k.boost = Math.max(k.boost, 1.5)
        break
      case 'star':
        k.star = 7
        if (k.isPlayer) this.say('無敵狀態！', 1.2)
        break
      case 'banana': {
        const b = this.bananas.find((x) => !x.active)
        if (!b) break
        b.active = true
        b.x = k.x - fx * 2.8
        b.z = k.z - fz * 2.8
        b.idx = locate(b.x, b.z, k.idx, 10)
        b.lat = lateral(b.x, b.z, b.idx)
        b.rot = Math.random() * Math.PI * 2
        break
      }
      case 'green':
      case 'red': {
        const s = this.shells.find((x) => !x.active)
        if (!s) break
        const ahead = this.karts.find((o) => o.place === k.place - 1)
        s.active = true
        s.type = item
        s.x = k.x + fx * 2.8
        s.z = k.z + fz * 2.8
        s.heading = k.heading
        s.speed = item === 'green' ? Math.max(55, k.speed + 28) : Math.max(48, k.speed + 20)
        s.idx = k.idx
        s.life = item === 'green' ? 5 : 7
        s.age = 0
        s.owner = k.id
        s.target = item === 'red' && ahead ? ahead.id : -1
        s.bounces = 4
        break
      }
      case 'bomb': {
        const b = this.bombs.find((x) => !x.active)
        if (!b) break
        const throwSpeed = Math.max(0, k.speed) * 0.6 + 22
        b.active = true
        b.state = 'fly'
        b.x = k.x + fx * 2
        b.z = k.z + fz * 2
        b.y = 1.2
        b.vx = fx * throwSpeed
        b.vz = fz * throwSpeed
        b.vy = 9
        b.timer = 0
        b.owner = k.id
        b.idx = k.idx
        break
      }
    }
  }

  private hitKart(k: Kart, kind: HitKind, source: HitSource, attacker?: Kart) {
    if (k.star > 0 || k.invuln > 0) return
    k.driftDir = 0
    k.driftCharge = 0
    if (kind === 'spin') {
      k.spin = 1.2
      k.speed *= source === 'oil' ? 0.6 : 0.35
      k.invuln = source === 'oil' ? 2.6 : 1.8
    } else if (kind === 'blast') {
      k.vy = 12
      k.y = 0.02
      k.spin = 1.4
      k.speed *= 0.2
      k.invuln = 2.2
    } else {
      k.squash = 1.8
      k.speed = 0
      k.invuln = 2.6
    }
    if (k.isPlayer) this.say(HIT_MESSAGES[source])
    else if (attacker?.isPlayer) this.say(`擊中 ${k.name}！`, 1.2)
  }

  private explode(x: number, z: number, radius: number, source: HitSource, attacker?: Kart) {
    const blast = this.blasts.find((b) => !b.active)
    if (blast) {
      blast.active = true
      blast.x = x
      blast.z = z
      blast.t = 0
      blast.radius = radius
    }
    for (const k of this.karts) {
      if (Math.hypot(k.x - x, k.z - z) < radius) this.hitKart(k, 'blast', source, attacker)
    }
  }

  private collideKarts() {
    const ks = this.karts
    for (let i = 0; i < ks.length; i++) {
      for (let j = i + 1; j < ks.length; j++) {
        const a = ks[i]
        const b = ks[j]
        if (Math.abs(a.y - b.y) > 1) continue
        const dx = b.x - a.x
        const dz = b.z - a.z
        const d = Math.hypot(dx, dz)
        if (d > 0.001 && d < 2.3) {
          const push = (2.3 - d) / 2
          const nx = dx / d
          const nz = dz / d
          a.x -= nx * push
          a.z -= nz * push
          b.x += nx * push
          b.z += nz * push
          if (a.star > 0 && b.star <= 0) this.hitKart(b, 'spin', 'star', a)
          else if (b.star > 0 && a.star <= 0) this.hitKart(a, 'spin', 'star', b)
          else {
            a.speed *= 0.98
            b.speed *= 0.98
          }
        }
      }
    }
  }

  private updateWorld(dt: number) {
    const racing = this.phase !== 'countdown'

    for (const box of this.boxes) {
      if (!box.active) {
        box.timer -= dt
        if (box.timer <= 0) box.active = true
        continue
      }
      if (!racing) continue
      for (const k of this.karts) {
        if (Math.hypot(k.x - box.x, k.z - box.z) < 2.6 && k.y < 2) {
          box.active = false
          box.timer = 3
          if (!k.item && k.roulette <= 0) k.roulette = 1.1
          break
        }
      }
    }

    for (const c of this.crushers) c.y = crusherHeight(this.clock + c.phase)

    if (!racing) return

    for (const b of this.bananas) {
      if (!b.active) continue
      for (const k of this.karts) {
        if (k.y < 1 && Math.hypot(k.x - b.x, k.z - b.z) < 1.8) {
          b.active = false
          this.hitKart(k, 'spin', 'banana')
          break
        }
      }
    }

    for (const o of this.oils) {
      for (const k of this.karts) {
        if (k.y < 0.5 && Math.hypot(k.x - o.x, k.z - o.z) < o.radius) this.hitKart(k, 'spin', 'oil')
      }
    }

    for (const m of this.mines) {
      if (!m.active) {
        m.timer -= dt
        if (m.timer <= 0) m.active = true
        continue
      }
      for (const k of this.karts) {
        if (k.y < 1 && Math.hypot(k.x - m.x, k.z - m.z) < 2.4) {
          m.active = false
          m.timer = 8
          this.explode(m.x, m.z, 5, 'mine')
          break
        }
      }
    }

    for (const c of this.crushers) {
      if (c.y > 1.6) continue
      for (const k of this.karts) {
        if (Math.hypot(k.x - c.x, k.z - c.z) < 3.6) this.hitKart(k, 'squash', 'crusher')
      }
    }

    for (const p of this.pads) {
      for (const k of this.karts) {
        if (k.y < 0.5 && Math.hypot(k.x - p.x, k.z - p.z) < 3) {
          k.boost = Math.max(k.boost, 1.1)
          if (k.isPlayer && k.boost >= 1.09) this.say('加速帶！', 0.6)
        }
      }
    }

    this.updateShells(dt)
    this.updateBombs(dt)

    for (const b of this.blasts) {
      if (!b.active) continue
      b.t += dt
      if (b.t > 0.7) b.active = false
    }
  }

  private updateShells(dt: number) {
    for (const s of this.shells) {
      if (!s.active) continue
      s.age += dt
      s.life -= dt
      if (s.life <= 0) {
        s.active = false
        continue
      }
      if (s.type === 'red') {
        const target = s.target >= 0 ? this.karts[s.target] : null
        let tx: number
        let tz: number
        if (target && Math.hypot(target.x - s.x, target.z - s.z) < 45) {
          tx = target.x
          tz = target.z
        } else {
          const p = pointAt(s.idx + 14, 0)
          tx = p.x
          tz = p.z
        }
        const diff = wrapAngle(Math.atan2(tx - s.x, tz - s.z) - s.heading)
        s.heading += clamp(diff, -4.5 * dt, 4.5 * dt)
      }
      s.x += Math.sin(s.heading) * s.speed * dt
      s.z += Math.cos(s.heading) * s.speed * dt
      s.idx = locate(s.x, s.z, s.idx, 25)
      const lat = lateral(s.x, s.z, s.idx)
      const limit = WALL_HALF - 0.8
      if (Math.abs(lat) > limit) {
        if (s.type === 'red' || s.bounces <= 0) {
          s.active = false
          continue
        }
        const tr = TRACK[s.idx]
        const sign = Math.sign(lat)
        const nx = tr.rx * sign
        const nz = tr.rz * sign
        let vx = Math.sin(s.heading)
        let vz = Math.cos(s.heading)
        const dot = vx * nx + vz * nz
        vx -= 2 * dot * nx
        vz -= 2 * dot * nz
        s.heading = Math.atan2(vx, vz)
        const over = Math.abs(lat) - limit
        s.x -= nx * over
        s.z -= nz * over
        s.bounces--
      }

      const owner = this.karts[s.owner]
      for (const k of this.karts) {
        if (k.id === s.owner && s.age < 0.5) continue
        if (k.y < 1.5 && Math.hypot(k.x - s.x, k.z - s.z) < 2.2) {
          s.active = false
          this.hitKart(k, 'spin', 'shell', owner)
          break
        }
      }
      if (!s.active) continue
      for (const b of this.bananas) {
        if (b.active && Math.hypot(b.x - s.x, b.z - s.z) < 1.6) {
          b.active = false
          s.active = false
          break
        }
      }
    }
  }

  private updateBombs(dt: number) {
    for (const b of this.bombs) {
      if (!b.active) continue
      const owner = this.karts[b.owner]
      if (b.state === 'fly') {
        b.vy -= 25 * dt
        b.x += b.vx * dt
        b.z += b.vz * dt
        b.y += b.vy * dt
        b.idx = locate(b.x, b.z, b.idx, 25)
        const lat = lateral(b.x, b.z, b.idx)
        const limit = WALL_HALF - 1
        if (Math.abs(lat) > limit) {
          const tr = TRACK[b.idx]
          const over = Math.abs(lat) - limit
          b.x -= tr.rx * Math.sign(lat) * over
          b.z -= tr.rz * Math.sign(lat) * over
        }
        if (b.y <= 0.6) {
          b.y = 0.6
          b.state = 'armed'
          b.timer = 1.5
        }
      } else {
        b.timer -= dt
        const near = this.karts.some((k) => Math.hypot(k.x - b.x, k.z - b.z) < 3)
        if (b.timer <= 0 || near) {
          b.active = false
          this.explode(b.x, b.z, 7, 'bomb', owner)
        }
      }
    }
  }

  private updatePlaces() {
    const sorted = [...this.karts].sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime
      if (a.finished) return -1
      if (b.finished) return 1
      return b.progress - a.progress
    })
    sorted.forEach((k, i) => {
      k.place = i + 1
    })
  }

  private buildHud(): HudSnapshot {
    const p = this.player
    const results: HudResult[] | null = p.finished
      ? [...this.karts]
          .sort((a, b) => a.place - b.place)
          .map((k) => ({
            name: k.name,
            color: k.color,
            isPlayer: k.isPlayer,
            time: k.finished ? k.finishTime : null,
            place: k.place,
          }))
      : null
    return {
      phase: this.phase,
      countdown: Math.ceil(this.countdown),
      place: p.place,
      total: this.karts.length,
      lap: clamp(Math.floor(p.progress / SAMPLES) + 1, 1, LAPS),
      laps: LAPS,
      item: p.item,
      rolling: p.roulette > 0,
      time: p.finished ? p.finishTime : this.time,
      speed: Math.round(Math.abs(p.speed) * 4),
      driftCharge: p.driftCharge,
      drifting: p.driftDir !== 0,
      boosting: p.boost > 0,
      star: p.star > 0,
      message: this.message,
      dots: this.karts.map((k) => ({ x: k.x, z: k.z, color: k.color, isPlayer: k.isPlayer })),
      results,
    }
  }
}
