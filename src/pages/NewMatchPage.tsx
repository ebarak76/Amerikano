import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Season, Match } from '../types'
import { generateId } from '../store'
import Header from '../components/Header'
import Avatar from '../components/Avatar'

interface Props {
  getSeason: (id: string) => Season | undefined
  updateSeason: (season: Season) => void
}

export default function NewMatchPage({ getSeason, updateSeason }: Props) {
  const { seasonId } = useParams<{ seasonId: string }>()
  const navigate = useNavigate()
  const season = getSeason(seasonId!)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  if (!season) return <div className="p-4 text-navy-400">Sezon bulunamadı.</div>

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
    <div className="flex flex-col min-h-svh bg-navy-50">
      <Header title="Yeni Maç" back={`/season/${seasonId}`} />
      <div className="flex-1 p-4 space-y-4 page-enter">
        <div className="flex items-center justify-between">
          <p className="text-sm text-navy-500 font-medium flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            4 oyuncu seçin
          </p>
          <span className={`text-sm font-bold px-3.5 py-1.5 rounded-full ${
            selected.size === 4 ? 'bg-green-100 text-green-700' : 'bg-navy-100 text-navy-400'
          }`}>
            {selected.size}/4
          </span>
        </div>

        <div className="space-y-2">
          {season.players.map(p => (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl border-2 font-semibold transition-all text-base ${
                selected.has(p.id)
                  ? 'border-navy-600 bg-navy-700 text-white shadow-lg shadow-navy-700/20'
                  : 'border-navy-100 bg-white text-navy-600'
              } active:scale-[0.98]`}
            >
              <Avatar name={p.name} size="md" />
              <span className="flex-1">{p.name}</span>
              {selected.has(p.id) && (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={selected.has(p.id) ? 'white' : '#1e3157'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={startMatch}
          disabled={selected.size !== 4}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-2xl text-lg font-bold active:scale-[0.97] transition-transform shadow-lg shadow-red-600/30 disabled:opacity-40 disabled:shadow-none disabled:active:scale-100"
        >
          Maçı Başlat
        </button>
      </div>
    </div>
  )
}
