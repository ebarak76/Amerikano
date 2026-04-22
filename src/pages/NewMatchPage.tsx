import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Season, Match } from '../types'
import { generateId } from '../store'
import Header from '../components/Header'

interface Props {
  getSeason: (id: string) => Season | undefined
  updateSeason: (season: Season) => void
}

export default function NewMatchPage({ getSeason, updateSeason }: Props) {
  const { seasonId } = useParams<{ seasonId: string }>()
  const navigate = useNavigate()
  const season = getSeason(seasonId!)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  if (!season) return <div className="p-4 text-gray-500">Sezon bulunamadı.</div>

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) {
      next.delete(id)
    } else {
      if (next.size >= 4) return
      next.add(id)
    }
    setSelected(next)
  }

  function startMatch() {
    if (selected.size !== 4) return alert('Tam olarak 4 oyuncu seçin.')

    const match: Match = {
      id: generateId(),
      playerIds: [...selected],
      games: [],
      completed: false,
      createdAt: new Date().toISOString(),
    }

    const updated = { ...season!, matches: [...season!.matches, match] }
    updateSeason(updated)
    navigate(`/season/${season!.id}/match/${match.id}`, { replace: true })
  }

  return (
    <div className="flex flex-col min-h-svh bg-gray-50">
      <Header title="Yeni Maç" back={`/season/${seasonId}`} />
      <div className="flex-1 p-4 space-y-4 page-enter">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            4 oyuncu seçin
          </p>
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${
            selected.size === 4 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
          }`}>
            {selected.size}/4
          </span>
        </div>

        <div className="space-y-2">
          {season.players.map(p => (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 font-medium transition-all text-sm ${
                selected.has(p.id)
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-100'
                  : 'border-gray-100 bg-white text-gray-600'
              } active:scale-[0.98]`}
            >
              <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                selected.has(p.id)
                  ? 'border-emerald-500 bg-emerald-500'
                  : 'border-gray-300'
              }`}>
                {selected.has(p.id) && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              {p.name}
            </button>
          ))}
        </div>

        <button
          onClick={startMatch}
          disabled={selected.size !== 4}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3.5 rounded-2xl text-base font-semibold active:scale-[0.98] transition-transform shadow-md shadow-emerald-600/30 disabled:opacity-40 disabled:shadow-none disabled:active:scale-100"
        >
          Maçı Başlat
        </button>
      </div>
    </div>
  )
}
