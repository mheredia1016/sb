# MLB Stolen Base Pregame Alerts

Daily Discord alerts for MLB stolen-base targets, built to run on Railway and GitHub.

## What it does

- Pulls today's MLB schedule from the free MLB Stats API
- Pulls probable pitchers when available
- Pulls recent player hitting/running stats from the free MLB Stats API
- Scores stolen-base targets using speed, OBP, recent SB activity, batting order spot, and matchup context
- Posts a Discord embed with top stolen-base plays
- Optional odds lookup support if you add an odds API key

This first version intentionally uses free MLB data only by default. It does not require a paid odds provider.

## Railway Variables

```env
SB_WEBHOOK_URL=your_discord_webhook_url
SB_ALERT_HOUR=8
SB_ALERT_MINUTE=0
TIMEZONE=America/Chicago
MIN_SB_SCORE=62
ELITE_SB_SCORE=82
TOP_SB_PLAYS=10
GAME_STATUS_FILTER=scheduled
RUN_ONCE=false
ODDS_API_KEY=
ODDS_REGIONS=us
ODDS_BOOKMAKERS=fanduel,draftkings
ODDS_MARKETS=batter_stolen_bases
BOT_NAME=MLB Stolen Base Alerts
```

## Local setup

```bash
npm install
cp .env.example .env
npm run run:once
```

## Railway start command

```bash
npm start
```

## Recommended first settings

```env
MIN_SB_SCORE=62
ELITE_SB_SCORE=82
TOP_SB_PLAYS=10
GAME_STATUS_FILTER=scheduled
```

If alerts are too thin, lower `MIN_SB_SCORE` to `55`.

If alerts are too noisy, raise `MIN_SB_SCORE` to `70`.

## Notes

Stolen-base picks are not guaranteed betting recommendations. They are matchup alerts based on available public data.
