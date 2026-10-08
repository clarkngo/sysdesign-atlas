import type { ScenarioBundle } from '../types'

export const pastebin: ScenarioBundle = {
  meta: {
    id: 'pastebin',
    label: 'Pastebin',
    blurb: 'Save a block of text, share it by link, optionally let it expire.',
    difficulty: 'intro',
  },
  nodes: [
    {
      id: 'pb-challenge',
      type: 'challenge',
      title: 'Store and share text snippets',
      summary:
        'Users paste text (up to a few MB), get a unique link, and anyone with the link can view it until it expires.',
      scenario: 'pastebin',
      tags: ['storage', 'read-heavy'],
      requirements: [
        'Unique, unguessable paste ids',
        'Optional expiry (10 min to never)',
        'Fast reads; writes are much rarer',
      ],
      scaleHint: '~1M new pastes/day · ~10:1 read:write',
    },
    {
      id: 'pb-solution-split',
      type: 'solution',
      title: 'Metadata in DB, content in object storage',
      summary:
        'Keep small fields (id, owner, created_at, expires_at) in a database row and the paste body as a blob in S3-style storage.',
      scenario: 'pastebin',
      tags: ['object-storage', 'database'],
      requirements: ['Blob key stored on the metadata row'],
      whenToUse: 'Content can be large; DB rows should stay small and fast.',
      tradeoffs: ['Two systems to read from per view', 'Writes must handle partial failure'],
    },
    {
      id: 'pb-solution-id',
      type: 'solution',
      title: 'Random id generation',
      summary:
        'Generate ~8 random base62 characters per paste and insert with a unique constraint; retry on the rare clash.',
      scenario: 'pastebin',
      tags: ['ids', 'encoding'],
      requirements: ['Unique index on id', 'Cryptographically random source'],
      whenToUse: 'Ids must not be sequential, so private pastes cannot be enumerated.',
    },
    {
      id: 'pb-solution-cdn',
      type: 'solution',
      title: 'Cache / CDN for popular pastes',
      summary:
        'Pastes are immutable, so they cache well. Serve hot ones from a CDN or in-memory cache.',
      scenario: 'pastebin',
      tags: ['cache', 'cdn', 'immutable'],
      requirements: ['Cache TTL no longer than paste expiry'],
      whenToUse: 'A few pastes get shared widely and dominate reads.',
    },
    {
      id: 'pb-solution-expiry',
      type: 'solution',
      title: 'Lazy expiry + background cleanup',
      summary:
        'On read, treat expired pastes as missing. A periodic job deletes expired rows and blobs in batches.',
      scenario: 'pastebin',
      tags: ['ttl', 'cleanup', 'batch'],
      requirements: ['Index on expires_at', 'Idempotent delete job'],
      whenToUse: 'You need expiry to be correct for users without scanning everything constantly.',
      tradeoffs: ['Storage is reclaimed a little late'],
    },
    {
      id: 'pb-blocker-abuse',
      type: 'blocker',
      title: 'Spam and abusive content',
      summary:
        'Anonymous uploads attract spam, malware links, and leaked secrets.',
      scenario: 'pastebin',
      tags: ['abuse', 'rate-limit'],
      requirements: ['Per-IP rate limits', 'Size caps', 'Report + takedown flow'],
    },
    {
      id: 'pb-blocker-orphans',
      type: 'blocker',
      title: 'Orphaned blobs',
      summary:
        'If the blob upload succeeds but the DB insert fails (or vice versa), storage leaks or links break.',
      scenario: 'pastebin',
      tags: ['consistency', 'object-storage'],
      requirements: ['Write blob first, then row', 'Sweep blobs with no matching row'],
    },
  ],
  edges: [
    { id: 'e-pb-1', source: 'pb-challenge', target: 'pb-solution-split', relation: 'addresses' },
    { id: 'e-pb-2', source: 'pb-challenge', target: 'pb-solution-id', relation: 'addresses' },
    { id: 'e-pb-3', source: 'pb-solution-split', target: 'pb-solution-cdn', relation: 'enables' },
    { id: 'e-pb-4', source: 'pb-challenge', target: 'pb-solution-expiry', relation: 'addresses' },
    { id: 'e-pb-5', source: 'pb-solution-expiry', target: 'pb-solution-cdn', relation: 'trades_off_with' },
    { id: 'e-pb-6', source: 'pb-challenge', target: 'pb-blocker-abuse', relation: 'blocked_by' },
    { id: 'e-pb-7', source: 'pb-solution-split', target: 'pb-blocker-orphans', relation: 'blocked_by' },
  ],
}
