import { useState, useEffect, useCallback, useRef } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import type { Season } from './types'
import { loadSeasons, saveSeason } from './store'
import HomePage from './pages/HomePage'
import NewSeasonPage from './pages/NewSeasonPage'
import SeasonPage from './pages/SeasonPage'
import NewMatchPage from './pages/NewMatchPage'
import MatchPage from './pages/MatchPage'
import GamePage from './pages/GamePage'
import LeaguePage from './pages/LeaguePage'

const POLL_INTERVAL = 5000

function App() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [saveError, setSaveError] = useState(false)
  const navigate = useNavigate()
  const savingRef = useRef(false)
  const mutationEpochRef = useRef(0)

  const fetchSeasons = useCallback(async () => {
    if (savingRef.current) return
    const epochAtStart = mutationEpochRef.current
    const data = await loadSeasons()
    setLoading(false)
    // Discard this server snapshot if a local change happened while the
    // request was in flight — otherwise a stale read would clobber unsaved
    // local state (e.g. a match that was just created).
    if (savingRef.current || mutationEpochRef.current !== epochAtStart) return
    setSeasons(data)
  }, [])

  useEffect(() => {
    fetchSeasons()
    const interval = setInterval(fetchSeasons, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchSeasons])

  function getSeason(id: string) {
    return seasons.find(s => s.id === id)
  }

  async function persist(season: Season) {
    savingRef.current = true
    mutationEpochRef.current++
    try {
      await saveSeason(season)
      setSaveError(false)
    } catch {
      setSaveError(true)
    } finally {
      savingRef.current = false
    }
  }

  async function updateSeason(season: Season) {
    setSeasons(prev => prev.map(s => s.id === season.id ? season : s))
    await persist(season)
  }

  async function addSeason(season: Season) {
    setSeasons(prev => [...prev, season])
    await persist(season)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-svh bg-gradient-to-b from-navy-50 to-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-navy-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-navy-700 text-base font-medium">Yükleniyor...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto min-h-svh flex flex-col bg-navy-50">
      {saveError && (
        <div className="fixed top-0 inset-x-0 z-50 max-w-lg mx-auto">
          <div className="m-2 flex items-center gap-2 bg-red-600 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
            <span className="flex-1">Kaydedilemedi — internet bağlantını kontrol et. Değişiklik henüz sunucuya yazılmadı.</span>
            <button onClick={() => setSaveError(false)} className="shrink-0 font-bold px-1" aria-label="Kapat">✕</button>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/" element={
          <HomePage seasons={seasons} />
        } />
        <Route path="/new-season" element={
          <NewSeasonPage onSave={async (season) => {
            await addSeason(season)
            navigate(`/season/${season.id}`)
          }} />
        } />
        <Route path="/season/:seasonId" element={
          <SeasonPage getSeason={getSeason} updateSeason={updateSeason} />
        } />
        <Route path="/season/:seasonId/new-match" element={
          <NewMatchPage getSeason={getSeason} updateSeason={updateSeason} />
        } />
        <Route path="/season/:seasonId/match/:matchId" element={
          <MatchPage getSeason={getSeason} updateSeason={updateSeason} />
        } />
        <Route path="/season/:seasonId/match/:matchId/game/:gameId" element={
          <GamePage getSeason={getSeason} updateSeason={updateSeason} />
        } />
        <Route path="/season/:seasonId/league" element={
          <LeaguePage getSeason={getSeason} />
        } />
      </Routes>
    </div>
  )
}

export default App
