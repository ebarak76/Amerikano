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

/** Bir maçta her oyuncunun kaç el açtığı. */
export function getMatchOpenings(match: Match): Map<string, number> {
  const openings = new Map<string, number>();
  for (const pid of match.playerIds) openings.set(pid, 0);
  for (const game of match.games) {
    if (!game.completed) continue;
    for (const score of game.scores) {
      if (!score.opened) continue;
      const current = openings.get(score.playerId);
      if (current !== undefined) openings.set(score.playerId, current + 1);
    }
  }
  return openings;
}

export function calculateLeagueTable(season: Season): LeagueRow[] {
  const rows: Map<string, LeagueRow> = new Map();

  for (const player of season.players) {
    rows.set(player.id, {
      player,
      matchesPlayed: 0,
      wins: 0,
      seconds: 0,
      openings: 0,
      totalPoints: 0,
    });
  }

  for (const match of season.matches) {
    if (!match.completed) continue;
    const leaguePoints = getMatchLeaguePoints(match);
    const matchOpenings = getMatchOpenings(match);

    for (const [playerId, points] of leaguePoints) {
      const row = rows.get(playerId);
      if (!row) continue;
      row.matchesPlayed++;
      row.totalPoints += points;
      row.openings += matchOpenings.get(playerId) ?? 0;
      if (points === 3) row.wins++;
      if (points === 1) row.seconds++;
    }
  }

  return [...rows.values()].sort(compareLeagueRows);
}

/**
 * Sezon sıralaması: puan, sonra EL AÇMA, sonra galibiyet, sonra ikincilik.
 * Şampiyonluk kuralıyla aynı ölçüt — tablonun 1.'si her zaman şampiyondur.
 */
