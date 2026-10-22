import type { ScenarioBundle } from '../types'

export const monitoringBasics: ScenarioBundle = {
  meta: {
    id: 'monitoring-basics',
    label: 'Monitoring & alerts',
    blurb: 'Know your service is broken before users tell you, and find out why quickly.',
    difficulty: 'intro',
  },
  nodes: [
    {
      id: 'mo-challenge',
      type: 'challenge',
      title: 'Find problems before users do',
      summary:
        'A checkout service sometimes slows down or errors. The team learns about it from angry tweets and then spends hours guessing the cause.',
      scenario: 'monitoring-basics',
      tags: ['observability', 'operations', 'fundamentals'],
      requirements: [
        'Alert within minutes of user impact',
        'Find the failing component quickly',
        'Few false alarms at 3 AM',
      ],
      scaleHint: '~20 services · ~2k RPS',
    },
    {
      id: 'mo-solution-health',
      type: 'solution',
      title: 'Health checks',
      summary:
        'Each service exposes /health. Load balancers stop sending traffic to instances that fail it, and orchestrators restart them.',
      scenario: 'monitoring-basics',
      tags: ['health-check', 'availability'],
      requirements: ['Liveness vs readiness checks', 'Checks are cheap and fast'],
      whenToUse: 'Every service behind a load balancer.',
    },
    {
      id: 'mo-solution-metrics',
      type: 'solution',
      title: 'Golden-signal metrics',
      summary:
        'Track rate, errors, latency (p50/p99), and saturation for each service on dashboards (e.g. Prometheus + Grafana).',
      scenario: 'monitoring-basics',
      tags: ['metrics', 'dashboards'],
      requirements: ['Percentiles, not just averages', 'Per-endpoint breakdown'],
      whenToUse: 'Seeing at a glance whether things are healthy.',
    },
    {
      id: 'mo-solution-logs-traces',
      type: 'solution',
      title: 'Structured logs + distributed tracing',
      summary:
        'Log JSON with a request id, and pass that id across services. A trace shows which hop in a request was slow or failed.',
      scenario: 'monitoring-basics',
      tags: ['logging', 'tracing'],
      requirements: ['Request/trace id on every log line', 'Central log search'],
      whenToUse: 'A request crosses several services and you need to see where it broke.',
    },
    {
      id: 'mo-solution-slo',
      type: 'solution',
      title: 'Alert on user-facing SLOs',
      summary:
        'Set a goal like "99.9% of checkouts succeed within 1s". Page someone only when that goal is being burned through, not for every CPU spike.',
      scenario: 'monitoring-basics',
      tags: ['slo', 'alerting'],
      requirements: ['Error budget', 'Runbook linked from each alert'],
      whenToUse: 'Alerts are noisy and people start ignoring them.',
    },
    {
      id: 'mo-blocker-fatigue',
      type: 'blocker',
      title: 'Alert fatigue',
      summary:
        'Hundreds of alerts fire for things users never notice, so the real one gets missed.',
      scenario: 'monitoring-basics',
      tags: ['alerting', 'on-call'],
      requirements: ['Delete alerts nobody acts on', 'Group related alerts'],
    },
    {
      id: 'mo-blocker-shallow',
      type: 'blocker',
      title: 'Health check says OK while users fail',
      summary:
        '/health returns 200 because the process is up, but the database it needs is unreachable.',
      scenario: 'monitoring-basics',
      tags: ['health-check', 'false-positive'],
      requirements: ['Readiness checks key dependencies', 'Synthetic user-journey checks'],
    },
    {
      id: 'mo-blocker-cost',
      type: 'blocker',
      title: 'Log and metric costs explode',
      summary:
        'Logging every request in full and tagging metrics by user id creates huge storage bills.',
      scenario: 'monitoring-basics',
      tags: ['cost', 'cardinality'],
      requirements: ['Sample traces', 'Avoid high-cardinality labels', 'Retention limits'],
    },
  ],
  edges: [
    { id: 'e-mo-1', source: 'mo-challenge', target: 'mo-solution-health', relation: 'addresses' },
    { id: 'e-mo-2', source: 'mo-challenge', target: 'mo-solution-metrics', relation: 'addresses' },
    { id: 'e-mo-3', source: 'mo-challenge', target: 'mo-solution-logs-traces', relation: 'addresses' },
    { id: 'e-mo-4', source: 'mo-solution-metrics', target: 'mo-solution-slo', relation: 'enables' },
    { id: 'e-mo-5', source: 'mo-solution-slo', target: 'mo-blocker-fatigue', relation: 'addresses' },
    { id: 'e-mo-6', source: 'mo-solution-metrics', target: 'mo-blocker-fatigue', relation: 'blocked_by' },
    { id: 'e-mo-7', source: 'mo-solution-health', target: 'mo-blocker-shallow', relation: 'blocked_by' },
    { id: 'e-mo-8', source: 'mo-solution-logs-traces', target: 'mo-blocker-cost', relation: 'blocked_by' },
  ],
}
