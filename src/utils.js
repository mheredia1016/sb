export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function todayCentralDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.TIMEZONE || 'America/Chicago',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const d = parts.find(p => p.type === 'day').value;
  return `${y}-${m}-${d}`;
}

export function seasonYear() {
  return Number(todayCentralDate().slice(0, 4));
}

export async function getJson(url, label = 'request') {
  const res = await fetch(url, { headers: { 'User-Agent': 'sb-alert-bot/2.0' }});
  if (!res.ok) throw new Error(`${label} failed: ${res.status} ${await res.text().catch(() => '')}`);
  return res.json();
}

export function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function boolEnv(name, fallback = false) {
  const v = process.env[name];
  if (v == null || v === '') return fallback;
  return ['1', 'true', 'yes', 'y'].includes(String(v).toLowerCase());
}
