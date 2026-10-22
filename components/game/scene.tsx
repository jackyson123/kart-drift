'use client'

import { useRef, type MutableRefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Race, RaceInput } from '@/lib/game/engine'
import { TrackMesh } from './track-mesh'
import { KartModel } from './kart-model'
import { Entities } from './entities'

function GameLoop({ race, input }: { race: Race; input: MutableRefObject<RaceInput> }) {
  useFrame((_, dt) => {
    race.update(dt, input.current)
  })
  return null
}

function CameraRig({ race }: { race: Race }) {
  const { camera } = useThree()
  const heading = useRef(race.player.heading)
  const look = useRef(new THREE.Vector3())
  const target = useRef(new THREE.Vector3())
  const initialized = useRef(false)

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const k = race.player
    let diff = k.heading - heading.current
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    heading.current += diff * (1 - Math.exp(-5 * dt))

    const fx = Math.sin(heading.current)
    const fz = Math.cos(heading.current)
    target.current.set(k.x - fx * 9.5, 4.6 + k.y * 0.6, k.z - fz * 9.5)
    if (!initialized.current) {
      camera.position.copy(target.current)
      initialized.current = true
    } else {
      camera.position.lerp(target.current, 1 - Math.exp(-10 * dt))
    }
    look.current.set(k.x + fx * 6, 1.6 + k.y * 0.5, k.z + fz * 6)
    camera.lookAt(look.current)

    const cam = camera as THREE.PerspectiveCamera
    const fov = k.boost > 0 || k.star > 0 ? 80 : 68
    cam.fov += (fov - cam.fov) * (1 - Math.exp(-4 * dt))
    cam.updateProjectionMatrix()
  })
  return null
}

export function RaceScene({ race, input }: { race: Race; input: MutableRefObject<RaceInput> }) {
  return (
    <Canvas camera={{ fov: 68, near: 0.5, far: 900, position: [0, 6, 15] }} dpr={[1, 1.75]} gl={{ antialias: true }}>
      <GameLoop race={race} input={input} />
      <CameraRig race={race} />
      <color attach="background" args={['#8ecae6']} />
      <fog attach="fog" args={['#8ecae6', 140, 560]} />
      <hemisphereLight args={['#e8f6ff', '#4a7a3a', 1.1]} />
      <directionalLight position={[80, 120, 40]} intensity={1.6} />
      <TrackMesh />
      <Entities race={race} />
      {race.karts.map((k) => (
        <KartModel key={k.id} kart={k} />
      ))}
    </Canvas>
  )
}
