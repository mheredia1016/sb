require('dotenv').config();

function intEnv(name, fallback) {
  const raw = process.env[name];
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boolEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return ['1', 'true', 'yes', 'y'].includes(String(raw).toLowerCase());
}

const args = process.argv.slice(2);

module.exports = {
  webhookUrl: process.env.SB_WEBHOOK_URL || '',
  alertHour: intEnv('SB_ALERT_HOUR', 8),
  alertMinute: intEnv('SB_ALERT_MINUTE', 0),
  timezone: process.env.TIMEZONE || 'America/Chicago',
  minScore: intEnv('MIN_SB_SCORE', 62),
  eliteScore: intEnv('ELITE_SB_SCORE', 82),
  topPlays: intEnv('TOP_SB_PLAYS', 10),
  includeProbablePitcherMatchup: boolEnv('INCLUDE_PROBABLE_PITCHER_MATCHUP', true),
  postWhenNoPlays: boolEnv('POST_WHEN_NO_PLAYS', true),
  oddsApiKey: process.env.ODDS_API_KEY || '',
  dryRun: boolEnv('DRY_RUN', false) || args.includes('--dry-run'),
  once: args.includes('--once')
};
