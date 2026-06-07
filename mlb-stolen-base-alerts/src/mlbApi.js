const MLB_BASE = 'https://statsapi.mlb.com/api/v1';

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'mlb-stolen-base-alerts/1.0' } });
  if (!res.ok) {
    throw new Error(`MLB API error ${res.status}: ${url}`);
  }
  return res.json();
}

export function formatDateCentral(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const obj = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${obj.year}-${obj.month}-${obj.day}`;
}

export async function getTodaysGames(dateStr = formatDateCentral()) {
  const url = `${MLB_BASE}/schedule?sportId=1&date=${dateStr}&hydrate=probablePitcher,team,linescore`;
  const data = await getJson(url);
  return data.dates?.[0]?.games ?? [];
}

export function isPregameGame(game, filter = 'scheduled') {
  const state = game.status?.abstractGameState;
  const detailed = game.status?.detailedState ?? '';

  if (state === 'Preview') return true;
  if (filter === 'final') {
    return ['Pre-Game', 'Warmup', 'Scheduled'].some(s => detailed.includes(s));
  }
  return detailed === 'Scheduled' || detailed === 'Pre-Game' || state === 'Preview';
}

export async function getLikelyLineup(teamId) {
  // Free MLB API does not reliably publish confirmed lineups early.
  // Use active roster hitters as candidates and score by recent stats.
  const url = `${MLB_BASE}/teams/${teamId}/roster?rosterType=active`;
  const data = await getJson(url);
  return (data.roster ?? [])
    .filter(r => r.person?.id && r.position?.type !== 'Pitcher')
    .map(r => ({
      id: r.person.id,
      name: r.person.fullName,
      position: r.position?.abbreviation ?? ''
    }));
}

export async function getPlayerSeasonStats(playerId) {
  const url = `${MLB_BASE}/people/${playerId}/stats?stats=season&group=hitting&season=${new Date().getFullYear()}`;
  const data = await getJson(url);
  return data.stats?.[0]?.splits?.[0]?.stat ?? {};
}

export async function getPlayerRecentStats(playerId) {
  const url = `${MLB_BASE}/people/${playerId}/stats?stats=lastXGames&group=hitting&gameType=R&season=${new Date().getFullYear()}&limit=14`;
  const data = await getJson(url);
  return data.stats?.[0]?.splits?.[0]?.stat ?? {};
}

export async function getTeamRosterCandidates(teamId) {
  const players = await getLikelyLineup(teamId);
  // Limit candidates to avoid API overload. Fast/base-stealing threats usually have season SB in stats.
  return players.slice(0, 18);
}
