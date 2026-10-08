import type { ScenarioBundle } from '../types'

export const leaderboard: ScenarioBundle = {
  meta: {
    id: 'leaderboard',
    label: 'Game leaderboard',
    blurb: 'Rank players by score and show top-N plus "your rank" in real time.',
    difficulty: 'intro',
  },
  nodes: [
    {
      id: 'lb-challenge',
      type: 'challenge',
      title: 'Live ranking of player scores',
      summary:
        'Players submit scores after each match. The game shows the global top 100 and each player\'s own rank.',
      scenario: 'leaderboard',
      tags: ['ranking', 'sorted-set'],
      requirements: [
        'Rank lookup in milliseconds',
        'Scores visible within a second of submission',
        'Daily / weekly boards reset cleanly',
      ],
      scaleHint: '~10M players · ~2k score updates/sec',
    },
    {
      id: 'lb-solution-sql',
      type: 'solution',
      title: 'SQL ORDER BY score',
      summary:
        'Store scores in a table and compute rank with ORDER BY / COUNT(*) WHERE score > mine.',
      scenario: 'leaderboard',
      tags: ['database', 'baseline'],
      requirements: ['Index on score'],
      whenToUse: 'Small player counts or a quick first version.',
      tradeoffs: ['Rank queries scan more rows as players grow'],
    },
    {
      id: 'lb-solution-zset',
      type: 'solution',
      title: 'Redis sorted set',
      summary:
        'ZADD to update a score, ZREVRANGE for top-N, ZREVRANK for a player\'s rank — all O(log n).',
      scenario: 'leaderboard',
      tags: ['redis', 'sorted-set', 'in-memory'],
      requirements: ['Enough RAM for all members', 'Persistence (AOF/RDB) or rebuild path'],
      whenToUse: 'Rank lookups must be fast for millions of players.',
      tradeoffs: ['Memory-bound', 'Not a durable source of truth on its own'],
    },
    {
      id: 'lb-solution-durable',
      type: 'solution',
      title: 'DB as source of truth, Redis as index',
      summary:
        'Write each score to the database, then update Redis. If Redis is lost, rebuild it from the DB.',
      scenario: 'leaderboard',
      tags: ['durability', 'database'],
      requirements: ['Rebuild job', 'Write DB first, then cache'],
      whenToUse: 'Scores matter (prizes, disputes) and must not be lost.',
    },
    {
      id: 'lb-solution-periods',
      type: 'solution',
      title: 'One key per time window',
      summary:
        'Use keys like board:daily:2026-10-07. New day, new key; old keys expire via TTL.',
      scenario: 'leaderboard',
      tags: ['ttl', 'time-window'],
      requirements: ['Write to all active windows per score'],
      whenToUse: 'You need daily/weekly/all-time boards without costly resets.',
    },
    {
      id: 'lb-blocker-ties',
      type: 'blocker',
      title: 'Ties in score',
      summary:
        'Many players share the same score; order looks random and ranks jump around.',
      scenario: 'leaderboard',
      tags: ['ranking', 'product'],
      requirements: ['Tiebreak by earliest time (encode in score)', 'Or show shared ranks'],
    },
    {
      id: 'lb-blocker-cheat',
      type: 'blocker',
      title: 'Fake score submissions',
      summary:
        'Clients can send any number they like, polluting the board.',
      scenario: 'leaderboard',
      tags: ['security', 'validation'],
      requirements: ['Compute scores server-side', 'Sanity limits + anomaly flags'],
    },
    {
      id: 'lb-blocker-memory',
      type: 'blocker',
      title: 'One sorted set outgrows a node',
      summary:
        'Hundreds of millions of members exceed a single Redis node\'s memory.',
      scenario: 'leaderboard',
      tags: ['memory', 'sharding'],
      requirements: ['Only rank active players', 'Approximate ranks via score buckets'],
    },
  ],
  edges: [
    { id: 'e-lb-1', source: 'lb-challenge', target: 'lb-solution-sql', relation: 'addresses' },
    { id: 'e-lb-2', source: 'lb-challenge', target: 'lb-solution-zset', relation: 'addresses' },
    { id: 'e-lb-3', source: 'lb-solution-sql', target: 'lb-solution-zset', relation: 'trades_off_with' },
    { id: 'e-lb-4', source: 'lb-solution-durable', target: 'lb-solution-zset', relation: 'enables' },
    { id: 'e-lb-5', source: 'lb-solution-zset', target: 'lb-solution-periods', relation: 'enables' },
    { id: 'e-lb-6', source: 'lb-solution-zset', target: 'lb-blocker-ties', relation: 'blocked_by' },
    { id: 'e-lb-7', source: 'lb-challenge', target: 'lb-blocker-cheat', relation: 'blocked_by' },
    { id: 'e-lb-8', source: 'lb-solution-zset', target: 'lb-blocker-memory', relation: 'blocked_by' },
  ],
}
