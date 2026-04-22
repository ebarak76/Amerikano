import { Link } from 'react-router-dom'
import type { Season } from '../types'
import Header from '../components/Header'

export default function HomePage({ seasons }: { seasons: Season[] }) {
  return (
    <div className="flex flex-col min-h-svh bg-gray-50">
      <Header title="Amerikano" subtitle="Okey Ligi" />
      <div className="flex-1 p-4 space-y-4 page-enter">
        <Link
          to="/new-season"
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3.5 rounded-2xl text-base font-semibold active:scale-[0.98] transition-transform shadow-md shadow-emerald-600/30"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Yeni Sezon
        </Link>

        {seasons.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4 opacity-30">&#127183;</div>
            <p className="text-gray-400 text-sm">Henüz bir sezon oluşturulmadı</p>
            <p className="text-gray-300 text-xs mt-1">Yukarıdaki butona dokunarak başlayın</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
              Sezonlar
            </h2>
            {[...seasons].reverse().map(season => {
              const completedMatches = season.matches.filter(m => m.completed).length
              return (
                <Link
                  key={season.id}
                  to={`/season/${season.id}`}
                  className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-800 text-base truncate">{season.name}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          {season.players.length}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {completedMatches} maç
                        </span>
                      </div>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
