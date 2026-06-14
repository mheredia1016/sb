# MLB Stolen Base Alerts V2

This version fixes the two main issues from V1:

1. **Same players every day** — candidates are rebuilt from **today's MLB schedule** and today's teams only.
2. **Discord cutoffs** — long reports are split into multiple Discord messages.

## Railway start command

```bash
npm start
```

## Manual run

```bash
npm test
```

## Discord command

Add `DISCORD_BOT_TOKEN`, invite the bot, enable **Message Content Intent**, then type:

```text
!sb
```

Other commands:

```text
!sbtop     # top 10
!sbelite   # elite spots only
!sbdebug   # posts candidate/qualified counts
```

## Required Railway variables

```env
SB_WEBHOOK_URL=
SB_ALERT_HOUR=8
TIMEZONE=America/Chicago
MIN_SB_SCORE=55
ELITE_SB_SCORE=80
TOP_SB_PLAYS=ALL
MAX_DISCORD_CHARS=1750
POST_DELAY_MS=900
ONLY_TODAYS_TEAMS=true
REQUIRE_PROBABLE_LINEUP=false
MIN_SEASON_PA=25
MAX_PLAYERS_PER_TEAM=8
```

Optional:

```env
DISCORD_BOT_TOKEN=
DEBUG_SB=false
```

## Notes

- Pregame MLB lineups are not always available early in the morning. If lineups are missing, V2 uses active roster hitters from today's teams and filters by PA/SB profile.
- Set `REQUIRE_PROBABLE_LINEUP=true` only if you want to hide players unless batting order data is available.
