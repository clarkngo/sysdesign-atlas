import type { ScenarioBundle } from '../types'

export const lmsAssignmentDeadline: ScenarioBundle = {
  meta: {
    id: 'lms-assignment-deadline',
    label: 'Quizzes & submissions',
    blurb: 'Handle timed quizzes and assignment uploads when everyone submits at 11:59 PM.',
    difficulty: 'intermediate',
  },
  nodes: [
    {
      id: 'ad-challenge',
      type: 'challenge',
      title: 'Survive the deadline rush',
      summary:
        'Thousands of students start a timed midterm at 9:00 or upload essays in the last five minutes before midnight. No answer or file may be lost.',
      scenario: 'lms-assignment-deadline',
      tags: ['spiky-traffic', 'durability', 'time'],
      requirements: [
        'Zero lost answers or submissions',
        'Server, not client, decides on-time vs late',
        'Quiz timers are fair even if the page reloads',
      ],
      scaleHint: '~20k students in one exam window · 50× normal traffic at deadlines',
    },
    {
      id: 'ad-solution-autosave',
      type: 'solution',
      title: 'Autosave each quiz answer',
      summary:
        'Save every answer to the server as the student goes (debounced), keyed by attempt and question. Final submit just locks the attempt.',
      scenario: 'lms-assignment-deadline',
      tags: ['autosave', 'idempotency'],
      requirements: ['Upsert on (attempt, question)', 'Local backup in browser storage'],
      whenToUse: 'Browsers crash and Wi-Fi drops mid-exam.',
      tradeoffs: ['Many small writes during the exam'],
    },
    {
      id: 'ad-solution-server-time',
      type: 'solution',
      title: 'Server-side attempt clock',
      summary:
        'Store attempt start time and allowed duration on the server. The client timer is display only; the server rejects or flags answers after the end.',
      scenario: 'lms-assignment-deadline',
      tags: ['time', 'fairness'],
      requirements: ['started_at + time limit per attempt', 'Per-student accommodations (extra time)'],
      whenToUse: 'Students can change device clocks or reload to reset a timer.',
    },
    {
      id: 'ad-solution-receipt',
      type: 'solution',
      title: 'Upload to storage, then record with a timestamp',
      summary:
        'Files go directly to object storage via presigned URL. The server records the submission time when the upload starts and returns a receipt.',
      scenario: 'lms-assignment-deadline',
      tags: ['object-storage', 'upload'],
      requirements: ['Receipt id + timestamp shown to student', 'Checksum on completion'],
      whenToUse: 'Big files at the deadline would overload app servers.',
    },
    {
      id: 'ad-solution-scale',
      type: 'solution',
      title: 'Pre-scale for known exam windows',
      summary:
        'Exam and due times are on the calendar. Scale app servers and DB connections up before them instead of reacting after load hits.',
      scenario: 'lms-assignment-deadline',
      tags: ['autoscaling', 'capacity'],
      requirements: ['Scheduled scaling from the course calendar', 'Load test at expected peak'],
      whenToUse: 'Reactive autoscaling is minutes too slow for a 9:00 sharp start.',
    },
    {
      id: 'ad-solution-async-grade',
      type: 'solution',
      title: 'Auto-grade in background workers',
      summary:
        'On submit, enqueue grading for multiple-choice and code questions. Students see "submitted" immediately; scores appear later.',
      scenario: 'lms-assignment-deadline',
      tags: ['queue', 'async'],
      requirements: ['Idempotent grading job', 'Retry + dead-letter queue'],
      whenToUse: 'Grading work would slow down the submit request at peak.',
    },
    {
      id: 'ad-blocker-boundary',
      type: 'blocker',
      title: 'Disputes at 11:59:59',
      summary:
        'A slow upload finishes at 12:00:03. Was it late? Students and instructors disagree.',
      scenario: 'lms-assignment-deadline',
      tags: ['time', 'policy'],
      requirements: ['Clear rule: start time counts', 'Grace period configurable per course'],
    },
    {
      id: 'ad-blocker-hotrows',
      type: 'blocker',
      title: 'Hot rows on one exam',
      summary:
        'Every student writes to the same quiz and attempt tables at once, causing lock waits and connection pool exhaustion.',
      scenario: 'lms-assignment-deadline',
      tags: ['database', 'contention'],
      requirements: ['Partition by attempt id', 'Connection pooler (e.g. PgBouncer)'],
    },
    {
      id: 'ad-blocker-cheating',
      type: 'blocker',
      title: 'Answer sharing during the exam',
      summary:
        'Same questions in the same order make it easy to share answers in a group chat.',
      scenario: 'lms-assignment-deadline',
      tags: ['integrity', 'product'],
      requirements: ['Question pools + shuffled order', 'Seed stored per attempt for regrades'],
    },
  ],
  edges: [
    { id: 'e-ad-1', source: 'ad-challenge', target: 'ad-solution-autosave', relation: 'addresses' },
    { id: 'e-ad-2', source: 'ad-challenge', target: 'ad-solution-server-time', relation: 'addresses' },
    { id: 'e-ad-3', source: 'ad-challenge', target: 'ad-solution-receipt', relation: 'addresses' },
    { id: 'e-ad-4', source: 'ad-challenge', target: 'ad-solution-scale', relation: 'addresses' },
    { id: 'e-ad-5', source: 'ad-solution-autosave', target: 'ad-solution-async-grade', relation: 'enables' },
    { id: 'e-ad-6', source: 'ad-solution-receipt', target: 'ad-blocker-boundary', relation: 'blocked_by' },
    { id: 'e-ad-7', source: 'ad-solution-autosave', target: 'ad-blocker-hotrows', relation: 'blocked_by' },
    { id: 'e-ad-8', source: 'ad-solution-server-time', target: 'ad-blocker-cheating', relation: 'blocked_by' },
    { id: 'e-ad-9', source: 'ad-solution-scale', target: 'ad-blocker-hotrows', relation: 'addresses' },
  ],
}
