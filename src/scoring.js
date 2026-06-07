function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function scoreCandidate({ player, stats, recentGames, game, teamSide }) {
  const sb = num(stats?.stolenBases);
  const cs = num(stats?.caughtStealing);
  const games = Math.max(1, num(stats?.gamesPlayed, 1));
  const obp = num(stats?.obp);
  const hits = num(stats?.hits);
  const walks = num(stats?.baseOnBalls);
  const hbp = num(stats?.hitByPitch);
  const plateAppearances = Math.max(1, num(stats?.plateAppearances, 1));
  const timesOnBaseProxy = hits + walks + hbp;
  const obpProxy = obp || timesOnBaseProxy / plateAppearances;

  const recent = (recentGames || []).slice(0, 14);
  const recentSb = recent.reduce((sum, g) => sum + num(g.stat?.stolenBases), 0);
  const recentCs = recent.reduce((sum, g) => sum + num(g.stat?.caughtStealing), 0);

  const attempts = sb + cs;
  const recentAttempts = recentSb + recentCs;
  const sbPerGame = sb / games;
  const attemptRate = attempts / games;
  const successRate = attempts > 0 ? sb / attempts : 0;
  const recentSbBoost = recentSb >= 3 ? 12 : recentSb === 2 ? 8 : recentSb === 1 ? 4 : 0;
  const recentAttemptBoost = recentAttempts >= 4 ? 8 : recentAttempts >= 2 ? 4 : 0;

  let score = 0;
  score += clamp(sb * 1.45, 0, 32);
  score += clamp(sbPerGame * 85, 0, 18);
  score += clamp(attemptRate * 70, 0, 16);
  score += successRate >= 0.82 ? 8 : successRate >= 0.72 ? 5 : successRate >= 0.62 ? 2 : -5;
  score += clamp(obpProxy * 25, 0, 10);
  score += recentSbBoost + recentAttemptBoost;

  // Basic playing-time and lineup-quality proxies.
  if (games >= 40) score += 4;
  if (plateAppearances / games >= 3.4) score += 5;

  // Opponent probable pitcher exists. Without detailed pitch/catcher metrics, only mark context.
  const opponent = teamSide === 'away' ? game.teams.home : game.teams.away;
  const probablePitcher = opponent?.probablePitcher?.fullName || 'TBD';
  if (probablePitcher !== 'TBD') score += 2;

  const reasons = [];
  reasons.push(`${sb} SB this season`);
  if (recentSb > 0) reasons.push(`${recentSb} SB last 14 games`);
  if (attempts > 0) reasons.push(`${Math.round(successRate * 100)}% SB success rate`);
  if (obpProxy > 0) reasons.push(`${obpProxy.toFixed(3)} OBP / on-base proxy`);
  if (probablePitcher !== 'TBD') reasons.push(`Facing probable pitcher ${probablePitcher}`);

  return {
    playerId: player.person.id,
    playerName: player.person.fullName,
    teamName: teamSide === 'away' ? game.teams.away.team.name : game.teams.home.team.name,
    opponentName: opponent.team.name,
    gamePk: game.gamePk,
    gameTime: game.gameDate,
    probablePitcher,
    score: Math.round(score),
    sb,
    cs,
    recentSb,
    attempts,
    successRate,
    obpProxy,
    reasons
  };
}

module.exports = { scoreCandidate };
