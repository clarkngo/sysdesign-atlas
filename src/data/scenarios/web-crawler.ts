import type { ScenarioBundle } from '../types'

export const webCrawler: ScenarioBundle = {
  meta: {
    id: 'web-crawler',
    label: 'Web crawler',
    blurb: 'Download pages, follow their links, and do it politely without visiting a page twice.',
    difficulty: 'intro',
  },
  nodes: [
    {
      id: 'wc-challenge',
      type: 'challenge',
      title: 'Crawl a large slice of the web',
      summary:
        'Start from a list of seed URLs, download each page, extract its links, and keep going, storing pages for a search index.',
      scenario: 'web-crawler',
      tags: ['crawler', 'queue', 'batch'],
      requirements: [
        'Do not fetch the same URL twice in a cycle',
        'Never overload any one website',
        'Keep running when some workers crash',
      ],
      scaleHint: '~1B pages/month · ~400 pages/sec',
    },
    {
      id: 'wc-solution-frontier',
      type: 'solution',
      title: 'URL frontier queue',
      summary:
        'A queue of URLs waiting to be fetched. Workers pull a URL, download it, and push newly found links back in (breadth-first search).',
      scenario: 'web-crawler',
      tags: ['queue', 'bfs'],
      requirements: ['Durable queue', 'Priority by page importance'],
      whenToUse: 'The core loop of any crawler.',
    },
    {
      id: 'wc-solution-seen',
      type: 'solution',
      title: 'Seen-URL set (Bloom filter)',
      summary:
        'Before enqueueing, check whether the URL was already seen. A Bloom filter does this in little memory, with rare false "seen" answers.',
      scenario: 'web-crawler',
      tags: ['dedup', 'bloom-filter'],
      requirements: ['Normalize URLs first (lowercase host, strip fragments)'],
      whenToUse: 'Billions of URLs will not fit in a plain hash set.',
      tradeoffs: ['A few pages are skipped by false positives'],
    },
    {
      id: 'wc-solution-polite',
      type: 'solution',
      title: 'Per-host politeness queues',
      summary:
        'Group URLs by host and allow only one request per host every second or so. Obey robots.txt.',
      scenario: 'web-crawler',
      tags: ['politeness', 'rate-limit'],
      requirements: ['robots.txt cache per host', 'Delay per host'],
      whenToUse: 'Always: crawling too fast looks like an attack.',
      tradeoffs: ['Big sites take a long time to crawl'],
    },
    {
      id: 'wc-solution-workers',
      type: 'solution',
      title: 'Stateless fetcher workers',
      summary:
        'Many workers fetch in parallel and store raw pages in object storage. A crashed worker\'s URLs return to the queue.',
      scenario: 'web-crawler',
      tags: ['workers', 'horizontal-scaling'],
      requirements: ['Visibility timeout on queue items', 'Timeouts on slow sites'],
      whenToUse: 'One machine cannot fetch fast enough.',
    },
    {
      id: 'wc-blocker-trap',
      type: 'blocker',
      title: 'Crawler traps',
      summary:
        'A calendar with endless "next month" links or URL session ids creates infinite unique URLs.',
      scenario: 'web-crawler',
      tags: ['traps', 'robustness'],
      requirements: ['Max depth and max pages per host', 'Max URL length'],
    },
    {
      id: 'wc-blocker-dupe-content',
      type: 'blocker',
      title: 'Same content, different URLs',
      summary:
        'Mirrors and tracking parameters make the same page appear under many URLs, wasting storage.',
      scenario: 'web-crawler',
      tags: ['dedup', 'hashing'],
      requirements: ['Hash page content', 'Skip storing duplicates'],
    },
    {
      id: 'wc-blocker-dns',
      type: 'blocker',
      title: 'DNS lookups slow everything down',
      summary:
        'Every new host needs a DNS lookup; a slow resolver stalls all workers.',
      scenario: 'web-crawler',
      tags: ['dns', 'latency'],
      requirements: ['Local DNS cache', 'Async resolution'],
    },
  ],
  edges: [
    { id: 'e-wc-1', source: 'wc-challenge', target: 'wc-solution-frontier', relation: 'addresses' },
    { id: 'e-wc-2', source: 'wc-solution-seen', target: 'wc-solution-frontier', relation: 'enables' },
    { id: 'e-wc-3', source: 'wc-solution-frontier', target: 'wc-solution-polite', relation: 'enables' },
    { id: 'e-wc-4', source: 'wc-challenge', target: 'wc-solution-workers', relation: 'addresses' },
    { id: 'e-wc-5', source: 'wc-solution-polite', target: 'wc-solution-workers', relation: 'trades_off_with' },
    { id: 'e-wc-6', source: 'wc-solution-frontier', target: 'wc-blocker-trap', relation: 'blocked_by' },
    { id: 'e-wc-7', source: 'wc-solution-seen', target: 'wc-blocker-dupe-content', relation: 'blocked_by' },
    { id: 'e-wc-8', source: 'wc-solution-workers', target: 'wc-blocker-dns', relation: 'blocked_by' },
  ],
}
