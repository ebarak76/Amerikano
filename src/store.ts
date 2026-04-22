import { supabase } from './lib/supabase'
import type { Season } from './types'

interface SeasonRow {
  id: string
  name: string
  players: Season['players']
  matches: Season['matches']
  created_at: string
}

function rowToSeason(row: SeasonRow): Season {
  return {
    id: row.id,
    name: row.name,
    players: row.players,
    matches: row.matches,
    createdAt: row.created_at,
  }
}

function seasonToRow(season: Season) {
  return {
    id: season.id,
    name: season.name,
    players: season.players,
    matches: season.matches,
    created_at: season.createdAt,
  }
}

export async function loadSeasons(): Promise<Season[]> {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to load seasons:', error)
    return []
  }

  return (data as SeasonRow[]).map(rowToSeason)
}

export async function saveSeason(season: Season): Promise<void> {
  const { error } = await supabase
    .from('seasons')
    .upsert(seasonToRow(season))

  if (error) {
    console.error('Failed to save season:', error)
  }
}

export async function deleteSeason(id: string): Promise<void> {
  const { error } = await supabase
    .from('seasons')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete season:', error)
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}
