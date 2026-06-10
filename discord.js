const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function splitDiscordText(text, maxChars = 1750) {
  const safeMax = Math.min(Number(maxChars) || 1750, 1900);
  const blocks = String(text || '').split('\n\n');
  const chunks = [];
  let current = '';

  for (const block of blocks) {
    const next = current ? `${current}\n\n${block}` : block;

    if (next.length <= safeMax) {
      current = next;
      continue;
    }

    if (current) chunks.push(current);

    if (block.length <= safeMax) {
      current = block;
    } else {
      // Last-resort split for a single oversized block.
      for (let i = 0; i < block.length; i += safeMax) {
        chunks.push(block.slice(i, i + safeMax));
      }
      current = '';
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

export async function postDiscordReport({ webhookUrl, title, text, maxChars, delayMs }) {
  if (!webhookUrl) throw new Error('Missing SB_WEBHOOK_URL');

  const chunks = splitDiscordText(text, maxChars);
  const total = chunks.length;

  for (let i = 0; i < total; i++) {
    const partTitle = total > 1 ? `${title} (${i + 1}/${total})` : title;

    const body = {
      content: `**${partTitle}**\n${chunks[i]}`
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Discord post failed: ${res.status} ${errText}`);
    }

    if (i < total - 1) await sleep(Number(delayMs) || 900);
  }

  return { chunks: total };
}
