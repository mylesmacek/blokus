'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { COLOR_HEX } from '@/types/game'

function getOrCreatePlayerId(): string {
  let id = localStorage.getItem('blokus-pid')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('blokus-pid', id) }
  return id
}

export default function Home() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [joinId, setJoinId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function createGame() {
    if (!name.trim()) { setError('Enter your name'); return }
    setLoading(true)
    setError('')
    const playerId = getOrCreatePlayerId()
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), playerId }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.gameId) router.push(`/game/${data.gameId}`)
    else setError(data.error ?? 'Failed to create game')
  }

  function joinGame() {
    if (!name.trim() || !joinId.trim()) { setError('Enter name and game ID'); return }
    router.push(`/game/${joinId.trim()}?name=${encodeURIComponent(name.trim())}`)
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tight mb-1">BLOKUS</h1>
          <p className="text-gray-400 text-sm">2–4 players • online multiplayer</p>
          <div className="flex justify-center gap-2 mt-3">
            {(['blue','yellow','red','green'] as const).map(c => (
              <div key={c} className="w-5 h-5 rounded-sm" style={{ background: COLOR_HEX[c] }} />
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-5 flex flex-col gap-3">
          <input
            className="w-full bg-gray-700 rounded-lg px-4 py-2.5 text-sm placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your name"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && createGame()}
            maxLength={20}
            autoFocus
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            onClick={createGame}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg py-2.5 font-semibold text-sm transition-colors"
          >
            {loading ? 'Creating…' : 'Create Game'}
          </button>
          <div className="flex items-center gap-2 text-gray-600 text-xs">
            <div className="flex-1 h-px bg-gray-700" />or join existing<div className="flex-1 h-px bg-gray-700" />
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-gray-700 rounded-lg px-3 py-2.5 text-sm placeholder-gray-500 outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Game ID"
              value={joinId}
              onChange={e => { setJoinId(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && joinGame()}
            />
            <button
              onClick={joinGame}
              className="bg-green-700 hover:bg-green-600 rounded-lg px-4 py-2.5 font-semibold text-sm transition-colors"
            >
              Join
            </button>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs">
          Create a game and share the link — up to 4 players
        </p>
      </div>
    </main>
  )
}
