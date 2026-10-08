import type { ScenarioBundle } from '../types'

export const webAppScaling: ScenarioBundle = {
  meta: {
    id: 'web-app-scaling',
    label: 'Scale a web app',
    blurb: 'Grow a single-server app to millions of users, one bottleneck at a time.',
    difficulty: 'intro',
  },
  nodes: [
    {
      id: 'wa-challenge',
      type: 'challenge',
      title: 'Outgrow a single server',
      summary:
        'App, database, and files all live on one machine. Traffic is growing and one box can no longer keep up or survive a crash.',
      scenario: 'web-app-scaling',
      tags: ['fundamentals', 'scaling', 'availability'],
      requirements: [
        'Stay up when any one machine dies',
        'Add capacity without a rewrite',
        'Keep page loads fast as users grow',
      ],
      scaleHint: '1 server → ~1M users · ~5k RPS peak',
    },
    {
      id: 'wa-solution-split-db',
      type: 'solution',
      title: 'Move the database to its own server',
      summary:
        'Separate the web tier from the data tier so each can be sized and scaled independently.',
      scenario: 'web-app-scaling',
      tags: ['database', 'fundamentals'],
      requirements: ['Network access between tiers', 'Connection pooling'],
      whenToUse: 'Always the first step: app CPU and DB disk/memory compete on one box.',
      tradeoffs: ['Adds a network hop per query'],
    },
    {
      id: 'wa-solution-stateless',
      type: 'solution',
      title: 'Stateless app servers',
      summary:
        'Keep no user data in app server memory or disk. Sessions go to a shared store (Redis/DB) or signed cookies.',
      scenario: 'web-app-scaling',
      tags: ['stateless', 'sessions'],
      requirements: ['Shared session store or JWT', 'Uploads go to object storage, not local disk'],
      whenToUse: 'Before adding a second app server, so any server can handle any request.',
    },
    {
      id: 'wa-solution-lb',
      type: 'solution',
      title: 'Load balancer + horizontal scaling',
      summary:
        'Put a load balancer in front of several identical app servers. It spreads traffic and stops sending to unhealthy hosts.',
      scenario: 'web-app-scaling',
      tags: ['load-balancer', 'horizontal-scaling', 'availability'],
      requirements: ['Health checks', 'Round-robin or least-connections routing'],
      whenToUse: 'One app server is CPU-bound or a single point of failure.',
      tradeoffs: ['LB itself must be redundant', 'More hosts to deploy and monitor'],
    },
    {
      id: 'wa-solution-cache',
      type: 'solution',
      title: 'Cache frequent reads',
      summary:
        'Put an in-memory cache (Redis/Memcached) in front of the database for data that is read often and changes rarely.',
      scenario: 'web-app-scaling',
      tags: ['cache', 'latency'],
      requirements: ['TTL per key', 'Invalidate or update on write'],
      whenToUse: 'The same queries run over and over and the DB is read-heavy.',
      tradeoffs: ['Stale reads until TTL/invalidation', 'One more system to run'],
    },
    {
      id: 'wa-solution-replicas',
      type: 'solution',
      title: 'Read replicas',
      summary:
        'One primary handles writes; replicas copy its data and serve reads. A replica can be promoted if the primary fails.',
      scenario: 'web-app-scaling',
      tags: ['database', 'replication'],
      requirements: ['Route writes to primary, reads to replicas', 'Failover procedure'],
      whenToUse: 'Reads far outnumber writes (typical web apps are ~10:1 or more).',
      tradeoffs: ['Replication lag means replicas can be slightly behind'],
    },
    {
      id: 'wa-solution-cdn',
      type: 'solution',
      title: 'CDN for static assets',
      summary:
        'Serve images, JS, and CSS from edge servers close to users instead of from your app servers.',
      scenario: 'web-app-scaling',
      tags: ['cdn', 'latency', 'static'],
      requirements: ['Versioned file names for cache busting', 'Cache-Control headers'],
      whenToUse: 'Static files make up most bytes served, or users are far from your region.',
    },
    {
      id: 'wa-blocker-sticky',
      type: 'blocker',
      title: 'Sessions stuck on one server',
      summary:
        'If login state lives in server memory, users get logged out when the LB sends them elsewhere or a server restarts.',
      scenario: 'web-app-scaling',
      tags: ['sessions', 'stateless'],
      requirements: ['Externalize sessions', 'Avoid relying on sticky sessions'],
    },
    {
      id: 'wa-blocker-lag',
      type: 'blocker',
      title: 'Read-your-own-write after replication lag',
      summary:
        'A user updates their profile, the next read hits a lagging replica, and the old value appears.',
      scenario: 'web-app-scaling',
      tags: ['consistency', 'replication'],
      requirements: ['Read from primary right after a user writes', 'Or pin the user to primary briefly'],
    },
    {
      id: 'wa-blocker-write-ceiling',
      type: 'blocker',
      title: 'Single primary write ceiling',
      summary:
        'Replicas only scale reads. Eventually all writes on one primary hit CPU, disk, or lock limits.',
      scenario: 'web-app-scaling',
      tags: ['database', 'sharding'],
      requirements: ['Vertical scale first', 'Then shard by a key such as user_id'],
    },
  ],
  edges: [
    { id: 'e-wa-1', source: 'wa-challenge', target: 'wa-solution-split-db', relation: 'addresses' },
    { id: 'e-wa-2', source: 'wa-challenge', target: 'wa-solution-lb', relation: 'addresses' },
    { id: 'e-wa-3', source: 'wa-solution-stateless', target: 'wa-solution-lb', relation: 'enables' },
    { id: 'e-wa-4', source: 'wa-challenge', target: 'wa-solution-cache', relation: 'addresses' },
    { id: 'e-wa-5', source: 'wa-solution-split-db', target: 'wa-solution-replicas', relation: 'enables' },
    { id: 'e-wa-6', source: 'wa-challenge', target: 'wa-solution-cdn', relation: 'addresses' },
    { id: 'e-wa-7', source: 'wa-solution-lb', target: 'wa-blocker-sticky', relation: 'blocked_by' },
    { id: 'e-wa-8', source: 'wa-solution-replicas', target: 'wa-blocker-lag', relation: 'blocked_by' },
    { id: 'e-wa-9', source: 'wa-solution-replicas', target: 'wa-blocker-write-ceiling', relation: 'blocked_by' },
    { id: 'e-wa-10', source: 'wa-solution-cache', target: 'wa-solution-replicas', relation: 'trades_off_with' },
  ],
}
