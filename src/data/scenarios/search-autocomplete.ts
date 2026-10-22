import type { ScenarioBundle } from '../types'

export const searchAutocomplete: ScenarioBundle = {
  meta: {
    id: 'search-autocomplete',
    label: 'Search autocomplete',
    blurb: 'Suggest the most popular completions as the user types each letter.',
    difficulty: 'intro',
  },
  nodes: [
    {
      id: 'ac-challenge',
      type: 'challenge',
      title: 'Suggestions on every keystroke',
      summary:
        'As a user types "sys", show the top 5 popular searches that start with it, fast enough to feel instant.',
      scenario: 'search-autocomplete',
      tags: ['search', 'latency', 'read-heavy'],
      requirements: [
        'Results in under ~100ms end to end',
        'Ranked by popularity',
        'Popularity updates daily, not instantly',
      ],
      scaleHint: '~10M queries/day · ~5 requests per search typed',
    },
    {
      id: 'ac-solution-like',
      type: 'solution',
      title: 'SQL LIKE \'prefix%\' query',
      summary:
        'Store queries with counts in a table; look up WHERE query LIKE \'sys%\' ORDER BY count LIMIT 5.',
      scenario: 'search-autocomplete',
      tags: ['database', 'baseline'],
      requirements: ['Index on query text'],
      whenToUse: 'A first version with a small number of distinct queries.',
      tradeoffs: ['Sorting all matches by count gets slow for short prefixes'],
    },
    {
      id: 'ac-solution-trie',
      type: 'solution',
      title: 'Trie with top-k cached at each node',
      summary:
        'A prefix tree where each node already stores its top 5 completions. A lookup walks a few letters and returns the stored list.',
      scenario: 'search-autocomplete',
      tags: ['trie', 'data-structure', 'in-memory'],
      requirements: ['Fits in memory (or sharded by first letters)', 'Top-k list per node'],
      whenToUse: 'Lookups must be fast regardless of how many queries share a prefix.',
      tradeoffs: ['Uses more memory', 'Rebuilding is expensive'],
    },
    {
      id: 'ac-solution-batch',
      type: 'solution',
      title: 'Rebuild from search logs in batches',
      summary:
        'Log every search. A daily job counts queries, builds a fresh trie, and swaps it in. Lookups never wait on writes.',
      scenario: 'search-autocomplete',
      tags: ['batch', 'logs', 'offline'],
      requirements: ['Search log pipeline', 'Atomic swap of the new trie'],
      whenToUse: 'Popularity can be a day behind.',
      tradeoffs: ['New trending topics appear late'],
    },
    {
      id: 'ac-solution-client',
      type: 'solution',
      title: 'Debounce and cache in the browser',
      summary:
        'Wait ~100ms after typing stops before asking, and reuse results for prefixes already fetched. Cuts requests a lot.',
      scenario: 'search-autocomplete',
      tags: ['client', 'debounce', 'cache'],
      requirements: ['Short HTTP cache headers', 'Cancel stale in-flight requests'],
      whenToUse: 'Always: most keystrokes do not need a request.',
    },
    {
      id: 'ac-blocker-trending',
      type: 'blocker',
      title: 'Breaking news is missing',
      summary:
        'A big event happens at noon, but the daily rebuild will not include it until tomorrow.',
      scenario: 'search-autocomplete',
      tags: ['freshness', 'trending'],
      requirements: ['Small real-time trending list merged at query time'],
    },
    {
      id: 'ac-blocker-offensive',
      type: 'blocker',
      title: 'Offensive or harmful suggestions',
      summary:
        'Popular does not mean appropriate; bad completions are shown to everyone typing that prefix.',
      scenario: 'search-autocomplete',
      tags: ['moderation', 'product'],
      requirements: ['Blocklist filter during rebuild', 'Fast manual removal path'],
    },
    {
      id: 'ac-blocker-out-of-order',
      type: 'blocker',
      title: 'Responses arrive out of order',
      summary:
        'The reply for "sy" arrives after the reply for "sys" and overwrites the better list.',
      scenario: 'search-autocomplete',
      tags: ['client', 'concurrency'],
      requirements: ['Ignore responses for anything but the latest prefix'],
    },
  ],
  edges: [
    { id: 'e-ac-1', source: 'ac-challenge', target: 'ac-solution-like', relation: 'addresses' },
    { id: 'e-ac-2', source: 'ac-challenge', target: 'ac-solution-trie', relation: 'addresses' },
    { id: 'e-ac-3', source: 'ac-solution-like', target: 'ac-solution-trie', relation: 'trades_off_with' },
    { id: 'e-ac-4', source: 'ac-solution-batch', target: 'ac-solution-trie', relation: 'enables' },
    { id: 'e-ac-5', source: 'ac-challenge', target: 'ac-solution-client', relation: 'addresses' },
    { id: 'e-ac-6', source: 'ac-solution-batch', target: 'ac-blocker-trending', relation: 'blocked_by' },
    { id: 'e-ac-7', source: 'ac-solution-batch', target: 'ac-blocker-offensive', relation: 'blocked_by' },
    { id: 'e-ac-8', source: 'ac-solution-client', target: 'ac-blocker-out-of-order', relation: 'blocked_by' },
  ],
}
