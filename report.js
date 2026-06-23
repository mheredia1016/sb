export function buildReport(players) {
  if (!players.length) {
    return 'No stolen-base targets qualified today.';
  }

  const lines = [];

  lines.push('🏃 Official Stolen Base Targets');
  lines.push('');

  const games = {};

  for (const player of players) {
    const gameKey = `${player.awayTeam} @ ${player.homeTeam}`;

    if (!games[gameKey]) {
      games[gameKey] = {
        gameTime: player.gameTime,
        awayTeam: player.awayTeam,
        homeTeam: player.homeTeam,
        awayPlayers: [],
        homePlayers: []
      };
    }

    if (player.team === player.awayTeam) {
      games[gameKey].awayPlayers.push(player);
    } else {
      games[gameKey].homePlayers.push(player);
    }
  }

  for (const game of Object.values(games)) {
    lines.push(
      `${game.awayTeam} @ ${game.homeTeam} — ${game.gameTime}`
    );
    lines.push('Lineups confirmed ✅');
    lines.push('');

    lines.push(`${game.awayTeam} Top SB Targets`);

    game.awayPlayers
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .forEach((p, i) => {
        lines.push(
          `${i + 1}. #${p.lineupSpot} ${p.name}`
        );
        lines.push(
          `— 🏃 ${p.tier} ${p.score}`
        );
        lines.push(
          `Sprint ${p.sprintPercentile}% | OBP ${p.obp.toFixed(3)} | SB ${p.seasonSB}`
        );
        lines.push(
          `vs ${p.pitcherName}: SB Allowed ${p.pitcherSBAAllowed}`
        );
      });

    lines.push('');

    lines.push(`${game.homeTeam} Top SB Targets`);

    game.homePlayers
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .forEach((p, i) => {
        lines.push(
          `${i + 1}. #${p.lineupSpot} ${p.name}`
        );
        lines.push(
          `— 🏃 ${p.tier} ${p.score}`
        );
        lines.push(
          `Sprint ${p.sprintPercentile}% | OBP ${p.obp.toFixed(3)} | SB ${p.seasonSB}`
        );
        lines.push(
          `vs ${p.pitcherName}: SB Allowed ${p.pitcherSBAAllowed}`
        );
      });

    lines.push('');
    lines.push('────────────────');
    lines.push('');
  }

  return lines.join('\n');
}
