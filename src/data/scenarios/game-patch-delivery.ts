import type { ScenarioBundle } from '../types'

export const gamePatchDelivery: ScenarioBundle = {
  meta: {
    id: 'game-patch-delivery',
    label: 'Game patch delivery',
    blurb: 'Ship a new balance patch and assets to millions of phones on launch day.',
    difficulty: 'intermediate',
  },
  nodes: [
    {
      id: 'pd-challenge',
      type: 'challenge',
      title: 'Patch day for millions of devices',
      summary:
        'A new patch adds a champion, skins, and balance changes. Every player must update before queueing, and most log in within the first hours.',
      scenario: 'game-patch-delivery',
      tags: ['cdn', 'versioning', 'mobile'],
      requirements: [
        'Small downloads on mobile data',
        'Clients and servers agree on game version',
        'Roll back fast if the patch is broken',
      ],
      scaleHint: '~30M devices · ~1GB total assets · ~200MB typical patch',
    },
    {
      id: 'pd-solution-cdn',
      type: 'solution',
      title: 'Content-addressed asset bundles on a CDN',
      summary:
        'Split assets into bundles named by content hash. A manifest lists the hashes for each version; clients download only bundles they lack.',
      scenario: 'game-patch-delivery',
      tags: ['cdn', 'hashing', 'immutable'],
      requirements: ['Manifest per version', 'Hash check after download'],
      whenToUse: 'Most bytes do not change between patches.',
    },
    {
      id: 'pd-solution-ondemand',
      type: 'solution',
      title: 'Download extra content on demand',
      summary:
        'Ship a small core in the app store build; fetch skins, voice packs, and HD textures in the background or when first needed.',
      scenario: 'game-patch-delivery',
      tags: ['mobile', 'lazy-loading'],
      requirements: ['Placeholder assets', 'Prefetch likely-needed bundles'],
      whenToUse: 'App store size limits and storage-constrained phones.',
      tradeoffs: ['Brief loading if an asset is missing at match start'],
    },
    {
      id: 'pd-solution-staged',
      type: 'solution',
      title: 'Staged rollout by region',
      summary:
        'Release to one smaller region first, watch crash and win-rate metrics, then widen. Keeps CDN load and blast radius small.',
      scenario: 'game-patch-delivery',
      tags: ['rollout', 'risk'],
      requirements: ['Per-region version gate', 'Crash + error dashboards'],
      whenToUse: 'A bad patch would hit every player at once.',
    },
    {
      id: 'pd-solution-flags',
      type: 'solution',
      title: 'Server-driven config for balance numbers',
      summary:
        'Keep champion stats and event settings in config fetched at login, so a hotfix changes a number without a client download.',
      scenario: 'game-patch-delivery',
      tags: ['config', 'feature-flags'],
      requirements: ['Versioned, signed config', 'Same config on match server and client'],
      whenToUse: 'A newly released champion is wildly overpowered.',
    },
    {
      id: 'pd-blocker-mismatch',
      type: 'blocker',
      title: 'Mixed client versions in one match',
      summary:
        'A player on the old version gets matched with updated players and desyncs.',
      scenario: 'game-patch-delivery',
      tags: ['versioning', 'compatibility'],
      requirements: ['Version check at login and queue', 'Matchmaking pools per version'],
    },
    {
      id: 'pd-blocker-thundering',
      type: 'blocker',
      title: 'Everyone downloads at the same minute',
      summary:
        'Release at a fixed time sends millions of clients to the CDN and login service at once.',
      scenario: 'game-patch-delivery',
      tags: ['thundering-herd', 'cdn'],
      requirements: ['Pre-warm CDN', 'Background predownload before release', 'Login queue'],
    },
    {
      id: 'pd-blocker-store',
      type: 'blocker',
      title: 'App store review delays',
      summary:
        'Code changes need store approval, which can lag days behind the server release.',
      scenario: 'game-patch-delivery',
      tags: ['mobile', 'process'],
      requirements: ['Submit builds early', 'Gate features behind server config'],
    },
  ],
  edges: [
    { id: 'e-pd-1', source: 'pd-challenge', target: 'pd-solution-cdn', relation: 'addresses' },
    { id: 'e-pd-2', source: 'pd-solution-cdn', target: 'pd-solution-ondemand', relation: 'enables' },
    { id: 'e-pd-3', source: 'pd-challenge', target: 'pd-solution-staged', relation: 'addresses' },
    { id: 'e-pd-4', source: 'pd-challenge', target: 'pd-solution-flags', relation: 'addresses' },
    { id: 'e-pd-5', source: 'pd-solution-staged', target: 'pd-blocker-mismatch', relation: 'blocked_by' },
    { id: 'e-pd-6', source: 'pd-solution-cdn', target: 'pd-blocker-thundering', relation: 'blocked_by' },
    { id: 'e-pd-7', source: 'pd-solution-flags', target: 'pd-blocker-store', relation: 'addresses' },
    { id: 'e-pd-8', source: 'pd-solution-ondemand', target: 'pd-solution-staged', relation: 'trades_off_with' },
  ],
}
