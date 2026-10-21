import type { ScenarioBundle } from '../types'

export const gameMatchmaking: ScenarioBundle = {
  meta: {
    id: 'game-matchmaking',
    label: 'MOBA matchmaking',
    blurb: 'Group 10 players of similar skill into a fair 5v5 match within seconds.',
    difficulty: 'intermediate',
  },
  nodes: [
    {
      id: 'mm-challenge',
      type: 'challenge',
      title: 'Fast, fair 5v5 matches',
      summary:
        'Players (solo or in parties) queue for ranked or casual. Form two balanced teams of 5 with low ping and short waits, then hand them to a game server.',
      scenario: 'game-matchmaking',
      tags: ['matchmaking', 'skill-rating', 'queue'],
      requirements: [
        'Median queue time under ~60s',
        'Teams balanced by skill and party size',
        'Everyone gets acceptable ping to the chosen region',
      ],
      scaleHint: '~2M concurrent players · ~5k matches formed/min peak',
    },
    {
      id: 'mm-solution-mmr',
      type: 'solution',
      title: 'Hidden skill rating (MMR)',
      summary:
        'Track a numeric skill estimate per player (Elo/Glicko/TrueSkill style) plus uncertainty. Wins raise it, losses lower it; new players move faster.',
      scenario: 'game-matchmaking',
      tags: ['skill-rating', 'ranking'],
      requirements: ['Rating + uncertainty per player per queue', 'Update after each match result'],
      whenToUse: 'Visible ranks (tiers) alone are too coarse to balance teams.',
      tradeoffs: ['Players distrust what they cannot see'],
    },
    {
      id: 'mm-solution-pools',
      type: 'solution',
      title: 'Queue pools by region, mode, and rating band',
      summary:
        'Split waiting tickets into pools (e.g. SEA · ranked · 1400–1600). A matcher only searches inside a pool, keeping work small.',
      scenario: 'game-matchmaking',
      tags: ['partitioning', 'queue'],
      requirements: ['Ticket store per pool (in-memory/Redis)', 'One matcher owner per pool'],
      whenToUse: 'Scanning every waiting player for every match is too slow.',
      tradeoffs: ['Small pools mean long waits'],
    },
    {
      id: 'mm-solution-widen',
      type: 'solution',
      title: 'Widen search over wait time',
      summary:
        'Start strict (±50 MMR, best region). Every few seconds, relax the rating window and allow nearby regions.',
      scenario: 'game-matchmaking',
      tags: ['tuning', 'latency'],
      requirements: ['Per-ticket wait timer', 'Caps on how far it widens'],
      whenToUse: 'Off-peak hours or very high/low ranks with few players.',
      tradeoffs: ['Faster matches but less fair ones'],
    },
    {
      id: 'mm-solution-tick',
      type: 'solution',
      title: 'Batch matcher on a tick',
      summary:
        'Every 1–2s, take a pool snapshot and pick the best set of matches at once, instead of greedily matching each arrival.',
      scenario: 'game-matchmaking',
      tags: ['batch', 'optimization'],
      requirements: ['Scoring function (skill gap, wait, ping)', 'Atomic claim of chosen tickets'],
      whenToUse: 'Greedy first-come matching produces lopsided teams.',
    },
    {
      id: 'mm-solution-handoff',
      type: 'solution',
      title: 'Accept check, then allocate a game server',
      summary:
        'Send all 10 players an accept prompt. When all accept, ask the fleet allocator for a server in the region and send everyone its address + join token.',
      scenario: 'game-matchmaking',
      tags: ['allocation', 'handoff'],
      requirements: ['Accept timeout', 'Return non-decliners to the front of the queue'],
      whenToUse: 'Always: AFK players should not waste a server or a match.',
    },
    {
      id: 'mm-blocker-parties',
      type: 'blocker',
      title: 'Premade parties vs solo players',
      summary:
        'A coordinated 5-stack crushes five solo players of the same average rating.',
      scenario: 'game-matchmaking',
      tags: ['fairness', 'parties'],
      requirements: ['Match party size against party size', 'Rating bonus for premades'],
    },
    {
      id: 'mm-blocker-thin',
      type: 'blocker',
      title: 'Thin pools at the top ranks',
      summary:
        'Only a few hundred top players are online; strict rules mean 10-minute queues.',
      scenario: 'game-matchmaking',
      tags: ['queue-time', 'tuning'],
      requirements: ['Cross-region pools for top tiers', 'Show expected wait honestly'],
    },
    {
      id: 'mm-blocker-double',
      type: 'blocker',
      title: 'Player placed in two matches',
      summary:
        'Two matcher instances claim the same ticket at once, or a dodge leaves a stale ticket behind.',
      scenario: 'game-matchmaking',
      tags: ['concurrency', 'consistency'],
      requirements: ['Compare-and-set claim on tickets', 'Single owner per pool'],
    },
    {
      id: 'mm-blocker-smurf',
      type: 'blocker',
      title: 'Smurfs on new accounts',
      summary:
        'Skilled players on fresh accounts stomp beginners until their rating catches up.',
      scenario: 'game-matchmaking',
      tags: ['fairness', 'skill-rating'],
      requirements: ['High uncertainty → big early rating jumps', 'Performance-based placement'],
    },
  ],
  edges: [
    { id: 'e-mm-1', source: 'mm-challenge', target: 'mm-solution-mmr', relation: 'addresses' },
    { id: 'e-mm-2', source: 'mm-challenge', target: 'mm-solution-pools', relation: 'addresses' },
    { id: 'e-mm-3', source: 'mm-solution-mmr', target: 'mm-solution-pools', relation: 'enables' },
    { id: 'e-mm-4', source: 'mm-solution-pools', target: 'mm-solution-tick', relation: 'enables' },
    { id: 'e-mm-5', source: 'mm-solution-pools', target: 'mm-solution-widen', relation: 'enables' },
    { id: 'e-mm-6', source: 'mm-solution-tick', target: 'mm-solution-handoff', relation: 'enables' },
    { id: 'e-mm-7', source: 'mm-solution-widen', target: 'mm-solution-mmr', relation: 'trades_off_with' },
    { id: 'e-mm-8', source: 'mm-solution-mmr', target: 'mm-blocker-parties', relation: 'blocked_by' },
    { id: 'e-mm-9', source: 'mm-solution-mmr', target: 'mm-blocker-smurf', relation: 'blocked_by' },
    { id: 'e-mm-10', source: 'mm-solution-pools', target: 'mm-blocker-thin', relation: 'blocked_by' },
    { id: 'e-mm-11', source: 'mm-solution-tick', target: 'mm-blocker-double', relation: 'blocked_by' },
  ],
}
