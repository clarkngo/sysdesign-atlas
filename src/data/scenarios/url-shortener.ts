import type { ScenarioBundle } from '../types'

export const urlShortener: ScenarioBundle = {
  meta: {
    id: 'url-shortener',
    label: 'URL shortener',
    blurb: 'Create short links, redirect fast, track basic click counts.',
    difficulty: 'intro',
  },
  nodes: [
    {
      id: 'us-challenge',
      type: 'challenge',
      title: 'Shorten and redirect at modest scale',
      summary:
        'Accept long URLs, mint short codes, and redirect with low latency while storing click counts for analytics.',
      scenario: 'url-shortener',
      tags: ['hashing', 'redirect', 'kv'],
      requirements: [
        'Redirect p99 under ~50ms in-region',
        'Codes are unique and hard to guess',
        'Survive brief write spikes from campaigns',
      ],
      scaleHint: '~100M URLs · ~1k RPS redirects peak',
    },
    {
      id: 'us-solution-hash',
      type: 'solution',
      title: 'Base62 hash of URL or id',
      summary:
        'Hash the long URL (or a numeric id) and encode in base62 to form a short code of fixed length.',
      scenario: 'url-shortener',
      tags: ['hashing', 'encoding'],
      requirements: ['Collision handling strategy', 'Deterministic or id-based minting'],
      whenToUse: 'First design when uniqueness can be enforced at write time.',
      tradeoffs: ['Hash collisions need a retry path', 'Fixed length caps keyspace'],
    },
    {
      id: 'us-solution-kv',
      type: 'solution',
      title: 'Key-value store for code → URL',
      summary:
        'Store short_code as key and long URL (+ metadata) as value in a fast KV or relational table with a unique index.',
      scenario: 'url-shortener',
      tags: ['storage', 'kv'],
      requirements: ['Unique constraint on code', 'Optional TTL for ephemeral links'],
      whenToUse: 'Core persistence for redirects.',
    },
    {
      id: 'us-solution-cache',
      type: 'solution',
      title: 'Read-through cache on hot codes',
      summary:
        'Cache popular redirects in memory; miss falls through to the store. Write path invalidates or updates the entry.',
      scenario: 'url-shortener',
      tags: ['cache', 'latency'],
      requirements: ['TTL or explicit invalidation', 'Cache stampede protection'],
      whenToUse: 'Redirect QPS concentrates on a few viral links.',
    },
    {
      id: 'us-solution-analytics',
      type: 'solution',
      title: 'Async click counter',
      summary:
        'On redirect, enqueue an increment event; workers batch-update counters so the redirect path stays cheap.',
      scenario: 'url-shortener',
      tags: ['analytics', 'queue'],
      requirements: ['At-least-once event pipeline', 'Idempotent or approximate counts'],
      whenToUse: 'Exact counters are not needed on the redirect critical path.',
      tradeoffs: ['Counts lag reality', 'Approximate under lossy queues'],
    },
    {
      id: 'us-blocker-collision',
      type: 'blocker',
      title: 'Hash collisions & custom aliases',
      summary:
        'Two URLs can collide on the same code; custom aliases fight uniqueness and moderation rules.',
      scenario: 'url-shortener',
      tags: ['uniqueness', 'product'],
      requirements: ['Retry with salt / longer code', 'Alias reservation rules'],
    },
    {
      id: 'us-blocker-hot-key',
      type: 'blocker',
      title: 'Viral link hot key',
      summary:
        'One campaign code absorbs most read traffic and saturates a single cache entry or DB partition.',
      scenario: 'url-shortener',
      tags: ['hot-key', 'cache'],
      requirements: ['Local cache on app hosts', 'CDN or edge redirect for top codes'],
    },
  ],
  edges: [
    { id: 'e-us-1', source: 'us-challenge', target: 'us-solution-hash', relation: 'addresses' },
    { id: 'e-us-2', source: 'us-challenge', target: 'us-solution-kv', relation: 'addresses' },
    { id: 'e-us-3', source: 'us-solution-hash', target: 'us-solution-kv', relation: 'enables' },
    { id: 'e-us-4', source: 'us-solution-kv', target: 'us-solution-cache', relation: 'enables' },
    { id: 'e-us-5', source: 'us-challenge', target: 'us-solution-analytics', relation: 'addresses' },
    { id: 'e-us-6', source: 'us-solution-hash', target: 'us-blocker-collision', relation: 'blocked_by' },
    { id: 'e-us-7', source: 'us-solution-cache', target: 'us-blocker-hot-key', relation: 'blocked_by' },
    { id: 'e-us-8', source: 'us-solution-kv', target: 'us-blocker-hot-key', relation: 'blocked_by' },
  ],
}
