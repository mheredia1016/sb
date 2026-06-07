# MLB Stolen Base Pregame Alerts

Daily Discord alert for stolen base targets using free MLB Stats API data.

This is built to work like a pregame HR alert bot:

- Pulls today's MLB schedule
- Pulls probable pitchers when available
- Pulls probable team rosters
- Scores stolen base candidates
- Posts top plays to Discord
- Runs daily on Railway by cron
- Can also be run manually

## Important

This first version uses free data only. MLB's public Stats API does not include every premium metric we would ideally want, like catcher pop time, pitcher time-to-plate, or sportsbook stolen base odds. The scoring model uses available stats and matchup proxies:

- Season stolen bases
- Caught stealing
- Recent stolen base rate approximation
- OBP proxy from current season hitting stats
- Batting order proxy when lineup is available
- Opponent probable pitcher handedness/name when available
- Team/game context

You can improve it later by adding Baseball Savant exports, FanGraphs exports, or a paid odds API.

## Railway Variables

Add these in Railway > Variables:

```env
SB_WEBHOOK_URL=https://discord.com/api/webhooks/...
SB_ALERT_HOUR=8
SB_ALERT_MINUTE=0
TIMEZONE=America/Chicago
MIN_SB_SCORE=62
ELITE_SB_SCORE=82
TOP_SB_PLAYS=10
INCLUDE_PROBABLE_PITCHER_MATCHUP=true
POST_WHEN_NO_PLAYS=true
DRY_RUN=false
```

## Local Setup

```bash
npm install
cp .env.example .env
npm run test
npm run:sb
npm start
```

## Railway Start Command

```bash
npm start
```

## Manual Test Command

```bash
npm run test
```

This prints the Discord message to the console without posting if `DRY_RUN=true` or `--dry-run` is passed.

## Recommended Starting Thresholds

```env
MIN_SB_SCORE=62
ELITE_SB_SCORE=82
TOP_SB_PLAYS=10
```

If it posts too many weak plays, raise `MIN_SB_SCORE` to `68` or `70`.

If it posts nothing, lower it to `55`.

## Future Add-ons

Best next upgrades:

1. Catcher stolen base allowed / caught stealing data
2. Pitcher stolen base allowed
3. Baseball Savant sprint speed CSV
4. Odds API for anytime stolen base props
5. Live alert when a top runner reaches first base
