/**
 * Minimal deterministic seed generator (FE-045).
 *
 * A full `faker` dependency is overkill for typed fixture factories that only
 * need stable, seedable ids/addresses/amounts. This is a tiny mulberry32 PRNG
 * so fixtures are reproducible across test runs and CI (no flaky snapshots).
 */
export function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return function next(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededId(prefix: string, rand: () => number): string {
  const hex = Math.floor(rand() * 0xffffffff)
    .toString(16)
    .padStart(8, "0");
  return `${prefix}-${hex}`;
}

export function seededStellarAddress(rand: () => number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let out = "G";
  for (let i = 0; i < 55; i += 1) {
    out += chars[Math.floor(rand() * chars.length)];
  }
  return out;
}

export function pick<T>(items: readonly T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length)];
}
