import { number } from './utils.js';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function scorePlayer(p) {
  const pa = Math.max(number(p.seasonPa), 1);
  const sb = number(p.seasonSb);
  const cs = number(p.seasonCs);
  const recentSb = number(p.recentSb);
  const obp = number(p.obp);
  const lineup = number(p.lineupSpot, 0);

  const attemptRate = (sb + cs) / pa;
  const successRate = sb / Math.max(sb + cs, 1);

  let score = 0;
  score += clamp(sb * 2.8, 0, 35);
  score += clamp(recentSb * 10, 0, 30);
  score += clamp(attemptRate * 700, 0, 20);
  score += clamp((obp - 0.280) * 100, 0, 12);
  score += clamp((successRate - 0.60) * 20, 0, 8);

  if (lineup >= 1 && lineup <= 2) score += 10;
  else if (lineup >= 3 && lineup <= 5) score += 6;
  else if (lineup >= 6 && lineup <= 9) score += 2;
  else score += 3; // lineup unknown, do not kill early morning reports

  if (p.opponentPitcher && p.opponentPitcher !== 'TBD') score += 2;

  const reasons = [];
  if (sb >= 15) reasons.push(`${sb} season SB`);
  else if (sb >= 7) reasons.push(`${sb} season SB`);
  if (recentSb > 0) reasons.push(`${recentSb} SB last 14 days`);
  if (obp >= 0.350) reasons.push(`${obp.toFixed(3)} OBP`);
  if (lineup) reasons.push(`projected/listed batting ${lineup}`);
  if (successRate >= 0.75 && sb + cs >= 4) reasons.push(`${Math.round(successRate * 100)}% SB success`);
  if (p.opponentPitcher && p.opponentPitcher !== 'TBD') reasons.push(`vs ${p.opponentPitcher}`);

  return {
    ...p,
    score: Math.round(score),
    attemptRate,
    successRate,
    reasons
  };
}

export function rankPlayers(candidates, minScore = 55, limit = 'ALL') {
  const scored = candidates
    .map(scorePlayer)
    .filter(p => p.score >= Number(minScore || 55))
    .sort((a, b) => b.score - a.score || b.recentSb - a.recentSb || b.seasonSb - a.seasonSb);

  if (String(limit).toUpperCase() === 'ALL') return scored;
  const n = Number(limit || 10);
  return scored.slice(0, Number.isFinite(n) ? n : 10);
}
