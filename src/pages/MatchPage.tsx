import { useParams, useNavigate, Link } from 'react-router-dom'
import type { Season, Game } from '../types'
import { GAME_TYPES } from '../types'
import { generateId } from '../store'
import { getMatchTotalScores, getPlayedGameTypeIds, getMatchLeaguePoints } from '../utils'
import Header from '../components/Header'

interface Props {
  getSeason: (id: string) => Season | undefined
  updateSeason: (season: Season) => void
}

const POSITION_STYLES = [
  { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-400 text-white', icon: '1' },
  { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-400 text-white', icon: '2' },
  { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-400 text-white', icon: '3' },
  { bg: 'bg-white', border: 'border-navy-100', badge: 'bg-navy-200 text-navy-500', icon: '4' },
]

export default function MatchPage({ getSeason, updateSeason }: Props) {
  const { seasonId, matchId } = useParams<{ seasonId: string; matchId: string }>()
  const navigate = useNavigate()
  const season = getSeason(seasonId!)
  const match = season?.matches.find(m => m.id === matchId)

  if (!season || !match) return <div className="p-4 text-navy-400">Maç bulunamadı.</div>

  const players = match.playerIds.map(pid => season.players.find(p => p.id === pid)!)
  const totals = getMatchTotalScores(match)
  const playedTypeIds = getPlayedGameTypeIds(match)
  const completedGames = match.games.filter(g => g.completed).length
  const activeGame = match.games.find(g => !g.completed)

  function startNewGame(gameTypeId: number) {
    const game: Game = {
      id: generateId(),
      gameTypeId,
      scores: [],
      completed: false,
    }
    const updatedMatch = {
      ...match!,
      games: [...match!.games, game],
    }
    const updated: Season = {
      ...season!,
      matches: season!.matches.map(m => m.id === matchId ? updatedMatch : m),
    }
    updateSeason(updated)
    navigate(`/season/${seasonId}/match/${matchId}/game/${game.id}`)
  }

  function finishMatch() {
    if (!confirm('Maçı bitirmek istediğinize emin misiniz?')) return
    const updated: Season = {
      ...season!,
      matches: season!.matches.map(m =>
        m.id === matchId ? { ...m, completed: true } : m
      ),
    }
    updateSeason(updated)
  }

  const sortedPlayers = [...players].sort(
    (a, b) => (totals.get(a.id) || 0) - (totals.get(b.id) || 0)
  )

  const leaguePoints = match.completed ? getMatchLeaguePoints(match) : null
  const availableTypes = GAME_TYPES.filter(gt => !playedTypeIds.includes(gt.id))

  return (
    <div className="flex flex-col min-h-svh bg-navy-50">
      <Header
        title={`Maç ${season.matches.indexOf(match) + 1}`}
        back={`/season/${seasonId}`}
        subtitle={match.completed ? 'Tamamlandı' : `${completedGames}/12 oyun`}
      />
      <div className="flex-1 p-4 space-y-4 page-enter">
        {/* Active game banner */}
        {activeGame && (
          <Link
            to={`/season/${seasonId}/match/${matchId}/game/${activeGame.id}`}
            className="flex items-center gap-3 bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 active:bg-amber-100 transition-colors"
          >
            <span className="relative flex h-4 w-4 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-amber-800 text-base">
                {GAME_TYPES.find(gt => gt.id === activeGame.gameTypeId)?.name}
              </div>
              <div className="text-xs text-amber-600 mt-0.5">Oyuna devam etmek için dokunun</div>
            </div>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        )}

        {/* Scoreboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-navy-100 overflow-hidden">
          <div className="bg-gradient-to-r from-navy-800 to-navy-900 text-white px-4 py-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20V10" />
              <path d="M18 20V4" />
              <path d="M6 20v-4" />
            </svg>
            Skor Tablosu
          </div>
          <div className="p-2.5 space-y-2">
            {sortedPlayers.map((p, i) => {
              const style = POSITION_STYLES[i] || POSITION_STYLES[3]
              return (
                <div key={p.id} className={`flex items-center px-3 py-3 rounded-xl ${style.bg} border ${style.border}`}>
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${style.badge} shrink-0`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 font-bold text-base ml-3 text-navy-800">{p.name}</span>
                  <span className="font-bold text-xl tabular-nums text-navy-800">
                    {totals.get(p.id) || 0}
                  </span>
                  {leaguePoints && (
                    <span className={`ml-2.5 text-xs px-2.5 py-1 rounded-full font-bold ${
                      leaguePoints.get(p.id) === 3
                        ? 'bg-amber-100 text-amber-700'
                        : leaguePoints.get(p.id) === 1
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-navy-50 text-navy-300'
                    }`}>
                      +{leaguePoints.get(p.id)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Played games list */}
        <div className="bg-white rounded-2xl shadow-sm border border-navy-100 overflow-hidden">
          <div className="bg-gradient-to-r from-navy-800 to-navy-900 text-white px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              Oynanan Oyunlar
            </span>
            <span className="text-sm bg-white/20 px-2.5 py-0.5 rounded-full font-bold">{completedGames}/12</span>
          </div>
          {match.games.filter(g => g.completed).length === 0 ? (
            <p className="text-navy-300 text-center py-6 text-sm">Henüz oyun oynanmadı</p>
          ) : (
            <div className="divide-y divide-navy-50">
              {match.games.filter(g => g.completed).map(game => {
                const gameType = GAME_TYPES.find(gt => gt.id === game.gameTypeId)
                return (
                  <Link
                    key={game.id}
                    to={`/season/${seasonId}/match/${matchId}/game/${game.id}`}
                    className="block px-4 py-3 active:bg-navy-50 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm text-navy-700">{gameType?.name}</span>
                      <span className="text-[11px] text-red-500 font-semibold">Detay &rarr;</span>
                    </div>
                    <div className="flex gap-1">
                      {game.scores.map(s => {
                        const player = players.find(p => p.id === s.playerId)
                        return (
                          <div key={s.playerId} className="flex-1 text-center bg-navy-50 rounded-lg py-1.5 px-1">
                            <div className="text-[10px] text-navy-400 truncate font-medium">{player?.name}</div>
                            <div className={`font-bold text-sm ${
                              s.totalPoints < 0 ? 'text-green-600' : 'text-navy-700'
                            }`}>
                              {s.totalPoints}
                            </div>
                            {s.islerCount > 0 && (
                              <div className="text-[10px] text-amber-600 font-bold">+{s.islerCount} iş</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* New game - select type */}
        {!match.completed && !activeGame && completedGames < 12 && (
          <div className="bg-white rounded-2xl shadow-sm border border-navy-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              Yeni Oyun Başlat
            </div>
            <div className="p-2.5 space-y-2">
              {availableTypes.map(gt => (
                <button
                  key={gt.id}
                  onClick={() => startNewGame(gt.id)}
                  className="w-full text-left px-4 py-3.5 bg-navy-50 rounded-xl border border-navy-100 font-semibold text-navy-700 text-base active:bg-navy-100 transition-colors flex items-center justify-between"
                >
                  <span>{gt.name}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8ba3cd" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Remaining game types */}
        {!match.completed && activeGame && availableTypes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-navy-100 overflow-hidden">
            <div className="bg-navy-100 px-4 py-2.5 text-xs font-bold text-navy-400 uppercase tracking-wider">
              Kalan Oyunlar
            </div>
            <div className="px-4 py-3 flex flex-wrap gap-2">
              {availableTypes.map(gt => (
                <span key={gt.id} className="bg-navy-100 text-navy-500 px-3 py-1.5 rounded-lg text-xs font-semibold">
                  {gt.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Finish match */}
        {!match.completed && !activeGame && completedGames > 0 && (
          <button
            onClick={finishMatch}
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold active:bg-red-700 transition-colors text-base shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
            Maçı Bitir
          </button>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
