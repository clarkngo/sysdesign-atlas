import type { ScenarioBundle } from '../types'

export const socialFeed: ScenarioBundle = {
  meta: {
    id: 'social-feed',
    label: 'Social feed',
    blurb: 'Personalized home timeline under heavy read skew.',
    difficulty: 'intermediate',
  },
  nodes: [
    {
      id: 'sf-challenge-timeline',
      type: 'challenge',
      title: 'Personalized timeline at 50M DAU',
      summary:
        'Each open must assemble a ranked mix of followed authors and ads in under ~200ms p99, while write traffic stays bursty around peaks.',
      scenario: 'social-feed',
      tags: ['reads', 'fan-out', 'latency'],
      requirements: [
        'p99 feed assemble < 200ms',
        'Support celebrity accounts with >1M followers',
        'Freshness within a few minutes for most users',
      ],
      scaleHint: '~50M DAU · ~5k RPS peak feed reads',
    },
    {
      id: 'sf-solution-push',
      type: 'solution',
      title: 'Fan-out on write (push)',
      summary:
        'On publish, enqueue fan-out jobs that append the post id into each follower’s timeline cache (Redis list / sorted set).',
      scenario: 'social-feed',
      tags: ['fan-out', 'cache', 'write-path'],
      requirements: [
        'Async workers + durable queue',
        'Per-follower timeline store',
      ],
      whenToUse: 'Most users have modest follower counts; reads dominate.',
      tradeoffs: [
        'Celebrity posts explode write amplification',
        'Timeline storage grows with graph density',
      ],
      scaleHint: 'O(followers) work per write',
    },
    {
      id: 'sf-solution-pull',
      type: 'solution',
      title: 'Fan-out on read (pull)',
      summary:
        'Store posts per author; on read, fetch recent posts from followed authors and merge-rank in the feed service.',
      scenario: 'social-feed',
      tags: ['fan-out', 'read-path', 'merge'],
      requirements: [
        'Fast recent-post index per author',
        'Bounded follow graph fetch',
      ],
      whenToUse: 'Highly uneven follower distribution or sparse writes.',
      tradeoffs: [
        'Read path does more work',
        'Harder to keep ranking consistent under load',
      ],
      scaleHint: 'O(follows × k) work per read',
    },
    {
      id: 'sf-solution-hybrid',
      type: 'solution',
      title: 'Hybrid push + pull',
      summary:
        'Push into timelines for regular accounts; leave celebrity/hot authors on pull and merge at read time.',
      scenario: 'social-feed',
      tags: ['hybrid', 'hot-key', 'fan-out'],
      requirements: [
        'Classifier for push vs pull authors',
        'Merge step on feed assemble',
      ],
      whenToUse: 'Production default when follower skew is extreme.',
      tradeoffs: [
        'Two code paths to operate',
        'Threshold tuning becomes a product decision',
      ],
    },
    {
      id: 'sf-solution-rank',
      type: 'solution',
      title: 'Candidate generation + ranker',
      summary:
        'Generate a few hundred candidates (follows, recs, ads), then score with a lightweight ranker before returning the page.',
      scenario: 'social-feed',
      tags: ['ranking', 'ml', 'candidates'],
      requirements: [
        'Feature store or cached signals',
        'Hard latency budget for scoring',
      ],
      whenToUse: 'Chronological feed is no longer enough for engagement.',
      tradeoffs: [
        'Ranking bugs feel like “the product broke”',
        'Feature freshness vs cache hits',
      ],
    },
    {
      id: 'sf-solution-cdn-media',
      type: 'solution',
      title: 'CDN + object store for media',
      summary:
        'Keep post metadata in the feed path; serve images/video from object storage behind a CDN with signed or public URLs.',
      scenario: 'social-feed',
      tags: ['cdn', 'media', 'bandwidth'],
      requirements: [
        'Object storage + CDN',
        'Image variants / transcoding pipeline',
      ],
      whenToUse: 'Media bytes dwarf metadata traffic.',
      tradeoffs: ['Cache purge complexity', 'Regional egress cost'],
    },
    {
      id: 'sf-blocker-celebrity',
      type: 'blocker',
      title: 'Celebrity write amplification',
      summary:
        'A single post to millions of followers saturates queues and timeline writers if every follower is push-fanned.',
      scenario: 'social-feed',
      tags: ['hot-key', 'queue', 'write'],
      requirements: [
        'Detect high-fanout authors',
        'Backpressure / rate limits on fan-out',
      ],
      tradeoffs: ['Push purity vs operational survival'],
    },
    {
      id: 'sf-blocker-cache-invalidation',
      type: 'blocker',
      title: 'Stale timeline windows',
      summary:
        'Aggressive caching of assembled pages fights delete/edit and ranking updates; users see ghost posts or missing deletes.',
      scenario: 'social-feed',
      tags: ['cache', 'consistency', 'ttl'],
      requirements: [
        'TTL + selective invalidation',
        'Idempotent timeline mutations',
      ],
    },
    {
      id: 'sf-blocker-rank-latency',
      type: 'blocker',
      title: 'Ranker blows the p99 budget',
      summary:
        'Feature fetches and model scoring push assemble past 200ms when candidate sets grow or caches miss.',
      scenario: 'social-feed',
      tags: ['latency', 'ranking', 'p99'],
      requirements: [
        'Strict candidate caps',
        'Fallback chronological path',
      ],
    },
    {
      id: 'sf-blocker-graph-fetch',
      type: 'blocker',
      title: 'Follow-graph hot partitions',
      summary:
        'Pull and hybrid paths hammer the follow service for power users; graph shards become a bottleneck before the post store does.',
      scenario: 'social-feed',
      tags: ['graph', 'sharding', 'reads'],
      requirements: [
        'Cached follow lists',
        'Shard by user with overflow handling',
      ],
    }
  ],
  edges: [
    {
      id: 'e-sf-1',
      source: 'sf-challenge-timeline',
      target: 'sf-solution-push',
      relation: 'addresses',
    },
    {
      id: 'e-sf-2',
      source: 'sf-challenge-timeline',
      target: 'sf-solution-pull',
      relation: 'addresses',
    },
    {
      id: 'e-sf-3',
      source: 'sf-challenge-timeline',
      target: 'sf-solution-hybrid',
      relation: 'addresses',
    },
    {
      id: 'e-sf-4',
      source: 'sf-solution-push',
      target: 'sf-solution-hybrid',
      relation: 'enables',
    },
    {
      id: 'e-sf-5',
      source: 'sf-solution-pull',
      target: 'sf-solution-hybrid',
      relation: 'enables',
    },
    {
      id: 'e-sf-6',
      source: 'sf-solution-hybrid',
      target: 'sf-solution-rank',
      relation: 'enables',
    },
    {
      id: 'e-sf-7',
      source: 'sf-challenge-timeline',
      target: 'sf-solution-cdn-media',
      relation: 'addresses',
    },
    {
      id: 'e-sf-8',
      source: 'sf-solution-push',
      target: 'sf-blocker-celebrity',
      relation: 'blocked_by',
    },
    {
      id: 'e-sf-9',
      source: 'sf-solution-hybrid',
      target: 'sf-blocker-celebrity',
      relation: 'trades_off_with',
    },
    {
      id: 'e-sf-10',
      source: 'sf-solution-rank',
      target: 'sf-blocker-rank-latency',
      relation: 'blocked_by',
    },
    {
      id: 'e-sf-11',
      source: 'sf-solution-push',
      target: 'sf-blocker-cache-invalidation',
      relation: 'blocked_by',
    },
    {
      id: 'e-sf-12',
      source: 'sf-solution-pull',
      target: 'sf-blocker-graph-fetch',
      relation: 'blocked_by',
    },
    {
      id: 'e-sf-13',
      source: 'sf-solution-hybrid',
      target: 'sf-blocker-graph-fetch',
      relation: 'blocked_by',
    },
    {
      id: 'e-sf-14',
      source: 'sf-solution-pull',
      target: 'sf-solution-push',
      relation: 'trades_off_with',
    },
  ],
}
