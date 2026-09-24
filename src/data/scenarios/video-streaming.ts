import type { ScenarioBundle } from '../types'

export const videoStreaming: ScenarioBundle = {
  meta: {
    id: 'video-streaming',
    label: 'Video streaming',
    blurb: 'Ingest, encode, and deliver adaptive bitrate video worldwide.',
    difficulty: 'advanced',
  },
  nodes: [
    {
      id: 'vs-challenge',
      type: 'challenge',
      title: 'On-demand video at global scale',
      summary:
        'Creators upload large files; viewers worldwide start playback quickly with adaptive bitrate and steady QoE under peak evenings.',
      scenario: 'video-streaming',
      tags: ['cdn', 'encoding', 'storage'],
      requirements: [
        'Time-to-first-frame under a few seconds on broadband',
        'Multi-bitrate renditions per title',
        'Handle evening traffic spikes without origin melt',
      ],
      scaleHint: 'Petabyte library · multi-Tbps egress peaks',
    },
    {
      id: 'vs-solution-object',
      type: 'solution',
      title: 'Object store + segment packaging',
      summary:
        'Store mezzanine and packaged HLS/DASH segments in object storage; manifest points players at CDN URLs.',
      scenario: 'video-streaming',
      tags: ['storage', 'hls', 'dash'],
      requirements: ['Immutable segment objects', 'Manifest generation pipeline'],
      whenToUse: 'VOD library where segments are cacheable.',
    },
    {
      id: 'vs-solution-encode',
      type: 'solution',
      title: 'Async encoding pipeline',
      summary:
        'Upload triggers a job queue; workers produce ladder renditions (resolution/bitrate) and package segments offline.',
      scenario: 'video-streaming',
      tags: ['encoding', 'queue', 'workers'],
      requirements: ['Durable jobs + retries', 'Priority for popular titles'],
      whenToUse: 'Encoding is too slow for the upload request path.',
      tradeoffs: ['Hours of lag for long form', 'GPU/CPU fleet cost'],
    },
    {
      id: 'vs-solution-cdn',
      type: 'solution',
      title: 'Multi-CDN delivery',
      summary:
        'Edge caches hold hot segments; DNS or client-side logic picks a CDN; origin shield protects object storage.',
      scenario: 'video-streaming',
      tags: ['cdn', 'edge', 'egress'],
      requirements: ['Cache-control for segments', 'Origin shield / mid-tier'],
      whenToUse: 'Egress and latency dominate cost and QoE.',
    },
    {
      id: 'vs-solution-abr',
      type: 'solution',
      title: 'Adaptive bitrate player control',
      summary:
        'Players estimate bandwidth and switch renditions; server provides consistent segment durations and keyframe alignment.',
      scenario: 'video-streaming',
      tags: ['abr', 'client', 'qoe'],
      requirements: ['Aligned GOPs across ladder', 'Accurate manifests'],
      whenToUse: 'Heterogeneous networks and devices.',
    },
    {
      id: 'vs-solution-meta',
      type: 'solution',
      title: 'Catalog & entitlement service',
      summary:
        'Metadata, search, and license checks stay off the byte path; playback tokens authorize CDN segment fetches.',
      scenario: 'video-streaming',
      tags: ['metadata', 'auth', 'drm'],
      requirements: ['Short-lived signed URLs or cookies', 'Entitlement cache'],
      whenToUse: 'Paid or geo-restricted catalogs.',
    },
    {
      id: 'vs-blocker-cold',
      type: 'blocker',
      title: 'Cold title / cache miss storm',
      summary:
        'A newly popular title misses everywhere; thousands of edges stampede the origin for the same segments.',
      scenario: 'video-streaming',
      tags: ['cache', 'stampede', 'origin'],
      requirements: ['Origin shield', 'Prefetch top segments on publish'],
    },
    {
      id: 'vs-blocker-encode-lag',
      type: 'blocker',
      title: 'Encoding backlog after premieres',
      summary:
        'Launch-day uploads pile up; viewers hit “processing” while the worker fleet lags.',
      scenario: 'video-streaming',
      tags: ['capacity', 'queue'],
      requirements: ['Autoscaling encoders', 'Degraded preview rendition first'],
    },
    {
      id: 'vs-blocker-drm',
      type: 'blocker',
      title: 'DRM & device fragmentation',
      summary:
        'Widevine/FairPlay/PlayReady paths diverge; failed license calls look like buffering bugs to users.',
      scenario: 'video-streaming',
      tags: ['drm', 'devices'],
      requirements: ['License service SLOs', 'Device capability matrix'],
    },
  ],
  edges: [
    { id: 'e-vs-1', source: 'vs-challenge', target: 'vs-solution-object', relation: 'addresses' },
    { id: 'e-vs-2', source: 'vs-challenge', target: 'vs-solution-encode', relation: 'addresses' },
    { id: 'e-vs-3', source: 'vs-challenge', target: 'vs-solution-cdn', relation: 'addresses' },
    { id: 'e-vs-4', source: 'vs-solution-encode', target: 'vs-solution-object', relation: 'enables' },
    { id: 'e-vs-5', source: 'vs-solution-object', target: 'vs-solution-cdn', relation: 'enables' },
    { id: 'e-vs-6', source: 'vs-solution-cdn', target: 'vs-solution-abr', relation: 'enables' },
    { id: 'e-vs-7', source: 'vs-challenge', target: 'vs-solution-meta', relation: 'addresses' },
    { id: 'e-vs-8', source: 'vs-solution-cdn', target: 'vs-blocker-cold', relation: 'blocked_by' },
    { id: 'e-vs-9', source: 'vs-solution-encode', target: 'vs-blocker-encode-lag', relation: 'blocked_by' },
    { id: 'e-vs-10', source: 'vs-solution-meta', target: 'vs-blocker-drm', relation: 'blocked_by' },
    { id: 'e-vs-11', source: 'vs-solution-abr', target: 'vs-blocker-drm', relation: 'trades_off_with' },
  ],
}
