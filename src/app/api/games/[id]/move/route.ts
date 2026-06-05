import { NextResponse } from 'next/server'
import { getGame, saveGame } from '@/lib/store'
import { isValidPlacement, applyMove } from '@/lib/game-logic'
import { matchesOrientation, normalizeCells } from '@/lib/pieces'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { playerId, pieceId, cells } = await req.json()

  const game = await getGame(id)
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  if (game.status !== 'playing') return NextResponse.json({ error: 'Game not active' }, { status: 400 })

  const seatIndex = game.currentSeatIndex
  if (game.seats[seatIndex].playerId !== playerId)
    return NextResponse.json({ error: 'Not your turn' }, { status: 403 })

  if (!game.remainingPieces[seatIndex].includes(pieceId))
    return NextResponse.json({ error: 'Piece not available' }, { status: 400 })

  const normalizedCells = normalizeCells(cells)
  if (!matchesOrientation(pieceId, normalizedCells))
    return NextResponse.json({ error: 'Invalid piece orientation' }, { status: 400 })

  if (!isValidPlacement(game.board, seatIndex, cells))
    return NextResponse.json({ error: 'Invalid placement' }, { status: 400 })

  const newGame = applyMove(game, seatIndex, pieceId, cells)
  await saveGame(newGame)
  return NextResponse.json({ game: newGame })
}
