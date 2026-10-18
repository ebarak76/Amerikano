import { Link } from 'react-router-dom'
import type { Season } from '../types'
import {
  calculateChampionshipTable,
  getSeasonStatus,
  SEASON_MATCH_TARGET,
  TITLES_PER_STAR,
} from '../utils'
import Header from '../components/Header'
import Avatar from '../components/Avatar'

function Star({ filled = true, size = 18 }: { filled?: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? '#eda100' : 'none'}
      stroke={filled ? '#eda100' : '#b8c7e2'}
      strokeWidth={2}
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M12 2.5l2.9 5.9 6.6.95-4.8 4.65 1.15 6.5L12 17.45 6.15 20.5 7.3 14 2.5 9.35l6.6-.95z" />
    </svg>
  )
}

export default function ChampionshipPage({ seasons }: { seasons: Season[] }) {
  const champions = calculateChampionshipTable(seasons)
  const statuses = [...seasons].reverse().map(getSeasonStatus)

  return (
    <div className="flex flex-col min-h-svh bg-navy-50">
      <Header
        title="Şampiyonluk Tablosu"
        back="/"
        subtitle={champions.length > 0 ? `${champions.length} şampiyon` : 'Henüz şampiyon yok'}
      />
      <div className="flex-1 p-4 space-y-4 page-enter">

        {/* Şampiyonlar */}
        {champions.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-navy-100 text-center">
            <div className="flex justify-center gap-1 mb-3 opacity-40">
              <Star filled={false} size={26} />
              <Star filled={false} size={26} />
              <Star filled={false} size={26} />
            </div>
            <p className="text-navy-600 text-sm font-bold">Henüz şampiyon yok</p>
            <p className="text-navy-400 text-xs mt-1.5 leading-5">
              Bir sezonun şampiyonu, o sezonun <span className="font-bold">{SEASON_MATCH_TARGET}. maçı</span> tamamlanınca belli olur.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-navy-100 overflow-hidden">
            <div className="px-4 pt-3 pb-1 text-[10px] font-bold text-navy-400 uppercase tracking-wider">
              Şampiyonlar
            </div>
            <div className="divide-y divide-navy-50">
              {champions.map((row, i) => {
                const toNextStar = TITLES_PER_STAR - (row.titles % TITLES_PER_STAR)
                return (
                  <div key={row.name} className={`px-4 py-3 ${i === 0 ? 'bg-amber-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <Avatar name={row.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-navy-800 truncate">{row.name}</div>
                        <div className="flex items-center gap-1 mt-1">
                          {row.stars > 0 ? (
                            <>
                              {Array.from({ length: row.stars }, (_, k) => <Star key={k} size={15} />)}
                              <span className="text-[11px] text-navy-400 font-bold ml-1">
                                {row.stars} yıldız
                              </span>
                            </>
                          ) : (
                            <span className="text-[11px] text-navy-300 font-medium">
                              Yıldıza {toNextStar} şampiyonluk kaldı
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-bold text-amber-600 leading-none">{row.titles}</div>
                        <div className="text-[10px] text-navy-400 font-bold uppercase tracking-wide mt-0.5">
                          kupa
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-navy-400 mt-2 pl-12 leading-5">
                      {row.seasonNames.join(' · ')}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Sezon durumları */}
        <div className="bg-white rounded-2xl shadow-sm border border-navy-100 overflow-hidden">
          <div className="px-4 pt-3 pb-1 text-[10px] font-bold text-navy-400 uppercase tracking-wider">
            Sezonlar
          </div>
          {statuses.length === 0 ? (
            <p className="px-4 py-6 text-center text-navy-300 text-sm">Henüz sezon yok</p>
          ) : (
            <div className="divide-y divide-navy-50">
              {statuses.map(st => {
                const pct = Math.min(100, (st.completedMatches / st.target) * 100)
                const remaining = Math.max(0, st.target - st.completedMatches)
                return (
                  <Link
                    key={st.season.id}
                    to={`/season/${st.season.id}/league`}
                    className="block px-4 py-3 active:bg-navy-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-sm text-navy-800 truncate">{st.season.name}</span>
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold shrink-0 ${
                          st.finished ? 'bg-amber-100 text-amber-700' : 'bg-navy-100 text-navy-500'
                        }`}
                      >
                        {st.completedMatches}/{st.target}
                      </span>
                    </div>

                    {st.finished && st.champion ? (
                      <div className="mt-2 flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" className="shrink-0">
                          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
                          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
                          <path d="M4 22h16" />
                          <path d="M10 22V2h4v20" />
                        </svg>
                        <span className="text-sm font-bold text-amber-700 truncate">
                          {st.champion.player.name}
                        </span>
                        <span className="text-[11px] text-navy-400 font-medium shrink-0">
                          {st.champion.totalPoints}p · {st.champion.openings} el
                        </span>
                      </div>
                    ) : null}

                    {st.finished && st.istakaKing && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinejoin="round" className="shrink-0">
                          <path d="M3 8l4.5 3.5L12 5l4.5 6.5L21 8l-1.8 10H4.8z" />
                        </svg>
                        <span className="text-sm font-bold text-emerald-700 truncate">
                          {st.istakaKing.player.name}
                        </span>
                        <span className="text-[11px] text-navy-400 font-medium shrink-0">
                          Istaka Kralı · {st.istakaKing.openings} el
                        </span>
                      </div>
                    )}

                    {!st.finished && (
                      <>
                        <div className="mt-2 h-1.5 bg-navy-100 rounded-full overflow-hidden">
                          <div className="h-full bg-navy-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[11px] text-navy-400 font-medium">
                            {st.leader ? `Lider: ${st.leader.player.name} (${st.leader.totalPoints}p)` : 'Henüz maç yok'}
                          </span>
                          <span className="text-[11px] text-navy-300 font-medium">
                            {remaining} maç kaldı
                          </span>
                        </div>
                      </>
                    )}

                    {st.champion?.decidedByOpenings && (
                      <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 font-semibold">
                        Puanlar eşitti — şampiyon el açma sayısıyla belirlendi.
                      </div>
                    )}
                    {st.champion?.unresolvedTie && (
                      <div className="mt-2 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 font-semibold">
                        Puan, el açma, galibiyet ve ikincilik eşit — şampiyonu kural belirleyemiyor.
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Kurallar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100">
          <h2 className="text-[10px] font-bold text-navy-400 uppercase tracking-wider mb-2">
            Kurallar
          </h2>
          <ul className="text-xs text-navy-600 space-y-1.5 leading-5">
            <li>• Bir sezon <span className="font-bold">{SEASON_MATCH_TARGET} maç</span> sürer.</li>
            <li>• En çok lig puanı alan oyuncu <span className="font-bold">şampiyon</span> olur.</li>
            <li>• Puanlar eşitse <span className="font-bold">en çok el açan</span> şampiyon olur.</li>
            <li>• Her <span className="font-bold">{TITLES_PER_STAR} şampiyonluk</span> 1 yıldız kazandırır.</li>
            <li className="text-navy-400">• Oyuncular sezonlar arasında <span className="font-bold">isme göre</span> eşleştirilir — aynı kişiyi her sezon aynı yazın.</li>
          </ul>
        </div>

        <div className="h-2" />
      </div>
    </div>
  )
}
