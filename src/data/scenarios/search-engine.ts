import type { ScenarioBundle } from '../types'

export const searchEngine: ScenarioBundle = {
  meta: {
    id: 'search-engine',
    label: 'Full-text search',
    blurb: 'Search millions of documents by keyword and return the most relevant first.',
    difficulty: 'intermediate',
  },
  nodes: [
    {
      id: 'se-challenge',
      type: 'challenge',
      title: 'Keyword search over millions of documents',
      summary:
        'Users search product listings or articles by words. Results must be relevant, typo-tolerant, filterable, and reflect new or edited documents quickly.',
      scenario: 'search-engine',
      tags: ['search', 'inverted-index', 'relevance'],
      requirements: [
        'Results in under ~200ms',
        'Best matches ranked first',
        'New documents searchable within a minute',
      ],
      scaleHint: '~50M documents · ~2k queries/sec',
    },
    {
      id: 'se-solution-inverted',
      type: 'solution',
      title: 'Inverted index',
      summary:
        'Map each word to the list of documents containing it (like a book\'s index). A query intersects the lists for its words instead of scanning every document.',
      scenario: 'search-engine',
      tags: ['inverted-index', 'data-structure'],
      requirements: ['Tokenize text into terms', 'Store positions for phrase queries'],
      whenToUse: 'SQL LIKE \'%word%\' cannot use indexes and scans everything.',
    },
    {
      id: 'se-solution-analysis',
      type: 'solution',
      title: 'Text analysis pipeline',
      summary:
        'Before indexing and querying, lowercase, strip punctuation, stem ("running" → "run"), and handle synonyms, so similar words match.',
      scenario: 'search-engine',
      tags: ['tokenization', 'stemming', 'nlp'],
      requirements: ['Same analyzer at index and query time', 'Per-language rules'],
      whenToUse: 'Users type words differently from how documents phrase them.',
    },
    {
      id: 'se-solution-ranking',
      type: 'solution',
      title: 'Relevance ranking (BM25 + signals)',
      summary:
        'Score documents higher when query words are rare overall but frequent in that document (BM25), then blend in signals like freshness or popularity.',
      scenario: 'search-engine',
      tags: ['ranking', 'bm25', 'relevance'],
      requirements: ['Term statistics per shard', 'Tunable boosts'],
      whenToUse: 'Many documents match and order matters.',
    },
    {
      id: 'se-solution-cluster',
      type: 'solution',
      title: 'Sharded search cluster with replicas',
      summary:
        'Split the index into shards across nodes (e.g. Elasticsearch/OpenSearch). A query fans out to all shards, each returns its top results, and a coordinator merges them.',
      scenario: 'search-engine',
      tags: ['sharding', 'scatter-gather', 'replication'],
      requirements: ['Replicas for read throughput', 'Coordinator merges top-k'],
      whenToUse: 'The index or query load exceeds one machine.',
    },
    {
      id: 'se-solution-sync',
      type: 'solution',
      title: 'Index from a change stream',
      summary:
        'The database stays the source of truth. Changes flow through a stream (change data capture) to indexers that update the search index.',
      scenario: 'search-engine',
      tags: ['cdc', 'stream', 'near-real-time'],
      requirements: ['Ordered changes per document', 'Full reindex job for recovery'],
      whenToUse: 'Search must follow the database without dual writes from the app.',
      tradeoffs: ['Seconds of lag between saving and being searchable'],
    },
    {
      id: 'se-blocker-tail',
      type: 'blocker',
      title: 'One slow shard slows every query',
      summary:
        'A query waits for all shards, so the slowest one sets the response time.',
      scenario: 'search-engine',
      tags: ['tail-latency', 'scatter-gather'],
      requirements: ['Send to the fastest replica', 'Timeouts with partial results'],
    },
    {
      id: 'se-blocker-deep-paging',
      type: 'blocker',
      title: 'Deep pagination is expensive',
      summary:
        'Page 500 means every shard must find its top 10,000 results so the coordinator can pick the right 20.',
      scenario: 'search-engine',
      tags: ['pagination', 'performance'],
      requirements: ['Cap max page depth', 'Search-after cursors'],
    },
    {
      id: 'se-blocker-reindex',
      type: 'blocker',
      title: 'Changing the analyzer means reindexing',
      summary:
        'Adding a synonym or a new language rule requires rebuilding the whole index without downtime.',
      scenario: 'search-engine',
      tags: ['operations', 'migration'],
      requirements: ['Build new index alongside', 'Switch an alias when ready'],
    },
  ],
  edges: [
    { id: 'e-se-1', source: 'se-challenge', target: 'se-solution-inverted', relation: 'addresses' },
    { id: 'e-se-2', source: 'se-solution-analysis', target: 'se-solution-inverted', relation: 'enables' },
    { id: 'e-se-3', source: 'se-solution-inverted', target: 'se-solution-ranking', relation: 'enables' },
    { id: 'e-se-4', source: 'se-challenge', target: 'se-solution-cluster', relation: 'addresses' },
    { id: 'e-se-5', source: 'se-challenge', target: 'se-solution-sync', relation: 'addresses' },
    { id: 'e-se-6', source: 'se-solution-cluster', target: 'se-blocker-tail', relation: 'blocked_by' },
    { id: 'e-se-7', source: 'se-solution-cluster', target: 'se-blocker-deep-paging', relation: 'blocked_by' },
    { id: 'e-se-8', source: 'se-solution-analysis', target: 'se-blocker-reindex', relation: 'blocked_by' },
  ],
}
