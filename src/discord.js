const axios = require('axios');

function formatGameTime(iso) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    }).format(new Date(iso));
  } catch {
    return iso || 'TBD';
  }
}

function buildMessage(candidates, config, date) {
  if (!candidates.length) {
    return {
      content: `🦶 **MLB Stolen Base Targets — ${date}**\n\nNo stolen base plays cleared the minimum score of **${config.minScore}** today.`
    };
  }

  const lines = [];
  lines.push(`🦶 **MLB Stolen Base Targets — ${date}**`);
  lines.push('');
  lines.push(`Minimum Score: **${config.minScore}** | Elite: **${config.eliteScore}+**`);
  lines.push('');

  candidates.forEach((c, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '➡️';
    const tier = c.score >= config.eliteScore ? 'ELITE SPOT' : c.score >= config.minScore + 8 ? 'STRONG LOOK' : 'WATCH LIST';
    lines.push(`${medal} **${c.playerName}** — ${c.teamName} vs ${c.opponentName}`);
    lines.push(`Score: **${c.score}** | ${tier}`);
    lines.push(`Game: ${formatGameTime(c.gameTime)}`);
    lines.push(`Why: ${c.reasons.slice(0, 4).join(' • ')}`);
    lines.push(`Odds: _Add anytime SB odds provider later_`);
    lines.push('');
  });

  lines.push('_Free-data model. Best used as a shortlist before checking posted SB odds._');
  return { content: lines.join('\n').slice(0, 1900) };
}

async function postToDiscord(webhookUrl, payload, dryRun = false) {
  if (dryRun) {
    console.log('--- DRY RUN DISCORD PAYLOAD ---');
    console.log(payload.content);
    return;
  }
  if (!webhookUrl) {
    throw new Error('Missing SB_WEBHOOK_URL');
  }
  await axios.post(webhookUrl, payload, { timeout: 20000 });
}

module.exports = { buildMessage, postToDiscord };
