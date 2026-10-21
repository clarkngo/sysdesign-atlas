import type { ScenarioBundle } from '../types'

export const realtimeGameServer: ScenarioBundle = {
  meta: {
    id: 'realtime-game-server',
    label: 'Realtime match server',
    blurb: 'Run a 15–20 minute 10-player mobile match that feels instant and resists cheats.',
    difficulty: 'advanced',
  },
  nodes: [
    {
      id: 'gs-challenge',
      type: 'challenge',
      title: 'Smooth 10-player match on mobile networks',
      summary:
        'Ten phones send inputs over flaky Wi-Fi/4G. Every player must see the same fight, react within a frame or two, and survive brief disconnects.',
      scenario: 'realtime-game-server',
      tags: ['netcode', 'udp', 'latency'],
      requirements: [
        'Inputs feel responsive at 60–120ms RTT',
        'All clients agree on outcomes (who hit, who died)',
        'Reconnect mid-match without losing the game',
      ],
      scaleHint: '~200k concurrent matches · 15–30Hz server tick',
    },
    {
      id: 'gs-solution-authoritative',
      type: 'solution',
      title: 'Authoritative dedicated server',
      summary:
        'The server runs the real simulation. Clients send inputs only ("move here", "cast Q"); the server decides results and broadcasts state.',
      scenario: 'realtime-game-server',
      tags: ['authority', 'anti-cheat'],
      requirements: ['Fixed tick loop', 'Server-side validation of every input'],
      whenToUse: 'Competitive games where clients cannot be trusted.',
      tradeoffs: ['Server cost per match', 'Every action waits on a round trip unless predicted'],
    },
    {
      id: 'gs-solution-udp',
      type: 'solution',
      title: 'UDP with selective reliability',
      summary:
        'Send state over UDP so one lost packet does not stall later ones. Resend only what must arrive (ability casts, deaths); drop stale positions.',
      scenario: 'realtime-game-server',
      tags: ['udp', 'protocol'],
      requirements: ['Sequence numbers + acks', 'Redundant sends of recent inputs'],
      whenToUse: 'TCP head-of-line blocking causes visible stutter on lossy mobile links.',
    },
    {
      id: 'gs-solution-prediction',
      type: 'solution',
      title: 'Client prediction + reconciliation',
      summary:
        'The client moves your champion immediately, then corrects smoothly if the server disagrees. Other players are interpolated slightly in the past.',
      scenario: 'realtime-game-server',
      tags: ['netcode', 'prediction', 'interpolation'],
      requirements: ['Deterministic movement code shared by client and server', 'Input history buffer'],
      whenToUse: 'Waiting a full round trip before moving feels sluggish.',
      tradeoffs: ['Occasional rubber-banding on corrections'],
    },
    {
      id: 'gs-solution-lagcomp',
      type: 'solution',
      title: 'Lag compensation for skill shots',
      summary:
        'When a skill-shot input arrives, rewind other players to where the shooter saw them, check the hit, then resume.',
      scenario: 'realtime-game-server',
      tags: ['netcode', 'fairness'],
      requirements: ['Short history of positions per tick', 'Cap on rewind window'],
      whenToUse: 'Players complain that clear hits on their screen missed.',
      tradeoffs: ['Victims can be hit "behind cover" from their view'],
    },
    {
      id: 'gs-solution-fleet',
      type: 'solution',
      title: 'Regional server fleet with allocator',
      summary:
        'Pre-warm pools of match server processes in each region; an allocator hands one out per match and recycles it after.',
      scenario: 'realtime-game-server',
      tags: ['fleet', 'autoscaling', 'regions'],
      requirements: ['Many matches per host', 'Scale on ready-server buffer, not CPU alone'],
      whenToUse: 'Match starts must not wait for a VM to boot.',
    },
    {
      id: 'gs-solution-reconnect',
      type: 'solution',
      title: 'Reconnect with snapshot catch-up',
      summary:
        'Keep the player\'s champion in the match on disconnect. On return, send a full state snapshot, then resume delta updates.',
      scenario: 'realtime-game-server',
      tags: ['resilience', 'mobile'],
      requirements: ['Reconnect token per player per match', 'Grace window before AFK penalty'],
      whenToUse: 'Phones switch networks, take calls, and background the app.',
    },
    {
      id: 'gs-blocker-cheats',
      type: 'blocker',
      title: 'Map hacks and modified clients',
      summary:
        'Even with server authority, sending everyone the full state reveals enemies hidden in fog of war.',
      scenario: 'realtime-game-server',
      tags: ['anti-cheat', 'security'],
      requirements: ['Server-side visibility culling', 'Client integrity checks + report review'],
    },
    {
      id: 'gs-blocker-bandwidth',
      type: 'blocker',
      title: 'Bandwidth and battery on phones',
      summary:
        'Full state at 30Hz for ten champions, minions, and towers burns mobile data and battery.',
      scenario: 'realtime-game-server',
      tags: ['bandwidth', 'mobile'],
      requirements: ['Delta compression', 'Quantized positions', 'Interest management'],
    },
    {
      id: 'gs-blocker-crash',
      type: 'blocker',
      title: 'Server crash mid-match',
      summary:
        'A host dies and ten players lose a ranked game they were winning.',
      scenario: 'realtime-game-server',
      tags: ['reliability', 'state'],
      requirements: ['Void match + no rating loss', 'Spread matches across hosts/zones'],
    },
  ],
  edges: [
    { id: 'e-gs-1', source: 'gs-challenge', target: 'gs-solution-authoritative', relation: 'addresses' },
    { id: 'e-gs-2', source: 'gs-challenge', target: 'gs-solution-udp', relation: 'addresses' },
    { id: 'e-gs-3', source: 'gs-solution-authoritative', target: 'gs-solution-prediction', relation: 'enables' },
    { id: 'e-gs-4', source: 'gs-solution-authoritative', target: 'gs-solution-lagcomp', relation: 'enables' },
    { id: 'e-gs-5', source: 'gs-challenge', target: 'gs-solution-fleet', relation: 'addresses' },
    { id: 'e-gs-6', source: 'gs-solution-authoritative', target: 'gs-solution-reconnect', relation: 'enables' },
    { id: 'e-gs-7', source: 'gs-solution-prediction', target: 'gs-solution-lagcomp', relation: 'trades_off_with' },
    { id: 'e-gs-8', source: 'gs-solution-authoritative', target: 'gs-blocker-cheats', relation: 'blocked_by' },
    { id: 'e-gs-9', source: 'gs-solution-udp', target: 'gs-blocker-bandwidth', relation: 'blocked_by' },
    { id: 'e-gs-10', source: 'gs-solution-fleet', target: 'gs-blocker-crash', relation: 'blocked_by' },
  ],
}
