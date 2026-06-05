import { NextResponse } from 'next/server'
import { createNewGame } from '@/lib/game-logic'
import { saveGame } from '@/lib/store'

export async function POST(req: Request) {
  const { name, playerId } = await req.json()
  if (!name || !playerId) return NextResponse.json({ error: 'Missing name or playerId' }, { status: 400 })

  const id = crypto.randomUUID().slice(0, 8)
  const game = createNewGame(id)
  game.seats[0] = { playerId, name }

  await saveGame(game)
  return NextResponse.json({ gameId: id, seatIndex: 0 })
}
