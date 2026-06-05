import { Game, CORNER_COORDS } from '@/types/game'
import { ALL_PIECE_IDS, PIECE_DEFINITIONS, PIECE_ORIENTATIONS, normalizeCells } from './pieces'

const N = 20
const EDGE_DIRS: [number, number][] = [[-1,0],[1,0],[0,-1],[0,1]]
const CORNER_DIRS: [number, number][] = [[-1,-1],[-1,1],[1,-1],[1,1]]

function hasPieceOnBoard(board: (number | null)[][], seat: number): boolean {
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      if (board[r][c] === seat) return true
  return false
}

export function isValidPlacement(
  board: (number | null)[][],
  seatIndex: number,
  cells: [number, number][]
): boolean {
  for (const [r, c] of cells) {
    if (r < 0 || r >= N || c < 0 || c >= N) return false
    if (board[r][c] !== null) return false
  }

  // No edge-adjacency with own pieces
  for (const [r, c] of cells) {
    for (const [dr, dc] of EDGE_DIRS) {
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nr < N && nc >= 0 && nc < N && board[nr][nc] === seatIndex) return false
    }
  }

  if (!hasPieceOnBoard(board, seatIndex)) {
    const [sr, sc] = CORNER_COORDS[seatIndex]
    return cells.some(([r, c]) => r === sr && c === sc)
  }

  // Must touch own piece corner-to-corner
  for (const [r, c] of cells) {
    for (const [dr, dc] of CORNER_DIRS) {
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nr < N && nc >= 0 && nc < N && board[nr][nc] === seatIndex) return true
    }
  }
  return false
}

export function isPlayerBlocked(
  board: (number | null)[][],
  seatIndex: number,
  remaining: string[]
): boolean {
  for (const pieceId of remaining) {
    for (const orientation of PIECE_ORIENTATIONS[pieceId]) {
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const cells: [number, number][] = orientation.map(([dr, dc]) => [r + dr, c + dc])
          if (isValidPlacement(board, seatIndex, cells)) return false
        }
      }
    }
  }
  return true
}

export function applyMove(
  game: Game,
  seatIndex: number,
  pieceId: string,
  cells: [number, number][]
): Game {
  const newBoard = game.board.map(row => [...row]) as (number | null)[][]
  const newRemaining = game.remainingPieces.map(p => [...p])
  const newBlocked = [...game.isBlocked]

  for (const [r, c] of cells) newBoard[r][c] = seatIndex
  newRemaining[seatIndex] = newRemaining[seatIndex].filter(id => id !== pieceId)

  // Advance to next unblocked seat
  let nextIdx = (seatIndex + 1) % 4
  for (let i = 0; i < 4; i++) {
    if (!newBlocked[nextIdx]) {
      const blocked =
        newRemaining[nextIdx].length === 0 ||
        isPlayerBlocked(newBoard, nextIdx, newRemaining[nextIdx])
      if (!blocked) break
      newBlocked[nextIdx] = true
    }
    nextIdx = (nextIdx + 1) % 4
  }

  const allBlocked = newBlocked.every(Boolean)

  return {
    ...game,
    board: newBoard,
    remainingPieces: newRemaining,
    isBlocked: newBlocked,
    currentSeatIndex: nextIdx,
    status: allBlocked ? 'finished' : 'playing',
    updatedAt: Date.now(),
  }
}

export function getScores(game: Game): number[] {
  return game.remainingPieces.map((pieces, i) => {
    let onBoard = 0
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (game.board[r][c] === i) onBoard++
    return onBoard
  })
}

export function createNewGame(id: string): Game {
  const board: (number | null)[][] = Array.from({ length: N }, () => Array(N).fill(null))
  return {
    id,
    seats: Array(4).fill(null).map(() => ({ playerId: null, name: null })),
    currentSeatIndex: 0,
    board,
    remainingPieces: Array(4).fill(null).map(() => [...ALL_PIECE_IDS]),
    isBlocked: [false, false, false, false],
    status: 'waiting',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}
