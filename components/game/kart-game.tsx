'use client'

import { useState } from 'react'
import type { Difficulty } from '@/lib/game/engine'
import { Menu } from './menu'
import { RaceView } from './race-view'

export function KartGame() {
  const [screen, setScreen] = useState<'menu' | 'race'>('menu')
  const [colorIndex, setColorIndex] = useState(0)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const [raceKey, setRaceKey] = useState(0)

  if (screen === 'race') {
    return (
      <RaceView
        key={raceKey}
        colorIndex={colorIndex}
        difficulty={difficulty}
        onRestart={() => setRaceKey((k) => k + 1)}
        onMenu={() => setScreen('menu')}
      />
    )
  }

  return (
    <Menu
      colorIndex={colorIndex}
      difficulty={difficulty}
      onColor={setColorIndex}
      onDifficulty={setDifficulty}
      onStart={() => {
        setRaceKey((k) => k + 1)
        setScreen('race')
      }}
    />
  )
}