export function compareLeagueRows(a: LeagueRow, b: LeagueRow): number {
  if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
  if (b.openings !== a.openings) return b.openings - a.openings;
  if (b.wins !== a.wins) return b.wins - a.wins;
  return b.seconds - a.seconds;
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
    for (const [playerId, count] of getMatchOpenings(match)) {
      const row = rows.get(playerId);
      if (row) row.openings += count;
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
  const totals = new Map<string, { points: number; openings: number; wins: number; seconds: number }>()
  for (const p of season.players) totals.set(p.id, { points: 0, openings: 0, wins: 0, seconds: 0 })

  const progress: PlayerProgress[] = season.players.map(player => ({
    player, points: [], ranks: [], played: [],
  }))

  for (const [, bucket] of ordered) {
    const playedThisWeek = new Set<string>()

    for (const match of bucket.matches) {
      const matchOpenings = getMatchOpenings(match)
      for (const [playerId, pts] of getMatchLeaguePoints(match)) {
        const acc = totals.get(playerId)
        if (!acc) continue
        playedThisWeek.add(playerId)
        acc.points += pts
        acc.openings += matchOpenings.get(playerId) ?? 0
        if (pts === 3) acc.wins++
        if (pts === 1) acc.seconds++
      }
    }

    const standing = season.players
      .map(p => ({ id: p.id, ...totals.get(p.id)! }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.openings !== a.openings) return b.openings - a.openings
        if (b.wins !== a.wins) return b.wins - a.wins
        return b.seconds - a.seconds
      })

    // Eşitlikte aynı sıra verilir (1, 2, 2, 4).
    const ranks = new Map<string, number>()
    standing.forEach((row, i) => {
      const prev = i > 0 ? standing[i - 1] : null
      const tied = prev && prev.points === row.points && prev.openings === row.openings
        && prev.wins === row.wins && prev.seconds === row.seconds
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

// ---------------------------------------------------------------------------
// Şampiyonluk: sezon 20 maçta biter, en çok puan alan şampiyon olur.
// Puan eşitliğinde en çok el açan şampiyondur. Her 3 şampiyonluk 1 yıldız.
// ---------------------------------------------------------------------------

export const SEASON_MATCH_TARGET = 20
export const TITLES_PER_STAR = 3

export interface SeasonChampion {
  player: Player
  totalPoints: number
  openings: number
  /** Puan eşitti, şampiyonluk el açma sayısıyla belirlendi */
  decidedByOpenings: boolean
  /** Puan, el açma, galibiyet ve ikincilik hepsi eşit — kural çözemiyor */
  unresolvedTie: boolean
}

export interface SeasonStatus {
  season: Season
  completedMatches: number
  target: number
  finished: boolean
  champion: SeasonChampion | null
  /** Sezon bittiyse en çok el açan */
  istakaKing: IstakaKing | null
  /** Sezon sürüyorsa mevcut lider */
  leader: LeagueRow | null
}

export function getCompletedMatchCount(season: Season): number {
  return season.matches.filter(m => m.completed).length
}

export function getSeasonChampion(season: Season): SeasonChampion | null {
  if (getCompletedMatchCount(season) < SEASON_MATCH_TARGET) return null

  const table = calculateLeagueTable(season)
  const first = table[0]
  if (!first) return null
  const second = table[1]

  const pointsTied = !!second && second.totalPoints === first.totalPoints
  return {
    player: first.player,
    totalPoints: first.totalPoints,
    openings: first.openings,
    decidedByOpenings: pointsTied && second.openings !== first.openings,
    unresolvedTie: pointsTied && compareLeagueRows(first, second) === 0,
  }
}

export function getSeasonStatus(season: Season): SeasonStatus {
  const completedMatches = getCompletedMatchCount(season)
  const finished = completedMatches >= SEASON_MATCH_TARGET
  const table = calculateLeagueTable(season)
  return {
    season,
    completedMatches,
    target: SEASON_MATCH_TARGET,
    finished,
    champion: getSeasonChampion(season),
    istakaKing: getSeasonIstakaKing(season),
    leader: finished ? null : (table[0] ?? null),
  }
}

export interface ChampionRow {
  /** Oyuncular sezonlar arasında ada göre eşleştirilir */
  name: string
  titles: number
  stars: number
  seasonNames: string[]
}

export function calculateChampionshipTable(seasons: Season[]): ChampionRow[] {
  const byName = new Map<string, ChampionRow>()

  for (const season of seasons) {
    const champion = getSeasonChampion(season)
    if (!champion) continue
    const name = champion.player.name.trim()
    let row = byName.get(name)
    if (!row) {
      row = { name, titles: 0, stars: 0, seasonNames: [] }
      byName.set(name, row)
    }
    row.titles++
    row.seasonNames.push(season.name)
  }

  for (const row of byName.values()) {
    row.stars = Math.floor(row.titles / TITLES_PER_STAR)
  }

  return [...byName.values()].sort(
    (a, b) => b.titles - a.titles || a.name.localeCompare(b.name, 'tr'),
  )
}

// ---------------------------------------------------------------------------
// İstatistikler: tek sezon veya sezonlar üstü
// Oyuncular sezonlar arasında isme göre eşleştirilir (şampiyonlukla aynı kural).
// ---------------------------------------------------------------------------

export interface StatPlayer {
  name: string
  matchesPlayed: number
  wins: number
  seconds: number
  openings: number
  leaguePoints: number
  /** Maç başına lig puanı — yüksek iyi */
  avgLeaguePoints: number
  /** Maçlardaki toplam skor (ıstaka/açma toplamı) */
  totalScore: number
  /** Maç başına skor — DÜŞÜK iyi */
  avgScore: number
  /** Maç başına el açma */
  avgOpenings: number
}

export interface MatchRecord {
  playerName: string
  score: number
  seasonName: string
  matchNumber: number
  createdAt: string
}

export interface Stats {
  players: StatPlayer[]
  seasonCount: number
  matchCount: number
  gameCount: number
  /** En düşük skorla kazanılan maç — en ezici galibiyet */
  lowestWinningScore: MatchRecord | null
  /** En yüksek skorla kazanılan maç — en zor/çekişmeli galibiyet */
  highestWinningScore: MatchRecord | null
  /** Sonuncu olunan en düşük skor — iyi oynayıp yine de 4. olmak */
  lowestLastPlaceScore: MatchRecord | null
  /** Sonuncu olunan en yüksek skor — en kötü maç */
  highestLastPlaceScore: MatchRecord | null
}

export function calculateStats(seasons: Season[]): Stats {
  const byName = new Map<string, StatPlayer>()
  let matchCount = 0
  let gameCount = 0
  let lowestWinningScore: MatchRecord | null = null
  let highestWinningScore: MatchRecord | null = null
  let lowestLastPlaceScore: MatchRecord | null = null
  let highestLastPlaceScore: MatchRecord | null = null

  for (const season of seasons) {
    const nameOf = new Map(season.players.map(p => [p.id, p.name.trim()]))

    season.matches.forEach((match, index) => {
      if (!match.completed) return
      matchCount++
      gameCount += match.games.filter(g => g.completed).length

      const totals = getMatchTotalScores(match)
      const leaguePoints = getMatchLeaguePoints(match)
      const openings = getMatchOpenings(match)

      // Sonuncu = maçtaki en yüksek toplam skor. Maçlar 4 kişilik olduğu için
      // bu 4.'lük demektir; skor eşitse sonuncluğu paylaşan herkes sayılır.
      const allScores = [...totals.values()]
      const worstScore = allScores.length > 0 ? Math.max(...allScores) : null

      for (const [playerId, points] of leaguePoints) {
        const name = nameOf.get(playerId)
        if (!name) continue

        let row = byName.get(name)
        if (!row) {
          row = {
            name, matchesPlayed: 0, wins: 0, seconds: 0, openings: 0,
            leaguePoints: 0, avgLeaguePoints: 0, totalScore: 0, avgScore: 0, avgOpenings: 0,
          }
          byName.set(name, row)
        }

        const score = totals.get(playerId) ?? 0
        row.matchesPlayed++
        row.leaguePoints += points
        row.openings += openings.get(playerId) ?? 0
        row.totalScore += score
        if (points === 3) row.wins++
        if (points === 1) row.seconds++

        const record: MatchRecord = {
          playerName: name,
          score,
          seasonName: season.name,
          matchNumber: index + 1,
          createdAt: match.createdAt,
        }

        // Galibiyet rekorları
        if (points === 3) {
          if (!lowestWinningScore || score < lowestWinningScore.score) lowestWinningScore = record
          if (!highestWinningScore || score > highestWinningScore.score) highestWinningScore = record
        }

        // Sonunculuk (4.) rekorları
        if (worstScore !== null && score === worstScore) {
          if (!lowestLastPlaceScore || score < lowestLastPlaceScore.score) lowestLastPlaceScore = record
          if (!highestLastPlaceScore || score > highestLastPlaceScore.score) highestLastPlaceScore = record
        }
      }
    })
  }

  const players = [...byName.values()]
  for (const row of players) {
    if (row.matchesPlayed > 0) {
      row.avgLeaguePoints = row.leaguePoints / row.matchesPlayed
      row.avgScore = row.totalScore / row.matchesPlayed
      row.avgOpenings = row.openings / row.matchesPlayed
    }
  }
  players.sort((a, b) => b.leaguePoints - a.leaguePoints || a.name.localeCompare(b.name, 'tr'))

  return {
    players,
    seasonCount: seasons.length,
    matchCount,
    gameCount,
    lowestWinningScore,
    highestWinningScore,
    lowestLastPlaceScore,
    highestLastPlaceScore,
  }
}

export interface IstakaKing {
  player: Player
  openings: number
  /** Birden fazla oyuncu aynı sayıda el açtı */
  shared: boolean
}

/** Sezon bitiminde en çok el açan "Istaka Kralı" ünvanını alır. */
export function getSeasonIstakaKing(season: Season): IstakaKing | null {
  if (getCompletedMatchCount(season) < SEASON_MATCH_TARGET) return null

  const table = calculateOpeningTable(season)
  const top = table[0]
  if (!top || top.openings === 0) return null

  const player = season.players.find(p => p.id === top.player.id)
  if (!player) return null

  return {
    player,
    openings: top.openings,
    shared: table.filter(r => r.openings === top.openings).length > 1,
  }
}
