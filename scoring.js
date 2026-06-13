export function scorePlayer(player) {
  let score = 0;
  const reasons = [];

  if (player.seasonSB >= 15) { score += 20; reasons.push(`${player.seasonSB} season SB`); }
  else if (player.seasonSB >= 8) { score += 14; reasons.push(`${player.seasonSB} season SB`); }
  else if (player.seasonSB >= 4) { score += 8; reasons.push(`${player.seasonSB} season SB`); }

  if (player.last14SB >= 4) { score += 18; reasons.push(`${player.last14SB} SB last 14 days`); }
  else if (player.last14SB >= 2) { score += 12; reasons.push(`${player.last14SB} SB last 14 days`); }

  if (player.sprintPercentile >= 95) { score += 18; reasons.push(`${player.sprintPercentile}th percentile sprint speed`); }
  else if (player.sprintPercentile >= 85) { score += 12; reasons.push(`${player.sprintPercentile}th percentile sprint speed`); }

  if (player.obp >= .360) { score += 12; reasons.push(`OBP ${player.obp.toFixed(3)}`); }
  else if (player.obp >= .330) { score += 8; reasons.push(`OBP ${player.obp.toFixed(3)}`); }

  if (player.lineupSpot > 0 && player.lineupSpot <= 3) { score += 10; reasons.push(`top-${player.lineupSpot} lineup spot`); }
  else if (player.lineupSpot > 0 && player.lineupSpot <= 5) { score += 6; reasons.push(`lineup spot ${player.lineupSpot}`); }

  if (player.pitcherSBAAllowed >= 15) { score += 12; reasons.push(`pitcher allows steals`); }
  else if (player.pitcherSBAAllowed >= 8) { score += 8; reasons.push(`pitcher allows some steals`); }

  if (player.catcherCSRate <= .18) { score += 15; reasons.push(`catcher low CS%`); }
  else if (player.catcherCSRate <= .24) { score += 9; reasons.push(`catcher below-average CS%`); }

  return {
    ...player,
    score: Math.min(100, Math.round(score)),
    reasons
  };
}

function parseLimit(limitValue) {
  const raw = String(limitValue ?? 'ALL').trim().toUpperCase();

  // Use ALL/0/blank to post every qualified player.
  if (!raw || raw === 'ALL' || raw === 'NONE' || raw === '0') return null;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function rankPlayers(players, minScore = 70, limit = 'ALL') {
  const ranked = players
    .map(scorePlayer)
    .filter((p) => p.score >= Number(minScore))
    .sort((a, b) => b.score - a.score);

  const parsedLimit = parseLimit(limit);
  return parsedLimit ? ranked.slice(0, parsedLimit) : ranked;
}
