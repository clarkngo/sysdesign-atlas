import type { ScenarioBundle } from '../types'

export const shardingBasics: ScenarioBundle = {
  meta: {
    id: 'sharding-basics',
    label: 'Sharding basics',
    blurb: 'Split one huge database across several machines when a single server is not enough.',
    difficulty: 'intro',
  },
  nodes: [
    {
      id: 'sh-challenge',
      type: 'challenge',
      title: 'One database server is full',
      summary:
        'The messages table no longer fits on the biggest affordable machine, and writes are maxing out its disk. Read replicas do not help with writes.',
      scenario: 'sharding-basics',
      tags: ['sharding', 'partitioning', 'fundamentals'],
      requirements: [
        'Spread data and writes across machines',
        'Most queries touch only one machine',
        'Add machines later without downtime',
      ],
      scaleHint: '~20TB data · ~30k writes/sec',
    },
    {
      id: 'sh-solution-vertical',
      type: 'solution',
      title: 'Try simpler options first',
      summary:
        'A bigger machine, archiving old rows, and moving unrelated tables to their own database often buy years before sharding is needed.',
      scenario: 'sharding-basics',
      tags: ['vertical-scaling', 'archiving'],
      requirements: ['Measure what is actually full: CPU, disk, or memory'],
      whenToUse: 'Before sharding: it adds lasting complexity.',
    },
    {
      id: 'sh-solution-key',
      type: 'solution',
      title: 'Choose a shard key',
      summary:
        'Pick the column used by most queries (e.g. user_id or conversation_id). All rows with the same key live on the same shard.',
      scenario: 'sharding-basics',
      tags: ['shard-key', 'data-modeling'],
      requirements: ['Key present in nearly every query', 'Many distinct values'],
      whenToUse: 'The most important sharding decision; hard to change later.',
    },
    {
      id: 'sh-solution-hash',
      type: 'solution',
      title: 'Hash-based sharding',
      summary:
        'shard = hash(key) mod N, or better, consistent hashing / many small virtual shards. Spreads data evenly.',
      scenario: 'sharding-basics',
      tags: ['hashing', 'even-distribution'],
      requirements: ['Many logical shards mapped onto fewer servers'],
      whenToUse: 'Even load matters more than range queries.',
      tradeoffs: ['Range queries hit every shard'],
    },
    {
      id: 'sh-solution-range',
      type: 'solution',
      title: 'Range-based sharding',
      summary:
        'Assign key ranges to shards (A–F, G–M, …, or by date). Range scans stay on one shard.',
      scenario: 'sharding-basics',
      tags: ['range', 'ordering'],
      requirements: ['Lookup table of ranges', 'Split ranges as they grow'],
      whenToUse: 'Queries often scan ranges (time windows, alphabetical).',
      tradeoffs: ['Newest range can get all the writes'],
    },
    {
      id: 'sh-solution-router',
      type: 'solution',
      title: 'Routing layer',
      summary:
        'A library or proxy maps each key to its shard so app code does not need to know where data lives (e.g. Vitess, Citus).',
      scenario: 'sharding-basics',
      tags: ['routing', 'proxy'],
      requirements: ['Shard map stored centrally', 'Cached on each app server'],
      whenToUse: 'More than a couple of shards.',
    },
    {
      id: 'sh-blocker-hotspot',
      type: 'blocker',
      title: 'Hot shard',
      summary:
        'One celebrity user, or "today" in a date-range scheme, sends most traffic to a single shard.',
      scenario: 'sharding-basics',
      tags: ['hot-key', 'imbalance'],
      requirements: ['Better shard key', 'Split hot keys further'],
    },
    {
      id: 'sh-blocker-cross',
      type: 'blocker',
      title: 'Queries across shards',
      summary:
        'Joins, totals, and unique checks that span shards become slow fan-out queries or must move to the app.',
      scenario: 'sharding-basics',
      tags: ['joins', 'fan-out'],
      requirements: ['Keep related data on the same key', 'Separate analytics store for global queries'],
    },
    {
      id: 'sh-blocker-resharding',
      type: 'blocker',
      title: 'Resharding a live system',
      summary:
        'Going from 4 to 8 shards means copying data while the app keeps writing to it.',
      scenario: 'sharding-basics',
      tags: ['migration', 'operations'],
      requirements: ['Start with many logical shards', 'Copy, double-write, then switch'],
    },
  ],
  edges: [
    { id: 'e-sh-1', source: 'sh-challenge', target: 'sh-solution-vertical', relation: 'addresses' },
    { id: 'e-sh-2', source: 'sh-challenge', target: 'sh-solution-key', relation: 'addresses' },
    { id: 'e-sh-3', source: 'sh-solution-key', target: 'sh-solution-hash', relation: 'enables' },
    { id: 'e-sh-4', source: 'sh-solution-key', target: 'sh-solution-range', relation: 'enables' },
    { id: 'e-sh-5', source: 'sh-solution-hash', target: 'sh-solution-range', relation: 'trades_off_with' },
    { id: 'e-sh-6', source: 'sh-solution-hash', target: 'sh-solution-router', relation: 'enables' },
    { id: 'e-sh-7', source: 'sh-solution-range', target: 'sh-blocker-hotspot', relation: 'blocked_by' },
    { id: 'e-sh-8', source: 'sh-solution-key', target: 'sh-blocker-hotspot', relation: 'blocked_by' },
    { id: 'e-sh-9', source: 'sh-solution-key', target: 'sh-blocker-cross', relation: 'blocked_by' },
    { id: 'e-sh-10', source: 'sh-solution-router', target: 'sh-blocker-resharding', relation: 'blocked_by' },
  ],
}
