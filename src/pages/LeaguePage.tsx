import { useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Season } from '../types'
import { calculateLeagueTable, calculateOpeningTable } from '../utils'
import Header from '../components/Header'
import Avatar from '../components/Avatar'

interface Props {
  getSeason: (id: string) => Season | undefined
}

const RANK_STYLES = [
  { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-400 text-white', podiumBg: 'bg-amber-200', podiumBorder: 'border-amber-400', podiumShadow: 'shadow-amber-200' },
  { bg: 'bg-gray-50', text: 'text-gray-500', badge: 'bg-gray-400 text-white', podiumBg: 'bg-gray-200', podiumBorder: 'border-gray-300', podiumShadow: '' },
  { bg: 'bg-orange-50', text: 'text-orange-600', badge: 'bg-orange-400 text-white', podiumBg: 'bg-orange-200', podiumBorder: 'border-orange-300', podiumShadow: '' },
]

type Tab = 'total' | 'average' | 'openings'

interface DisplayRow {
  player: { id: string; name: string }
  matchesPlayed: number
  stat1: number   // wins (total/avg) or el açma (openings)
  stat2: number   // seconds (total/avg) or 0 (openings, hidden)
  primaryDisplay: string  // formatted value shown in main column
  annotation?: string     // e.g. "(12p)" shown next to name in average view
  podiumStats: string     // small text shown in podium block
}

export default function LeaguePage({ getSeason }: Props) {
  const { seasonId } = useParams<{ seasonId: string }>()
  const season = getSeason(seasonId!)
  const [activeTab, setActiveTab] = useState<Tab>('total')

  if (!season) return <div className="p-4 text-navy-400">Sezon bulunamadı.</div>

  const baseTable = calculateLeagueTable(season)

  const totalRows: DisplayRow[] = baseTable.map(r => ({
    player: r.player,
    matchesPlayed: r.matchesPlayed,
    stat1: r.wins,
    stat2: r.seconds,
    primaryDisplay: String(r.totalPoints),
    podiumStats: `${r.matchesPlayed}M ${r.wins}G`,
  }))

  const avgRows: DisplayRow[] = [...baseTable]
    .map(r => ({
      ...r,
      avgPoints: r.matchesPlayed > 0 ? r.totalPoints / r.matchesPlayed : 0,
    }))
    .sort((a, b) => {
      if (b.avgPoints !== a.avgPoints) return b.avgPoints - a.avgPoints
      if (b.wins !== a.wins) return b.wins - a.wins
      return b.seconds - a.seconds
    })
    .map(r => ({
      player: r.player,
      matchesPlayed: r.matchesPlayed,
      stat1: r.wins,
      stat2: r.seconds,
      primaryDisplay: r.avgPoints.toFixed(1),
      annotation: `(${r.totalPoints}p)`,
      podiumStats: `${r.matchesPlayed}M ${r.wins}G`,
    }))

  const openingRows: DisplayRow[] = calculateOpeningTable(season).map(r => ({
    player: r.player,
    matchesPlayed: r.matchesPlayed,
    stat1: 0,
    stat2: 0,
    primaryDisplay: String(r.openings),
    podiumStats: `${r.matchesPlayed}M`,
  }))

  const currentTable: DisplayRow[] =
    activeTab === 'total' ? totalRows : activeTab === 'average' ? avgRows : openingRows

  const primaryLabel = activeTab === 'total' ? 'P' : activeTab === 'average' ? 'Ort' : 'El'
  const stat1Label = 'G'
  const showStat1 = activeTab !== 'openings'
  const showStat2 = activeTab !== 'openings'

  return (
    <div className="flex flex-col min-h-svh bg-navy-50">
      <Header title="Lig Tablosu" back={`/season/${seasonId}`} subtitle={season.name} />
      <div className="flex-1 p-4 page-enter">

        {/* Tab switcher */}
        <div className="flex bg-navy-100 rounded-2xl p-1 mb-4 gap-1">
          <button
            onClick={() => setActiveTab('total')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'total'
                ? 'bg-navy-800 text-white shadow-md'
                : 'text-navy-500'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
              <path d="M4 22h16" />
              <path d="M10 22V2h4v20" />
            </svg>
            Toplam
          </button>
          <button
            onClick={() => setActiveTab('average')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'average'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-navy-500'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 20V10" />
              <path d="M18 20V4" />
              <path d="M6 20v-4" />
            </svg>
            Ortalama
          </button>
          <button
            onClick={() => setActiveTab('openings')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'openings'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-navy-500'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="6" width="18" height="12" rx="2" />
              <path d="M7 10v4M11 10v4M15 10v4" />
            </svg>
            El Açma
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
              <div className="text-lg font-bold text-gray-500">{currentTable[1].primaryDisplay}</div>
              <div className={`${RANK_STYLES[1].podiumBg} rounded-t-xl h-16 mt-2 flex items-center justify-center`}>
                <span className="text-xs text-gray-500 font-bold">{currentTable[1].podiumStats}</span>
              </div>
            </div>
            {/* 1st place */}
            <div className="flex-1 text-center">
              <div className={`w-15 h-15 rounded-full ${RANK_STYLES[0].podiumBg} border-3 ${RANK_STYLES[0].podiumBorder} flex items-center justify-center mx-auto mb-2 shadow-lg ${RANK_STYLES[0].podiumShadow}`}>
                <span className="text-xl font-bold text-amber-600">1</span>
              </div>
              <div className="text-sm font-bold text-navy-800 truncate">{currentTable[0].player.name}</div>
              <div className="text-xl font-bold text-amber-600">{currentTable[0].primaryDisplay}</div>
              <div className={`${RANK_STYLES[0].podiumBg} rounded-t-xl h-24 mt-2 flex items-center justify-center`}>
                <span className="text-xs text-amber-700 font-bold">{currentTable[0].podiumStats}</span>
              </div>
            </div>
            {/* 3rd place */}
            <div className="flex-1 text-center">
              <div className={`w-13 h-13 rounded-full ${RANK_STYLES[2].podiumBg} border-3 ${RANK_STYLES[2].podiumBorder} flex items-center justify-center mx-auto mb-2`}>
                <span className="text-lg font-bold text-orange-500">3</span>
              </div>
              <div className="text-sm font-bold text-navy-700 truncate">{currentTable[2].player.name}</div>
              <div className="text-lg font-bold text-orange-500">{currentTable[2].primaryDisplay}</div>
              <div className={`${RANK_STYLES[2].podiumBg} rounded-t-xl h-12 mt-2 flex items-center justify-center`}>
                <span className="text-xs text-orange-600 font-bold">{currentTable[2].podiumStats}</span>
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
            {showStat1 && <span className="w-7 text-center">{stat1Label}</span>}
            {showStat2 && <span className="w-7 text-center">2.</span>}
            <span className="w-10 text-center">{primaryLabel}</span>
          </div>
        </div>

        {/* Full table */}
        <div className="bg-white rounded-2xl shadow-sm border border-navy-100 overflow-hidden">
          <div className="divide-y divide-navy-50">
            {currentTable.map((row, i) => {
              const rankStyle = RANK_STYLES[i] || { bg: 'bg-white', text: 'text-navy-400', badge: 'bg-navy-100 text-navy-500' }
              return (
                <div key={row.player.id} className={`flex items-center px-4 py-3.5 ${i < 3 ? rankStyle.bg : ''}`}>
                  <div className="relative shrink-0">
                    <Avatar name={row.player.name} size="md" />
                    <span className={`absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${rankStyle.badge} border-2 border-white`}>
                      {i + 1}
                    </span>
                  </div>
                  <div className="flex-1 ml-3">
                    <span className="font-bold text-sm text-navy-800">{row.player.name}</span>
                    {row.annotation && (
                      <span className="text-[10px] text-navy-400 ml-1.5">{row.annotation}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium text-navy-400">
                    <span className="w-7 text-center">{row.matchesPlayed}</span>
                    {showStat1 && <span className="w-7 text-center">{row.stat1}</span>}
                    {showStat2 && <span className="w-7 text-center">{row.stat2}</span>}
                    <span className={`w-10 text-center text-base font-bold ${i < 3 ? rankStyle.text : 'text-navy-700'}`}>
                      {row.primaryDisplay}
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
          {activeTab === 'openings' ? (
            <>
              <span>El: El Açma</span>
              <span>El/M: Maç Başı Ortalama</span>
            </>
          ) : (
            <>
              <span>G: Galibiyet</span>
              <span>2.: İkincilik</span>
              <span>{activeTab === 'total' ? 'P: Puan' : 'Ort: Ortalama'}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
