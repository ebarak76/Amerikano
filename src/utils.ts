import type { Match, Season, LeagueRow, GameScore } from './types';

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
