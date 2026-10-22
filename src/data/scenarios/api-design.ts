import type { ScenarioBundle } from '../types'

export const apiDesign: ScenarioBundle = {
  meta: {
    id: 'api-design',
    label: 'REST API design',
    blurb: 'Design a clean, predictable API for a to-do app that mobile and web clients can rely on.',
    difficulty: 'intro',
  },
  nodes: [
    {
      id: 'api-challenge',
      type: 'challenge',
      title: 'An API clients can depend on',
      summary:
        'Web and mobile apps create, list, update, and delete to-do items. Old app versions stay installed for months, so the API cannot break them.',
      scenario: 'api-design',
      tags: ['api', 'rest', 'fundamentals'],
      requirements: [
        'Predictable URLs and responses',
        'Lists stay fast as users add thousands of items',
        'Changes do not break old clients',
      ],
      scaleHint: '~500k users · ~3k requests/sec',
    },
    {
      id: 'api-solution-resources',
      type: 'solution',
      title: 'Resources + HTTP methods',
      summary:
        'Nouns in URLs, verbs as methods: GET /todos, POST /todos, PATCH /todos/42, DELETE /todos/42. Return proper status codes (201, 404, 409).',
      scenario: 'api-design',
      tags: ['rest', 'http'],
      requirements: ['Consistent JSON shapes', 'Error body with a code and message'],
      whenToUse: 'The baseline for most public and internal APIs.',
    },
    {
      id: 'api-solution-pagination',
      type: 'solution',
      title: 'Cursor pagination',
      summary:
        'Return 50 items plus a next_cursor (e.g. the last item\'s id). The client sends it back for the next page.',
      scenario: 'api-design',
      tags: ['pagination', 'performance'],
      requirements: ['Stable sort order', 'Index on the cursor column'],
      whenToUse: 'Lists can be long or change while the user scrolls.',
      tradeoffs: ['Cannot jump straight to page 37'],
    },
    {
      id: 'api-solution-versioning',
      type: 'solution',
      title: 'Versioning and additive changes',
      summary:
        'Only add fields; never rename or remove them in place. For breaking changes, publish /v2 and keep /v1 running for a while.',
      scenario: 'api-design',
      tags: ['versioning', 'compatibility'],
      requirements: ['Deprecation schedule', 'Clients ignore unknown fields'],
      whenToUse: 'Clients you do not control (mobile apps, partners).',
    },
    {
      id: 'api-solution-idempotency',
      type: 'solution',
      title: 'Safe retries with idempotency keys',
      summary:
        'GET, PUT, and DELETE are naturally safe to repeat. For POST, the client sends an Idempotency-Key so a retry does not create a duplicate.',
      scenario: 'api-design',
      tags: ['idempotency', 'reliability'],
      requirements: ['Store key → response for ~24h'],
      whenToUse: 'Mobile networks drop responses and apps retry.',
    },
    {
      id: 'api-blocker-offset',
      type: 'blocker',
      title: 'OFFSET pagination gets slow and skips items',
      summary:
        'LIMIT 50 OFFSET 100000 makes the database read and discard 100k rows; inserts while scrolling cause duplicates or gaps.',
      scenario: 'api-design',
      tags: ['pagination', 'performance'],
      requirements: ['Switch to cursor pagination for long lists'],
    },
    {
      id: 'api-blocker-chatty',
      type: 'blocker',
      title: 'Too many round trips',
      summary:
        'A screen needs the list, each item\'s tags, and the owner, causing dozens of calls over a slow mobile link.',
      scenario: 'api-design',
      tags: ['latency', 'n-plus-one'],
      requirements: ['Embed related data (?include=tags)', 'Or a dedicated endpoint per screen'],
    },
    {
      id: 'api-blocker-breaking',
      type: 'blocker',
      title: 'Accidental breaking change',
      summary:
        'Renaming due_date to dueAt crashes every app version that has not updated yet.',
      scenario: 'api-design',
      tags: ['compatibility', 'testing'],
      requirements: ['Contract tests', 'Published API schema (OpenAPI)'],
    },
  ],
  edges: [
    { id: 'e-api-1', source: 'api-challenge', target: 'api-solution-resources', relation: 'addresses' },
    { id: 'e-api-2', source: 'api-solution-resources', target: 'api-solution-pagination', relation: 'enables' },
    { id: 'e-api-3', source: 'api-challenge', target: 'api-solution-versioning', relation: 'addresses' },
    { id: 'e-api-4', source: 'api-solution-resources', target: 'api-solution-idempotency', relation: 'enables' },
    { id: 'e-api-5', source: 'api-solution-pagination', target: 'api-blocker-offset', relation: 'addresses' },
    { id: 'e-api-6', source: 'api-solution-resources', target: 'api-blocker-chatty', relation: 'blocked_by' },
    { id: 'e-api-7', source: 'api-solution-versioning', target: 'api-blocker-breaking', relation: 'blocked_by' },
  ],
}
