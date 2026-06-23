export function buildReport(players) {
  if (!players.length) {
    return 'No stolen base targets qualified today.';
  }

  const games = new Map();

  for (const player of players) {
    const key = player.gamePk || `${player.awayTeam}-${player.homeTeam}`;

    if (!games.has(key)) {
      games.set(key, {
        awayTeam: player.awayTeam,
        homeTeam: player.homeTeam,
        gameTime: player.gameTime || '',
        awayPlayers: [],
        homePlayers: []
      });
    }

    const game = games.get(key);

    if (player.team === player.awayTeam) {
      game.awayPlayers.push(player);
    } else {
      game.homePlayers.push(player);
    }
  }

  const lines = [];

  lines.push('🏃 **Official Stolen Base Targets**');
  lines.push('');

  for (const game of games.values()) {
    lines.push(
      `**${game.awayTeam} @ ${game.homeTeam}**${game.gameTime ? ` — ${game.gameTime}` : ''}`
    );
    lines.push('Lineups confirmed ✅');
    lines.push('');

    lines.push(`**${game.awayTeam} Top SB Targets**`);

    game.awayPlayers
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .forEach((p, i) => {
        lines.push(
          `${i + 1}. ${p.name}`
        );
        lines.push(
          `🏃 ${p.tier} ${p.score}`
        );
      });

    lines.push('');

    lines.push(`**${game.homeTeam} Top SB Targets**`);

    game.homePlayers
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .forEach((p, i) => {
        lines.push(
          `${i + 1}. ${p.name}`
        );
        lines.push(
          `🏃 ${p.tier} ${p.score}`
        );
      });

    lines.push('');
    lines.push('────────────────────');
    lines.push('');
  }

  return lines.join('\n');
}
