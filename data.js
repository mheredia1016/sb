const API_BASE =
  process.env.HR_API_BASE ||
  'https://hr-api-production-fed2.up.railway.app';

function getTier(score) {
  if (score >= 75) return '🔥 Best';
  if (score >= 62) return '🏃 Strong';
  if (score >= 50) return '🎯 Live';
  return '👀 Lean';
}

function calculateFallbackScore(hitter) {
  const sb = Number(hitter.SB || 0);
  const xwOBA = Number(hitter.xwOBA || 0.315);
  const hh = Number(hitter.HH || 0);
  const swStr = Number(hitter.swStr || 10);
  const lineupSpot = Number(hitter.lineupSpot || 99);

  let lineupBonus = 0;
  if (lineupSpot <= 2) lineupBonus = 14;
  else if (lineupSpot <= 5) lineupBonus = 8;

  return Math.round(
    20 +
    sb * 2.2 +
    xwOBA * 55 +
    hh * 0.25 -
    swStr * 0.8 +
    lineupBonus
  );
}

export async function getStolenBaseCandidates() {
  const gamesRes = await fetch(`${API_BASE}/api/games`);

  if (!gamesRes.ok) {
    throw new Error(`Failed loading games: ${gamesRes.status}`);
  }

  const gamesData = await gamesRes.json();
  const candidates = [];

  for (const game of gamesData.games || []) {
    try {
      const gamePk = game.gamePk;
      const res = await fetch(`${API_BASE}/api/game/${gamePk}`);

      if (!res.ok) continue;

      const gameData = await res.json();
      const hitters = gameData.hitters || [];

      for (const hitter of hitters) {
        const score = Number(hitter.kSB) || calculateFallbackScore(hitter);

        if (score < Number(process.env.MIN_SB_SCORE || 25)) continue;

        candidates.push({
          gamePk,
          name: hitter.name,
          team: hitter.team,

          awayTeam: game.away?.abbreviation || game.away?.name,
          homeTeam: game.home?.abbreviation || game.home?.name,
          gameTime: game.gameDate,

          lineupSpot: hitter.lineupSpot || 99,
          score,
          tier: hitter.sbTier || getTier(score),

          seasonSB: hitter.SB || 0,
          caughtStealing: hitter.CS || 0,
          sbAttemptRate: hitter.sbAttemptRate || 0,

          xwOBA: hitter.xwOBA || 0,
          xwOBAcon: hitter.xwOBAcon || 0,
          HH: hitter.HH || 0,
          swStr: hitter.swStr || 0,

          pitcher: hitter.pitcher || 'TBD',
          lineupStatus: hitter.lineupStatus || 'projected'
        });
      }
    } catch (err) {
      console.error(`Failed game ${game.gamePk}`, err.message);
    }
  }

  return candidates;
}
