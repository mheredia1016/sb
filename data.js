const API_BASE =
  process.env.HR_API_BASE ||
  'https://hr-api-production-fed2.up.railway.app';

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

      const res = await fetch(
        `${API_BASE}/api/game/${gamePk}`
      );

      if (!res.ok) continue;

      const gameData = await res.json();

      const hitters = gameData.hitters || [];

      for (const hitter of hitters) {
        if (!hitter.kSB) continue;

        candidates.push({
          gamePk,

          name: hitter.name,
          team: hitter.team,

          awayTeam:
            game.away?.abbreviation ||
            game.away?.name,

          homeTeam:
            game.home?.abbreviation ||
            game.home?.name,

          gameTime: game.gameDate,

          lineupSpot:
            hitter.lineupSpot || 99,

          score: hitter.kSB,

          tier: hitter.sbTier,

          seasonSB: hitter.SB || 0,

          caughtStealing:
            hitter.CS || 0,

          sbAttemptRate:
            hitter.sbAttemptRate || 0,

          xwOBA:
            hitter.xwOBA || 0,

          xwOBAcon:
            hitter.xwOBAcon || 0,

          HH:
            hitter.HH || 0,

          swStr:
            hitter.swStr || 0,

          pitcher:
            hitter.pitcher || 'TBD',

          lineupStatus:
            hitter.lineupStatus || 'projected'
        });
      }
    } catch (err) {
      console.error(
        `Failed game ${game.gamePk}`,
        err.message
      );
    }
  }

  return candidates;
}
