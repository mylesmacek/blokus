export const PLAYER_COLORS = ['blue', 'yellow', 'red', 'green'] as const
export type PlayerColor = (typeof PLAYER_COLORS)[number]

export const COLOR_HEX: Record<PlayerColor, string> = {
  blue: '#3B82F6',
  yellow: '#EAB308',
  red: '#EF4444',
  green: '#22C55E',
}

export const CORNER_COORDS: [number, number][] = [
  [0, 0],
  [0, 19],
  [19, 19],
  [19, 0],
]

export type Seat = {
  playerId: string | null
  name: string | null
}

export type GameStatus = 'waiting' | 'playing' | 'finished'

export type Game = {
  id: string
  seats: Seat[]
  currentSeatIndex: number
  board: (number | null)[][]
  remainingPieces: string[][]
  isBlocked: boolean[]
  status: GameStatus
  createdAt: number
  updatedAt: number
}
