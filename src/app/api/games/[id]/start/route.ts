import { NextResponse } from 'next/server'
import { getGame, saveGame } from '@/lib/store'
import { isPlayerBlocked } from '@/lib/game-logic'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { playerId } = await req.json()

  const game = await getGame(id)
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  if (game.status !== 'waiting') return NextResponse.json({ error: 'Already started' }, { status: 400 })

  const isInGame = game.seats.some(s => s.playerId === playerId)
  if (!isInGame) return NextResponse.json({ error: 'Not in game' }, { status: 403 })

  const filledCount = game.seats.filter(s => s.playerId !== null).length
  if (filledCount < 2) return NextResponse.json({ error: 'Need at least 2 players' }, { status: 400 })

  // Block empty seats immediately
  for (let i = 0; i < 4; i++) {
    if (game.seats[i].playerId === null) game.isBlocked[i] = true
  }

  // Find first unblocked seat
  let first = 0
  while (first < 4 && game.isBlocked[first]) first++

  game.currentSeatIndex = first
  game.status = 'playing'
  game.updatedAt = Date.now()
  await saveGame(game)
  return NextResponse.json({ success: true })
}
