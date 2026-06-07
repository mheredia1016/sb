const axios = require('axios');

const BASE = 'https://statsapi.mlb.com/api/v1';

function todayCentralDate() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

async function getSchedule(date = todayCentralDate()) {
  const url = `${BASE}/schedule`;
  const { data } = await axios.get(url, {
    params: {
      sportId: 1,
      date,
      hydrate: 'probablePitcher,team,linescore'
    },
    timeout: 20000
  });

  const games = [];
  for (const day of data.dates || []) {
    for (const game of day.games || []) {
      games.push(game);
    }
  }
  return games;
}

async function getTeamRoster(teamId) {
  const { data } = await axios.get(`${BASE}/teams/${teamId}/roster`, {
    params: { rosterType: 'active' },
    timeout: 20000
  });
  return data.roster || [];
}

async function getPlayerSeasonStats(playerId) {
  const { data } = await axios.get(`${BASE}/people/${playerId}/stats`, {
    params: {
      stats: 'season',
      group: 'hitting',
      sportIds: 1
    },
    timeout: 20000
  });
  const splits = data.stats?.[0]?.splits || [];
  return splits[0]?.stat || null;
}

async function getPlayerGameLog(playerId) {
  const { data } = await axios.get(`${BASE}/people/${playerId}/stats`, {
    params: {
      stats: 'gameLog',
      group: 'hitting',
      sportIds: 1
    },
    timeout: 20000
  });
  return data.stats?.[0]?.splits || [];
}

async function getGameBoxscore(gamePk) {
  const { data } = await axios.get(`${BASE}/game/${gamePk}/boxscore`, { timeout: 20000 });
  return data;
}

module.exports = {
  todayCentralDate,
  getSchedule,
  getTeamRoster,
  getPlayerSeasonStats,
  getPlayerGameLog,
  getGameBoxscore
};
