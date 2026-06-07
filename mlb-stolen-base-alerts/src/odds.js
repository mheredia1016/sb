import { config } from './config.js';

export async function getStolenBaseOddsByPlayer() {
  if (!config.oddsApiKey) return new Map();

  // Odds APIs differ heavily by plan and sport market availability.
  // This is intentionally soft-fail so the free MLB data bot still works.
  try {
    const url = new URL('https://api.the-odds-api.com/v4/sports/baseball_mlb/odds');
    url.searchParams.set('apiKey', config.oddsApiKey);
    url.searchParams.set('regions', config.oddsRegions);
    url.searchParams.set('markets', config.oddsMarkets);
    url.searchParams.set('bookmakers', config.oddsBookmakers);
    url.searchParams.set('oddsFormat', 'american');

    const res = await fetch(url);
    if (!res.ok) return new Map();
    const games = await res.json();
    const map = new Map();

    for (const game of games) {
      for (const book of game.bookmakers ?? []) {
        for (const market of book.markets ?? []) {
          for (const outcome of market.outcomes ?? []) {
            const name = outcome.description || outcome.name;
            if (!name) continue;
            const current = map.get(name);
            const item = { book: book.title, price: outcome.price };
            if (!current) map.set(name, [item]);
            else current.push(item);
          }
        }
      }
    }

    return map;
  } catch {
    return new Map();
  }
}
