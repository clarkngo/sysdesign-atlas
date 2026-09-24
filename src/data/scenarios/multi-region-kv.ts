import type { ScenarioBundle } from '../types'

export const multiRegionKv: ScenarioBundle = {
  meta: {
    id: 'multi-region-kv',
    label: 'Multi-region KV',
    blurb: 'Low-latency reads worldwide with messy cross-region writes.',
    difficulty: 'advanced',
  },
  nodes: [
    {
      id: 'mr-challenge',
      type: 'challenge',
      title: 'Global key-value with regional latency',
      summary:
        'Serve session and config reads from the nearest region under ~50ms, while writes may originate anywhere and must converge without silent data loss.',
      scenario: 'multi-region-kv',
      tags: ['geo', 'consistency', 'replication'],
      requirements: [
        'Regional read latency for hot keys',
        'Documented consistency model per API',
        'Survive single-region failure',
      ],
      scaleHint: '3+ regions · billions of keys · uneven write locality',
    },
    {
      id: 'mr-solution-leader',
      type: 'solution',
      title: 'Single-leader per key range',
      summary:
        'Each shard has one primary region for writes; secondaries replicate asynchronously or semi-synchronously for reads.',
      scenario: 'multi-region-kv',
      tags: ['leader', 'sharding'],
      requirements: ['Shard map / placement service', 'Failover election'],
      whenToUse: 'Stronger write ordering matters more than write locality.',
      tradeoffs: ['Cross-region write RTT for remote clients', 'Failover complexity'],
    },
    {
      id: 'mr-solution-multi-leader',
      type: 'solution',
      title: 'Multi-leader with conflict resolution',
      summary:
        'Accept writes in multiple regions; replicate and resolve with LWW, CRDTs, or app-level merge.',
      scenario: 'multi-region-kv',
      tags: ['crdt', 'lww', 'multi-leader'],
      requirements: ['Version vectors or timestamps', 'Conflict policy per value type'],
      whenToUse: 'Writes must stay local and conflicts are rare or mergeable.',
      tradeoffs: ['Anomalies visible to users', 'Harder operational mental model'],
    },
    {
      id: 'mr-solution-cache',
      type: 'solution',
      title: 'Regional read replicas + edge cache',
      summary:
        'Pin hot keys in regional replicas; optional edge cache for immutable or slowly changing values.',
      scenario: 'multi-region-kv',
      tags: ['replica', 'cache', 'read'],
      requirements: ['Replica lag SLOs', 'Invalidation or short TTL'],
      whenToUse: 'Read/write ratio is high and staleness is tolerable.',
    },
    {
      id: 'mr-solution-routing',
      type: 'solution',
      title: 'Request routing by key & locality',
      summary:
        'Clients or a proxy send writes to the owning region and reads to the nearest healthy replica based on a placement map.',
      scenario: 'multi-region-kv',
      tags: ['routing', 'placement'],
      requirements: ['Gossip or control plane for map', 'Hedged requests optional'],
      whenToUse: 'Always — placement without routing leaves performance on the table.',
    },
    {
      id: 'mr-solution-quorum',
      type: 'solution',
      title: 'Quorum reads/writes (N/R/W)',
      summary:
        'Tune R and W against replica set N so overlapping quorums give the consistency the API promises.',
      scenario: 'multi-region-kv',
      tags: ['quorum', 'consistency'],
      requirements: ['Odd replica counts', 'Sloppy quorum / hinted handoff policy'],
      whenToUse: 'Dynamo-style stores where tunable consistency is a feature.',
      tradeoffs: ['Higher R/W adds latency', 'Misconfigured quorums surprise clients'],
    },
    {
      id: 'mr-blocker-conflict',
      type: 'blocker',
      title: 'Concurrent cross-region edits',
      summary:
        'Two regions update the same key; naive LWW drops a write users thought succeeded.',
      scenario: 'multi-region-kv',
      tags: ['conflict', 'consistency'],
      requirements: ['CRDT or explicit merge API', 'Surface conflicts to the app'],
    },
    {
      id: 'mr-blocker-split',
      type: 'blocker',
      title: 'Region partition / false failover',
      summary:
        'Network blips trigger dual primaries or stuck followers; healing creates divergent histories.',
      scenario: 'multi-region-kv',
      tags: ['partition', 'failover'],
      requirements: ['Fencing tokens', 'Conservative election timeouts'],
    },
    {
      id: 'mr-blocker-lag',
      type: 'blocker',
      title: 'Replica lag vs read-your-writes',
      summary:
        'A user writes in region A then reads from region B before replication catches up.',
      scenario: 'multi-region-kv',
      tags: ['lag', 'session'],
      requirements: ['Session stickiness', 'Sticky region or RYW tokens'],
    },
  ],
  edges: [
    { id: 'e-mr-1', source: 'mr-challenge', target: 'mr-solution-leader', relation: 'addresses' },
    { id: 'e-mr-2', source: 'mr-challenge', target: 'mr-solution-multi-leader', relation: 'addresses' },
    { id: 'e-mr-3', source: 'mr-challenge', target: 'mr-solution-cache', relation: 'addresses' },
    { id: 'e-mr-4', source: 'mr-challenge', target: 'mr-solution-routing', relation: 'addresses' },
    { id: 'e-mr-5', source: 'mr-solution-leader', target: 'mr-solution-multi-leader', relation: 'trades_off_with' },
    { id: 'e-mr-6', source: 'mr-solution-leader', target: 'mr-solution-routing', relation: 'enables' },
    { id: 'e-mr-7', source: 'mr-solution-multi-leader', target: 'mr-solution-quorum', relation: 'enables' },
    { id: 'e-mr-8', source: 'mr-solution-cache', target: 'mr-blocker-lag', relation: 'blocked_by' },
    { id: 'e-mr-9', source: 'mr-solution-multi-leader', target: 'mr-blocker-conflict', relation: 'blocked_by' },
    { id: 'e-mr-10', source: 'mr-solution-leader', target: 'mr-blocker-split', relation: 'blocked_by' },
    { id: 'e-mr-11', source: 'mr-solution-quorum', target: 'mr-blocker-lag', relation: 'trades_off_with' },
  ],
}
