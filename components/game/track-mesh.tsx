'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { ROAD_HALF, SAMPLES, TRACK, WALL_HALF, trackBounds } from '@/lib/game/track'

type Color = [number, number, number]

function hex(c: string): Color {
  const col = new THREE.Color(c)
  return [col.r, col.g, col.b]
}

function ribbon(inner: number, outer: number, y: number, colorAt: (i: number) => Color) {
  const positions: number[] = []
  const colors: number[] = []
  for (let i = 0; i < SAMPLES; i++) {
    const a = TRACK[i]
    const b = TRACK[(i + 1) % SAMPLES]
    const a0 = [a.x + a.rx * inner, y, a.z + a.rz * inner]
    const a1 = [a.x + a.rx * outer, y, a.z + a.rz * outer]
    const b0 = [b.x + b.rx * inner, y, b.z + b.rz * inner]
    const b1 = [b.x + b.rx * outer, y, b.z + b.rz * outer]
    positions.push(...a0, ...b0, ...a1, ...a1, ...b0, ...b1)
    const c = colorAt(i)
    for (let v = 0; v < 6; v++) colors.push(...c)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  g.computeVertexNormals()
  return g
}

function wall(offset: number, height: number, colorAt: (i: number) => Color) {
  const positions: number[] = []
  const colors: number[] = []
  for (let i = 0; i < SAMPLES; i++) {
    const a = TRACK[i]
    const b = TRACK[(i + 1) % SAMPLES]
    const ax = a.x + a.rx * offset
    const az = a.z + a.rz * offset
    const bx = b.x + b.rx * offset
    const bz = b.z + b.rz * offset
    positions.push(ax, 0, az, bx, 0, bz, ax, height, az, ax, height, az, bx, 0, bz, bx, height, bz)
    const c = colorAt(i)
    for (let v = 0; v < 6; v++) colors.push(...c)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  g.computeVertexNormals()
  return g
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function Trees() {
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const leafRef = useRef<THREE.InstancedMesh>(null)

  const trees = useMemo(() => {
    const rng = mulberry32(42)
    const b = trackBounds()
    const list: { x: number; z: number; s: number }[] = []
    let guard = 0
    while (list.length < 160 && guard < 4000) {
      guard++
      const x = b.minX - 70 + rng() * (b.maxX - b.minX + 140)
      const z = b.minZ - 70 + rng() * (b.maxZ - b.minZ + 140)
      let minD = Infinity
      for (let i = 0; i < SAMPLES; i += 4) {
        const d = Math.hypot(TRACK[i].x - x, TRACK[i].z - z)
        if (d < minD) minD = d
      }
      if (minD > WALL_HALF + 6) list.push({ x, z, s: 0.8 + rng() * 0.9 })
    }
    return list
  }, [])

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    trees.forEach((t, i) => {
      m.makeScale(t.s, t.s, t.s)
      m.setPosition(t.x, 1.2 * t.s, t.z)
      trunkRef.current?.setMatrixAt(i, m)
      m.makeScale(t.s, t.s, t.s)
      m.setPosition(t.x, 4.2 * t.s, t.z)
      leafRef.current?.setMatrixAt(i, m)
    })
    if (trunkRef.current) trunkRef.current.instanceMatrix.needsUpdate = true
    if (leafRef.current) leafRef.current.instanceMatrix.needsUpdate = true
  }, [trees])

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, trees.length]}>
        <cylinderGeometry args={[0.35, 0.5, 2.4, 6]} />
        <meshStandardMaterial color="#7a4e2d" />
      </instancedMesh>
      <instancedMesh ref={leafRef} args={[undefined, undefined, trees.length]}>
        <coneGeometry args={[2.2, 5, 7]} />
        <meshStandardMaterial color="#2f7d3a" flatShading />
      </instancedMesh>
    </group>
  )
}

function Mountains() {
  const peaks = useMemo(() => {
    const rng = mulberry32(7)
    return Array.from({ length: 22 }, (_, i) => {
      const a = (i / 22) * Math.PI * 2 + rng() * 0.2
      const r = 420 + rng() * 80
      return { x: 60 + Math.cos(a) * r, z: Math.sin(a) * r, h: 60 + rng() * 80, w: 50 + rng() * 40 }
    })
  }, [])
  return (
    <group>
      {peaks.map((p, i) => (
        <mesh key={i} position={[p.x, p.h / 2 - 2, p.z]}>
          <coneGeometry args={[p.w, p.h, 6]} />
          <meshStandardMaterial color={i % 2 ? '#6b8f71' : '#7d9c86'} flatShading />
        </mesh>
      ))}
    </group>
  )
}

