import { todayCentralDate } from './utils.js';

export function buildReport(players, eliteScore = 80, options = {}) {
  const date = todayCentralDate();
  if (!players.length) {
    return `No stolen-base targets cleared the current threshold today (${date}). Try lowering MIN_SB_SCORE or set DEBUG_SB=true to inspect candidates.`;
  }

  const lines = [];
  lines.push(`🦶 **MLB Stolen Base Pregame Report — ${date}**`);
  lines.push(`Qualified plays: **${players.length}**`);
  lines.push(`Threshold: **${options.minScore ?? process.env.MIN_SB_SCORE ?? 55}+**`);
  lines.push('');

  players.forEach((p, i) => {
    const tier = p.score >= Number(eliteScore) ? '🔥 ELITE' : p.score >= 70 ? '✅ Strong' : '👀 Lean';
    const lineup = p.lineupSpot ? `Batting: ${p.lineupSpot}` : 'Lineup: not posted yet';
    const reasonText = p.reasons?.length ? p.reasons.slice(0, 5).join(' • ') : 'Speed/OBP/SB profile fit';

    lines.push(`**${i + 1}. ${p.name} — ${p.team} vs ${p.opponent}**`);
    lines.push(`${tier} | Score: **${p.score}** | ${lineup}`);
    lines.push(`SB: ${p.seasonSb} | CS: ${p.seasonCs} | Last 14d SB: ${p.recentSb} | OBP: ${Number(p.obp || 0).toFixed(3)}`);
    lines.push(`Reasons: ${reasonText}`);
    lines.push('');
  });

  lines.push('_V2 note: candidates are rebuilt from today’s MLB schedule/active teams every run, so it should not recycle the same static player pool daily._');
  return lines.join('\n');
}

export function buildDebugReport({ candidates, ranked }) {
  const teams = {};
  for (const p of candidates) teams[p.team] = (teams[p.team] || 0) + 1;
  const teamLines = Object.entries(teams).sort().map(([team, count]) => `${team}: ${count}`).join('\n');
  return `**SB Debug**\nCandidates loaded: ${candidates.length}\nQualified: ${ranked.length}\n\nBy team:\n${teamLines || 'none'}`;
}
