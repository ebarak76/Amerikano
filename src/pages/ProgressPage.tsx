import { useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Season } from '../types'
import { calculateSeasonProgress } from '../utils'
import LineChart from '../components/LineChart'
import type { ChartSeries } from '../components/LineChart'
import { seriesColor } from '../chartTheme'
import Header from '../components/Header'
import Avatar from '../components/Avatar'

interface Props {
  getSeason: (id: string) => Season | undefined
}

export default function ProgressPage({ getSeason }: Props) {
  const { seasonId } = useParams<{ seasonId: string }>()
  const season = getSeason(seasonId!)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showTable, setShowTable] = useState(false)

  if (!season) return <div className="p-4 text-navy-400">Sezon bulunamadı.</div>

  const { weeks, players } = calculateSeasonProgress(season)
  const labels = weeks.map(w => w.label)

  // Renk oyuncuya bağlıdır, sırasına değil: filtre/sıra değişince renk kaymaz.
  const colorOf = new Map(season.players.map((p, i) => [p.id, seriesColor(i)]))

  const pointSeries: ChartSeries[] = players.map(p => ({
    id: p.player.id,
    name: p.player.name,
    color: colorOf.get(p.player.id)!,
    values: p.points,
    solid: p.played,
  }))

  const rankSeries: ChartSeries[] = players.map(p => ({
    id: p.player.id,
    name: p.player.name,
    color: colorOf.get(p.player.id)!,
    values: p.ranks,
    solid: p.played,
  }))

  const playerCount = season.players.length
  const endLabels = playerCount <= 4
  const maxPoints = Math.max(1, ...players.map(p => p.points[p.points.length - 1] ?? 0))

  // Efsane: güncel sıraya göre dizilir
  const legend = [...players].sort(
    (a, b) => (a.ranks[a.ranks.length - 1] ?? 99) - (b.ranks[b.ranks.length - 1] ?? 99),
  )

  if (weeks.length === 0) {
    return (
      <div className="flex flex-col min-h-svh bg-navy-50">
        <Header title="Puan Grafiği" back={`/season/${seasonId}`} subtitle={season.name} />
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <p className="text-navy-300 text-sm">
            Henüz tamamlanmış maç yok.<br />Grafik ilk maç bitince oluşur.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-svh bg-navy-50">
      <Header
        title="Puan Grafiği"
        back={`/season/${seasonId}`}
        subtitle={`${season.name} · ${weeks.length} hafta`}
      />
      <div className="flex-1 p-4 space-y-4 page-enter">

        {weeks.length === 1 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-700 font-semibold text-center">
            Tek hafta oynandı — çizgi ikinci haftadan itibaren oluşur.
          </div>
        )}

        {/* Kümülatif puan */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100">
          <h2 className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-1 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 17l6-6 4 4 7-7" />
              <path d="M17 7h4v4" />
            </svg>
            Kümülatif Lig Puanı
          </h2>
          <p className="text-[11px] text-navy-300 mb-2">Hafta sonundaki toplam puan</p>
          <LineChart
            labels={labels}
            series={pointSeries}
            yMin={0}
            yMax={maxPoints}
            height={230}
            activeId={activeId}
            endLabels={endLabels}
          />
        </div>

        {/* Sıralama */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-navy-100">
          <h2 className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-1 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
              <path d="M4 22h16" />
              <path d="M10 22V2h4v20" />
            </svg>
            Sıralama
          </h2>
          <p className="text-[11px] text-navy-300 mb-2">1 = lider · yukarı çıkmak iyidir</p>
          <LineChart
            labels={labels}
            series={rankSeries}
            invertY
            yMin={1}
            yMax={playerCount}
            yTicks={Array.from({ length: playerCount }, (_, i) => i + 1)}
            height={30 + playerCount * 26}
            activeId={activeId}
            endLabels={endLabels}
            formatValue={v => `${v}.`}
          />
        </div>

        {/* Efsane — dokununca o oyuncu öne çıkar */}
        <div className="bg-white rounded-2xl shadow-sm border border-navy-100 overflow-hidden">
          <div className="px-4 pt-3 pb-1 text-[10px] font-bold text-navy-400 uppercase tracking-wider">
            Oyuncular {activeId && '· tekrar dokun, hepsini göster'}
          </div>
          <div className="divide-y divide-navy-50">
            {legend.map(p => {
              const isActive = activeId === p.player.id
              const pts = p.points[p.points.length - 1]
              const rank = p.ranks[p.ranks.length - 1]
              const prevRank = p.ranks.length > 1 ? p.ranks[p.ranks.length - 2] : rank
              const delta = prevRank - rank
              return (
                <button
                  key={p.player.id}
                  onClick={() => setActiveId(isActive ? null : p.player.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    isActive ? 'bg-navy-50' : 'active:bg-navy-50'
                  }`}
                >
                  <span
                    className="w-4 h-1 rounded-full shrink-0"
                    style={{ background: colorOf.get(p.player.id) }}
                  />
                  <Avatar name={p.player.name} size="sm" />
                  <span className="flex-1 font-bold text-sm text-navy-800 truncate">
                    {p.player.name}
                  </span>
                  {delta !== 0 && (
                    <span
                      className={`text-[11px] font-bold tabular-nums ${
                        delta > 0 ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {delta > 0 ? `▲${delta}` : `▼${-delta}`}
                    </span>
                  )}
                  <span className="text-xs text-navy-400 font-bold tabular-nums w-7 text-right">
                    {rank}.
                  </span>
                  <span className="text-base font-bold text-navy-700 tabular-nums w-8 text-right">
                    {pts}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tablo görünümü */}
        <button
          onClick={() => setShowTable(v => !v)}
          className="w-full bg-navy-100 text-navy-600 py-3 rounded-2xl font-bold text-sm active:bg-navy-200 transition-colors flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M3 15h18M9 3v18" />
          </svg>
          {showTable ? 'Tabloyu Gizle' : 'Tablo Olarak Gör'}
        </button>

        {showTable && (
          <div className="bg-white rounded-2xl shadow-sm border border-navy-100 overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="text-[10px] text-navy-400 uppercase tracking-wider">
                  <th className="text-left font-bold px-3 py-2 sticky left-0 bg-white">Oyuncu</th>
                  {weeks.map(w => (
                    <th key={w.key} className="font-bold px-2.5 py-2 whitespace-nowrap text-center">
                      {w.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {legend.map(p => (
                  <tr key={p.player.id}>
                    <td className="px-3 py-2 font-bold text-navy-800 whitespace-nowrap sticky left-0 bg-white">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: colorOf.get(p.player.id) }}
                        />
                        {p.player.name}
                      </span>
                    </td>
                    {weeks.map((w, i) => (
                      <td
                        key={w.key}
                        className={`px-2.5 py-2 text-center tabular-nums whitespace-nowrap ${
                          p.played[i] ? 'text-navy-700' : 'text-navy-300'
                        }`}
                      >
                        <span className="font-bold">{p.points[i]}</span>
                        <span className="text-navy-400 ml-1">({p.ranks[i]}.)</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[11px] text-navy-400 text-center leading-5">
          Puan: 1. <span className="font-bold">3p</span> · 2. <span className="font-bold">1p</span> · 3.–4. <span className="font-bold">0p</span><br />
          Soluk hücre ve işaretçisiz nokta: o hafta oynamadı.
        </p>

        <div className="h-2" />
      </div>
    </div>
  )
}
