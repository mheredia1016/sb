function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getTier(score) {
  if (score >= 75) return 'Elite';
  if (score >= 60) return 'Strong';
  if (score >= 45) return 'Live';
  return 'Lean';
}

export function scorePlayer(player) {
  let score = 0;
  const reasons = [];

  const seasonSB = num(player.seasonSB);
  const last14SB = num(player.last14SB);
  const sprintPercentile = num(player.sprintPercentile);
  const obp = num(player.obp);
  const lineupSpot = num(player.lineupSpot);
  const pitcherSBAAllowed = num(player.pitcherSBAAllowed);
  const catcherCSRate = num(player.catcherCSRate, 0.25);

  if (seasonSB >= 25) {
    score += 24;
    reasons.push(`${seasonSB} season SB`);
  } else if (seasonSB >= 15) {
    score += 20;
    reasons.push(`${seasonSB} season SB`);
  } else if (seasonSB >= 8) {
    score += 14;
    reasons.push(`${seasonSB} season SB`);
  } else if (seasonSB >= 4) {
    score += 8;
    reasons.push(`${seasonSB} season SB`);
  }

  if (last14SB >= 5) {
    score += 18;
    reasons.push(`${last14SB} SB last 14 days`);
  } else if (last14SB >= 3) {
    score += 14;
    reasons.push(`${last14SB} SB last 14 days`);
  } else if (last14SB >= 1) {
    score += 8;
    reasons.push(`${last14SB} SB last 14 days`);
  }

  if (sprintPercentile >= 95) {
    score += 20;
    reasons.push(`${sprintPercentile}th percentile sprint`);
  } else if (sprintPercentile >= 85) {
    score += 15;
    reasons.push(`${sprintPercentile}th percentile sprint`);
  } else if (sprintPercentile >= 70) {
    score += 9;
    reasons.push(`${sprintPercentile}th percentile sprint`);
  }

  if (obp >= 0.370) {
    score += 14;
    reasons.push(`OBP ${obp.toFixed(3)}`);
  } else if (obp >= 0.340) {
    score += 10;
    reasons.push(`OBP ${obp.toFixed(3)}`);
  } else if (obp >= 0.310) {
    score += 6;
    reasons.push(`OBP ${obp.toFixed(3)}`);
  }

  if (lineupSpot > 0 && lineupSpot <= 2) {
    score += 10;
    reasons.push(`top-${lineupSpot} lineup spot`);
  } else if (lineupSpot > 0 && lineupSpot <= 5) {
    score += 6;
    reasons.push(`lineup spot ${lineupSpot}`);
  }

  if (pitcherSBAAllowed >= 18) {
    score += 14;
    reasons.push(`${pitcherSBAAllowed} SB allowed by pitcher`);
  } else if (pitcherSBAAllowed >= 10) {
    score += 10;
    reasons.push(`${pitcherSBAAllowed} SB allowed by pitcher`);
  } else if (pitcherSBAAllowed >= 5) {
    score += 6;
    reasons.push(`${pitcherSBAAllowed} SB allowed by pitcher`);
  }

  if (catcherCSRate <= 0.16) {
    score += 14;
    reasons.push(`catcher CS% ${(catcherCSRate * 100).toFixed(1)}%`);
  } else if (catcherCSRate <= 0.22) {
    score += 9;
    reasons.push(`catcher CS% ${(catcherCSRate * 100).toFixed(1)}%`);
  } else if (catcherCSRate <= 0.28) {
    score += 5;
    reasons.push(`catcher CS% ${(catcherCSRate * 100).toFixed(1)}%`);
  }

  const finalScore = Math.min(100, Math.round(score));

  return {
    ...player,
    score: finalScore,
    tier: getTier(finalScore),
    reasons
  };
}

function parseLimit(limitValue) {
  const raw = String(limitValue ?? 'ALL').trim().toUpperCase();

  if (!raw || raw === 'ALL' || raw === 'NONE' || raw === '0') return null;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return parsed;
}

export function rankPlayers(players, minScore = 45, limit = 'ALL') {
  const ranked = players
    .map(scorePlayer)
    .filter((p) => p.score >= Number(minScore))
    .sort((a, b) => {
      if (a.gamePk !== b.gamePk) return String(a.gamePk).localeCompare(String(b.gamePk));
      if (a.team !== b.team) return String(a.team).localeCompare(String(b.team));
      return b.score - a.score;
    });

  const topPerTeam = Number(process.env.SB_TOP_PER_TEAM || 3);

  const grouped = new Map();

  for (const player of ranked) {
    const key = `${player.gamePk || player.awayTeam + player.homeTeam}-${player.team}`;

    if (!grouped.has(key)) grouped.set(key, []);

    const list = grouped.get(key);

    if (list.length < topPerTeam) {
      list.push(player);
    }
  }

  const topPlayers = Array.from(grouped.values()).flat();

  const parsedLimit = parseLimit(limit);
  return parsedLimit ? topPlayers.slice(0, parsedLimit) : topPlayers;
}
