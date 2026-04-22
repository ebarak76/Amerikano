import { useState } from 'react'
import type { Season } from '../types'
import { generateId } from '../store'
import Header from '../components/Header'

interface Props {
  onSave: (season: Season) => void
}

export default function NewSeasonPage({ onSave }: Props) {
  const [name, setName] = useState('')
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '', ''])

  function addPlayer() {
    setPlayerNames([...playerNames, ''])
  }

  function removePlayer(index: number) {
    if (playerNames.length <= 4) return
    setPlayerNames(playerNames.filter((_, i) => i !== index))
  }

  function updatePlayer(index: number, value: string) {
    const updated = [...playerNames]
    updated[index] = value
    setPlayerNames(updated)
  }

  function handleSave() {
    const trimmedName = name.trim()
    const validPlayers = playerNames.map(p => p.trim()).filter(p => p.length > 0)
    if (!trimmedName) return alert('Sezon adı girin.')
    if (validPlayers.length < 4) return alert('En az 4 oyuncu girin.')
    if (new Set(validPlayers).size !== validPlayers.length) return alert('Oyuncu isimleri benzersiz olmalı.')

    const season: Season = {
      id: generateId(),
      name: trimmedName,
      players: validPlayers.map(p => ({ id: generateId(), name: p })),
      matches: [],
      createdAt: new Date().toISOString(),
    }
    onSave(season)
  }

  return (
    <div className="flex flex-col min-h-svh bg-gray-50">
      <Header title="Yeni Sezon" back="/" />
      <div className="flex-1 p-4 space-y-5 page-enter">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sezon Adı</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Örn: 2024 Bahar Sezonu"
            className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Oyuncular ({playerNames.length})
          </label>
          <div className="space-y-2">
            {playerNames.map((p, i) => (
              <div key={i} className="flex gap-2">
                <div className="w-8 h-11 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-300">{i + 1}</span>
                </div>
                <input
                  type="text"
                  value={p}
                  onChange={e => updatePlayer(i, e.target.value)}
                  placeholder={`Oyuncu ${i + 1}`}
                  className="flex-1 border border-gray-200 bg-white rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                {playerNames.length > 4 && (
                  <button
                    onClick={() => removePlayer(i)}
                    className="w-11 h-11 flex items-center justify-center text-red-400 active:text-red-600 transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M15 9l-6 6M9 9l6 6" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addPlayer}
            className="mt-3 flex items-center gap-1.5 text-emerald-600 font-semibold text-sm active:text-emerald-700 pl-10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Oyuncu Ekle
          </button>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3.5 rounded-2xl text-base font-semibold active:scale-[0.98] transition-transform shadow-md shadow-emerald-600/30"
        >
          Sezonu Başlat
        </button>
      </div>
    </div>
  )
}
