import { Link } from 'react-router-dom'
import type { Season } from '../types'
import Header from '../components/Header'

export default function HomePage({ seasons }: { seasons: Season[] }) {
  return (
    <div className="flex flex-col min-h-svh bg-navy-50">
      <Header title="Amerikano" subtitle="Okey Ligi" />
      <div className="flex-1 p-4 space-y-4 page-enter">
        <Link
          to="/new-season"
          className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-2xl text-lg font-bold active:scale-[0.97] transition-transform shadow-lg shadow-red-600/30"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Yeni Sezon
        </Link>

        {seasons.length === 0 ? (
          <div className="text-center py-16">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c7d2e0" strokeWidth="1.5" className="mx-auto mb-4">
              <rect x="2" y="2" width="20" height="20" rx="3" />
              <path d="M8 12h8M12 8v8" />
            </svg>
            <p className="text-navy-400 text-sm font-medium">Henüz bir sezon oluşturulmadı</p>
            <p className="text-navy-300 text-xs mt-1">Yukarıdaki butona dokunarak başlayın</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-navy-400 uppercase tracking-wider px-1 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
                <path d="M4 22h16" />
                <path d="M10 22V2h4v20" />
              </svg>
              Sezonlar
            </h2>
            {[...seasons].reverse().map(season => {
              const completedMatches = season.matches.filter(m => m.completed).length
              return (
                <Link
                  key={season.id}
                  to={`/season/${season.id}`}
                  className="block bg-white rounded-2xl p-4 shadow-sm border border-navy-100 active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-navy-800 text-base truncate">{season.name}</div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-xs text-navy-400 font-medium">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          {season.players.length} oyuncu
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-navy-400 font-medium">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {completedMatches} maç
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-navy-50 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8ba3cd" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
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
