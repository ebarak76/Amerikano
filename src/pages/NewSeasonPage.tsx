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
    <div className="flex flex-col min-h-svh bg-navy-50">
      <Header title="Yeni Sezon" back="/" />
      <div className="flex-1 p-4 space-y-5 page-enter">
        <div>
          <label className="block text-xs font-bold text-navy-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Sezon Adı
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Örn: 2024 Bahar Sezonu"
            className="w-full border border-navy-200 bg-white rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-navy-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Oyuncular ({playerNames.length})
          </label>
          <div className="space-y-2">
            {playerNames.map((p, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="w-9 h-12 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-navy-200 flex items-center justify-center">
                    <span className="text-xs font-bold text-navy-600">{i + 1}</span>
                  </div>
                </div>
                <input
                  type="text"
                  value={p}
                  onChange={e => updatePlayer(i, e.target.value)}
                  placeholder={`Oyuncu ${i + 1}`}
                  className="flex-1 border border-navy-200 bg-white rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                />
                {playerNames.length > 4 && (
                  <button
                    onClick={() => removePlayer(i)}
                    className="w-12 h-12 flex items-center justify-center text-red-400 active:text-red-600 transition-colors"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
            className="mt-3 flex items-center gap-2 text-navy-600 font-bold text-sm active:text-navy-800 pl-11"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            Oyuncu Ekle
          </button>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-2xl text-lg font-bold active:scale-[0.97] transition-transform shadow-lg shadow-red-600/30"
        >
          Sezonu Başlat
        </button>
      </div>
    </div>
  )
}
