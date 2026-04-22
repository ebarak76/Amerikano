export interface Player {
  id: string;
  name: string;
}

export interface GameScore {
  playerId: string;
  opened: boolean;
  remainingPoints: number;
  islerCount: number;
  totalPoints: number; // calculated: opened ? -50 + isler*25 : remaining + isler*25
}

export interface Game {
  id: string;
  gameTypeId: number;
  scores: GameScore[];
  completed: boolean;
}

export interface Match {
  id: string;
  playerIds: string[]; // exactly 4
  games: Game[];
  completed: boolean;
  createdAt: string;
}

export interface Season {
  id: string;
  name: string;
  players: Player[];
  matches: Match[];
  createdAt: string;
}

export interface LeagueRow {
  player: Player;
  matchesPlayed: number;
  wins: number;
  seconds: number;
  totalPoints: number;
}

export const GAME_TYPES: { id: number; name: string }[] = [
  { id: 1, name: "3'lü seri" },
  { id: 2, name: "3'lü küt" },
  { id: 3, name: "İki 3'lü küt" },
  { id: 4, name: "İki 3'lü seri" },
  { id: 5, name: "3'lü küt 3'lü seri" },
  { id: 6, name: "4'lü seri" },
  { id: 7, name: "4'lü küt" },
  { id: 8, name: "İki 4'lü seri" },
  { id: 9, name: "İki 4'lü küt" },
  { id: 10, name: "4'lü seri 4'lü küt" },
  { id: 11, name: "5'li seri" },
  { id: 12, name: "Elden" },
];
