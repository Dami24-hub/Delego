/**
 * Minimal fuzzy matcher for command palette search: exact substrings score
 * highest (better for short route names), then in-order subsequence matches
 * with a bonus for consecutive characters (typical "fzf-style" typo tolerance).
 * Returns null when `query` doesn't match `text` at all.
 */
export function fuzzyScore(query: string, text: string): number | null {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const t = text.toLowerCase();

  const idx = t.indexOf(q);
  if (idx !== -1) {
    return 1000 - idx;
  }

  let qi = 0;
  let score = 0;
  let lastMatchIndex = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += lastMatchIndex === ti - 1 ? 5 : 1;
      lastMatchIndex = ti;
      qi++;
    }
  }

  return qi === q.length ? score : null;
}

/** Best score for `query` across a set of candidate strings, or null if none match. */
export function bestFuzzyScore(
  query: string,
  candidates: (string | undefined)[]
): number | null {
  let best: number | null = null;
  for (const candidate of candidates) {
    if (!candidate) continue;
    const score = fuzzyScore(query, candidate);
    if (score !== null && (best === null || score > best)) {
      best = score;
    }
  }
  return best;
}
