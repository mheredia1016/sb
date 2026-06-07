function toNum(v, fallback = 0) {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function scorePlayer({ player, season, recent, game, teamSide }) {
  const sb = toNum(season.stolenBases);
  const cs = toNum(season.caughtStealing);
  const recentSb = toNum(recent.stolenBases);
  const obp = toNum(season.obp);
  const recentObp = toNum(recent.obp);
  const games = Math.max(1, toNum(season.gamesPlayed, 1));
  const pa = toNum(season.plateAppearances);
  const attempts = sb + cs;

  // Free proxy for opportunity and aggressiveness.
  const sbPerGame = sb / games;
  const attemptRate = pa > 0 ? attempts / pa : 0;

  let score = 0;
  const reasons = [];

  const seasonSbScore = clamp(sb * 2.6, 0, 30);
  score += seasonSbScore;
  if (sb >= 10) reasons.push(`${sb} SB this season`);

  const recentScore = clamp(recentSb * 8, 0, 28);
  score += recentScore;
  if (recentSb >= 2) reasons.push(`${recentSb} SB over last 14 games`);

  const obpScore = clamp((Math.max(obp, recentObp) - 0.280) * 120, 0, 18);
  score += obpScore;
  if (Math.max(obp, recentObp) >= 0.340) reasons.push(`Strong on-base profile (${Math.max(obp, recentObp).toFixed(3)} OBP)`);

  const attemptsScore = clamp(attemptRate * 350, 0, 16);
  score += attemptsScore;
  if (attemptRate >= 0.04) reasons.push(`Aggressive steal attempt rate`);

  const sbGameScore = clamp(sbPerGame * 45, 0, 12);
  score += sbGameScore;

  // Light matchup bump if probable pitcher exists. Future versions can add pitcher/catcher allowed data.
  const opponent = teamSide === 'away' ? game.teams.home : game.teams.away;
  const probablePitcher = opponent?.probablePitcher?.fullName;
  if (probablePitcher) {
    score += 3;
    reasons.push(`Probable pitcher: ${probablePitcher}`);
  }

  // Filter out bench/low PA players.
  if (pa < 40 && sb < 3) score -= 25;

  score = Math.round(clamp(score, 0, 100));

  return {
    playerId: player.id,
    playerName: player.name,
    position: player.position,
    teamName: teamSide === 'away' ? game.teams.away.team.name : game.teams.home.team.name,
    opponentName: opponent.team.name,
    gamePk: game.gamePk,
    gameTime: game.gameDate,
    score,
    seasonSb: sb,
    recentSb,
    obp: Math.max(obp, recentObp),
    reasons: reasons.slice(0, 4)
  };
}
