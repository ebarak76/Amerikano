import { useParams, Link } from 'react-router-dom'
import type { Season } from '../types'
import Header from '../components/Header'
import Avatar from '../components/Avatar'

interface Props {
  getSeason: (id: string) => Season | undefined
  updateSeason: (season: Season) => void
}

export default function SeasonPage({ getSeason }: Props) {
  const { seasonId } = useParams<{ seasonId: string }>()
  const season = getSeason(seasonId!)

  if (!season) return <div className="p-4 text-navy-400">Sezon bulunamadı.</div>

  return (
    <div className="flex flex-col min-h-svh bg-navy-50">
      <Header title={season.name} back="/" subtitle={`${season.players.length} oyuncu`} />
      <div className="flex-1 p-4 space-y-4 page-enter">
        {/* Action buttons */}
        <div className="flex gap-3">
          <Link
            to={`/season/${season.id}/new-match`}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-center py-4 rounded-2xl font-bold active:scale-[0.97] transition-transform shadow-lg shadow-red-600/30 text-base"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Yeni Maç
          </Link>
          <Link
            to={`/season/${season.id}/league`}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-navy-700 to-navy-800 text-white text-center py-4 rounded-2xl font-bold active:scale-[0.97] transition-transform shadow-lg shadow-navy-800/30 text-base"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
              <path d="M4 22h16" />
              <path d="M10 22V2h4v20" />
            </svg>
            Lig Tablosu
          </Link>
        </div>

        {/* Players */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100">
          <h2 className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            Oyuncular
          </h2>
          <div className="flex flex-wrap gap-2">
            {season.players.map(p => (
              <span key={p.id} className="bg-navy-100 text-navy-700 pl-1.5 pr-3.5 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2">
                <Avatar name={p.name} size="sm" />
                {p.name}
              </span>
            ))}
          </div>
        </div>

        {/* Matches */}
        <div>
          <h2 className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
            </svg>
            Maçlar ({season.matches.length})
          </h2>
          {season.matches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-navy-300 text-sm">Henüz maç yok</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...season.matches].reverse().map((match, idx) => {
                const matchNum = season.matches.length - idx
                const players = match.playerIds.map(
                  pid => season.players.find(p => p.id === pid)?.name || '?'
                )
                const completedGames = match.games.filter(g => g.completed).length
                return (
                  <Link
                    key={match.id}
                    to={`/season/${season.id}/match/${match.id}`}
                    className="flex items-center bg-white rounded-2xl p-4 shadow-sm border border-navy-100 active:scale-[0.98] transition-transform gap-3"
                  >
                    <div className="w-11 h-11 rounded-xl bg-navy-100 flex items-center justify-center shrink-0">
                      <span className="font-bold text-navy-600 text-sm">{matchNum}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-navy-800 text-sm">
                        Maç {matchNum}
                      </div>
                      <div className="text-xs text-navy-400 mt-0.5 truncate">
                        {players.join(' \u00b7 ')}
                      </div>
                    </div>
                    <span className={`text-[11px] px-3 py-1.5 rounded-full font-bold ${
                      match.completed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {match.completed ? 'Bitti' : `${completedGames}/12`}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
