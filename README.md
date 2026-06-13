# MLB Stolen Base Alerts

Railway/GitHub-ready Discord bot for pregame stolen-base targets.

## Fix in this version

This version fixes two separate limits:

1. Discord length limit: long reports are split into multiple Discord messages.
2. Player count limit: `TOP_SB_PLAYS=ALL` posts every player that clears `MIN_SB_SCORE`.

## Railway variables

```env
SB_WEBHOOK_URL=
SB_ALERT_HOUR=8
TIMEZONE=America/Chicago
MIN_SB_SCORE=70
ELITE_SB_SCORE=90
TOP_SB_PLAYS=ALL
MAX_DISCORD_CHARS=1750
POST_DELAY_MS=900
```

### Important

If you only want the top 10/15/etc., set:

```env
TOP_SB_PLAYS=15
```

If you want every qualified stolen-base target, set:

```env
TOP_SB_PLAYS=ALL
```

## Commands

Install locally:

```bash
npm install
```

Test one post:

```bash
npm run test-alert
```

Start scheduler:

```bash
npm start
```
