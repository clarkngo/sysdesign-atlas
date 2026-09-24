import type { ScenarioBundle } from '../types'

export const realtimeChat: ScenarioBundle = {
  meta: {
    id: 'realtime-chat',
    label: 'Realtime chat',
    blurb: '1:1 and small-group messaging with presence and ordered delivery.',
    difficulty: 'intermediate',
  },
  nodes: [
    {
      id: 'rc-challenge-delivery',
      type: 'challenge',
      title: 'Ordered chat delivery at peak',
      summary:
        'Deliver 1:1 and small-group messages with presence, typing, and at-least-once delivery while connections churn across regions.',
      scenario: 'realtime-chat',
      tags: ['websocket', 'ordering', 'presence'],
      requirements: [
        'Message visible to online peers in < 300ms typical',
        'No lost messages after ack',
        'Presence accurate within a few seconds',
      ],
      scaleHint: '~20M MAU · ~80k concurrent sockets peak',
    },
    {
      id: 'rc-solution-gateway',
      type: 'solution',
      title: 'Sticky websocket gateway tier',
      summary:
        'Edge gateways terminate sockets, authenticate, and route pub/sub by conversation id to downstream chat workers.',
      scenario: 'realtime-chat',
      tags: ['gateway', 'websocket', 'routing'],
      requirements: [
        'Horizontal gateway fleet',
        'Session affinity or reconnect tokens',
      ],
      whenToUse: 'Always — sockets should not terminate on app servers that own business logic alone.',
      tradeoffs: [
        'Sticky sessions complicate deploys',
        'Gateway becomes a critical path',
      ],
    },
    {
      id: 'rc-solution-pubsub',
      type: 'solution',
      title: 'Conversation-keyed pub/sub',
      summary:
        'Publish each message to a channel keyed by conversation; subscribers on any gateway receive fan-in for online members.',
      scenario: 'realtime-chat',
      tags: ['pubsub', 'fan-in', 'redis'],
      requirements: [
        'Pub/sub or streaming bus',
        'Stable conversation → partition mapping',
      ],
      whenToUse: 'Small groups where all online members should see the same stream.',
      tradeoffs: [
        'Bus outage freezes live delivery',
        'Large groups need different fan-out',
      ],
    },
    {
      id: 'rc-solution-log',
      type: 'solution',
      title: 'Append-only message log',
      summary:
        'Persist messages to an ordered log (partitioned by conversation) before ack; clients sync by sequence / cursor.',
      scenario: 'realtime-chat',
      tags: ['storage', 'ordering', 'sync'],
      requirements: [
        'Monotonic sequence per conversation',
        'Durable store with replay',
      ],
      whenToUse: 'Need offline catch-up and dispute-free history.',
      tradeoffs: [
        'Write latency on the critical path',
        'Hot conversations concentrate on one partition',
      ],
      scaleHint: 'Partition by conversation_id',
    },
    {
      id: 'rc-solution-presence',
      type: 'solution',
      title: 'Ephemeral presence store',
      summary:
        'Track online status and last-seen in a fast store with heartbeats; expire keys on missed pings.',
      scenario: 'realtime-chat',
      tags: ['presence', 'ttl', 'heartbeat'],
      requirements: [
        'Heartbeat interval + TTL',
        'Presence change fan-out to interested peers',
      ],
      whenToUse: 'Product surfaces “online” and typing indicators.',
      tradeoffs: [
        'False offline on flaky networks',
        'Heartbeat traffic scales with sockets',
      ],
    },
    {
      id: 'rc-solution-push',
      type: 'solution',
      title: 'Offline push notifications',
      summary:
        'When no active socket exists, enqueue APNs/FCM with collapse keys; deep-link opens the conversation sync path.',
      scenario: 'realtime-chat',
      tags: ['push', 'offline', 'mobile'],
      requirements: [
        'Device token registry',
        'Preference / mute rules',
      ],
      whenToUse: 'Mobile clients spend most time backgrounded.',
      tradeoffs: ['Push provider rate limits', 'Privacy of message previews'],
    },
    {
      id: 'rc-blocker-reorder',
      type: 'blocker',
      title: 'Out-of-order multi-device sync',
      summary:
        'The same user on phone and desktop can race publishes; naive clocks produce confusing history without server sequences.',
      scenario: 'realtime-chat',
      tags: ['ordering', 'multi-device', 'clocks'],
      requirements: [
        'Server-assigned sequence',
        'Client idempotency keys',
      ],
    },
    {
      id: 'rc-blocker-split-brain',
      type: 'blocker',
      title: 'Gateway drain during deploy',
      summary:
        'Rolling deploys drop sticky sockets; without graceful drain and reconnect tokens, users see flapping online status and duplicate sends.',
      scenario: 'realtime-chat',
      tags: ['deploy', 'reconnect', 'gateway'],
      requirements: [
        'Connection drain window',
        'Resume tokens + client backoff',
      ],
    },
    {
      id: 'rc-blocker-hot-room',
      type: 'blocker',
      title: 'Hot conversation partition',
      summary:
        'A viral group chat concentrates writes on one log partition and one pub/sub channel, saturating a single shard.',
      scenario: 'realtime-chat',
      tags: ['hot-key', 'partition', 'scale'],
      requirements: [
        'Backpressure / slow consumers',
        'Group size limits or shard splitting strategy',
      ],
    },
    {
      id: 'rc-blocker-presence-storm',
      type: 'blocker',
      title: 'Presence heartbeat storm',
      summary:
        'Aggressive heartbeats from tens of thousands of sockets flood the presence store and drown real message traffic.',
      scenario: 'realtime-chat',
      tags: ['presence', 'load', 'heartbeat'],
      requirements: [
        'Jittered intervals',
        'Batch presence updates',
      ],
    }
  ],
  edges: [
    {
      id: 'e-rc-1',
      source: 'rc-challenge-delivery',
      target: 'rc-solution-gateway',
      relation: 'addresses',
    },
    {
      id: 'e-rc-2',
      source: 'rc-challenge-delivery',
      target: 'rc-solution-pubsub',
      relation: 'addresses',
    },
    {
      id: 'e-rc-3',
      source: 'rc-challenge-delivery',
      target: 'rc-solution-log',
      relation: 'addresses',
    },
    {
      id: 'e-rc-4',
      source: 'rc-solution-gateway',
      target: 'rc-solution-pubsub',
      relation: 'enables',
    },
    {
      id: 'e-rc-5',
      source: 'rc-solution-log',
      target: 'rc-solution-pubsub',
      relation: 'enables',
    },
    {
      id: 'e-rc-6',
      source: 'rc-challenge-delivery',
      target: 'rc-solution-presence',
      relation: 'addresses',
    },
    {
      id: 'e-rc-7',
      source: 'rc-challenge-delivery',
      target: 'rc-solution-push',
      relation: 'addresses',
    },
    {
      id: 'e-rc-8',
      source: 'rc-solution-gateway',
      target: 'rc-blocker-split-brain',
      relation: 'blocked_by',
    },
    {
      id: 'e-rc-9',
      source: 'rc-solution-log',
      target: 'rc-blocker-reorder',
      relation: 'trades_off_with',
    },
    {
      id: 'e-rc-10',
      source: 'rc-solution-pubsub',
      target: 'rc-blocker-hot-room',
      relation: 'blocked_by',
    },
    {
      id: 'e-rc-11',
      source: 'rc-solution-log',
      target: 'rc-blocker-hot-room',
      relation: 'blocked_by',
    },
    {
      id: 'e-rc-12',
      source: 'rc-solution-presence',
      target: 'rc-blocker-presence-storm',
      relation: 'blocked_by',
    },
    {
      id: 'e-rc-13',
      source: 'rc-solution-push',
      target: 'rc-solution-log',
      relation: 'enables',
    },
  ],
}
