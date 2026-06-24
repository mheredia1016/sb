function getTier(score) {
  if (score >= 75) return '🔥 Best';
  if (score >= 62) return '🏃 Strong';
  if (score >= 50) return '🎯 Live';
  return '👀 Lean';
}

function parseLimit(limitValue) {
  const raw = String(limitValue ?? 'ALL').trim().toUpperCase();
  if (!raw || raw === 'ALL' || raw === 'NONE' || raw === '0') return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function rankPlayers(players, minScore = 25, limit = 'ALL') {
  const ranked = players
    .map((p) => {
      const score = Number(p.score || p.kSB || 0);

      return {
        ...p,
        score,
        tier: p.tier || p.sbTier || getTier(score)
      };
    })
    .filter((p) => p.score >= Number(minScore))
    .sort((a, b) => {
      if (a.gamePk !== b.gamePk) return String(a.gamePk).localeCompare(String(b.gamePk));
      if (a.team !== b.team) return String(a.team).localeCompare(String(b.team));
      return b.score - a.score;
    });

  const topPerTeam = Number(process.env.SB_TOP_PER_TEAM || 3);
  const grouped = new Map();

  for (const player of ranked) {
    const key = `${player.gamePk}-${player.team}`;

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
