import type { ScenarioBundle } from '../types'

export const ticketBooking: ScenarioBundle = {
  meta: {
    id: 'ticket-booking',
    label: 'Ticket booking',
    blurb: 'Sell concert seats without ever selling the same seat to two people.',
    difficulty: 'intro',
  },
  nodes: [
    {
      id: 'tb-challenge',
      type: 'challenge',
      title: 'No double-booked seats',
      summary:
        'Fans pick a seat, have a few minutes to pay, and get a ticket. Many fans may click the same seat at the same moment.',
      scenario: 'ticket-booking',
      tags: ['transactions', 'concurrency', 'fundamentals'],
      requirements: [
        'Each seat sold at most once',
        'Held seats are released if payment is not finished',
        'Paying twice must not charge twice',
      ],
      scaleHint: '~50k seats · ~200k fans at on-sale time',
    },
    {
      id: 'tb-solution-txn',
      type: 'solution',
      title: 'Database transaction with a conditional update',
      summary:
        'UPDATE seats SET status=\'held\', holder=me WHERE seat_id=? AND status=\'available\'. If 0 rows changed, someone else got it first.',
      scenario: 'ticket-booking',
      tags: ['transactions', 'acid', 'database'],
      requirements: ['Relational DB with transactions', 'Check rows affected'],
      whenToUse: 'The simplest correct way to claim a single row.',
    },
    {
      id: 'tb-solution-locking',
      type: 'solution',
      title: 'Optimistic vs pessimistic locking',
      summary:
        'Pessimistic: lock the row (SELECT … FOR UPDATE) while deciding. Optimistic: read a version number and only update if it has not changed.',
      scenario: 'ticket-booking',
      tags: ['locking', 'concurrency'],
      requirements: ['Version column (optimistic)', 'Short transactions (pessimistic)'],
      whenToUse: 'Multi-step changes that must see a consistent row.',
      tradeoffs: ['Pessimistic waits under contention; optimistic retries'],
    },
    {
      id: 'tb-solution-hold',
      type: 'solution',
      title: 'Temporary hold with expiry',
      summary:
        'A held seat gets hold_expires_at = now + 10 min. A background job (or the next claim) releases expired holds.',
      scenario: 'ticket-booking',
      tags: ['ttl', 'workflow'],
      requirements: ['Index on hold expiry', 'Treat expired holds as available'],
      whenToUse: 'Payment takes minutes and users often abandon checkout.',
    },
    {
      id: 'tb-solution-idempotent',
      type: 'solution',
      title: 'Idempotency key on payment',
      summary:
        'The client sends a unique key with "pay". If the same key arrives again (double click, retry), return the first result instead of charging again.',
      scenario: 'ticket-booking',
      tags: ['idempotency', 'payments'],
      requirements: ['Store key → result', 'Pass the key to the payment provider'],
      whenToUse: 'Any request that has side effects and may be retried.',
    },
    {
      id: 'tb-blocker-rush',
      type: 'blocker',
      title: 'On-sale rush',
      summary:
        'At 10:00 sharp, hundreds of thousands of fans hit the site and fight over the same rows.',
      scenario: 'ticket-booking',
      tags: ['spiky-traffic', 'contention'],
      requirements: ['Virtual waiting room', 'Let users in at a controlled rate'],
    },
    {
      id: 'tb-blocker-paid-expired',
      type: 'blocker',
      title: 'Payment succeeds after the hold expired',
      summary:
        'The user pays at minute 10:05; the seat was released at 10:00 and sold to someone else.',
      scenario: 'ticket-booking',
      tags: ['consistency', 'payments'],
      requirements: ['Re-check the hold before confirming', 'Automatic refund path'],
    },
  ],
  edges: [
    { id: 'e-tb-1', source: 'tb-challenge', target: 'tb-solution-txn', relation: 'addresses' },
    { id: 'e-tb-2', source: 'tb-solution-txn', target: 'tb-solution-locking', relation: 'enables' },
    { id: 'e-tb-3', source: 'tb-solution-txn', target: 'tb-solution-hold', relation: 'enables' },
    { id: 'e-tb-4', source: 'tb-challenge', target: 'tb-solution-idempotent', relation: 'addresses' },
    { id: 'e-tb-5', source: 'tb-solution-txn', target: 'tb-blocker-rush', relation: 'blocked_by' },
    { id: 'e-tb-6', source: 'tb-solution-hold', target: 'tb-blocker-paid-expired', relation: 'blocked_by' },
    { id: 'e-tb-7', source: 'tb-solution-idempotent', target: 'tb-blocker-paid-expired', relation: 'addresses' },
  ],
}
