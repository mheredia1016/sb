import 'dotenv/config';
import cron from 'node-cron';
import { getStolenBaseCandidates } from './data.js';
import { rankPlayers } from './scoring.js';
import { buildReport } from './report.js';
import { postDiscordReport } from './discord.js';

async function runStolenBaseAlert() {
  const candidates = await getStolenBaseCandidates();

  const ranked = rankPlayers(
    candidates,
    process.env.MIN_SB_SCORE || 25,
    process.env.TOP_SB_PLAYS || 'ALL'
  );

  console.log(`SB candidates loaded: ${candidates.length}`);
  console.log(`SB qualified after score filter: ${ranked.length}`);

  const report = buildReport(ranked, process.env.ELITE_SB_SCORE || 90);

  const result = await postDiscordReport({
    webhookUrl: process.env.SB_WEBHOOK_URL,
    title: 'MLB Stolen Base Pregame Report',
    text: report,
    maxChars: process.env.MAX_DISCORD_CHARS || 1750,
    delayMs: process.env.POST_DELAY_MS || 900
  });

  console.log(`Posted stolen-base report in ${result.chunks} Discord message(s).`);
}

const isTest = process.argv.includes('--test');

if (isTest) {
  runStolenBaseAlert().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  const hour = Number(process.env.SB_ALERT_HOUR || 8);
  const timezone = process.env.TIMEZONE || 'America/Chicago';

  console.log(`SB alert scheduler active: ${hour}:00 ${timezone}`);

  if (process.env.RUN_SB_ON_START === 'true') {
    console.log('RUN_SB_ON_START enabled. Posting SB report now...');
    runStolenBaseAlert().catch(console.error);
  }

  cron.schedule(`0 ${hour} * * *`, () => {
    runStolenBaseAlert().catch(console.error);
  }, { timezone });
}
