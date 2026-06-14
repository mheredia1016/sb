import 'dotenv/config';
import cron from 'node-cron';
import { Client, GatewayIntentBits } from 'discord.js';
import { getStolenBaseCandidates } from './data.js';
import { rankPlayers } from './scoring.js';
import { buildDebugReport, buildReport } from './report.js';
import { postDiscordReport } from './discord.js';

async function generateStolenBaseReport({ minScore, limit, eliteScore, debug = false } = {}) {
  const candidates = await getStolenBaseCandidates();
  const ranked = rankPlayers(
    candidates,
    minScore ?? process.env.MIN_SB_SCORE ?? 55,
    limit ?? process.env.TOP_SB_PLAYS ?? 'ALL'
  );

  console.log(`SB candidates loaded: ${candidates.length}`);
  console.log(`SB qualified after score filter: ${ranked.length}`);

  const text = debug
    ? buildDebugReport({ candidates, ranked })
    : buildReport(ranked, eliteScore ?? process.env.ELITE_SB_SCORE ?? 80, { minScore: minScore ?? process.env.MIN_SB_SCORE ?? 55 });

  return { candidates, ranked, text };
}

async function runStolenBaseAlert(options = {}) {
  const { ranked, text } = await generateStolenBaseReport(options);

  const result = await postDiscordReport({
    webhookUrl: process.env.SB_WEBHOOK_URL,
    title: options.title || 'MLB Stolen Base Pregame Report',
    text,
    maxChars: process.env.MAX_DISCORD_CHARS || 1750,
    delayMs: process.env.POST_DELAY_MS || 900
  });

  console.log(`Posted ${ranked.length} stolen-base play(s) in ${result.chunks} Discord message(s).`);
  return { ranked, chunks: result.chunks };
}

function startCommandBot() {
  if (!process.env.DISCORD_BOT_TOKEN) {
    console.log('DISCORD_BOT_TOKEN not set. Manual Discord commands disabled.');
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  client.once('ready', () => {
    console.log(`Discord command bot logged in as ${client.user.tag}`);
  });

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content.trim().toLowerCase();
    if (!content.startsWith('!sb')) return;

    console.log(`Command seen: ${content} from ${message.author.tag}`);

    try {
      if (content === '!sb') {
        await message.reply('🦶 Generating full stolen base report...');
        const result = await runStolenBaseAlert({ title: 'Manual MLB Stolen Base Report' });
        await message.channel.send(`✅ Posted ${result.ranked.length} stolen-base play(s).`);
      } else if (content === '!sbtop') {
        await message.reply('🦶 Generating top 10 stolen base report...');
        const result = await runStolenBaseAlert({ limit: 10, title: 'Top 10 MLB Stolen Base Report' });
        await message.channel.send(`✅ Posted top ${result.ranked.length}.`);
      } else if (content === '!sbelite') {
        await message.reply('🦶 Generating elite stolen base report...');
        const result = await runStolenBaseAlert({ minScore: process.env.ELITE_SB_SCORE || 80, title: 'Elite MLB Stolen Base Report' });
        await message.channel.send(`✅ Posted ${result.ranked.length} elite stolen-base play(s).`);
      } else if (content === '!sbdebug') {
        await message.reply('🔎 Generating SB debug report...');
        const result = await runStolenBaseAlert({ debug: true, title: 'SB Debug Report' });
        await message.channel.send(`✅ Debug posted. Qualified: ${result.ranked.length}.`);
      }
    } catch (err) {
      console.error(err);
      await message.channel.send(`❌ SB command failed: ${err.message}`);
    }
  });

  client.login(process.env.DISCORD_BOT_TOKEN).catch((err) => {
    console.error('Discord login failed:', err.message);
  });
}

const isTest = process.argv.includes('--test');
const isDebug = process.argv.includes('--debug') || process.env.DEBUG_SB === 'true';

if (isTest) {
  runStolenBaseAlert({ debug: isDebug }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  startCommandBot();

  const hour = Number(process.env.SB_ALERT_HOUR || 8);
  const timezone = process.env.TIMEZONE || 'America/Chicago';
  console.log(`SB alert scheduler active: ${hour}:00 ${timezone}`);

  cron.schedule(`0 ${hour} * * *`, () => {
    runStolenBaseAlert().catch(console.error);
  }, { timezone });
}
