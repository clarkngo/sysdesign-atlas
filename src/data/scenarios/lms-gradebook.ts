import type { ScenarioBundle } from '../types'

export const lmsGradebook: ScenarioBundle = {
  meta: {
    id: 'lms-gradebook',
    label: 'Course gradebook',
    blurb: 'Record grades per assignment and show students correct, private final grades.',
    difficulty: 'intro',
  },
  nodes: [
    {
      id: 'gb-challenge',
      type: 'challenge',
      title: 'Accurate, private grades per course',
      summary:
        'Instructors enter scores for assignments, quizzes, and exams. Students see only their own grades and a weighted course total.',
      scenario: 'lms-gradebook',
      tags: ['database', 'access-control', 'correctness'],
      requirements: [
        'A student never sees another student\'s grade',
        'Totals match the syllabus weighting exactly',
        'Every grade change is traceable',
      ],
      scaleHint: '~5k courses · ~200k students · grade-posting spikes at term end',
    },
    {
      id: 'gb-solution-schema',
      type: 'solution',
      title: 'Relational schema: courses, items, grades',
      summary:
        'Tables for course, enrollment (user + role), grade_item (weight, max points, category), and grade (item, student, score).',
      scenario: 'lms-gradebook',
      tags: ['database', 'schema'],
      requirements: ['Unique (item, student) per grade', 'Foreign keys + transactions'],
      whenToUse: 'Data is highly structured and correctness matters more than raw speed.',
    },
    {
      id: 'gb-solution-rbac',
      type: 'solution',
      title: 'Role-based access per course',
      summary:
        'Permissions come from the user\'s role in that course (instructor, TA, student). Every query filters by course and, for students, by their own id.',
      scenario: 'lms-gradebook',
      tags: ['rbac', 'security'],
      requirements: ['Check enrollment role on every request', 'Deny by default'],
      whenToUse: 'Grades are sensitive student records (e.g. FERPA in the US).',
    },
    {
      id: 'gb-solution-computed',
      type: 'solution',
      title: 'Compute totals from raw scores',
      summary:
        'Store only raw scores and weights. Calculate category and final totals on read (or cache them and recompute on change).',
      scenario: 'lms-gradebook',
      tags: ['derived-data', 'cache'],
      requirements: ['One shared calculation function', 'Recalculate when weights change'],
      whenToUse: 'Instructors change weights or drop lowest scores mid-term.',
      tradeoffs: ['Caching totals risks showing stale numbers'],
    },
    {
      id: 'gb-solution-audit',
      type: 'solution',
      title: 'Append-only grade history',
      summary:
        'Every change writes an audit row (who, when, old → new, reason). The current grade is just the latest entry.',
      scenario: 'lms-gradebook',
      tags: ['audit', 'compliance'],
      requirements: ['No updates/deletes on history rows'],
      whenToUse: 'Grade disputes and academic-integrity reviews.',
    },
    {
      id: 'gb-solution-release',
      type: 'solution',
      title: 'Draft vs released grades',
      summary:
        'Grades stay hidden until the instructor releases the item, so students do not see half-graded batches.',
      scenario: 'lms-gradebook',
      tags: ['workflow', 'visibility'],
      requirements: ['released_at per grade item', 'Notify students on release'],
      whenToUse: 'Instructors grade over several days.',
    },
    {
      id: 'gb-blocker-concurrent',
      type: 'blocker',
      title: 'Two graders overwrite each other',
      summary:
        'An instructor and a TA edit the same score in two tabs; the last save silently wins.',
      scenario: 'lms-gradebook',
      tags: ['concurrency', 'locking'],
      requirements: ['Optimistic locking with a version column', 'Show conflict to the user'],
    },
    {
      id: 'gb-blocker-leak',
      type: 'blocker',
      title: 'Grade leaks through exports or caches',
      summary:
        'A shared cache key or CSV export forgets the per-student filter and exposes classmates\' grades.',
      scenario: 'lms-gradebook',
      tags: ['security', 'privacy'],
      requirements: ['Include user id in cache keys', 'Access tests for every endpoint'],
    },
  ],
  edges: [
    { id: 'e-gb-1', source: 'gb-challenge', target: 'gb-solution-schema', relation: 'addresses' },
    { id: 'e-gb-2', source: 'gb-challenge', target: 'gb-solution-rbac', relation: 'addresses' },
    { id: 'e-gb-3', source: 'gb-solution-schema', target: 'gb-solution-computed', relation: 'enables' },
    { id: 'e-gb-4', source: 'gb-solution-schema', target: 'gb-solution-audit', relation: 'enables' },
    { id: 'e-gb-5', source: 'gb-challenge', target: 'gb-solution-release', relation: 'addresses' },
    { id: 'e-gb-6', source: 'gb-solution-schema', target: 'gb-blocker-concurrent', relation: 'blocked_by' },
    { id: 'e-gb-7', source: 'gb-solution-computed', target: 'gb-blocker-leak', relation: 'blocked_by' },
    { id: 'e-gb-8', source: 'gb-solution-rbac', target: 'gb-blocker-leak', relation: 'addresses' },
  ],
}
