import type { ScenarioBundle } from '../types'

export const rideSharing: ScenarioBundle = {
  meta: {
    id: 'ride-sharing',
    label: 'Ride sharing',
    blurb: 'Track moving drivers and match each rider to a nearby one within seconds.',
    difficulty: 'intermediate',
  },
  nodes: [
    {
      id: 'rs-challenge',
      type: 'challenge',
      title: 'Find nearby drivers that keep moving',
      summary:
        'Drivers send their location every few seconds. When a rider requests a trip, find the closest available drivers and offer the trip to one at a time.',
      scenario: 'ride-sharing',
      tags: ['geospatial', 'realtime', 'matching'],
      requirements: [
        'Nearby-driver search in under ~100ms',
        'Absorb a flood of location updates',
        'A driver is never given two trips at once',
      ],
      scaleHint: '~1M active drivers · location every 4s → ~250k writes/sec',
    },
    {
      id: 'rs-solution-geohash',
      type: 'solution',
      title: 'Geospatial index (geohash / S2 / H3 cells)',
      summary:
        'Divide the map into grid cells with string or numeric ids. A driver\'s cell id becomes the lookup key, and nearby search checks the rider\'s cell plus its neighbours.',
      scenario: 'ride-sharing',
      tags: ['geohash', 'spatial-index'],
      requirements: ['Cell size tuned to city density', 'Neighbour-cell lookup'],
      whenToUse: 'Plain lat/lng range queries on a normal index are too slow.',
      tradeoffs: ['Fixed cells are too big downtown and too small in suburbs'],
    },
    {
      id: 'rs-solution-quadtree',
      type: 'solution',
      title: 'Quadtree that splits busy areas',
      summary:
        'A tree that splits a square into four children whenever it holds too many drivers, so dense areas get small cells automatically.',
      scenario: 'ride-sharing',
      tags: ['quadtree', 'spatial-index', 'in-memory'],
      requirements: ['Max drivers per leaf', 'Rebuild or rebalance as drivers move'],
      whenToUse: 'Driver density varies wildly across a city.',
      tradeoffs: ['Constant moves make updates costly'],
    },
    {
      id: 'rs-solution-memory',
      type: 'solution',
      title: 'Latest locations in memory, history to a log',
      summary:
        'Keep only each driver\'s latest position in an in-memory store (e.g. Redis GEO) with a short TTL. Stream all pings to a log for trip history and analytics.',
      scenario: 'ride-sharing',
      tags: ['in-memory', 'redis', 'stream'],
      requirements: ['TTL so offline drivers disappear', 'Sharded by city or region'],
      whenToUse: 'Location updates are far too frequent for a disk-based database.',
    },
    {
      id: 'rs-solution-dispatch',
      type: 'solution',
      title: 'Dispatch with a short exclusive offer',
      summary:
        'Rank nearby drivers by ETA, atomically mark the best one "offered", and give them ~15s to accept before moving to the next.',
      scenario: 'ride-sharing',
      tags: ['matching', 'locking'],
      requirements: ['Atomic status change (available → offered)', 'Offer timeout'],
      whenToUse: 'Two riders must never be matched to the same driver.',
    },
    {
      id: 'rs-blocker-boundary',
      type: 'blocker',
      title: 'Closest driver is across a cell edge',
      summary:
        'The rider sits at the edge of a cell; the nearest driver is in the next cell and gets missed.',
      scenario: 'ride-sharing',
      tags: ['geospatial', 'correctness'],
      requirements: ['Always search neighbouring cells', 'Widen radius if too few results'],
    },
    {
      id: 'rs-blocker-eta',
      type: 'blocker',
      title: 'Straight-line distance lies',
      summary:
        'A driver 300m away across a river may be 15 minutes away by road.',
      scenario: 'ride-sharing',
      tags: ['routing', 'eta'],
      requirements: ['Use straight-line search to shortlist, road ETA to rank'],
    },
    {
      id: 'rs-blocker-hot-city',
      type: 'blocker',
      title: 'One city overloads a shard',
      summary:
        'New Year\'s Eve in one city sends most updates and searches to the shard holding it.',
      scenario: 'ride-sharing',
      tags: ['hot-spot', 'sharding'],
      requirements: ['Shard by cell, not whole city', 'Pre-scale for known events'],
    },
  ],
  edges: [
    { id: 'e-rs-1', source: 'rs-challenge', target: 'rs-solution-geohash', relation: 'addresses' },
    { id: 'e-rs-2', source: 'rs-challenge', target: 'rs-solution-quadtree', relation: 'addresses' },
    { id: 'e-rs-3', source: 'rs-solution-geohash', target: 'rs-solution-quadtree', relation: 'trades_off_with' },
    { id: 'e-rs-4', source: 'rs-challenge', target: 'rs-solution-memory', relation: 'addresses' },
    { id: 'e-rs-5', source: 'rs-solution-memory', target: 'rs-solution-dispatch', relation: 'enables' },
    { id: 'e-rs-6', source: 'rs-solution-geohash', target: 'rs-blocker-boundary', relation: 'blocked_by' },
    { id: 'e-rs-7', source: 'rs-solution-dispatch', target: 'rs-blocker-eta', relation: 'blocked_by' },
    { id: 'e-rs-8', source: 'rs-solution-memory', target: 'rs-blocker-hot-city', relation: 'blocked_by' },
  ],
}
