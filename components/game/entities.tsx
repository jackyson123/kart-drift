'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Race } from '@/lib/game/engine'

function ItemBoxes({ race }: { race: Race }) {
  const refs = useRef<(THREE.Group | null)[]>([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    race.boxes.forEach((b, i) => {
      const g = refs.current[i]
      if (!g) return
      g.visible = b.active
      g.position.set(b.x, 1.5 + Math.sin(t * 2 + b.seed) * 0.25, b.z)
      g.rotation.set(t * 0.8 + b.seed, t * 1.2 + b.seed, 0)
    })
  })
  return (
    <group>
      {race.boxes.map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
        >
          <mesh>
            <boxGeometry args={[1.8, 1.8, 1.8]} />
            <meshStandardMaterial
              color="#ffc531"
              emissive="#ff9a1f"
              emissiveIntensity={0.45}
              transparent
              opacity={0.78}
            />
          </mesh>
          <mesh rotation={[0.6, 0.6, 0]}>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Bananas({ race }: { race: Race }) {
  const refs = useRef<(THREE.Group | null)[]>([])
  useFrame(() => {
    race.bananas.forEach((b, i) => {
      const g = refs.current[i]
      if (!g) return
      g.visible = b.active
      if (b.active) {
        g.position.set(b.x, 0.45, b.z)
        g.rotation.y = b.rot
      }
    })
  })
  return (
    <group>
      {race.bananas.map((_, i) => (
        <group
          key={i}
          visible={false}
          ref={(el) => {
            refs.current[i] = el
          }}
        >
          <mesh rotation={[0, 0, Math.PI * 0.95]}>
            <torusGeometry args={[0.6, 0.22, 8, 16, Math.PI * 1.1]} />
            <meshStandardMaterial color="#ffd93d" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Shells({ race }: { race: Race }) {
  const refs = useRef<(THREE.Group | null)[]>([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    race.shells.forEach((s, i) => {
      const g = refs.current[i]
      if (!g) return
      g.visible = s.active
      if (!s.active) return
      g.position.set(s.x, 0.5, s.z)
      g.rotation.y = t * 12
      g.children[0].visible = s.type === 'green'
      g.children[1].visible = s.type === 'red'
    })
  })
  return (
    <group>
      {race.shells.map((_, i) => (
        <group
          key={i}
          visible={false}
          ref={(el) => {
            refs.current[i] = el
          }}
        >
          <mesh>
            <sphereGeometry args={[0.8, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#2bb673" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.8, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#e63946" emissive="#e63946" emissiveIntensity={0.3} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.8, 0.14, 8, 20]} />
            <meshStandardMaterial color="#f4f4f4" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Bombs({ race }: { race: Race }) {
  const refs = useRef<(THREE.Group | null)[]>([])
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    race.bombs.forEach((b, i) => {
      const g = refs.current[i]
      if (!g) return
      g.visible = b.active
      if (!b.active) return
      g.position.set(b.x, b.y + 0.3, b.z)
      const m = mats.current[i]
      if (m) {
        const blink = b.state === 'armed' && Math.floor(t * (b.timer < 0.6 ? 20 : 8)) % 2 === 0
        m.emissiveIntensity = blink ? 1.2 : 0
      }
    })
  })
  return (
    <group>
      {race.bombs.map((_, i) => (
        <group
          key={i}
          visible={false}
          ref={(el) => {
            refs.current[i] = el
          }}
        >
          <mesh>
            <sphereGeometry args={[0.85, 16, 12]} />
            <meshStandardMaterial
              ref={(el) => {
                mats.current[i] = el
              }}
              color="#20242c"
              emissive="#e63946"
              emissiveIntensity={0}
            />
          </mesh>
          <mesh position={[0, 0.95, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.4, 6]} />
            <meshStandardMaterial color="#c9a26b" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Blasts({ race }: { race: Race }) {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  useFrame(() => {
    race.blasts.forEach((b, i) => {
      const m = refs.current[i]
      if (!m) return
      m.visible = b.active
      if (!b.active) return
      const f = b.t / 0.7
      m.position.set(b.x, 1, b.z)
      m.scale.setScalar(0.5 + f * b.radius)
      ;(m.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - f)
    })
  })
  return (
    <group>
      {race.blasts.map((_, i) => (
        <mesh
          key={i}
          visible={false}
          ref={(el) => {
            refs.current[i] = el
          }}
        >
          <sphereGeometry args={[1, 18, 12]} />
          <meshBasicMaterial color="#ff7a1a" transparent depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function Oils({ race }: { race: Race }) {
  return (
    <group>
      {race.oils.map((o, i) => (
        <group key={i} position={[o.x, 0.11, o.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[o.radius, 24]} />
            <meshStandardMaterial color="#14161c" roughness={0.05} metalness={0.8} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[o.radius * 0.6, 0.005, o.radius * 0.4]}>
            <circleGeometry args={[o.radius * 0.55, 18]} />
            <meshStandardMaterial color="#14161c" roughness={0.05} metalness={0.8} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-o.radius * 0.3, 0.01, o.radius * 0.2]}>
            <ringGeometry args={[o.radius * 0.3, o.radius * 0.42, 20]} />
            <meshBasicMaterial color="#3ec8ff" transparent opacity={0.35} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Mines({ race }: { race: Race }) {
  const refs = useRef<(THREE.Group | null)[]>([])
  const lights = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    race.mines.forEach((m, i) => {
      const g = refs.current[i]
      if (g) g.visible = m.active
      const l = lights.current[i]
      if (l) l.color.set(Math.floor(t * 3 + i) % 2 === 0 ? '#ff2b2b' : '#5a1010')
    })
  })
  return (
    <group>
      {race.mines.map((m, i) => (
        <group
          key={i}
          position={[m.x, 0.4, m.z]}
          ref={(el) => {
            refs.current[i] = el
          }}
        >
          <mesh>
            <sphereGeometry args={[0.75, 14, 10]} />
            <meshStandardMaterial color="#2b2f38" metalness={0.5} roughness={0.4} />
          </mesh>
          {[0, 1, 2, 3, 4, 5].map((s) => {
            const a = (s / 6) * Math.PI * 2
            return (
              <mesh key={s} position={[Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8]} rotation={[0, -a, -Math.PI / 2]}>
                <coneGeometry args={[0.14, 0.4, 6]} />
                <meshStandardMaterial color="#8d93a3" />
              </mesh>
            )
          })}
          <mesh position={[0, 0.75, 0]}>
            <sphereGeometry args={[0.18, 8, 6]} />
            <meshBasicMaterial
              ref={(el) => {
                lights.current[i] = el
              }}
              color="#ff2b2b"
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Crushers({ race }: { race: Race }) {
  const blocks = useRef<(THREE.Group | null)[]>([])
  const shadows = useRef<(THREE.Mesh | null)[]>([])
  useFrame(() => {
    race.crushers.forEach((c, i) => {
      const b = blocks.current[i]
      if (b) b.position.y = c.y + 2.5
      const s = shadows.current[i]
      if (s) {
        const mat = s.material as THREE.MeshBasicMaterial
        mat.opacity = 0.15 + 0.5 * (1 - c.y / 7)
      }
    })
  })
  return (
    <group>
      {race.crushers.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]} rotation={[0, c.heading + Math.PI, 0]}>
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.12, 0]}
            ref={(el) => {
              shadows.current[i] = el
            }}
          >
            <planeGeometry args={[6.4, 6.4]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.3} depthWrite={false} />
          </mesh>
          <group
            ref={(el) => {
              blocks.current[i] = el
            }}
          >
            <mesh>
              <boxGeometry args={[6, 5, 6]} />
              <meshStandardMaterial color="#8d93a3" flatShading roughness={1} />
            </mesh>
            {[-1.3, 1.3].map((x) => (
              <group key={x} position={[x, 0.6, 3.01]}>
                <mesh>
                  <boxGeometry args={[1.2, 1.2, 0.05]} />
                  <meshBasicMaterial color="#f4f4f4" />
                </mesh>
                <mesh position={[0, -0.15, 0.04]}>
                  <boxGeometry args={[0.5, 0.6, 0.05]} />
                  <meshBasicMaterial color="#14161c" />
                </mesh>
                <mesh position={[0, 0.85, 0.04]} rotation={[0, 0, x > 0 ? 0.4 : -0.4]}>
                  <boxGeometry args={[1.5, 0.3, 0.05]} />
                  <meshBasicMaterial color="#14161c" />
                </mesh>
              </group>
            ))}
            <mesh position={[0, -1.3, 3.01]}>
              <boxGeometry args={[3, 0.5, 0.05]} />
              <meshBasicMaterial color="#14161c" />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  )
}

function Pads({ race }: { race: Race }) {
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    mats.current.forEach((m, i) => {
      if (m) m.color.setHSL(0.1 + 0.03 * Math.sin(t * 8 + i), 1, 0.55)
    })
  })
  return (
    <group>
      {race.pads.map((p, i) => (
        <group key={i} position={[p.x, 0.12, p.z]} rotation={[0, p.heading, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4, 5.5]} />
            <meshBasicMaterial
              ref={(el) => {
                mats.current[i] = el
              }}
              color="#ff9a1f"
            />
          </mesh>
          {[-1.6, 0, 1.6].map((z) => (
            <group key={z} position={[0, 0.02, z]}>
              {[-1, 1].map((side) => (
                <mesh key={side} position={[side * 0.55, 0, -0.35]} rotation={[0, side * 0.8, 0]}>
                  <boxGeometry args={[1.5, 0.02, 0.35]} />
                  <meshBasicMaterial color="#fff4c2" />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}

export function Entities({ race }: { race: Race }) {
  return (
    <>
      <Pads race={race} />
      <Oils race={race} />
      <Mines race={race} />
      <Crushers race={race} />
      <ItemBoxes race={race} />
      <Bananas race={race} />
      <Shells race={race} />
      <Bombs race={race} />
      <Blasts race={race} />
    </>
  )
}
