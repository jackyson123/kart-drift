'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Kart } from '@/lib/game/engine'

const WHEELS: [number, number, boolean][] = [
  [-0.95, 0.9, true],
  [0.95, 0.9, true],
  [-0.95, -0.85, false],
  [0.95, -0.85, false],
]

export function KartModel({ kart }: { kart: Kart }) {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const shadow = useRef<THREE.Mesh>(null)
  const flame = useRef<THREE.Mesh>(null)
  const aura = useRef<THREE.Mesh>(null)
  const sparks = useRef<THREE.Group>(null)
  const sparkMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#3ec8ff' }), [])
  const wheels = useRef<(THREE.Group | null)[]>([])

  useFrame((state) => {
    const k = kart
    const t = state.clock.elapsedTime
    if (!root.current || !body.current) return
    root.current.position.set(k.x, k.y, k.z)
    root.current.rotation.y = k.heading

    const driftYaw = k.driftDir * 0.4
    body.current.rotation.y = k.spinAngle + driftYaw
    body.current.rotation.z = -k.steerVisual * 0.06 * Math.min(1, Math.abs(k.speed) / 20)
    const squashY = k.squash > 0 ? 0.3 : 1
    const squashXZ = k.squash > 0 ? 1.35 : 1
    body.current.scale.set(squashXZ, squashY, squashXZ)
    body.current.visible = k.invuln > 0 && k.squash <= 0 && k.spin <= 0 ? Math.floor(t * 16) % 2 === 0 : true

    if (shadow.current) {
      shadow.current.position.y = -k.y + 0.14
      const s = 1 / (1 + k.y * 0.15)
      shadow.current.scale.set(s, s, s)
    }
    if (flame.current) {
      flame.current.visible = k.boost > 0 || k.star > 0
      flame.current.scale.setScalar(0.8 + Math.sin(t * 40) * 0.25)
    }
    if (aura.current) {
      aura.current.visible = k.star > 0
      const mat = aura.current.material as THREE.MeshBasicMaterial
      mat.color.setHSL((t * 1.5) % 1, 0.9, 0.6)
    }
    if (sparks.current) {
      sparks.current.visible = k.driftDir !== 0 && k.driftCharge > 0.4
      sparkMat.color.set(k.driftCharge > 2.2 ? '#ff7a1a' : k.driftCharge > 1 ? '#3ec8ff' : '#ffffff')
      sparks.current.scale.setScalar(0.7 + Math.random() * 0.6)
    }
    wheels.current.forEach((w, i) => {
      if (!w) return
      const isFront = WHEELS[i][2]
      w.rotation.y = isFront ? k.steerVisual * 0.4 : 0
      const tyre = w.children[0]
      if (tyre) tyre.rotation.x = k.wheelRot
    })
  })

  return (
    <group ref={root}>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.6, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.32} depthWrite={false} />
      </mesh>
      <group ref={body}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.7, 0.45, 2.6]} />
          <meshStandardMaterial color={kart.color} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.42, 1.45]}>
          <boxGeometry args={[1.9, 0.3, 0.3]} />
          <meshStandardMaterial color="#20242c" />
        </mesh>
        <mesh position={[0, 0.85, 0.85]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[1.3, 0.25, 0.6]} />
          <meshStandardMaterial color={kart.color} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.85, -0.45]}>
          <boxGeometry args={[0.9, 0.5, 0.7]} />
          <meshStandardMaterial color="#20242c" />
        </mesh>
        <mesh position={[0, 1.25, -0.25]}>
          <cylinderGeometry args={[0.32, 0.38, 0.7, 10]} />
          <meshStandardMaterial color={kart.color} />
        </mesh>
        <mesh position={[0, 1.85, -0.2]}>
          <sphereGeometry args={[0.42, 16, 12]} />
          <meshStandardMaterial color={kart.color} roughness={0.25} metalness={0.2} />
        </mesh>
        <mesh position={[0, 1.82, 0.12]}>
          <boxGeometry args={[0.55, 0.22, 0.2]} />
          <meshStandardMaterial color="#1b2333" roughness={0.1} metalness={0.6} />
        </mesh>
        <mesh position={[0, 1.25, -1.25]}>
          <boxGeometry args={[1.8, 0.12, 0.45]} />
          <meshStandardMaterial color="#20242c" />
        </mesh>
        {[-0.7, 0.7].map((x) => (
          <mesh key={x} position={[x, 0.95, -1.2]}>
            <boxGeometry args={[0.1, 0.5, 0.15]} />
            <meshStandardMaterial color="#20242c" />
          </mesh>
        ))}
        <mesh ref={flame} position={[0, 0.55, -1.65]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <coneGeometry args={[0.3, 1.2, 8]} />
          <meshBasicMaterial color="#ff9a1f" />
        </mesh>
        {WHEELS.map(([x, z], i) => (
          <group
            key={i}
            position={[x, 0.38, z]}
            ref={(el) => {
              wheels.current[i] = el
            }}
          >
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.38, 0.38, 0.42, 14]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
            </mesh>
          </group>
        ))}
        <group ref={sparks} visible={false}>
          {[-0.95, 0.95].map((x) => (
            <mesh key={x} position={[x, 0.2, -1.2]} material={sparkMat}>
              <sphereGeometry args={[0.22, 8, 6]} />
            </mesh>
          ))}
        </group>
        <mesh ref={aura} position={[0, 0.9, 0]} visible={false}>
          <sphereGeometry args={[2.1, 20, 14]} />
          <meshBasicMaterial transparent opacity={0.25} depthWrite={false} />
        </mesh>
      </group>
    </group>
  )
}
