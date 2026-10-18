import type { Match, Season, LeagueRow, GameScore, Player } from './types';

export function calculateGameScore(score: GameScore): number {
  const base = score.opened ? -50 : score.remainingPoints;
  return base + score.islerCount * 25;
}

export function getMatchTotalScores(match: Match): Map<string, number> {
  const totals = new Map<string, number>();
  for (const pid of match.playerIds) {
    totals.set(pid, 0);
  }
  for (const game of match.games) {
    if (!game.completed) continue;
    for (const score of game.scores) {
      totals.set(score.playerId, (totals.get(score.playerId) || 0) + score.totalPoints);
    }
  }
  return totals;
}

export function getMatchLeaguePoints(match: Match): Map<string, number> {
  const totals = getMatchTotalScores(match);
  const sorted = [...totals.entries()].sort((a, b) => a[1] - b[1]);
  const leaguePoints = new Map<string, number>();

  if (sorted.length === 0) return leaguePoints;

  const bestScore = sorted[0][1];
  // Find second best score (different from best)
  let secondBestScore: number | null = null;
  for (const [, score] of sorted) {
    if (score > bestScore) {
      secondBestScore = score;
      break;
    }
  }

  for (const [playerId, score] of sorted) {
    if (score === bestScore) {
      leaguePoints.set(playerId, 3);
    } else if (secondBestScore !== null && score === secondBestScore) {
      leaguePoints.set(playerId, 1);
    } else {
      leaguePoints.set(playerId, 0);
    }
  }

  return leaguePoints;
}

export function calculateLeagueTable(season: Season): LeagueRow[] {
  const rows: Map<string, LeagueRow> = new Map();

  for (const player of season.players) {
    rows.set(player.id, {
      player,
      matchesPlayed: 0,
      wins: 0,
      seconds: 0,
      totalPoints: 0,
    });
  }

  for (const match of season.matches) {
    if (!match.completed) continue;
    const leaguePoints = getMatchLeaguePoints(match);

    for (const [playerId, points] of leaguePoints) {
      const row = rows.get(playerId);
      if (!row) continue;
      row.matchesPlayed++;
      row.totalPoints += points;
      if (points === 3) row.wins++;
      if (points === 1) row.seconds++;
    }
  }

  return [...rows.values()].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.seconds - a.seconds;
  });
}

export function getPlayedGameTypeIds(match: Match): number[] {
  return match.games.filter(g => g.completed).map(g => g.gameTypeId);
}

export interface OpeningRow {
  player: { id: string; name: string };
  matchesPlayed: number;
  openings: number;
}

export function calculateOpeningTable(season: Season): OpeningRow[] {
  const rows = new Map<string, OpeningRow>();

  for (const player of season.players) {
    rows.set(player.id, { player, matchesPlayed: 0, openings: 0 });
  }

  for (const match of season.matches) {
    if (!match.completed) continue;
    for (const pid of match.playerIds) {
      const row = rows.get(pid);
      if (row) row.matchesPlayed++;
    }
    for (const game of match.games) {
      if (!game.completed) continue;
      for (const score of game.scores) {
        if (score.opened) {
          const row = rows.get(score.playerId);
          if (row) row.openings++;
        }
      }
    }
  }

  return [...rows.values()].sort((a, b) => {
    if (b.openings !== a.openings) return b.openings - a.openings;
    return a.matchesPlayed - b.matchesPlayed;
  });
}

// ---------------------------------------------------------------------------
// Sezon gidişatı: haftalık kümülatif lig puanı ve sıralama
// ---------------------------------------------------------------------------

export interface SeasonWeek {
  key: string        // "2026-W36"
  label: string      // "5 Eyl"
  matchCount: number
}

export interface PlayerProgress {
  player: Player
  points: number[]   // her hafta sonundaki kümülatif lig puanı
  ranks: number[]    // her hafta sonundaki sıra (1 = lider)
  played: boolean[]  // o hafta maç oynadı mı
}

export interface SeasonProgress {
  weeks: SeasonWeek[]
  players: PlayerProgress[]
}

const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

// Gece yarısını geçen oturumlar bir önceki güne sayılsın diye 6 saat geri alınır:
// 05:00'te biten bir Cumartesi gecesi oturumu Pazar'a (ve bazen sonraki haftaya)
// kaymamalı.
function sessionDate(iso: string): Date {
  const d = new Date(iso)
  d.setHours(d.getHours() - 6)
  return d
}

function isoWeekKey(d: Date): string {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dayMonFirst = (t.getDay() + 6) % 7
  t.setDate(t.getDate() - dayMonFirst + 3)        // bu haftanın perşembesi
  const year = t.getFullYear()
  const jan4 = new Date(year, 0, 4)
  const week1Thursday = new Date(year, 0, 4 - ((jan4.getDay() + 6) % 7) + 3)
  const week = 1 + Math.round((t.getTime() - week1Thursday.getTime()) / (7 * 86400000))
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function calculateSeasonProgress(season: Season): SeasonProgress {
  const completed = season.matches.filter(m => m.completed)
  if (completed.length === 0) return { weeks: [], players: [] }

  // Maçları hafta anahtarına göre grupla, haftaları kronolojik sırala.
  const byWeek = new Map<string, { date: Date; matches: Match[] }>()
  for (const match of completed) {
    const d = sessionDate(match.createdAt)
    const key = isoWeekKey(d)
    const bucket = byWeek.get(key)
    if (bucket) {
      bucket.matches.push(match)
      if (d < bucket.date) bucket.date = d
    } else {
      byWeek.set(key, { date: d, matches: [match] })
    }
  }
  const ordered = [...byWeek.entries()].sort((a, b) => a[1].date.getTime() - b[1].date.getTime())

  const weeks: SeasonWeek[] = ordered.map(([key, b]) => ({
    key,
    label: `${b.date.getDate()} ${TR_MONTHS[b.date.getMonth()]}`,
    matchCount: b.matches.length,
  }))

  // Lig tablosuyla aynı sıralama ölçütleri: puan, sonra galibiyet, sonra ikincilik.
  const totals = new Map<string, { points: number; wins: number; seconds: number }>()
  for (const p of season.players) totals.set(p.id, { points: 0, wins: 0, seconds: 0 })

  const progress: PlayerProgress[] = season.players.map(player => ({
    player, points: [], ranks: [], played: [],
  }))

  for (const [, bucket] of ordered) {
    const playedThisWeek = new Set<string>()

    for (const match of bucket.matches) {
      for (const [playerId, pts] of getMatchLeaguePoints(match)) {
        const acc = totals.get(playerId)
        if (!acc) continue
        playedThisWeek.add(playerId)
        acc.points += pts
        if (pts === 3) acc.wins++
        if (pts === 1) acc.seconds++
      }
    }

    const standing = season.players
      .map(p => ({ id: p.id, ...totals.get(p.id)! }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.wins !== a.wins) return b.wins - a.wins
        return b.seconds - a.seconds
      })

    // Eşitlikte aynı sıra verilir (1, 2, 2, 4).
    const ranks = new Map<string, number>()
    standing.forEach((row, i) => {
      const prev = i > 0 ? standing[i - 1] : null
      const tied = prev && prev.points === row.points && prev.wins === row.wins && prev.seconds === row.seconds
      ranks.set(row.id, tied ? ranks.get(prev!.id)! : i + 1)
    })

    for (const p of progress) {
      p.points.push(totals.get(p.player.id)!.points)
      p.ranks.push(ranks.get(p.player.id)!)
      p.played.push(playedThisWeek.has(p.player.id))
    }
  }

  return { weeks, players: progress }
}
