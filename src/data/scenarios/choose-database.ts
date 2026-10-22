import type { ScenarioBundle } from '../types'

export const chooseDatabase: ScenarioBundle = {
  meta: {
    id: 'choose-database',
    label: 'SQL vs NoSQL',
    blurb: 'Pick the right kind of database by looking at your data and how you will query it.',
    difficulty: 'intro',
  },
  nodes: [
    {
      id: 'db-challenge',
      type: 'challenge',
      title: 'Which database should a new app use?',
      summary:
        'A shopping app stores users, products, orders, carts, and click events. Each kind of data is read and written differently.',
      scenario: 'choose-database',
      tags: ['database', 'data-modeling', 'fundamentals'],
      requirements: [
        'Orders and payments must be correct',
        'Product pages read fast',
        'Click events arrive in huge volume',
      ],
      scaleHint: '~1M users · ~5k orders/day · ~50M events/day',
    },
    {
      id: 'db-solution-sql',
      type: 'solution',
      title: 'Relational database (SQL)',
      summary:
        'Tables with a fixed schema, joins, and ACID transactions (e.g. PostgreSQL, MySQL). Great for related data where correctness matters.',
      scenario: 'choose-database',
      tags: ['sql', 'acid', 'joins'],
      requirements: ['Schema migrations', 'Indexes for common queries'],
      whenToUse: 'The default for most apps, and always for money and inventory.',
      tradeoffs: ['Scaling writes past one machine takes work'],
    },
    {
      id: 'db-solution-document',
      type: 'solution',
      title: 'Document store',
      summary:
        'Store each record as a JSON-like document (e.g. MongoDB, DynamoDB). Fields can vary, and one read returns the whole object.',
      scenario: 'choose-database',
      tags: ['nosql', 'document'],
      requirements: ['Design around access patterns up front'],
      whenToUse: 'Self-contained records with flexible fields, like product catalogs.',
      tradeoffs: ['Joins and multi-record transactions are limited'],
    },
    {
      id: 'db-solution-kv',
      type: 'solution',
      title: 'Key-value store',
      summary:
        'Get and set by key only (e.g. Redis). Extremely fast, simple, and often kept in memory.',
      scenario: 'choose-database',
      tags: ['nosql', 'key-value', 'cache'],
      requirements: ['Lookups always by a known key'],
      whenToUse: 'Sessions, shopping carts, caches, counters.',
    },
    {
      id: 'db-solution-wide',
      type: 'solution',
      title: 'Wide-column / time-series store',
      summary:
        'Built for very high write rates partitioned by a key and time (e.g. Cassandra, ClickHouse for analytics).',
      scenario: 'choose-database',
      tags: ['nosql', 'write-heavy', 'analytics'],
      requirements: ['Partition key chosen carefully', 'Queries known in advance'],
      whenToUse: 'Event logs, metrics, and other append-heavy data.',
    },
    {
      id: 'db-solution-polyglot',
      type: 'solution',
      title: 'Use more than one, but start with one',
      summary:
        'Start with a relational database. Add a specialized store only when a real need appears (cache, events, search).',
      scenario: 'choose-database',
      tags: ['architecture', 'polyglot-persistence'],
      requirements: ['Clear owner for each piece of data'],
      whenToUse: 'Different data has clearly different needs.',
      tradeoffs: ['Each extra database is more to run and keep in sync'],
    },
    {
      id: 'db-blocker-unknown',
      type: 'blocker',
      title: 'Queries not known yet',
      summary:
        'NoSQL tables are designed around specific queries. A new feature needing a different query may require copying all data.',
      scenario: 'choose-database',
      tags: ['data-modeling', 'flexibility'],
      requirements: ['Prefer SQL while requirements change', 'List access patterns first'],
    },
    {
      id: 'db-blocker-sync',
      type: 'blocker',
      title: 'Keeping two databases in sync',
      summary:
        'Writing to SQL and then to a second store can fail halfway, leaving them disagreeing.',
      scenario: 'choose-database',
      tags: ['consistency', 'dual-write'],
      requirements: ['Change data capture or an outbox table', 'One source of truth'],
    },
  ],
  edges: [
    { id: 'e-db-1', source: 'db-challenge', target: 'db-solution-sql', relation: 'addresses' },
    { id: 'e-db-2', source: 'db-challenge', target: 'db-solution-document', relation: 'addresses' },
    { id: 'e-db-3', source: 'db-challenge', target: 'db-solution-kv', relation: 'addresses' },
    { id: 'e-db-4', source: 'db-challenge', target: 'db-solution-wide', relation: 'addresses' },
    { id: 'e-db-5', source: 'db-solution-sql', target: 'db-solution-document', relation: 'trades_off_with' },
    { id: 'e-db-6', source: 'db-solution-sql', target: 'db-solution-polyglot', relation: 'enables' },
    { id: 'e-db-7', source: 'db-solution-document', target: 'db-blocker-unknown', relation: 'blocked_by' },
    { id: 'e-db-8', source: 'db-solution-wide', target: 'db-blocker-unknown', relation: 'blocked_by' },
    { id: 'e-db-9', source: 'db-solution-polyglot', target: 'db-blocker-sync', relation: 'blocked_by' },
  ],
}
