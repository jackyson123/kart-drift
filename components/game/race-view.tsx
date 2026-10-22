'use client'

import { useState } from 'react'
import { Race, type Difficulty } from '@/lib/game/engine'
import { useRaceInput } from '@/lib/game/use-keyboard-input'
import { RaceScene } from './scene'
import { Hud } from './hud'
import { TouchControls } from './touch-controls'

export function RaceView({
  colorIndex,
  difficulty,
  onRestart,
  onMenu,
}: {
  colorIndex: number
  difficulty: Difficulty
  onRestart: () => void
  onMenu: () => void
}) {
  const [race] = useState(() => new Race(colorIndex, difficulty))
  const { input, setKey } = useRaceInput()

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background">
      <RaceScene race={race} input={input} />
      <Hud race={race} onRestart={onRestart} onMenu={onMenu} />
      <TouchControls setKey={setKey} />
    </div>
  )
}
