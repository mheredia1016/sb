import 'dotenv/config';
import cron from 'node-cron';
import { getStolenBaseCandidates } from './data.js';
import { rankPlayers } from './scoring.js';
import { buildReport } from './report.js';
import { postDiscordReport } from './discord.js';

function todayChicagoDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.TIMEZONE || 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function cleanRecapUrl(url) {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

async function sendPicksToRecapBot(players, date) {
  if (!process.env.RECAP_BOT_URL || !process.env.RECAP_BOT_SECRET) {
    console.log('[RECAP] Missing RECAP_BOT_URL or RECAP_BOT_SECRET');
    return;
  }

  const recapUrl = cleanRecapUrl(process.env.RECAP_BOT_URL);

  const payload = {
    type: 'sb',
    date,
    players: players
      .map((p) => ({
        playerId: p.playerId || p.id || p.mlbId,
        name: p.name || p.playerName,
        team: p.team || p.teamAbbr,
        opponent: p.opponent || p.opponentAbbr,
        gamePk: p.gamePk || p.gameId,
        score: p.score,
        tier: p.tier || null
      }))
      .filter((p) => p.playerId && p.name && p.gamePk)
  };

  if (!payload.players.length) {
    console.log('[RECAP] No valid SB picks found to send.');
    return;
  }

  try {
    const response = await fetch(`${recapUrl}/save-picks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-recap-secret': process.env.RECAP_BOT_SECRET
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`[RECAP] ${response.status} ${await response.text()}`);
      return;
    }

    console.log(`[RECAP] Saved ${payload.players.length} SB picks`);
  } catch (err) {
    console.error('[RECAP]', err);
  }
}

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

  await sendPicksToRecapBot(ranked, todayChicagoDate());
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