function StartLine() {
  const geom = useMemo(() => {
    const positions: number[] = []
    const colors: number[] = []
    const white = hex('#f4f4f4')
    const black = hex('#1c1c1c')
    const s = TRACK[0]
    const cell = 1
    for (let row = 0; row < 2; row++) {
      for (let c = -ROAD_HALF; c < ROAD_HALF; c += cell) {
        const f0 = row * cell
        const f1 = f0 + cell
        const corner = (f: number, l: number) => [s.x + s.tx * f + s.rx * l, 0.1, s.z + s.tz * f + s.rz * l]
        const p00 = corner(f0, c)
        const p01 = corner(f0, c + cell)
        const p10 = corner(f1, c)
        const p11 = corner(f1, c + cell)
        positions.push(...p00, ...p10, ...p01, ...p01, ...p10, ...p11)
        const col = (row + Math.round(c)) % 2 === 0 ? white : black
        for (let v = 0; v < 6; v++) colors.push(...col)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [])

  const s = TRACK[0]
  return (
    <group>
      <mesh geometry={geom}>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} />
      </mesh>
      <group position={[s.x, 0, s.z]} rotation={[0, s.heading, 0]}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * (ROAD_HALF + 1.5), 4, 0]}>
            <boxGeometry args={[0.8, 8, 0.8]} />
            <meshStandardMaterial color="#e9edf2" />
          </mesh>
        ))}
        <mesh position={[0, 8.2, 0]}>
          <boxGeometry args={[ROAD_HALF * 2 + 4, 1.8, 0.6]} />
          <meshStandardMaterial color="#e63946" />
        </mesh>
        <mesh position={[0, 8.2, 0.31]}>
          <boxGeometry args={[ROAD_HALF * 2, 0.9, 0.05]} />
          <meshStandardMaterial color="#ffc531" emissive="#ffc531" emissiveIntensity={0.3} />
        </mesh>
      </group>
    </group>
  )
}

export function TrackMesh() {
  const { road, lines, kerbL, kerbR, wallL, wallR, grassEdge } = useMemo(() => {
    const asphalt = hex('#4b5160')
    const asphaltAlt = hex('#474d5b')
    const red = hex('#e63946')
    const white = hex('#f4f4f4')
    const blue = hex('#1d7bf2')
    const dirt = hex('#7fae4f')
    const stripe = (i: number) => (Math.floor(i / 5) % 2 === 0 ? red : white)
    const wallStripe = (i: number) => (Math.floor(i / 8) % 2 === 0 ? blue : white)
    return {
      road: ribbon(-ROAD_HALF, ROAD_HALF, 0.05, (i) => (Math.floor(i / 12) % 2 ? asphalt : asphaltAlt)),
      lines: [
        ribbon(-ROAD_HALF + 0.4, -ROAD_HALF + 0.7, 0.08, () => white),
        ribbon(ROAD_HALF - 0.7, ROAD_HALF - 0.4, 0.08, () => white),
      ],
      kerbL: ribbon(-ROAD_HALF - 1.4, -ROAD_HALF, 0.07, stripe),
      kerbR: ribbon(ROAD_HALF, ROAD_HALF + 1.4, 0.07, stripe),
      grassEdge: ribbon(-WALL_HALF, WALL_HALF, 0.0, () => dirt),
      wallL: wall(-WALL_HALF, 1.3, wallStripe),
      wallR: wall(WALL_HALF, 1.3, wallStripe),
    }
  }, [])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[60, -0.05, 0]}>
        <planeGeometry args={[1400, 1400]} />
        <meshStandardMaterial color="#5fa84a" />
      </mesh>
      {[grassEdge, road, kerbL, kerbR, ...lines].map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
      ))}
      {[wallL, wallR].map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial vertexColors side={THREE.DoubleSide} />
        </mesh>
      ))}
      <StartLine />
      <Trees />
      <Mountains />
    </group>
  )
}
