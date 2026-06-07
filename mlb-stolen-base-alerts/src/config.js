import 'dotenv/config';

function num(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function str(name, fallback = '') {
  return process.env[name] ?? fallback;
}

function bool(name, fallback = false) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return ['1', 'true', 'yes', 'y'].includes(String(raw).toLowerCase());
}

export const config = {
  webhookUrl: str('SB_WEBHOOK_URL'),
  alertHour: num('SB_ALERT_HOUR', 8),
  alertMinute: num('SB_ALERT_MINUTE', 0),
  timezone: str('TIMEZONE', 'America/Chicago'),
  minScore: num('MIN_SB_SCORE', 62),
  eliteScore: num('ELITE_SB_SCORE', 82),
  topPlays: num('TOP_SB_PLAYS', 10),
  gameStatusFilter: str('GAME_STATUS_FILTER', 'scheduled'),
  runOnce: bool('RUN_ONCE', false),
  botName: str('BOT_NAME', 'MLB Stolen Base Alerts'),
  oddsApiKey: str('ODDS_API_KEY'),
  oddsRegions: str('ODDS_REGIONS', 'us'),
  oddsBookmakers: str('ODDS_BOOKMAKERS', 'fanduel,draftkings'),
  oddsMarkets: str('ODDS_MARKETS', 'batter_stolen_bases')
};
