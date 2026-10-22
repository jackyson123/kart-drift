import * as THREE from 'three'

export const SAMPLES = 800
export const ROAD_HALF = 9
export const WALL_HALF = 17
export const LAPS = 3

const CONTROL_POINTS: [number, number][] = [
  [0, 0],
  [0, -120],
  [40, -180],
  [120, -190],
  [170, -140],
  [160, -70],
  [110, -40],
  [100, 20],
  [150, 70],
  [140, 140],
  [70, 170],
  [0, 150],
  [-50, 110],
  [-40, 50],
]

export interface TrackSample {
  x: number
  z: number
  tx: number
  tz: number
  rx: number
  rz: number
  heading: number
}

function buildSamples(): TrackSample[] {
  const curve = new THREE.CatmullRomCurve3(
    CONTROL_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    true,
    'centripetal',
  )
  const pts = curve.getSpacedPoints(SAMPLES)
  const samples: TrackSample[] = []
  for (let i = 0; i < SAMPLES; i++) {
    const prev = pts[(i - 1 + SAMPLES) % SAMPLES]
    const next = pts[(i + 1) % SAMPLES]
    let tx = next.x - prev.x
    let tz = next.z - prev.z
    const len = Math.hypot(tx, tz) || 1
    tx /= len
    tz /= len
    samples.push({ x: pts[i].x, z: pts[i].z, tx, tz, rx: -tz, rz: tx, heading: Math.atan2(tx, tz) })
  }
  return samples
}

export const TRACK = buildSamples()

export function wrapIndex(i: number) {
  return ((Math.round(i) % SAMPLES) + SAMPLES) % SAMPLES
}

export function locate(x: number, z: number, hint: number, range = 25) {
  let best = hint
  let bestD = Infinity
  for (let o = -range; o <= range; o++) {
    const i = wrapIndex(hint + o)
    const s = TRACK[i]
    const d = (s.x - x) ** 2 + (s.z - z) ** 2
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}

export function lateral(x: number, z: number, i: number) {
  const s = TRACK[i]
  return (x - s.x) * s.rx + (z - s.z) * s.rz
}

export function pointAt(i: number, lat: number) {
  const s = TRACK[wrapIndex(i)]
  return { x: s.x + s.rx * lat, z: s.z + s.rz * lat, heading: s.heading }
}

export function trackBounds() {
  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity
  for (const s of TRACK) {
    minX = Math.min(minX, s.x)
    maxX = Math.max(maxX, s.x)
    minZ = Math.min(minZ, s.z)
    maxZ = Math.max(maxZ, s.z)
  }
  return { minX, maxX, minZ, maxZ }
}
