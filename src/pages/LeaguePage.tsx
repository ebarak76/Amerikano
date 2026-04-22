import { useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Season } from '../types'
import { calculateLeagueTable } from '../utils'
import Header from '../components/Header'

interface Props {
  getSeason: (id: string) => Season | undefined
}

const RANK_STYLES = [
  { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-400 text-white', podiumBg: 'bg-amber-200', podiumBorder: 'border-amber-400', podiumShadow: 'shadow-amber-200' },
  { bg: 'bg-gray-50', text: 'text-gray-500', badge: 'bg-gray-400 text-white', podiumBg: 'bg-gray-200', podiumBorder: 'border-gray-300', podiumShadow: '' },
  { bg: 'bg-orange-50', text: 'text-orange-600', badge: 'bg-orange-400 text-white', podiumBg: 'bg-orange-200', podiumBorder: 'border-orange-300', podiumShadow: '' },
]

export default function LeaguePage({ getSeason }: Props) {
  const { seasonId } = useParams<{ seasonId: string }>()
  const season = getSeason(seasonId!)
  const [activeTab, setActiveTab] = useState<'total' | 'average'>('total')

  if (!season) return <div className="p-4 text-navy-400">Sezon bulunamadı.</div>

  const table = calculateLeagueTable(season)

  // Average points table
  const avgTable = [...table]
    .map(row => ({
      ...row,
      avgPoints: row.matchesPlayed > 0 ? row.totalPoints / row.matchesPlayed : 0,
    }))
    .sort((a, b) => {
      if (b.avgPoints !== a.avgPoints) return b.avgPoints - a.avgPoints
      if (b.wins !== a.wins) return b.wins - a.wins
      return b.seconds - a.seconds
    })

  const currentTable = activeTab === 'total' ? table : avgTable

  return (
    <div className="flex flex-col min-h-svh bg-navy-50">
      <Header title="Lig Tablosu" back={`/season/${seasonId}`} subtitle={season.name} />
      <div className="flex-1 p-4 page-enter">

        {/* Tab switcher */}
        <div className="flex bg-navy-100 rounded-2xl p-1 mb-4">
          <button
            onClick={() => setActiveTab('total')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'total'
                ? 'bg-navy-800 text-white shadow-md'
                : 'text-navy-500'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
              <path d="M4 22h16" />
              <path d="M10 22V2h4v20" />
            </svg>
            Toplam Puan
          </button>
          <button
            onClick={() => setActiveTab('average')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'average'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-navy-500'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 20V10" />
              <path d="M18 20V4" />
              <path d="M6 20v-4" />
            </svg>
            Ortalama Puan
          </button>
        </div>

        {/* Top 3 podium */}
        {currentTable.length >= 3 && (
          <div className="flex items-end justify-center gap-2 mb-5 pt-2">
            {/* 2nd place */}
            <div className="flex-1 text-center">
              <div className={`w-13 h-13 rounded-full ${RANK_STYLES[1].podiumBg} border-3 ${RANK_STYLES[1].podiumBorder} flex items-center justify-center mx-auto mb-2`}>
                <span className="text-lg font-bold text-gray-500">2</span>
              </div>
              <div className="text-sm font-bold text-navy-700 truncate">{currentTable[1].player.name}</div>
              <div className="text-lg font-bold text-gray-500">
                {activeTab === 'total'
                  ? currentTable[1].totalPoints
                  : (currentTable[1] as typeof avgTable[number]).avgPoints.toFixed(1)
                }
              </div>
              <div className={`${RANK_STYLES[1].podiumBg} rounded-t-xl h-16 mt-2 flex items-center justify-center`}>
                <span className="text-xs text-gray-500 font-bold">{currentTable[1].matchesPlayed}M {currentTable[1].wins}G</span>
              </div>
            </div>
            {/* 1st place */}
            <div className="flex-1 text-center">
              <div className={`w-15 h-15 rounded-full ${RANK_STYLES[0].podiumBg} border-3 ${RANK_STYLES[0].podiumBorder} flex items-center justify-center mx-auto mb-2 shadow-lg ${RANK_STYLES[0].podiumShadow}`}>
                <span className="text-xl font-bold text-amber-600">1</span>
              </div>
              <div className="text-sm font-bold text-navy-800 truncate">{currentTable[0].player.name}</div>
              <div className="text-xl font-bold text-amber-600">
                {activeTab === 'total'
                  ? currentTable[0].totalPoints
                  : (currentTable[0] as typeof avgTable[number]).avgPoints.toFixed(1)
                }
              </div>
              <div className={`${RANK_STYLES[0].podiumBg} rounded-t-xl h-24 mt-2 flex items-center justify-center`}>
                <span className="text-xs text-amber-700 font-bold">{currentTable[0].matchesPlayed}M {currentTable[0].wins}G</span>
              </div>
            </div>
            {/* 3rd place */}
            <div className="flex-1 text-center">
              <div className={`w-13 h-13 rounded-full ${RANK_STYLES[2].podiumBg} border-3 ${RANK_STYLES[2].podiumBorder} flex items-center justify-center mx-auto mb-2`}>
                <span className="text-lg font-bold text-orange-500">3</span>
              </div>
              <div className="text-sm font-bold text-navy-700 truncate">{currentTable[2].player.name}</div>
              <div className="text-lg font-bold text-orange-500">
                {activeTab === 'total'
                  ? currentTable[2].totalPoints
                  : (currentTable[2] as typeof avgTable[number]).avgPoints.toFixed(1)
                }
              </div>
              <div className={`${RANK_STYLES[2].podiumBg} rounded-t-xl h-12 mt-2 flex items-center justify-center`}>
                <span className="text-xs text-orange-600 font-bold">{currentTable[2].matchesPlayed}M {currentTable[2].wins}G</span>
              </div>
            </div>
          </div>
        )}

        {/* Column headers */}
        <div className="flex items-center px-4 py-2 text-[10px] text-navy-400 font-bold uppercase tracking-wider">
          <span className="w-8 shrink-0"></span>
          <span className="flex-1 ml-3"></span>
          <div className="flex items-center gap-3">
            <span className="w-7 text-center">M</span>
            <span className="w-7 text-center">G</span>
            <span className="w-7 text-center">2.</span>
            <span className="w-10 text-center">{activeTab === 'total' ? 'P' : 'Ort'}</span>
          </div>
        </div>

        {/* Full table */}
        <div className="bg-white rounded-2xl shadow-sm border border-navy-100 overflow-hidden">
          <div className="divide-y divide-navy-50">
            {currentTable.map((row, i) => {
              const rankStyle = RANK_STYLES[i] || { bg: 'bg-white', text: 'text-navy-400', badge: 'bg-navy-100 text-navy-500' }
              return (
                <div key={row.player.id} className={`flex items-center px-4 py-3.5 ${i < 3 ? rankStyle.bg : ''}`}>
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${rankStyle.badge} shrink-0`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 ml-3">
                    <span className="font-bold text-sm text-navy-800">{row.player.name}</span>
                    {activeTab === 'average' && (
                      <span className="text-[10px] text-navy-400 ml-1.5">({row.totalPoints}p)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium text-navy-400">
                    <span className="w-7 text-center">{row.matchesPlayed}</span>
                    <span className="w-7 text-center">{row.wins}</span>
                    <span className="w-7 text-center">{row.seconds}</span>
                    <span className={`w-10 text-center text-base font-bold ${i < 3 ? rankStyle.text : 'text-navy-700'}`}>
                      {activeTab === 'total'
                        ? row.totalPoints
                        : (row as typeof avgTable[number]).avgPoints.toFixed(1)
                      }
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex justify-center gap-4 text-[11px] text-navy-400 font-medium">
          <span>M: Maç</span>
          <span>G: Galibiyet</span>
          <span>2.: İkincilik</span>
          <span>{activeTab === 'total' ? 'P: Puan' : 'Ort: Ortalama'}</span>
        </div>
      </div>
    </div>
  )
}
