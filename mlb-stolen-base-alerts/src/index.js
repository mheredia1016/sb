import cron from 'node-cron';
import { config } from './config.js';
import { getTodaysGames, isPregameGame, getTeamRosterCandidates, getPlayerSeasonStats, getPlayerRecentStats, formatDateCentral } from './mlbApi.js';
import { scorePlayer } from './scoring.js';
import { buildDiscordPayload, postToDiscord } from './discord.js';
import { getStolenBaseOddsByPlayer } from './odds.js';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runStolenBaseAlert() {
  const date = formatDateCentral();
  console.log(`[SB] Running stolen-base alert for ${date}`);

  const games = (await getTodaysGames(date)).filter(g => isPregameGame(g, config.gameStatusFilter));
  console.log(`[SB] Found ${games.length} pregame MLB games`);

  const plays = [];

  for (const game of games) {
    const teams = [
      { side: 'away', id: game.teams.away.team.id },
      { side: 'home', id: game.teams.home.team.id }
    ];

    for (const team of teams) {
      let candidates = [];
      try {
        candidates = await getTeamRosterCandidates(team.id);
      } catch (err) {
        console.warn(`[SB] Could not load roster for team ${team.id}: ${err.message}`);
        continue;
      }

      for (const player of candidates) {
        try {
          const [season, recent] = await Promise.all([
            getPlayerSeasonStats(player.id),
            getPlayerRecentStats(player.id)
          ]);
          const scored = scorePlayer({ player, season, recent, game, teamSide: team.side });
          if (scored.score >= config.minScore) plays.push(scored);
          await sleep(60);
        } catch (err) {
          console.warn(`[SB] Skipping ${player.name}: ${err.message}`);
        }
      }
    }
  }

  plays.sort((a, b) => b.score - a.score);
  const top = plays.slice(0, config.topPlays);
  const oddsMap = await getStolenBaseOddsByPlayer();
  const payload = buildDiscordPayload(top, oddsMap);
  await postToDiscord(payload);
  console.log(`[SB] Posted ${top.length} stolen-base plays`);
}

function startScheduler() {
  const minute = String(config.alertMinute);
  const hour = String(config.alertHour);
  const schedule = `${minute} ${hour} * * *`;

  console.log(`[SB] Scheduler active: ${schedule} ${config.timezone}`);
  cron.schedule(schedule, () => {
    runStolenBaseAlert().catch(err => console.error('[SB] Alert failed:', err));
  }, { timezone: config.timezone });
}

if (process.argv.includes('--test-score')) {
  console.log('Scoring test mode is included through npm run run:once using live MLB data.');
  process.exit(0);
}

if (config.runOnce || process.env.RUN_ONCE === 'true') {
  runStolenBaseAlert().catch(err => {
    console.error(err);
    process.exit(1);
  });
} else {
  startScheduler();
}
