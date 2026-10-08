import type { ScenarioBundle } from '../types'

export const notificationService: ScenarioBundle = {
  meta: {
    id: 'notification-service',
    label: 'Notification service',
    blurb: 'Send email, SMS, and push messages reliably without spamming users.',
    difficulty: 'intro',
  },
  nodes: [
    {
      id: 'ns-challenge',
      type: 'challenge',
      title: 'Deliver notifications across channels',
      summary:
        'Other services ask to notify a user ("order shipped"). Deliver via email, SMS, or push based on user preferences.',
      scenario: 'notification-service',
      tags: ['queue', 'async', 'third-party'],
      requirements: [
        'Callers never wait on email/SMS providers',
        'No lost notifications; few duplicates',
        'Respect opt-outs and quiet hours',
      ],
      scaleHint: '~20M notifications/day · bursty marketing sends',
    },
    {
      id: 'ns-solution-queue',
      type: 'solution',
      title: 'Accept fast, deliver via queue',
      summary:
        'The API validates the request, writes it to a message queue, and returns 202. Workers do the slow sending.',
      scenario: 'notification-service',
      tags: ['queue', 'decoupling'],
      requirements: ['Durable queue', 'Request id for tracing'],
      whenToUse: 'Downstream providers are slow or flaky and callers need quick responses.',
      tradeoffs: ['Delivery is eventually, not instantly, confirmed'],
    },
    {
      id: 'ns-solution-channels',
      type: 'solution',
      title: 'Per-channel workers',
      summary:
        'Separate queues and workers for email, SMS, and push so a slow SMS provider does not delay emails.',
      scenario: 'notification-service',
      tags: ['isolation', 'workers'],
      requirements: ['Channel router step', 'Independent scaling per channel'],
      whenToUse: 'Channels have very different speeds, costs, and rate limits.',
    },
    {
      id: 'ns-solution-prefs',
      type: 'solution',
      title: 'Preferences + template lookup',
      summary:
        'Before sending, check the user\'s opt-ins, channel choices, and timezone; render a stored template with the event data.',
      scenario: 'notification-service',
      tags: ['preferences', 'templates'],
      requirements: ['Cached preferences', 'Versioned templates'],
      whenToUse: 'Users must control what they receive (often legally required).',
    },
    {
      id: 'ns-solution-retry',
      type: 'solution',
      title: 'Retries with backoff + dead-letter queue',
      summary:
        'Failed sends retry with growing delays; after N attempts they move to a DLQ for inspection.',
      scenario: 'notification-service',
      tags: ['retry', 'reliability', 'dlq'],
      requirements: ['Max attempts', 'Jitter on delay', 'Alert on DLQ growth'],
      whenToUse: 'Third-party providers return transient errors.',
      tradeoffs: ['Retries can produce duplicates'],
    },
    {
      id: 'ns-blocker-dupes',
      type: 'blocker',
      title: 'Duplicate sends',
      summary:
        'A worker sends the email, then crashes before acking; the message is redelivered and the user gets it twice.',
      scenario: 'notification-service',
      tags: ['idempotency', 'at-least-once'],
      requirements: ['Idempotency key per notification', 'Record "sent" before ack'],
    },
    {
      id: 'ns-blocker-provider-limits',
      type: 'blocker',
      title: 'Provider rate limits',
      summary:
        'A marketing blast of millions hits the SMS/email provider\'s per-second cap and gets throttled.',
      scenario: 'notification-service',
      tags: ['rate-limit', 'third-party'],
      requirements: ['Token bucket per provider', 'Priority: transactional before marketing'],
    },
  ],
  edges: [
    { id: 'e-ns-1', source: 'ns-challenge', target: 'ns-solution-queue', relation: 'addresses' },
    { id: 'e-ns-2', source: 'ns-solution-queue', target: 'ns-solution-channels', relation: 'enables' },
    { id: 'e-ns-3', source: 'ns-challenge', target: 'ns-solution-prefs', relation: 'addresses' },
    { id: 'e-ns-4', source: 'ns-solution-queue', target: 'ns-solution-retry', relation: 'enables' },
    { id: 'e-ns-5', source: 'ns-solution-retry', target: 'ns-blocker-dupes', relation: 'blocked_by' },
    { id: 'e-ns-6', source: 'ns-solution-channels', target: 'ns-blocker-provider-limits', relation: 'blocked_by' },
  ],
}
