'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Board from '@/components/Board'
import PieceSelector from '@/components/PieceSelector'
import { Game, PLAYER_COLORS, COLOR_HEX } from '@/types/game'
import { PIECE_ORIENTATIONS } from '@/lib/pieces'
import { isValidPlacement } from '@/lib/game-logic'

function getOrCreatePlayerId(): string {
  let id = localStorage.getItem('blokus-pid')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('blokus-pid', id) }
  return id
}

const COLOR_NAMES = ['Blue', 'Yellow', 'Red', 'Green']
const COLOR_BG = ['bg-blue-500', 'bg-yellow-400', 'bg-red-500', 'bg-green-500']
const COLOR_TEXT = ['text-blue-400', 'text-yellow-400', 'text-red-400', 'text-green-400']

export default function GameClient({ gameId }: { gameId: string }) {
  const searchParams = useSearchParams()
  const [game, setGame] = useState<Game | null>(null)
  const [playerId] = useState(() => typeof window !== 'undefined' ? getOrCreatePlayerId() : '')
  const [joinName, setJoinName] = useState(searchParams.get('name') ?? '')
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null)
  const [orientationIdx, setOrientationIdx] = useState(0)
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const mySeatIndex = game?.seats.findIndex(s => s.playerId === playerId) ?? -1
  const isMyTurn = game?.status === 'playing' && game.currentSeatIndex === mySeatIndex

  // Poll for game state
  useEffect(() => {
    async function fetch_() {
      const res = await fetch(`/api/games/${gameId}`)
      if (res.ok) { const d = await res.json(); setGame(d.game) }
    }
    fetch_()
    const t = setInterval(fetch_, 2000)
    return () => clearInterval(t)
  }, [gameId])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'r' || e.key === 'R') rotate()
      if (e.key === 'f' || e.key === 'F') flip()
      if (e.key === 'Escape') { setSelectedPiece(null); setOrientationIdx(0) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function rotate() {
    if (!selectedPiece) return
    const len = PIECE_ORIENTATIONS[selectedPiece].length
    setOrientationIdx(i => (i + 1) % len)
  }

  function flip() {
    if (!selectedPiece) return
    const orientations = PIECE_ORIENTATIONS[selectedPiece]
    // Flip = find the mirrored orientation (second half of orientations array)
    const half = Math.floor(orientations.length / 2)
    setOrientationIdx(i => (i + half) % orientations.length)
  }

  const previewCells = useMemo((): [number, number][] => {
    if (!selectedPiece || !hoverCell || !game) return []
    const [hr, hc] = hoverCell
    const orientations = PIECE_ORIENTATIONS[selectedPiece]
    if (!orientations?.length) return []
    const orientation = orientations[orientationIdx % orientations.length]
    return orientation.map(([r, c]) => [hr + r, hc + c])
  }, [selectedPiece, hoverCell, orientationIdx, game])

  const previewValid = useMemo(() => {
    if (!game || mySeatIndex < 0 || !selectedPiece || previewCells.length === 0) return false
    return isValidPlacement(game.board, mySeatIndex, previewCells)
  }, [game, mySeatIndex, selectedPiece, previewCells])

  function handleCellHover(r: number, c: number) {
    if (r < 0) setHoverCell(null)
    else setHoverCell([r, c])
  }

  async function handleCellClick(r: number, c: number) {
    if (!game || !isMyTurn || !selectedPiece || mySeatIndex < 0) return
    const orientations = PIECE_ORIENTATIONS[selectedPiece]
    if (!orientations?.length) return
    const orientation = orientations[orientationIdx % orientations.length]
    const cells: [number, number][] = orientation.map(([dr, dc]) => [r + dr, c + dc])
    if (!isValidPlacement(game.board, mySeatIndex, cells)) return
    const res = await fetch(`/api/games/${gameId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, pieceId: selectedPiece, cells }),
    })
    const data = await res.json()
    if (data.game) {
      setGame(data.game)
      setSelectedPiece(null)
      setOrientationIdx(0)
      setError('')
    } else {
      setError(data.error ?? 'Invalid move')
    }
  }

  async function joinSeat(seat: number) {
    if (!joinName.trim()) { setError('Enter your name first'); return }
    const res = await fetch(`/api/games/${gameId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: joinName.trim(), playerId, seatIndex: seat }),
    })
    const data = await res.json()
    if (data.success) {
      const res2 = await fetch(`/api/games/${gameId}`)
      const d = await res2.json()
      setGame(d.game)
      setError('')
    } else {
      setError(data.error ?? 'Failed to join')
    }
  }

  async function startGame() {
    const res = await fetch(`/api/games/${gameId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    })
    const data = await res.json()
    if (data.success) {
      const res2 = await fetch(`/api/games/${gameId}`)
      const d = await res2.json()
      setGame(d.game)
    } else {
      setError(data.error ?? 'Failed to start')
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading game…</p>
      </div>
    )
  }

  const filledSeats = game.seats.filter(s => s.playerId !== null).length
  const scores = game.remainingPieces.map((pieces, i) => {
    let n = 0
    for (let r = 0; r < 20; r++) for (let c = 0; c < 20; c++) if (game.board[r][c] === i) n++
    return n
  })

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <a href="/" className="font-black text-xl tracking-tight">BLOKUS</a>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500 font-mono">#{gameId}</span>
          <button
            onClick={copyLink}
            className="bg-gray-700 hover:bg-gray-600 rounded px-3 py-1.5 text-xs font-medium transition-colors"
          >
            {copied ? 'Copied!' : 'Share link'}
          </button>
        </div>
      </div>

      {/* Waiting lobby */}
      {game.status === 'waiting' && (
        <div className="max-w-lg mx-auto p-6 flex flex-col gap-4">
          <h2 className="text-lg font-bold">Waiting for players</h2>
          {mySeatIndex < 0 && (
            <div className="flex flex-col gap-2">
              <input
                className="bg-gray-700 rounded-lg px-4 py-2.5 text-sm placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your name"
                value={joinName}
                onChange={e => setJoinName(e.target.value)}
                maxLength={20}
              />
            </div>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            {game.seats.map((seat, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 border ${seat.playerId ? 'border-gray-600 bg-gray-800' : 'border-dashed border-gray-700 bg-gray-800/50'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-sm" style={{ background: COLOR_HEX[PLAYER_COLORS[i]] }} />
                  <span className="text-sm font-medium">{COLOR_NAMES[i]}</span>
                </div>
                {seat.playerId ? (
                  <p className="text-sm text-gray-300">{seat.name}</p>
                ) : mySeatIndex < 0 ? (
                  <button
                    onClick={() => joinSeat(i)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Take this seat →
                  </button>
                ) : (
                  <p className="text-xs text-gray-600">Empty</p>
                )}
              </div>
            ))}
          </div>
          {mySeatIndex >= 0 && filledSeats >= 2 && (
            <button
              onClick={startGame}
              className="bg-green-600 hover:bg-green-500 rounded-lg py-2.5 font-semibold transition-colors"
            >
              Start Game ({filledSeats} players)
            </button>
          )}
          {mySeatIndex >= 0 && filledSeats < 2 && (
            <p className="text-gray-500 text-sm text-center">Share the link to invite players (need at least 2)</p>
          )}
        </div>
      )}

      {/* Active game */}
      {game.status !== 'waiting' && (
        <div className="flex flex-col lg:flex-row gap-4 p-4 items-start">
          {/* Board */}
          <div className="flex-shrink-0">
            <Board
              board={game.board}
              previewCells={previewCells}
              previewValid={previewValid}
              onCellHover={handleCellHover}
              onCellClick={handleCellClick}
              disabled={!isMyTurn}
            />
          </div>

          {/* Sidebar */}
          <div className="flex-1 min-w-0 flex flex-col gap-4 lg:max-w-xs">
            {/* Scores */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Scores</h3>
              <div className="flex flex-col gap-1.5">
                {game.seats.map((seat, i) => (
                  seat.playerId && (
                    <div
                      key={i}
                      className={`flex items-center justify-between rounded px-2 py-1 ${
                        game.status === 'playing' && game.currentSeatIndex === i ? 'bg-gray-700' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_HEX[PLAYER_COLORS[i]] }} />
                        <span className="text-sm">{seat.name}</span>
                        {game.isBlocked[i] && <span className="text-xs text-gray-600">blocked</span>}
                        {game.status === 'playing' && game.currentSeatIndex === i && (
                          <span className="text-xs text-yellow-400">▶</span>
                        )}
                      </div>
                      <span className="text-sm font-mono font-semibold">{scores[i]}</span>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Turn info */}
            {game.status === 'playing' && (
              <div className={`rounded-xl p-4 ${isMyTurn ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-gray-800'}`}>
                {isMyTurn ? (
                  <>
                    <p className="font-bold text-yellow-400 mb-1">Your turn!</p>
                    <p className="text-xs text-gray-400">
                      {selectedPiece
                        ? 'Click the board to place. R=rotate, F=flip, Esc=cancel'
                        : 'Select a piece below'}
                    </p>
                    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                  </>
                ) : (
                  <p className="text-sm text-gray-400">
                    Waiting for{' '}
                    <span className={COLOR_TEXT[game.currentSeatIndex]}>
                      {game.seats[game.currentSeatIndex]?.name ?? COLOR_NAMES[game.currentSeatIndex]}
                    </span>
                    …
                  </p>
                )}
              </div>
            )}

            {/* Finished */}
            {game.status === 'finished' && (
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="font-bold mb-2">Game over!</h3>
                {[...scores.map((s, i) => ({ s, i, name: game.seats[i].name })).filter(x => game.seats[x.i].playerId)]
                  .sort((a, b) => b.s - a.s)
                  .map((x, rank) => (
                    <div key={x.i} className="flex items-center gap-2 text-sm py-0.5">
                      <span className="text-gray-500">#{rank + 1}</span>
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_HEX[PLAYER_COLORS[x.i]] }} />
                      <span>{x.name}</span>
                      <span className="ml-auto font-mono font-semibold">{x.s}</span>
                    </div>
                  ))}
                <a href="/" className="block mt-3 text-center text-sm text-blue-400 hover:text-blue-300">
                  Play again →
                </a>
              </div>
            )}

            {/* Piece selector */}
            {isMyTurn && game.remainingPieces[mySeatIndex]?.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Your pieces ({game.remainingPieces[mySeatIndex].length} left)
                </h3>
                <PieceSelector
                  remainingPieces={game.remainingPieces[mySeatIndex]}
                  selectedPiece={selectedPiece}
                  orientationIndex={orientationIdx}
                  seatIndex={mySeatIndex}
                  onSelect={id => { setSelectedPiece(id || null); setOrientationIdx(0) }}
                  onRotate={rotate}
                  onFlip={flip}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
