# MLB Stolen Base Alerts

Railway/GitHub-ready Discord bot for pregame stolen-base targets.

## Important fix in this version

Discord messages can get cut off when they are too long. This version automatically splits the stolen-base report into multiple Discord messages:

- `MAX_DISCORD_CHARS=1750`
- `POST_DELAY_MS=900`

## Railway variables

```env
SB_WEBHOOK_URL=
SB_ALERT_HOUR=8
TIMEZONE=America/Chicago
MIN_SB_SCORE=70
ELITE_SB_SCORE=90
TOP_SB_PLAYS=15
MAX_DISCORD_CHARS=1750
POST_DELAY_MS=900
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
