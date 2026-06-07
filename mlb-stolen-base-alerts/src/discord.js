import { config } from './config.js';

function americanOddsText(oddsItems = []) {
  if (!oddsItems.length) return '';
  return oddsItems.slice(0, 2).map(o => `${o.book}: ${o.price > 0 ? '+' : ''}${o.price}`).join(' | ');
}

export function buildDiscordPayload(plays, oddsMap) {
  const now = new Date();
  const title = '🦶 MLB Stolen Base Targets';

  if (!plays.length) {
    return {
      username: config.botName,
      embeds: [{
        title,
        description: `No stolen-base targets cleared the score threshold today.`,
        color: 0x5865F2,
        footer: { text: `Generated ${now.toLocaleString('en-US', { timeZone: config.timezone })}` }
      }]
    };
  }

  const fields = plays.slice(0, config.topPlays).map((p, idx) => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '▫️';
    const tier = p.score >= config.eliteScore ? 'ELITE' : 'TARGET';
    const oddsText = americanOddsText(oddsMap.get(p.playerName));
    const reasonText = p.reasons.length ? p.reasons.map(r => `✅ ${r}`).join('\n') : '✅ Strong stolen-base profile';
    return {
      name: `${medal} ${p.playerName} — ${p.teamName} vs ${p.opponentName}`,
      value: `**SB Score:** ${p.score} / 100 (${tier})\n**Season SB:** ${p.seasonSb} | **Last 14:** ${p.recentSb} | **OBP:** ${p.obp ? p.obp.toFixed(3) : 'N/A'}\n${reasonText}${oddsText ? `\n**Odds:** ${oddsText}` : ''}`,
      inline: false
    };
  });

  return {
    username: config.botName,
    embeds: [{
      title,
      description: `Top stolen-base spots for today's MLB slate. Threshold: ${config.minScore}+`,
      color: 0x2ECC71,
      fields,
      footer: { text: `Generated ${now.toLocaleString('en-US', { timeZone: config.timezone })}` }
    }]
  };
}

export async function postToDiscord(payload) {
  if (!config.webhookUrl) {
    console.log(JSON.stringify(payload, null, 2));
    console.log('No SB_WEBHOOK_URL set, printed payload instead.');
    return;
  }

  const res = await fetch(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord webhook failed ${res.status}: ${text}`);
  }
}
