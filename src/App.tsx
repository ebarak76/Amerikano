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
  const navigate = useNavigate()
  const savingRef = useRef(false)

  const fetchSeasons = useCallback(async () => {
    if (savingRef.current) return
    const data = await loadSeasons()
    setSeasons(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSeasons()
    const interval = setInterval(fetchSeasons, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchSeasons])

  function getSeason(id: string) {
    return seasons.find(s => s.id === id)
  }

  async function updateSeason(season: Season) {
    savingRef.current = true
    setSeasons(prev => prev.map(s => s.id === season.id ? season : s))
    await saveSeason(season)
    savingRef.current = false
  }

  async function addSeason(season: Season) {
    savingRef.current = true
    setSeasons(prev => [...prev, season])
    await saveSeason(season)
    savingRef.current = false
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
