import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Season, Match, Game, GameScore } from '../types'
import { GAME_TYPES } from '../types'
import { calculateGameScore } from '../utils'
import Header from '../components/Header'

interface Props {
  getSeason: (id: string) => Season | undefined
  updateSeason: (season: Season) => void
}

export default function GamePage({ getSeason, updateSeason }: Props) {
  const { seasonId, matchId, gameId } = useParams<{ seasonId: string; matchId: string; gameId: string }>()
  const navigate = useNavigate()
  const season = getSeason(seasonId!)
  const match = season?.matches.find(m => m.id === matchId)
  const game = match?.games.find(g => g.id === gameId)

  const [scores, setScores] = useState<Map<string, { opened: boolean; remaining: number; isler: number }>>(new Map())
  const [initialized, setInitialized] = useState(false)
  const [editing, setEditing] = useState(false)

  const players = match ? match.playerIds.map(pid => season!.players.find(p => p.id === pid)!) : []

  useEffect(() => {
    if (!initialized && match && game && players.length > 0) {
      const map = new Map<string, { opened: boolean; remaining: number; isler: number }>()
      for (const p of players) {
        const existing = game.scores.find(s => s.playerId === p.id)
        if (existing) {
          map.set(p.id, {
            opened: existing.opened,
            remaining: existing.remainingPoints,
            isler: existing.islerCount,
          })
        } else {
          map.set(p.id, { opened: false, remaining: 0, isler: 0 })
        }
      }
      setScores(map)
      setInitialized(true)
    }
  }, [initialized, match, game, players])

  if (!season || !match || !game) return <div className="p-4 text-gray-500">Oyun bulunamadı.</div>

  const gameTypeName = GAME_TYPES.find(gt => gt.id === game.gameTypeId)?.name
  const isReadOnly = game.completed && !editing

  function toggleOpened(playerId: string) {
    if (isReadOnly) return
    const next = new Map(scores)
    const current = next.get(playerId)!
    next.set(playerId, { ...current, opened: !current.opened, remaining: 0 })
    setScores(next)
  }

  function setRemaining(playerId: string, val: string) {
    if (isReadOnly) return
    const next = new Map(scores)
    const current = next.get(playerId)!
    next.set(playerId, { ...current, remaining: parseInt(val) || 0 })
    setScores(next)
  }

  function adjustIsler(playerId: string, delta: number) {
    if (isReadOnly) return
    const next = new Map(scores)
    const current = next.get(playerId)!
    const newVal = Math.max(0, current.isler + delta)
    next.set(playerId, { ...current, isler: newVal })
    setScores(next)
  }

  function saveGame() {
    const gameScores: GameScore[] = players.map(p => {
      const s = scores.get(p.id)!
      const score: GameScore = {
        playerId: p.id,
        opened: s.opened,
        remainingPoints: s.remaining,
        islerCount: s.isler,
        totalPoints: 0,
      }
      score.totalPoints = calculateGameScore(score)
      return score
    })

    const openedCount = gameScores.filter(s => s.opened).length
    const allZeroRemaining = gameScores.every(s => !s.opened && s.remainingPoints === 0)
    if (openedCount === 0 && allZeroRemaining) {
      return alert('Pat durumunda her oyuncunun ıstaka puanını girin.')
    }

    const updatedGame: Game = { ...game!, scores: gameScores, completed: true }
    const updatedMatch: Match = {
      ...match!,
      games: match!.games.map(g => g.id === gameId ? updatedGame : g),
    }

    if (updatedMatch.games.filter(g => g.completed).length >= 12) {
      updatedMatch.completed = true
    }

    const updated: Season = {
      ...season!,
      matches: season!.matches.map(m => m.id === matchId ? updatedMatch : m),
    }
    updateSeason(updated)
    navigate(`/season/${seasonId}/match/${matchId}`, { replace: true })
  }

  function cancelGame() {
    if (!confirm('Oyunu iptal etmek istediğinize emin misiniz?')) return
    const updatedMatch: Match = {
      ...match!,
      games: match!.games.filter(g => g.id !== gameId),
    }
    const updated: Season = {
      ...season!,
      matches: season!.matches.map(m => m.id === matchId ? updatedMatch : m),
    }
    updateSeason(updated)
    navigate(`/season/${seasonId}/match/${matchId}`, { replace: true })
  }

  return (
    <div className="flex flex-col min-h-svh bg-gray-50">
      <Header title={gameTypeName || 'Oyun'} back={`/season/${seasonId}/match/${matchId}`} />
      <div className="flex-1 p-4 space-y-3 page-enter">
        {game.completed && !editing && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5 text-sm text-emerald-700 font-medium text-center">
              Bu oyun tamamlandı
            </div>
            <button
              onClick={() => setEditing(true)}
              className="bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2.5 rounded-2xl text-sm font-semibold active:bg-amber-100 transition-colors"
            >
              Düzenle
            </button>
          </div>
        )}
        {editing && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 text-sm text-amber-700 font-medium text-center">
            Düzenleme modu
          </div>
        )}

        {players.map(p => {
          const s = scores.get(p.id) || { opened: false, remaining: 0, isler: 0 }
          const preview: GameScore = {
            playerId: p.id,
            opened: s.opened,
            remainingPoints: s.remaining,
            islerCount: s.isler,
            totalPoints: 0,
          }
          preview.totalPoints = calculateGameScore(preview)

          return (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Player header */}
              <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-100">
                <span className="font-bold text-gray-800">{p.name}</span>
                <span className={`font-bold text-xl tabular-nums ${
                  preview.totalPoints < 0 ? 'text-emerald-600' : preview.totalPoints > 0 ? 'text-red-500' : 'text-gray-400'
                }`}>
                  {preview.totalPoints}
                </span>
              </div>

              <div className="p-4 space-y-3">
                {/* Opened toggle */}
                <button
                  onClick={() => toggleOpened(p.id)}
                  className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all ${
                    s.opened
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                      : 'bg-gray-100 text-gray-500'
                  } ${isReadOnly ? 'opacity-60' : 'active:scale-[0.98]'}`}
                >
                  {s.opened ? 'Açtı (-50)' : 'Açmadı'}
                </button>

                {/* Remaining points */}
                {!s.opened && (
                  <div>
                    <label className="text-xs text-gray-400 font-medium">Istaka Puanı</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={s.remaining || ''}
                      onChange={e => setRemaining(p.id, e.target.value)}
                      placeholder="0"
                      readOnly={isReadOnly}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                    />
                  </div>
                )}

                {/* Isler counter */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-600 font-medium">İşler</span>
                    <span className="text-xs text-amber-600 ml-2 font-semibold">+{s.isler * 25}</span>
                  </div>
                  {!isReadOnly && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustIsler(p.id, -1)}
                        className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 text-xl font-bold active:bg-gray-200 transition-colors flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold text-lg tabular-nums">{s.isler}</span>
                      <button
                        onClick={() => adjustIsler(p.id, 1)}
                        className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 text-xl font-bold active:bg-amber-200 transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  )}
                  {isReadOnly && (
                    <span className="font-bold text-lg tabular-nums text-gray-600">{s.isler}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {!isReadOnly && (
          <div className="space-y-2 pt-2">
            <button
              onClick={saveGame}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3.5 rounded-2xl text-base font-semibold active:scale-[0.98] transition-transform shadow-md shadow-emerald-600/30"
            >
              {editing ? 'Değişiklikleri Kaydet' : 'Oyunu Kaydet'}
            </button>
            {!editing && (
              <button
                onClick={cancelGame}
                className="w-full bg-gray-100 text-gray-500 py-3 rounded-2xl font-semibold active:bg-gray-200 transition-colors text-sm"
              >
                Oyunu İptal Et
              </button>
            )}
            {editing && (
              <button
                onClick={() => {
                  setEditing(false)
                  setInitialized(false)
                }}
                className="w-full bg-gray-100 text-gray-500 py-3 rounded-2xl font-semibold active:bg-gray-200 transition-colors text-sm"
              >
                İptal
              </button>
            )}
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
