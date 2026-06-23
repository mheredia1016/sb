function formatGameTime(value) {
  if (!value) return 'Time TBD';

  try {
    return new Date(value).toLocaleTimeString('en-US', {
      timeZone: process.env.TIMEZONE || 'America/Chicago',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch {
    return value;
  }
}

function fmt(value, digits = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(digits);
}

function playerLine(rank, p) {
  const spot = p.lineupSpot && p.lineupSpot !== 99 ? `#${p.lineupSpot} ` : '';

  return [
    `**${rank}. ${spot}${p.name}** — ${p.tier || '👀 Lean'} \`${fmt(p.score)}\``,
    `   SB ${p.seasonSB || 0} | Att Rate ${fmt(p.sbAttemptRate)}% | xwOBA ${fmt(p.xwOBA, 3)} | HH ${fmt(p.HH)}% | SwStr ${fmt(p.swStr)}%`,
    `   vs ${p.pitcher || 'TBD'}`
  ].join('\n');
}

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
        homePlayers: [],
        confirmed: player.lineupStatus === 'confirmed'
      });
    }

    const game = games.get(key);

    if (player.lineupStatus === 'confirmed') {
      game.confirmed = true;
    }

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
    lines.push(`**${game.awayTeam} @ ${game.homeTeam} — ${formatGameTime(game.gameTime)}**`);
    lines.push(game.confirmed ? 'Lineups confirmed ✅' : 'Projected lineup data ⚠️');
    lines.push('');

    lines.push(`__**${game.awayTeam} Top SB Targets**__`);
    lines.push(
      game.awayPlayers
        .sort((a, b) => b.score - a.score)
        .slice(0, Number(process.env.SB_TOP_PER_TEAM || 3))
        .map((p, i) => playerLine(i + 1, p))
        .join('\n') || 'No qualified SB targets.'
    );

    lines.push('');
    lines.push(`__**${game.homeTeam} Top SB Targets**__`);
    lines.push(
      game.homePlayers
        .sort((a, b) => b.score - a.score)
        .slice(0, Number(process.env.SB_TOP_PER_TEAM || 3))
        .map((p, i) => playerLine(i + 1, p))
        .join('\n') || 'No qualified SB targets.'
    );

    lines.push('');
    lines.push('────────────────────');
    lines.push('');
  }

  return lines.join('\n');
}
