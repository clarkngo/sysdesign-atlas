import type { ScenarioBundle } from '../types'

export const rateLimiter: ScenarioBundle = {
  meta: {
    id: 'rate-limiter',
    label: 'Rate limiter',
    blurb: 'Throttle abusive or bursty clients without killing legitimate traffic.',
    difficulty: 'intro',
  },
  nodes: [
    {
      id: 'rl-challenge',
      type: 'challenge',
      title: 'Per-client request throttling',
      summary:
        'Enforce quotas (e.g. 100 req/min per API key) across a fleet of stateless API servers with predictable latency overhead.',
      scenario: 'rate-limiter',
      tags: ['throttle', 'api', 'fairness'],
      requirements: [
        'Decisions in single-digit milliseconds',
        'Shared limit across all app instances',
        'Clear 429 + retry-after semantics',
      ],
      scaleHint: '~5k RPS checked · millions of keys',
    },
    {
      id: 'rl-solution-token-bucket',
      type: 'solution',
      title: 'Token bucket / leaky bucket',
      summary:
        'Each key holds tokens refilled over time; a request spends a token or is rejected when empty.',
      scenario: 'rate-limiter',
      tags: ['algorithm', 'burst'],
      requirements: ['Stored remaining tokens + timestamp', 'Configurable burst size'],
      whenToUse: 'Allow short bursts while capping sustained rate.',
      tradeoffs: ['Burst size is a product knob', 'Clock skew affects refill'],
    },
    {
      id: 'rl-solution-sliding',
      type: 'solution',
      title: 'Sliding window counter',
      summary:
        'Count requests in the current and previous window; weight by elapsed time for a smoother limit than fixed windows.',
      scenario: 'rate-limiter',
      tags: ['algorithm', 'window'],
      requirements: ['Two counters + window id', 'Atomic increment'],
      whenToUse: 'You want simpler mental model than token buckets.',
      tradeoffs: ['Still approximates true sliding window', 'More keys than fixed window'],
    },
    {
      id: 'rl-solution-redis',
      type: 'solution',
      title: 'Centralized Redis counters',
      summary:
        'API servers call a Redis script (INCR + EXPIRE / Lua) so all instances share one view of each key’s budget.',
      scenario: 'rate-limiter',
      tags: ['redis', 'shared-state'],
      requirements: ['Atomic Lua or MULTI', 'Timeout + fail-open/closed policy'],
      whenToUse: 'Stateless app tier that must share limits.',
    },
    {
      id: 'rl-solution-gateway',
      type: 'solution',
      title: 'Enforce at the edge / gateway',
      summary:
        'Apply coarse limits on API gateway or CDN before traffic hits origin; keep fine-grained limits closer to the service.',
      scenario: 'rate-limiter',
      tags: ['gateway', 'edge'],
      requirements: ['Key extraction (IP, API key, user)', 'Consistent 429 mapping'],
      whenToUse: 'Absorb obvious abuse before app compute.',
    },
    {
      id: 'rl-blocker-redis',
      type: 'blocker',
      title: 'Limiter store outage',
      summary:
        'If Redis is down, you must choose fail-open (risk abuse) or fail-closed (risk outage for everyone).',
      scenario: 'rate-limiter',
      tags: ['availability', 'policy'],
      requirements: ['Documented fail mode', 'Local degraded limiter optional'],
    },
    {
      id: 'rl-blocker-hot-key',
      type: 'blocker',
      title: 'Hot API key / NAT IP',
      summary:
        'One key or a corporate NAT IP concentrates checks on a single Redis hash slot and skews fairness.',
      scenario: 'rate-limiter',
      tags: ['hot-key', 'fairness'],
      requirements: ['Per-user keys over raw IP when possible', 'Shard isolation for top keys'],
    },
  ],
  edges: [
    { id: 'e-rl-1', source: 'rl-challenge', target: 'rl-solution-token-bucket', relation: 'addresses' },
    { id: 'e-rl-2', source: 'rl-challenge', target: 'rl-solution-sliding', relation: 'addresses' },
    { id: 'e-rl-3', source: 'rl-solution-token-bucket', target: 'rl-solution-redis', relation: 'enables' },
    { id: 'e-rl-4', source: 'rl-solution-sliding', target: 'rl-solution-redis', relation: 'enables' },
    { id: 'e-rl-5', source: 'rl-challenge', target: 'rl-solution-gateway', relation: 'addresses' },
    { id: 'e-rl-6', source: 'rl-solution-token-bucket', target: 'rl-solution-sliding', relation: 'trades_off_with' },
    { id: 'e-rl-7', source: 'rl-solution-redis', target: 'rl-blocker-redis', relation: 'blocked_by' },
    { id: 'e-rl-8', source: 'rl-solution-redis', target: 'rl-blocker-hot-key', relation: 'blocked_by' },
    { id: 'e-rl-9', source: 'rl-solution-gateway', target: 'rl-blocker-hot-key', relation: 'trades_off_with' },
  ],
}
