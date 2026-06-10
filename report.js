export function buildReport(players, eliteScore = 90) {
  if (!players.length) {
    return 'No stolen-base targets cleared the minimum score today.';
  }

  const lines = [];
  lines.push('🦶 **Pregame Stolen Base Targets**');
  lines.push(`Generated: ${new Date().toLocaleString('en-US', { timeZone: process.env.TIMEZONE || 'America/Chicago' })}`);

  players.forEach((p, index) => {
    const badge = p.score >= Number(eliteScore) ? '🔥 ELITE' : '✅ Target';
    lines.push([
      `**${index + 1}. ${p.name} — ${p.team} vs ${p.opponent}**`,
      `${badge} | SB Score: **${p.score}**${p.odds ? ` | Odds: **${p.odds}**` : ''}`,
      `Reasons: ${p.reasons.slice(0, 4).join(' • ')}`
    ].join('\n'));
  });

  return lines.join('\n\n');
}
