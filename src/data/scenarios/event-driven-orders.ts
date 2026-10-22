import type { ScenarioBundle } from '../types'

export const eventDrivenOrders: ScenarioBundle = {
  meta: {
    id: 'event-driven-orders',
    label: 'Event-driven orders',
    blurb: 'Let many services react to "order placed" without tightly coupling them together.',
    difficulty: 'intermediate',
  },
  nodes: [
    {
      id: 'ev-challenge',
      type: 'challenge',
      title: 'Many services react to one order',
      summary:
        'When an order is placed, inventory, shipping, email, loyalty points, and analytics all need to know. Calling each one directly makes checkout slow and fragile.',
      scenario: 'event-driven-orders',
      tags: ['events', 'pub-sub', 'decoupling'],
      requirements: [
        'Checkout does not wait on downstream services',
        'No event lost, even if a service is down',
        'New consumers can be added without touching checkout',
      ],
      scaleHint: '~10 consumer services · ~3k orders/min peak',
    },
    {
      id: 'ev-solution-pubsub',
      type: 'solution',
      title: 'Publish events to a topic',
      summary:
        'Checkout publishes OrderPlaced once. Each interested service subscribes with its own consumer group and processes at its own pace.',
      scenario: 'event-driven-orders',
      tags: ['pub-sub', 'topics'],
      requirements: ['Durable topic', 'One consumer group per service'],
      whenToUse: 'Several independent services react to the same fact.',
      tradeoffs: ['Harder to see the full flow than one call chain'],
    },
    {
      id: 'ev-solution-log',
      type: 'solution',
      title: 'Partitioned log (Kafka-style)',
      summary:
        'Events are appended to partitions and kept for days. Consumers track their own offset, can replay history, and keep order within a partition key like order_id.',
      scenario: 'event-driven-orders',
      tags: ['kafka', 'log', 'ordering'],
      requirements: ['Partition by order_id', 'Retention long enough to recover'],
      whenToUse: 'You need replay, per-key ordering, or high throughput.',
    },
    {
      id: 'ev-solution-outbox',
      type: 'solution',
      title: 'Transactional outbox',
      summary:
        'Write the order and an "outbox" event row in the same database transaction. A relay process reads the outbox and publishes to the topic.',
      scenario: 'event-driven-orders',
      tags: ['outbox', 'consistency'],
      requirements: ['Outbox table', 'Relay with retries'],
      whenToUse: 'Saving to the DB and publishing must both happen or neither.',
    },
    {
      id: 'ev-solution-idempotent',
      type: 'solution',
      title: 'Idempotent consumers',
      summary:
        'Delivery is at-least-once, so the same event can arrive twice. Consumers record processed event ids and skip repeats.',
      scenario: 'event-driven-orders',
      tags: ['idempotency', 'at-least-once'],
      requirements: ['Unique event id', 'Processed-ids table or natural upserts'],
      whenToUse: 'Always with message brokers: exactly-once delivery is rare.',
    },
    {
      id: 'ev-solution-schema',
      type: 'solution',
      title: 'Versioned event schemas',
      summary:
        'Define events in a schema registry (Avro/Protobuf/JSON Schema). Only make backward-compatible changes so old consumers keep working.',
      scenario: 'event-driven-orders',
      tags: ['schema', 'compatibility'],
      requirements: ['Compatibility checks in CI'],
      whenToUse: 'Many teams consume the same events.',
    },
    {
      id: 'ev-blocker-dual-write',
      type: 'blocker',
      title: 'Saved but never published',
      summary:
        'Checkout commits the order, then crashes before publishing. Downstream services never hear about it.',
      scenario: 'event-driven-orders',
      tags: ['dual-write', 'consistency'],
      requirements: ['Never publish separately from the DB commit'],
    },
    {
      id: 'ev-blocker-order',
      type: 'blocker',
      title: 'Events arrive out of order',
      summary:
        'OrderCancelled is processed before OrderPlaced because they landed on different partitions.',
      scenario: 'event-driven-orders',
      tags: ['ordering', 'partitions'],
      requirements: ['Same partition key for related events', 'Version numbers on entities'],
    },
    {
      id: 'ev-blocker-poison',
      type: 'blocker',
      title: 'One bad event blocks a partition',
      summary:
        'A malformed event crashes the consumer on every retry, so nothing behind it in the partition is processed.',
      scenario: 'event-driven-orders',
      tags: ['poison-message', 'dlq'],
      requirements: ['Retry limit', 'Dead-letter topic', 'Alert on consumer lag'],
    },
  ],
  edges: [
    { id: 'e-ev-1', source: 'ev-challenge', target: 'ev-solution-pubsub', relation: 'addresses' },
    { id: 'e-ev-2', source: 'ev-solution-log', target: 'ev-solution-pubsub', relation: 'enables' },
    { id: 'e-ev-3', source: 'ev-challenge', target: 'ev-solution-outbox', relation: 'addresses' },
    { id: 'e-ev-4', source: 'ev-solution-pubsub', target: 'ev-solution-idempotent', relation: 'enables' },
    { id: 'e-ev-5', source: 'ev-solution-pubsub', target: 'ev-solution-schema', relation: 'enables' },
    { id: 'e-ev-6', source: 'ev-solution-outbox', target: 'ev-blocker-dual-write', relation: 'addresses' },
    { id: 'e-ev-7', source: 'ev-challenge', target: 'ev-blocker-dual-write', relation: 'blocked_by' },
    { id: 'e-ev-8', source: 'ev-solution-log', target: 'ev-blocker-order', relation: 'blocked_by' },
    { id: 'e-ev-9', source: 'ev-solution-log', target: 'ev-blocker-poison', relation: 'blocked_by' },
  ],
}
