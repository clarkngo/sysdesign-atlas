import type { ScenarioBundle } from '../types'

export const lmsMultiTenant: ScenarioBundle = {
  meta: {
    id: 'lms-multi-tenant',
    label: 'Multi-school LMS platform',
    blurb: 'Host many universities on one learning platform with isolation, SSO, and integrations.',
    difficulty: 'advanced',
  },
  nodes: [
    {
      id: 'mt-challenge',
      type: 'challenge',
      title: 'One platform, thousands of institutions',
      summary:
        'Universities and school districts each get their own branded LMS. Their data must stay separate, they sign in with their own identity systems, and they sync rosters from student information systems.',
      scenario: 'lms-multi-tenant',
      tags: ['multi-tenant', 'saas', 'isolation'],
      requirements: [
        'No data ever crosses tenants',
        'One big tenant cannot slow down others',
        'Data stays in the tenant\'s required country/region',
      ],
      scaleHint: '~2k tenants · tenants range 500 to 300k users',
    },
    {
      id: 'mt-solution-shared',
      type: 'solution',
      title: 'Shared database with tenant_id on every row',
      summary:
        'All tenants share tables; every row and every query carries tenant_id. Cheapest to run and easy to update.',
      scenario: 'lms-multi-tenant',
      tags: ['database', 'multi-tenant'],
      requirements: ['tenant_id in every index', 'Row-level security or a query layer that always adds it'],
      whenToUse: 'Many small tenants with similar needs.',
      tradeoffs: ['One missed filter leaks data', 'Noisy neighbors share resources'],
    },
    {
      id: 'mt-solution-silo',
      type: 'solution',
      title: 'Dedicated database per large tenant',
      summary:
        'Big or regulated institutions get their own database (or cell). A routing table maps tenant → cell.',
      scenario: 'lms-multi-tenant',
      tags: ['cells', 'isolation', 'routing'],
      requirements: ['Tenant directory service', 'Automated provisioning + migrations per cell'],
      whenToUse: 'Large tenants, strict contracts, or data residency rules.',
      tradeoffs: ['More databases to patch, back up, and migrate'],
    },
    {
      id: 'mt-solution-sso',
      type: 'solution',
      title: 'Per-tenant SSO (SAML / OIDC)',
      summary:
        'Each school signs users in through its own identity provider. The tenant is resolved from the domain (school.lms.example) before login.',
      scenario: 'lms-multi-tenant',
      tags: ['auth', 'sso'],
      requirements: ['IdP config per tenant', 'Map IdP user ids to platform users'],
      whenToUse: 'Institutions require their existing accounts and MFA.',
    },
    {
      id: 'mt-solution-sis-sync',
      type: 'solution',
      title: 'Roster sync from student information systems',
      summary:
        'Nightly and incremental imports create courses and enrollments from the school\'s SIS (often via standards like OneRoster). LTI lets external tools plug into courses.',
      scenario: 'lms-multi-tenant',
      tags: ['integration', 'etl', 'lti'],
      requirements: ['Idempotent upserts by external id', 'Per-tenant import queue'],
      whenToUse: 'Enrollments change constantly during add/drop week.',
    },
    {
      id: 'mt-solution-quotas',
      type: 'solution',
      title: 'Per-tenant rate limits and job queues',
      summary:
        'Limit API calls, background jobs, and bulk imports per tenant so one school\'s huge sync cannot starve others.',
      scenario: 'lms-multi-tenant',
      tags: ['rate-limit', 'fairness'],
      requirements: ['Tenant-tagged metrics', 'Fair-share job scheduling'],
      whenToUse: 'Tenant sizes differ by 100× or more.',
    },
    {
      id: 'mt-blocker-leak',
      type: 'blocker',
      title: 'Cross-tenant data leak',
      summary:
        'A single query, cache key, or search index without tenant_id shows one school\'s data to another.',
      scenario: 'lms-multi-tenant',
      tags: ['security', 'privacy'],
      requirements: ['Enforce tenant scope in the data layer, not each endpoint', 'Tenant-isolation tests'],
    },
    {
      id: 'mt-blocker-calendar',
      type: 'blocker',
      title: 'Everyone\'s term starts the same week',
      summary:
        'Thousands of schools begin semesters together: SIS imports, logins, and content views spike at once.',
      scenario: 'lms-multi-tenant',
      tags: ['capacity', 'seasonality'],
      requirements: ['Capacity plan around academic calendars', 'Stagger bulk imports'],
    },
    {
      id: 'mt-blocker-migrations',
      type: 'blocker',
      title: 'Schema migrations across many cells',
      summary:
        'A schema change must roll out to hundreds of tenant databases without downtime during the term.',
      scenario: 'lms-multi-tenant',
      tags: ['operations', 'migrations'],
      requirements: ['Expand/contract migrations', 'Roll out cell by cell'],
    },
  ],
  edges: [
    { id: 'e-mt-1', source: 'mt-challenge', target: 'mt-solution-shared', relation: 'addresses' },
    { id: 'e-mt-2', source: 'mt-challenge', target: 'mt-solution-silo', relation: 'addresses' },
    { id: 'e-mt-3', source: 'mt-solution-shared', target: 'mt-solution-silo', relation: 'trades_off_with' },
    { id: 'e-mt-4', source: 'mt-challenge', target: 'mt-solution-sso', relation: 'addresses' },
    { id: 'e-mt-5', source: 'mt-solution-sso', target: 'mt-solution-sis-sync', relation: 'enables' },
    { id: 'e-mt-6', source: 'mt-solution-shared', target: 'mt-solution-quotas', relation: 'enables' },
    { id: 'e-mt-7', source: 'mt-solution-shared', target: 'mt-blocker-leak', relation: 'blocked_by' },
    { id: 'e-mt-8', source: 'mt-solution-sis-sync', target: 'mt-blocker-calendar', relation: 'blocked_by' },
    { id: 'e-mt-9', source: 'mt-solution-silo', target: 'mt-blocker-migrations', relation: 'blocked_by' },
  ],
}
