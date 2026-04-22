import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Season, Match, Game, GameScore } from '../types'
import { GAME_TYPES } from '../types'
import { calculateGameScore } from '../utils'
import Header from '../components/Header'
import Avatar from '../components/Avatar'

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

  if (!season || !match || !game) return <div className="p-4 text-navy-400">Oyun bulunamadı.</div>

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
    <div className="flex flex-col min-h-svh bg-navy-50">
      <Header title={gameTypeName || 'Oyun'} back={`/season/${seasonId}/match/${matchId}`} />
      <div className="flex-1 p-4 space-y-3 page-enter">
        {game.completed && !editing && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-sm text-green-700 font-bold text-center flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Tamamlandı
            </div>
            <button
              onClick={() => setEditing(true)}
              className="bg-amber-50 text-amber-700 border border-amber-200 px-5 py-3 rounded-2xl text-sm font-bold active:bg-amber-100 transition-colors flex items-center gap-1.5"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Düzenle
            </button>
          </div>
        )}
        {editing && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700 font-bold text-center flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
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
            <div key={p.id} className="bg-white rounded-2xl border border-navy-100 shadow-sm overflow-hidden">
              {/* Player header */}
              <div className="flex justify-between items-center px-4 py-3 bg-navy-800 text-white">
                <span className="font-bold text-base flex items-center gap-2.5">
                  <Avatar name={p.name} size="md" />
                  {p.name}
                </span>
                <span className={`font-bold text-xl tabular-nums px-3 py-1 rounded-lg ${
                  preview.totalPoints < 0 ? 'bg-green-500/20 text-green-300' : preview.totalPoints > 0 ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white/60'
                }`}>
                  {preview.totalPoints}
                </span>
              </div>

              <div className="p-4 space-y-3">
                {/* Opened toggle */}
                <button
                  onClick={() => toggleOpened(p.id)}
                  className={`w-full py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                    s.opened
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-500/30'
                      : 'bg-navy-100 text-navy-400'
                  } ${isReadOnly ? 'opacity-60' : 'active:scale-[0.98]'}`}
                >
                  {s.opened ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Açtı (-50)
                    </>
                  ) : 'Açmadı'}
                </button>

                {/* Remaining points */}
                {!s.opened && (
                  <div>
                    <label className="text-xs text-navy-400 font-bold flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 20V10" />
                        <path d="M18 20V4" />
                        <path d="M6 20v-4" />
                      </svg>
                      Istaka Puanı
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={s.remaining || ''}
                      onChange={e => setRemaining(p.id, e.target.value)}
                      placeholder="0"
                      readOnly={isReadOnly}
                      className="w-full border border-navy-200 rounded-xl px-4 py-3 text-lg mt-1 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent bg-navy-50 font-bold"
                    />
                  </div>
                )}

                {/* Isler counter */}
                <div className="flex items-center justify-between bg-navy-50 rounded-xl px-4 py-3">
                  <div>
                    <span className="text-base text-navy-700 font-bold">İşler</span>
                    <span className="text-sm text-amber-600 ml-2 font-bold">+{s.isler * 25} puan</span>
                  </div>
                  {!isReadOnly ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustIsler(p.id, -1)}
                        className="w-12 h-12 rounded-xl bg-navy-200 text-navy-600 text-2xl font-bold active:bg-navy-300 transition-colors flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-bold text-xl tabular-nums text-navy-800">{s.isler}</span>
                      <button
                        onClick={() => adjustIsler(p.id, 1)}
                        className="w-12 h-12 rounded-xl bg-amber-400 text-white text-2xl font-bold active:bg-amber-500 transition-colors flex items-center justify-center shadow-md shadow-amber-400/30"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <span className="font-bold text-xl tabular-nums text-navy-700">{s.isler}</span>
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
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-2xl text-lg font-bold active:scale-[0.97] transition-transform shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {editing ? 'Değişiklikleri Kaydet' : 'Oyunu Kaydet'}
            </button>
            {!editing && (
              <button
                onClick={cancelGame}
                className="w-full bg-navy-100 text-navy-500 py-3.5 rounded-2xl font-bold active:bg-navy-200 transition-colors text-base flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
                Oyunu İptal Et
              </button>
            )}
            {editing && (
              <button
                onClick={() => {
                  setEditing(false)
                  setInitialized(false)
                }}
                className="w-full bg-navy-100 text-navy-500 py-3.5 rounded-2xl font-bold active:bg-navy-200 transition-colors text-base"
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
