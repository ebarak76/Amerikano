import { useParams, Link } from 'react-router-dom'
import type { Season } from '../types'
import Header from '../components/Header'

interface Props {
  getSeason: (id: string) => Season | undefined
  updateSeason: (season: Season) => void
}

export default function SeasonPage({ getSeason }: Props) {
  const { seasonId } = useParams<{ seasonId: string }>()
  const season = getSeason(seasonId!)

  if (!season) return <div className="p-4 text-gray-500">Sezon bulunamadı.</div>

  return (
    <div className="flex flex-col min-h-svh bg-gray-50">
      <Header title={season.name} back="/" subtitle={`${season.players.length} oyuncu`} />
      <div className="flex-1 p-4 space-y-4 page-enter">
        {/* Action buttons */}
        <div className="flex gap-3">
          <Link
            to={`/season/${season.id}/new-match`}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-center py-3 rounded-2xl font-semibold active:scale-[0.98] transition-transform shadow-md shadow-emerald-600/30 text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Yeni Maç
          </Link>
          <Link
            to={`/season/${season.id}/league`}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-emerald-700 text-center py-3 rounded-2xl font-semibold border-2 border-emerald-200 active:bg-emerald-50 transition-colors text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
              <path d="M4 22h16" />
              <path d="M10 22V2h4v20" />
            </svg>
            Lig Tablosu
          </Link>
        </div>

        {/* Players */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Oyuncular
          </h2>
          <div className="flex flex-wrap gap-2">
            {season.players.map(p => (
              <span key={p.id} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-medium border border-emerald-100">
                {p.name}
              </span>
            ))}
          </div>
        </div>

        {/* Matches */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            Maçlar ({season.matches.length})
          </h2>
          {season.matches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-300 text-sm">Henüz maç yok</p>
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
                    className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800 text-sm">
                        Maç {matchNum}
                      </span>
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                        match.completed
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {match.completed ? 'Tamamlandı' : `${completedGames}/12`}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {players.join(' \u00b7 ')}
                    </div>
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
