import { NextResponse } from 'next/server'
import { getGame, saveGame } from '@/lib/store'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, playerId, seatIndex } = await req.json()

  if (!name || !playerId || seatIndex === undefined)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const game = await getGame(id)
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  if (game.status !== 'waiting') return NextResponse.json({ error: 'Game already started' }, { status: 400 })
  if (game.seats[seatIndex].playerId !== null)
    return NextResponse.json({ error: 'Seat taken' }, { status: 400 })

  game.seats[seatIndex] = { playerId, name }
  game.updatedAt = Date.now()
  await saveGame(game)
  return NextResponse.json({ success: true })
}
