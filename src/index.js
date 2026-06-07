const cron = require('node-cron');
const config = require('./config');
const {
  todayCentralDate,
  getSchedule,
  getTeamRoster,
  getPlayerSeasonStats,
  getPlayerGameLog
} = require('./mlbApi');
const { scoreCandidate } = require('./scoring');
const { buildMessage, postToDiscord } = require('./discord');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isPositionPlayer(rosterItem) {
  const type = rosterItem.position?.type || '';
  const code = rosterItem.position?.code || '';
  return type !== 'Pitcher' && code !== '1';
}

async function scoreRosterForGame(game, teamSide) {
  const team = teamSide === 'away' ? game.teams.away.team : game.teams.home.team;
  const roster = await getTeamRoster(team.id);
  const candidates = [];

  for (const player of roster.filter(isPositionPlayer)) {
    try {
      const stats = await getPlayerSeasonStats(player.person.id);
      if (!stats) continue;

      const sb = Number(stats.stolenBases || 0);
      const cs = Number(stats.caughtStealing || 0);
      if (sb + cs === 0) continue;

      const recentGames = await getPlayerGameLog(player.person.id);
      const scored = scoreCandidate({ player, stats, recentGames, game, teamSide });
      candidates.push(scored);

      // Be gentle with free API.
      await sleep(120);
    } catch (err) {
      console.warn(`Skipping ${player.person.fullName}: ${err.message}`);
    }
  }

  return candidates;
}

async function runStolenBaseReport() {
  const date = todayCentralDate();
  console.log(`[SB] Building report for ${date}`);

  const games = await getSchedule(date);
  if (!games.length) {
    const payload = { content: `🦶 **MLB Stolen Base Targets — ${date}**\n\nNo MLB games found today.` };
    await postToDiscord(config.webhookUrl, payload, config.dryRun);
    return;
  }

  let allCandidates = [];
  for (const game of games) {
    const status = game.status?.abstractGameState || '';
    if (status === 'Final') continue;

    console.log(`[SB] Scoring ${game.teams.away.team.name} @ ${game.teams.home.team.name}`);
    const away = await scoreRosterForGame(game, 'away');
    const home = await scoreRosterForGame(game, 'home');
    allCandidates = allCandidates.concat(away, home);
  }

  const filtered = allCandidates
    .filter(c => c.score >= config.minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, config.topPlays);

  if (!filtered.length && !config.postWhenNoPlays) {
    console.log('[SB] No plays cleared threshold; not posting.');
    return;
  }

  const payload = buildMessage(filtered, config, date);
  await postToDiscord(config.webhookUrl, payload, config.dryRun);
  console.log(`[SB] Posted ${filtered.length} plays.`);
}

async function main() {
  if (config.once) {
    await runStolenBaseReport();
    return;
  }

  const cronExpression = `${config.alertMinute} ${config.alertHour} * * *`;
  console.log(`[SB] Scheduler started: ${cronExpression} ${config.timezone}`);

  cron.schedule(cronExpression, () => {
    runStolenBaseReport().catch(err => {
      console.error('[SB] Report failed:', err);
    });
  }, { timezone: config.timezone });
}

main().catch(err => {
  console.error('[SB] Fatal error:', err);
  process.exit(1);
});
