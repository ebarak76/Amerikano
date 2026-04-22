import { useParams } from 'react-router-dom'
import type { Season } from '../types'
import { calculateLeagueTable } from '../utils'
import Header from '../components/Header'

interface Props {
  getSeason: (id: string) => Season | undefined
}

const RANK_STYLES = [
  { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-400 text-white' },
  { bg: 'bg-gray-50', text: 'text-gray-500', badge: 'bg-gray-400 text-white' },
  { bg: 'bg-orange-50', text: 'text-orange-600', badge: 'bg-orange-400 text-white' },
]

export default function LeaguePage({ getSeason }: Props) {
  const { seasonId } = useParams<{ seasonId: string }>()
  const season = getSeason(seasonId!)

  if (!season) return <div className="p-4 text-gray-500">Sezon bulunamadı.</div>

  const table = calculateLeagueTable(season)

  return (
    <div className="flex flex-col min-h-svh bg-gray-50">
      <Header title="Lig Tablosu" back={`/season/${seasonId}`} subtitle={season.name} />
      <div className="flex-1 p-4 page-enter">
        {/* Top 3 podium */}
        {table.length >= 3 && (
          <div className="flex items-end justify-center gap-2 mb-6 pt-2">
            {/* 2nd place */}
            <div className="flex-1 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center mx-auto mb-2">
                <span className="text-lg font-bold text-gray-500">2</span>
              </div>
              <div className="text-sm font-bold text-gray-700 truncate">{table[1].player.name}</div>
              <div className="text-lg font-bold text-gray-500">{table[1].totalPoints}</div>
              <div className="bg-gray-200 rounded-t-xl h-16 mt-2 flex items-center justify-center">
                <span className="text-xs text-gray-500 font-medium">{table[1].wins}G {table[1].seconds}İ</span>
              </div>
            </div>
            {/* 1st place */}
            <div className="flex-1 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-amber-200">
                <span className="text-xl font-bold text-amber-600">1</span>
              </div>
              <div className="text-sm font-bold text-gray-800 truncate">{table[0].player.name}</div>
              <div className="text-xl font-bold text-amber-600">{table[0].totalPoints}</div>
              <div className="bg-amber-200 rounded-t-xl h-24 mt-2 flex items-center justify-center">
                <span className="text-xs text-amber-700 font-medium">{table[0].wins}G {table[0].seconds}İ</span>
              </div>
            </div>
            {/* 3rd place */}
            <div className="flex-1 text-center">
              <div className="w-12 h-12 rounded-full bg-orange-100 border-2 border-orange-300 flex items-center justify-center mx-auto mb-2">
                <span className="text-lg font-bold text-orange-500">3</span>
              </div>
              <div className="text-sm font-bold text-gray-700 truncate">{table[2].player.name}</div>
              <div className="text-lg font-bold text-orange-500">{table[2].totalPoints}</div>
              <div className="bg-orange-200 rounded-t-xl h-12 mt-2 flex items-center justify-center">
                <span className="text-xs text-orange-600 font-medium">{table[2].wins}G {table[2].seconds}İ</span>
              </div>
            </div>
          </div>
        )}

        {/* Full table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {table.map((row, i) => {
              const rankStyle = RANK_STYLES[i] || { bg: 'bg-white', text: 'text-gray-400', badge: 'bg-gray-100 text-gray-500' }
              return (
                <div key={row.player.id} className={`flex items-center px-4 py-3 ${i < 3 ? rankStyle.bg : ''}`}>
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${rankStyle.badge} shrink-0`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 font-semibold text-sm ml-3">{row.player.name}</span>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="w-6 text-center">{row.matchesPlayed}</span>
                    <span className="w-6 text-center">{row.wins}</span>
                    <span className="w-6 text-center">{row.seconds}</span>
                    <span className={`w-8 text-center text-base font-bold ${i < 3 ? rankStyle.text : 'text-gray-700'}`}>
                      {row.totalPoints}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex justify-center gap-4 text-[11px] text-gray-400">
          <span>M: Maç</span>
          <span>G: Galibiyet</span>
          <span>İ: İkincilik</span>
          <span>P: Puan</span>
        </div>

        {/* Table header (sticky reference) */}
        <div className="mt-2 flex items-center px-4 text-[10px] text-gray-300 font-medium">
          <span className="w-7 shrink-0"></span>
          <span className="flex-1 ml-3"></span>
          <div className="flex items-center gap-4">
            <span className="w-6 text-center">M</span>
            <span className="w-6 text-center">G</span>
            <span className="w-6 text-center">İ</span>
            <span className="w-8 text-center">P</span>
          </div>
        </div>
      </div>
    </div>
  )
}
