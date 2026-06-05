'use client'

import { useMemo } from 'react'
import { PLAYER_COLORS } from '@/types/game'

const COLOR_CLASSES = [
  'bg-blue-500',
  'bg-yellow-400',
  'bg-red-500',
  'bg-green-500',
]

const PREVIEW_VALID = 'bg-white/50'
const PREVIEW_INVALID = 'bg-red-400/60'

interface BoardProps {
  board: (number | null)[][]
  previewCells: [number, number][]
  previewValid: boolean
  onCellHover: (row: number, col: number) => void
  onCellClick: (row: number, col: number) => void
  disabled: boolean
}

export default function Board({
  board,
  previewCells,
  previewValid,
  onCellHover,
  onCellClick,
  disabled,
}: BoardProps) {
  const previewSet = useMemo(
    () => new Set(previewCells.map(([r, c]) => `${r},${c}`)),
    [previewCells]
  )

  return (
    <div
      className="inline-grid border border-gray-600 select-none"
      style={{ gridTemplateColumns: 'repeat(20, 1fr)' }}
      onMouseLeave={() => onCellHover(-1, -1)}
    >
      {board.map((row, r) =>
        row.map((cell, c) => {
          const isPreview = previewSet.has(`${r},${c}`)
          let bg = 'bg-gray-700 hover:bg-gray-600'
          if (cell !== null) bg = COLOR_CLASSES[cell]
          else if (isPreview) bg = previewValid ? PREVIEW_VALID : PREVIEW_INVALID

          return (
            <div
              key={`${r}-${c}`}
              className={`w-6 h-6 sm:w-7 sm:h-7 border border-gray-800/40 cursor-pointer transition-colors ${bg}`}
              onMouseEnter={() => !disabled && onCellHover(r, c)}
              onClick={() => !disabled && onCellClick(r, c)}
            />
          )
        })
      )}
    </div>
  )
}
