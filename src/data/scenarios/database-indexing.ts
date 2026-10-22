import type { ScenarioBundle } from '../types'

export const databaseIndexing: ScenarioBundle = {
  meta: {
    id: 'database-indexing',
    label: 'Database indexes',
    blurb: 'Turn a slow query that reads every row into one that jumps straight to the answer.',
    difficulty: 'intro',
  },
  nodes: [
    {
      id: 'ix-challenge',
      type: 'challenge',
      title: 'A query got slow as the table grew',
      summary:
        '"Show this user\'s 20 latest orders" was instant with 10k rows. With 50M rows it takes seconds, because the database reads the whole table.',
      scenario: 'database-indexing',
      tags: ['database', 'indexes', 'fundamentals'],
      requirements: [
        'Common queries under ~10ms',
        'Writes stay fast',
        'Know why a query is slow, not guess',
      ],
      scaleHint: '~50M rows · ~2k queries/sec',
    },
    {
      id: 'ix-solution-explain',
      type: 'solution',
      title: 'Read the query plan (EXPLAIN)',
      summary:
        'Ask the database how it will run the query. "Seq Scan" or "full table scan" over millions of rows is the usual culprit.',
      scenario: 'database-indexing',
      tags: ['explain', 'debugging'],
      requirements: ['Slow query log enabled', 'EXPLAIN ANALYZE on real data sizes'],
      whenToUse: 'Always the first step before adding anything.',
    },
    {
      id: 'ix-solution-btree',
      type: 'solution',
      title: 'B-tree index on the filter column',
      summary:
        'An index is a sorted copy of one or more columns with pointers to rows, like a book\'s index. Lookups become a few page reads instead of millions.',
      scenario: 'database-indexing',
      tags: ['b-tree', 'indexes'],
      requirements: ['Index the columns in WHERE and JOIN'],
      whenToUse: 'A query filters on a column with many distinct values (user_id, email).',
      tradeoffs: ['Extra disk space', 'Every insert/update also updates the index'],
    },
    {
      id: 'ix-solution-composite',
      type: 'solution',
      title: 'Composite index matching the query',
      summary:
        'Index (user_id, created_at) so the database finds one user\'s rows already sorted by date. Column order matters: equality filters first, then sort/range.',
      scenario: 'database-indexing',
      tags: ['composite-index', 'sorting'],
      requirements: ['Leftmost columns must appear in the query'],
      whenToUse: 'Queries filter on one column and sort or range on another.',
    },
    {
      id: 'ix-solution-covering',
      type: 'solution',
      title: 'Covering index',
      summary:
        'Include every column the query needs in the index, so the database answers from the index alone without visiting the table.',
      scenario: 'database-indexing',
      tags: ['covering-index', 'performance'],
      requirements: ['INCLUDE columns or add them to the index'],
      whenToUse: 'A very hot query reads only a few columns.',
      tradeoffs: ['Bigger index'],
    },
    {
      id: 'ix-blocker-writes',
      type: 'blocker',
      title: 'Too many indexes slow down writes',
      summary:
        'Each index must be updated on every insert. Ten indexes on a busy table can make writes several times slower.',
      scenario: 'database-indexing',
      tags: ['write-amplification', 'tradeoff'],
      requirements: ['Drop unused indexes', 'Check index usage stats'],
    },
    {
      id: 'ix-blocker-selectivity',
      type: 'blocker',
      title: 'Index ignored on low-variety columns',
      summary:
        'An index on status (only "active"/"inactive") rarely helps: half the table matches, so a full scan is cheaper.',
      scenario: 'database-indexing',
      tags: ['selectivity', 'query-planner'],
      requirements: ['Index high-variety columns', 'Partial index for the rare value'],
    },
    {
      id: 'ix-blocker-functions',
      type: 'blocker',
      title: 'Query wraps the column in a function',
      summary:
        'WHERE LOWER(email) = ? or a leading wildcard LIKE \'%gmail\' cannot use a normal index on email.',
      scenario: 'database-indexing',
      tags: ['query-design'],
      requirements: ['Expression index', 'Store a normalized column'],
    },
  ],
  edges: [
    { id: 'e-ix-1', source: 'ix-challenge', target: 'ix-solution-explain', relation: 'addresses' },
    { id: 'e-ix-2', source: 'ix-solution-explain', target: 'ix-solution-btree', relation: 'enables' },
    { id: 'e-ix-3', source: 'ix-solution-btree', target: 'ix-solution-composite', relation: 'enables' },
    { id: 'e-ix-4', source: 'ix-solution-composite', target: 'ix-solution-covering', relation: 'enables' },
    { id: 'e-ix-5', source: 'ix-solution-btree', target: 'ix-blocker-writes', relation: 'blocked_by' },
    { id: 'e-ix-6', source: 'ix-solution-btree', target: 'ix-blocker-selectivity', relation: 'blocked_by' },
    { id: 'e-ix-7', source: 'ix-solution-btree', target: 'ix-blocker-functions', relation: 'blocked_by' },
    { id: 'e-ix-8', source: 'ix-solution-covering', target: 'ix-blocker-writes', relation: 'blocked_by' },
  ],
}
