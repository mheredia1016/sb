import { boolEnv, getJson, number, seasonYear, todayCentralDate, sleep } from './utils.js';

const MLB = 'https://statsapi.mlb.com/api/v1';

function extractStat(statsResponse) {
  return statsResponse?.stats?.[0]?.splits?.[0]?.stat || {};
}

async function getSchedule(date) {
  const url = `${MLB}/schedule?sportId=1&date=${date}&hydrate=probablePitcher`;
  const data = await getJson(url, 'schedule');
  return data?.dates?.[0]?.games || [];
}

async function getRoster(teamId) {
  const data = await getJson(`${MLB}/teams/${teamId}/roster?rosterType=active`, `roster ${teamId}`);
  return (data.roster || []).map(r => ({
    id: r.person.id,
    name: r.person.fullName,
    position: r.position?.abbreviation || ''
  }));
}

async function getPlayerStats(playerId, season) {
  const seasonUrl = `${MLB}/people/${playerId}/stats?stats=season&group=hitting&season=${season}`;
  const recentUrl = `${MLB}/people/${playerId}/stats?stats=byDateRange&group=hitting&season=${season}&startDate=${recentStartDate()}&endDate=${todayCentralDate()}`;

  const [seasonStats, recentStats] = await Promise.allSettled([
    getJson(seasonUrl, `season stats ${playerId}`),
    getJson(recentUrl, `recent stats ${playerId}`)
  ]);

  return {
    season: seasonStats.status === 'fulfilled' ? extractStat(seasonStats.value) : {},
    recent: recentStats.status === 'fulfilled' ? extractStat(recentStats.value) : {}
  };
}

function recentStartDate() {
  const d = new Date(`${todayCentralDate()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 14);
  return d.toISOString().slice(0, 10);
}

function battingOrderFromBoxscore(boxscore, teamSide, playerId) {
  const side = boxscore?.teams?.[teamSide];
  const players = side?.players || {};
  for (const key of Object.keys(players)) {
    const p = players[key];
    if (p?.person?.id === playerId && p?.battingOrder) {
      return Math.ceil(Number(p.battingOrder) / 100);
    }
  }
  return null;
}

async function getBoxscore(gamePk) {
  try {
    return await getJson(`${MLB}/game/${gamePk}/boxscore`, `boxscore ${gamePk}`);
  } catch {
    return null;
  }
}

export async function getStolenBaseCandidates() {
  const date = todayCentralDate();
  const season = seasonYear();
  const games = await getSchedule(date);
  const minPA = Number(process.env.MIN_SEASON_PA || 25);
  const maxPerTeam = Number(process.env.MAX_PLAYERS_PER_TEAM || 8);
  const requireLineup = boolEnv('REQUIRE_PROBABLE_LINEUP', false);

  const candidates = [];
  const debug = boolEnv('DEBUG_SB', false);

  for (const game of games) {
    const gamePk = game.gamePk;
    const away = game.teams.away.team;
    const home = game.teams.home.team;
    const awayPitcher = game.teams.home.probablePitcher?.fullName || 'TBD';
    const homePitcher = game.teams.away.probablePitcher?.fullName || 'TBD';
    const box = await getBoxscore(gamePk);

    for (const side of [
      { team: away, opponent: home, teamSide: 'away', opponentPitcher: awayPitcher },
      { team: home, opponent: away, teamSide: 'home', opponentPitcher: homePitcher }
    ]) {
      let roster = [];
      try { roster = await getRoster(side.team.id); } catch (err) { console.warn(err.message); }

      const hitters = roster.filter(p => !['P', 'TWP'].includes(p.position));
      const teamCandidates = [];

      for (const player of hitters) {
        await sleep(35); // gentle throttle for MLB Stats API
        const stats = await getPlayerStats(player.id, season);
        const s = stats.season;
        const pa = number(s.plateAppearances);
        const sb = number(s.stolenBases);
        const cs = number(s.caughtStealing);
        const obp = number(s.obp);
        const recentSb = number(stats.recent.stolenBases);
        const recentPa = number(stats.recent.plateAppearances);
        const lineupSpot = battingOrderFromBoxscore(box, side.teamSide, player.id);

        if (requireLineup && !lineupSpot) continue;
        if (pa < minPA && sb === 0 && recentSb === 0) continue;
        if (sb === 0 && recentSb === 0 && obp < 0.330) continue;

        teamCandidates.push({
          id: player.id,
          name: player.name,
          team: side.team.abbreviation || side.team.name,
          teamName: side.team.name,
          opponent: side.opponent.abbreviation || side.opponent.name,
          opponentName: side.opponent.name,
          opponentPitcher: side.opponentPitcher,
          position: player.position,
          lineupSpot,
          seasonPa: pa,
          seasonSb: sb,
          seasonCs: cs,
          obp,
          recentSb,
          recentPa,
          sourceDate: date
        });
      }

      teamCandidates.sort((a, b) => {
        const aRate = a.seasonSb / Math.max(a.seasonPa, 1);
        const bRate = b.seasonSb / Math.max(b.seasonPa, 1);
        return (b.recentSb * 4 + b.seasonSb + bRate * 200) - (a.recentSb * 4 + a.seasonSb + aRate * 200);
      });

      candidates.push(...teamCandidates.slice(0, maxPerTeam));
      if (debug) console.log(`${side.team.name}: ${teamCandidates.length} candidates, kept ${Math.min(teamCandidates.length, maxPerTeam)}`);
    }
  }

  return candidates;
}
