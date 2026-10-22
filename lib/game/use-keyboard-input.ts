'use client'

import { useEffect, useRef } from 'react'
import type { RaceInput } from './engine'

export type TouchKey = 'left' | 'right' | 'throttle' | 'brake' | 'drift' | 'item'

const KEY_MAP: Record<string, TouchKey> = {
  ArrowUp: 'throttle',
  KeyW: 'throttle',
  ArrowDown: 'brake',
  KeyS: 'brake',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ShiftLeft: 'drift',
  ShiftRight: 'drift',
  KeyK: 'drift',
  Space: 'item',
  KeyJ: 'item',
}

export function useRaceInput() {
  const input = useRef<RaceInput>({ throttle: false, brake: false, steer: 0, drift: false, item: false })
  const pressed = useRef<Record<TouchKey, boolean>>({
    left: false,
    right: false,
    throttle: false,
    brake: false,
    drift: false,
    item: false,
  })

  const sync = () => {
    const p = pressed.current
    input.current.throttle = p.throttle
    input.current.brake = p.brake
    input.current.drift = p.drift
    input.current.item = p.item
    input.current.steer = (p.left ? 1 : 0) - (p.right ? 1 : 0)
  }

  const setKey = (key: TouchKey, down: boolean) => {
    pressed.current[key] = down
    sync()
  }

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const key = KEY_MAP[e.code]
      if (!key) return
      e.preventDefault()
      pressed.current[key] = true
      sync()
    }
    const onUp = (e: KeyboardEvent) => {
      const key = KEY_MAP[e.code]
      if (!key) return
      e.preventDefault()
      pressed.current[key] = false
      sync()
    }
    const onBlur = () => {
      for (const k of Object.keys(pressed.current) as TouchKey[]) pressed.current[k] = false
      sync()
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { input, setKey }
}
