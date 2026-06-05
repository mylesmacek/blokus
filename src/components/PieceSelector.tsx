'use client'

import { PIECE_DEFINITIONS, PIECE_ORIENTATIONS } from '@/lib/pieces'

const COLOR_CLASSES = [
  'bg-blue-500',
  'bg-yellow-400',
  'bg-red-500',
  'bg-green-500',
]

interface PieceSelectorProps {
  remainingPieces: string[]
  selectedPiece: string | null
  orientationIndex: number
  seatIndex: number
  onSelect: (pieceId: string) => void
  onRotate: () => void
  onFlip: () => void
}

function PieceMini({
  pieceId,
  seatIndex,
  selected,
  orientationIndex,
}: {
  pieceId: string
  seatIndex: number
  selected: boolean
  orientationIndex: number
}) {
  const orientations = PIECE_ORIENTATIONS[pieceId]
  const cells = selected
    ? orientations[orientationIndex % orientations.length]
    : PIECE_DEFINITIONS[pieceId]

  const maxR = Math.max(...cells.map(([r]) => r))
  const maxC = Math.max(...cells.map(([, c]) => c))
  const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`))
  const color = COLOR_CLASSES[seatIndex]

  return (
    <div
      className="grid gap-px"
      style={{ gridTemplateColumns: `repeat(${maxC + 1}, 1fr)` }}
    >
      {Array.from({ length: maxR + 1 }, (_, r) =>
        Array.from({ length: maxC + 1 }, (_, c) => (
          <div
            key={`${r}-${c}`}
            className={`w-3.5 h-3.5 ${cellSet.has(`${r},${c}`) ? color : 'bg-transparent'}`}
          />
        ))
      )}
    </div>
  )
}

export default function PieceSelector({
  remainingPieces,
  selectedPiece,
  orientationIndex,
  seatIndex,
  onSelect,
  onRotate,
  onFlip,
}: PieceSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      {selectedPiece && (
        <div className="flex gap-2">
          <button
            onClick={onRotate}
            className="flex-1 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded font-medium"
          >
            Rotate (R)
          </button>
          <button
            onClick={onFlip}
            className="flex-1 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded font-medium"
          >
            Flip (F)
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {remainingPieces.map(id => (
          <button
            key={id}
            onClick={() => onSelect(id === selectedPiece ? '' : id)}
            className={`p-2 rounded border transition-all ${
              id === selectedPiece
                ? 'border-white bg-gray-600'
                : 'border-gray-600 bg-gray-800 hover:border-gray-400'
            }`}
            title={id}
          >
            <PieceMini
              pieceId={id}
              seatIndex={seatIndex}
              selected={id === selectedPiece}
              orientationIndex={orientationIndex}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
