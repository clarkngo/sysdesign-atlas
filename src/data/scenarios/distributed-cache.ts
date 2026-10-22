import type { ScenarioBundle } from '../types'

export const distributedCache: ScenarioBundle = {
  meta: {
    id: 'distributed-cache',
    label: 'Caching basics',
    blurb: 'Speed up reads with a cache: what to store, when to remove it, and how to split it.',
    difficulty: 'intro',
  },
  nodes: [
    {
      id: 'dc-challenge',
      type: 'challenge',
      title: 'Database is too slow for repeated reads',
      summary:
        'Product pages read the same rows thousands of times a minute. Keep a fast in-memory copy of hot data without serving wrong data for long.',
      scenario: 'distributed-cache',
      tags: ['cache', 'latency', 'fundamentals'],
      requirements: [
        'Cache hits in about 1ms',
        'Stale data only for a short, known time',
        'Add cache servers without losing everything',
      ],
      scaleHint: '~50k reads/sec · ~95% hit rate target',
    },
    {
      id: 'dc-solution-aside',
      type: 'solution',
      title: 'Cache-aside (lazy loading)',
      summary:
        'App checks the cache first. On a miss, read the database, then store the result in the cache for next time.',
      scenario: 'distributed-cache',
      tags: ['cache-aside', 'pattern'],
      requirements: ['TTL on every key'],
      whenToUse: 'The default pattern: only data that is actually read gets cached.',
      tradeoffs: ['First read of each key is slow'],
    },
    {
      id: 'dc-solution-write',
      type: 'solution',
      title: 'Update or delete the key on write',
      summary:
        'When data changes, delete its cache key (or write the new value) so the next read gets fresh data.',
      scenario: 'distributed-cache',
      tags: ['invalidation', 'consistency'],
      requirements: ['Write DB first, then delete the cache key'],
      whenToUse: 'Users expect to see their own changes right away.',
    },
    {
      id: 'dc-solution-lru',
      type: 'solution',
      title: 'LRU eviction',
      summary:
        'Memory is limited. When full, remove the least recently used key, since recently used data is likely to be used again.',
      scenario: 'distributed-cache',
      tags: ['eviction', 'lru', 'memory'],
      requirements: ['maxmemory limit set', 'Eviction policy configured'],
      whenToUse: 'The cache cannot hold everything.',
    },
    {
      id: 'dc-solution-hashring',
      type: 'solution',
      title: 'Consistent hashing across nodes',
      summary:
        'Spread keys over cache servers on a hash ring. Adding or removing a server only moves a small share of keys.',
      scenario: 'distributed-cache',
      tags: ['consistent-hashing', 'sharding'],
      requirements: ['Virtual nodes for even spread'],
      whenToUse: 'One cache server is not enough memory or throughput.',
      tradeoffs: ['Plain hash(key) % N would remap almost every key when N changes'],
    },
    {
      id: 'dc-blocker-stampede',
      type: 'blocker',
      title: 'Cache stampede',
      summary:
        'A popular key expires and hundreds of requests miss at once, all hitting the database together.',
      scenario: 'distributed-cache',
      tags: ['stampede', 'thundering-herd'],
      requirements: ['Only one request refills a key (lock)', 'Random jitter on TTLs'],
    },
    {
      id: 'dc-blocker-stale',
      type: 'blocker',
      title: 'Stale data after a race',
      summary:
        'A slow reader puts an old value back into the cache just after a writer deleted the key.',
      scenario: 'distributed-cache',
      tags: ['consistency', 'race-condition'],
      requirements: ['Short TTLs as a safety net', 'Version numbers on cached values'],
    },
    {
      id: 'dc-blocker-cold',
      type: 'blocker',
      title: 'Cold cache after restart',
      summary:
        'A cache node restarts empty and its share of traffic suddenly falls through to the database.',
      scenario: 'distributed-cache',
      tags: ['availability', 'warmup'],
      requirements: ['Replicas for cache nodes', 'Warm up hot keys before taking traffic'],
    },
  ],
  edges: [
    { id: 'e-dc-1', source: 'dc-challenge', target: 'dc-solution-aside', relation: 'addresses' },
    { id: 'e-dc-2', source: 'dc-solution-aside', target: 'dc-solution-write', relation: 'enables' },
    { id: 'e-dc-3', source: 'dc-solution-aside', target: 'dc-solution-lru', relation: 'enables' },
    { id: 'e-dc-4', source: 'dc-challenge', target: 'dc-solution-hashring', relation: 'addresses' },
    { id: 'e-dc-5', source: 'dc-solution-aside', target: 'dc-blocker-stampede', relation: 'blocked_by' },
    { id: 'e-dc-6', source: 'dc-solution-write', target: 'dc-blocker-stale', relation: 'blocked_by' },
    { id: 'e-dc-7', source: 'dc-solution-hashring', target: 'dc-blocker-cold', relation: 'blocked_by' },
  ],
}
