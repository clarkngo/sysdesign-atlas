import type { ScenarioBundle } from '../types'

export const uniqueIdGenerator: ScenarioBundle = {
  meta: {
    id: 'unique-id-generator',
    label: 'Unique ID generator',
    blurb: 'Hand out unique, roughly time-ordered ids from many servers without a bottleneck.',
    difficulty: 'intro',
  },
  nodes: [
    {
      id: 'id-challenge',
      type: 'challenge',
      title: 'Unique ids across many servers',
      summary:
        'Every new order, post, or message needs an id. With many app servers writing at once, ids must never repeat and should sort roughly by creation time.',
      scenario: 'unique-id-generator',
      tags: ['ids', 'fundamentals', 'distributed'],
      requirements: [
        'Never generate the same id twice',
        'Fits in 64 bits for compact indexes',
        'Roughly sortable by time',
      ],
      scaleHint: '~50 app servers · ~100k ids/sec peak',
    },
    {
      id: 'id-solution-autoinc',
      type: 'solution',
      title: 'Database auto-increment',
      summary:
        'Let one database hand out 1, 2, 3, … Simple, ordered, and guaranteed unique by the database.',
      scenario: 'unique-id-generator',
      tags: ['database', 'baseline'],
      requirements: ['Single primary database'],
      whenToUse: 'One database and modest write volume: the right first choice.',
      tradeoffs: ['Every insert depends on one machine', 'Ids reveal your volume to outsiders'],
    },
    {
      id: 'id-solution-uuid',
      type: 'solution',
      title: 'Random UUIDs',
      summary:
        'Each server generates a random 128-bit id locally. Collisions are so unlikely they can be ignored in practice. UUIDv7 adds a time prefix so ids sort by time.',
      scenario: 'unique-id-generator',
      tags: ['uuid', 'random'],
      requirements: ['Good random source'],
      whenToUse: 'No coordination wanted and 128-bit ids are acceptable.',
      tradeoffs: ['Twice the size of a 64-bit id', 'Random (v4) ids scatter index writes'],
    },
    {
      id: 'id-solution-snowflake',
      type: 'solution',
      title: 'Snowflake-style ids',
      summary:
        'Pack a 64-bit id from timestamp (ms) + machine id + a per-ms counter. Each server generates ids on its own, and they sort by time.',
      scenario: 'unique-id-generator',
      tags: ['snowflake', 'time-ordered'],
      requirements: ['Unique machine id per server', 'Counter resets each millisecond'],
      whenToUse: 'High volume, many servers, and time-sorted 64-bit ids.',
    },
    {
      id: 'id-solution-ranges',
      type: 'solution',
      title: 'Hand out id ranges in blocks',
      summary:
        'A central service gives each server a block (e.g. 1,000,000 to 1,000,999). The server uses ids from memory and asks for a new block when it runs out.',
      scenario: 'unique-id-generator',
      tags: ['coordination', 'batching'],
      requirements: ['Durable counter for the next block'],
      whenToUse: 'You want small numeric ids but not a database round trip per id.',
      tradeoffs: ['Unused ids in a block are lost if the server restarts'],
    },
    {
      id: 'id-blocker-clock',
      type: 'blocker',
      title: 'Clock moves backwards',
      summary:
        'NTP corrects a server\'s clock by a few ms. Snowflake ids from that server could repeat earlier ones.',
      scenario: 'unique-id-generator',
      tags: ['time', 'clocks'],
      requirements: ['Refuse or wait when the clock goes back', 'Track the last timestamp used'],
    },
    {
      id: 'id-blocker-machine',
      type: 'blocker',
      title: 'Two servers share a machine id',
      summary:
        'A config mistake or autoscaled clone reuses a machine id, so both servers produce identical ids.',
      scenario: 'unique-id-generator',
      tags: ['config', 'coordination'],
      requirements: ['Lease machine ids from a coordinator (e.g. ZooKeeper/etcd)'],
    },
    {
      id: 'id-blocker-spof',
      type: 'blocker',
      title: 'Central id service goes down',
      summary:
        'If every insert needs an id from one service or database, its outage stops all writes.',
      scenario: 'unique-id-generator',
      tags: ['availability', 'spof'],
      requirements: ['Generate locally when possible', 'Pre-fetch blocks before they run out'],
    },
  ],
  edges: [
    { id: 'e-id-1', source: 'id-challenge', target: 'id-solution-autoinc', relation: 'addresses' },
    { id: 'e-id-2', source: 'id-challenge', target: 'id-solution-uuid', relation: 'addresses' },
    { id: 'e-id-3', source: 'id-challenge', target: 'id-solution-snowflake', relation: 'addresses' },
    { id: 'e-id-4', source: 'id-solution-autoinc', target: 'id-solution-ranges', relation: 'enables' },
    { id: 'e-id-5', source: 'id-solution-uuid', target: 'id-solution-snowflake', relation: 'trades_off_with' },
    { id: 'e-id-6', source: 'id-solution-autoinc', target: 'id-blocker-spof', relation: 'blocked_by' },
    { id: 'e-id-7', source: 'id-solution-ranges', target: 'id-blocker-spof', relation: 'blocked_by' },
    { id: 'e-id-8', source: 'id-solution-snowflake', target: 'id-blocker-clock', relation: 'blocked_by' },
    { id: 'e-id-9', source: 'id-solution-snowflake', target: 'id-blocker-machine', relation: 'blocked_by' },
  ],
}
