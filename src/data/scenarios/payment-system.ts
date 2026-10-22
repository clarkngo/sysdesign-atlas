import type { ScenarioBundle } from '../types'

export const paymentSystem: ScenarioBundle = {
  meta: {
    id: 'payment-system',
    label: 'Payment system',
    blurb: 'Move money correctly across services and an outside payment provider.',
    difficulty: 'intermediate',
  },
  nodes: [
    {
      id: 'pay-challenge',
      type: 'challenge',
      title: 'Charge exactly once, never lose a cent',
      summary:
        'Checkout reserves inventory, charges the card through a payment provider, and creates the order. These live in different services and can each fail.',
      scenario: 'payment-system',
      tags: ['payments', 'consistency', 'distributed-transactions'],
      requirements: [
        'A customer is charged at most once per order',
        'Every cent is accounted for',
        'A failure halfway leaves no money in limbo',
      ],
      scaleHint: '~2M payments/day · ~500 TPS peak',
    },
    {
      id: 'pay-solution-ledger',
      type: 'solution',
      title: 'Double-entry ledger',
      summary:
        'Record every money movement as a pair of entries (debit one account, credit another) that always sum to zero. Entries are never edited, only reversed by new entries.',
      scenario: 'payment-system',
      tags: ['ledger', 'accounting', 'append-only'],
      requirements: ['Append-only table', 'Balances computed from entries'],
      whenToUse: 'Any system that holds or moves money.',
    },
    {
      id: 'pay-solution-idempotency',
      type: 'solution',
      title: 'Idempotency keys end to end',
      summary:
        'Each payment attempt carries a unique key that is stored and also passed to the provider, so retries after timeouts never create a second charge.',
      scenario: 'payment-system',
      tags: ['idempotency', 'retries'],
      requirements: ['Unique constraint on key', 'Same key on every retry'],
      whenToUse: 'Network timeouts leave you unsure whether a charge happened.',
    },
    {
      id: 'pay-solution-saga',
      type: 'solution',
      title: 'Saga with compensating steps',
      summary:
        'Run reserve → charge → create order as separate local steps. If a later step fails, run undo steps in reverse (refund, release stock) instead of a global transaction.',
      scenario: 'payment-system',
      tags: ['saga', 'orchestration', 'distributed-transactions'],
      requirements: ['Orchestrator that records step state', 'An undo action for every step'],
      whenToUse: 'One database transaction cannot span several services and a provider.',
      tradeoffs: ['Brief windows where the system is in between states'],
    },
    {
      id: 'pay-solution-webhooks',
      type: 'solution',
      title: 'Provider webhooks + status polling',
      summary:
        'Payment providers report final results asynchronously. Verify signed webhooks, and poll for payments still pending after a deadline.',
      scenario: 'payment-system',
      tags: ['webhooks', 'async'],
      requirements: ['Signature verification', 'Dedupe repeated webhooks'],
      whenToUse: 'Card authorizations, 3-D Secure, and bank transfers finish later.',
    },
    {
      id: 'pay-solution-reconcile',
      type: 'solution',
      title: 'Daily reconciliation',
      summary:
        'Compare your ledger with the provider\'s settlement reports every day and flag any mismatch for review.',
      scenario: 'payment-system',
      tags: ['reconciliation', 'batch', 'audit'],
      requirements: ['Settlement file import', 'Mismatch queue for finance'],
      whenToUse: 'Always: bugs and provider errors happen; this is how you catch them.',
    },
    {
      id: 'pay-blocker-unknown',
      type: 'blocker',
      title: 'Timeout: did the charge go through?',
      summary:
        'The call to the provider times out. Retrying blindly may double-charge; giving up may lose a real payment.',
      scenario: 'payment-system',
      tags: ['timeouts', 'uncertainty'],
      requirements: ['Mark as "unknown" and query the provider', 'Retry only with the same key'],
    },
    {
      id: 'pay-blocker-compensation',
      type: 'blocker',
      title: 'An undo step fails too',
      summary:
        'The order step failed and the automatic refund is rejected because the card was closed.',
      scenario: 'payment-system',
      tags: ['saga', 'operations'],
      requirements: ['Retry compensations', 'Escalate to a manual queue'],
    },
    {
      id: 'pay-blocker-floats',
      type: 'blocker',
      title: 'Rounding errors in money math',
      summary:
        'Storing amounts as floating-point numbers makes 0.1 + 0.2 ≠ 0.3, and cents drift.',
      scenario: 'payment-system',
      tags: ['correctness', 'data-types'],
      requirements: ['Integer minor units (cents) or decimal types', 'Store currency with amount'],
    },
  ],
  edges: [
    { id: 'e-pay-1', source: 'pay-challenge', target: 'pay-solution-ledger', relation: 'addresses' },
    { id: 'e-pay-2', source: 'pay-challenge', target: 'pay-solution-idempotency', relation: 'addresses' },
    { id: 'e-pay-3', source: 'pay-challenge', target: 'pay-solution-saga', relation: 'addresses' },
    { id: 'e-pay-4', source: 'pay-solution-idempotency', target: 'pay-solution-saga', relation: 'enables' },
    { id: 'e-pay-5', source: 'pay-solution-saga', target: 'pay-solution-webhooks', relation: 'enables' },
    { id: 'e-pay-6', source: 'pay-solution-ledger', target: 'pay-solution-reconcile', relation: 'enables' },
    { id: 'e-pay-7', source: 'pay-solution-idempotency', target: 'pay-blocker-unknown', relation: 'blocked_by' },
    { id: 'e-pay-8', source: 'pay-solution-webhooks', target: 'pay-blocker-unknown', relation: 'addresses' },
    { id: 'e-pay-9', source: 'pay-solution-saga', target: 'pay-blocker-compensation', relation: 'blocked_by' },
    { id: 'e-pay-10', source: 'pay-solution-ledger', target: 'pay-blocker-floats', relation: 'blocked_by' },
  ],
}
