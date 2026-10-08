import type { ScenarioBundle } from '../types'

export const photoUpload: ScenarioBundle = {
  meta: {
    id: 'photo-upload',
    label: 'Photo upload',
    blurb: 'Let users upload images, make thumbnails, and serve them quickly worldwide.',
    difficulty: 'intro',
  },
  nodes: [
    {
      id: 'pu-challenge',
      type: 'challenge',
      title: 'Upload, resize, and serve images',
      summary:
        'Users upload photos from phones; the app shows thumbnails in lists and full-size on tap, anywhere in the world.',
      scenario: 'photo-upload',
      tags: ['files', 'media', 'cdn'],
      requirements: [
        'Uploads survive flaky mobile networks',
        'Thumbnails appear within seconds',
        'Image loads feel instant on repeat views',
      ],
      scaleHint: '~500k uploads/day · avg 3MB · ~50:1 view:upload',
    },
    {
      id: 'pu-solution-presigned',
      type: 'solution',
      title: 'Direct-to-storage presigned uploads',
      summary:
        'The API hands the client a short-lived signed URL; the client uploads straight to object storage, bypassing app servers.',
      scenario: 'photo-upload',
      tags: ['object-storage', 'upload'],
      requirements: ['URL expiry in minutes', 'Content-type and size limits in the signature'],
      whenToUse: 'Large files would otherwise tie up app server bandwidth and memory.',
      tradeoffs: ['App must confirm the upload actually finished'],
    },
    {
      id: 'pu-solution-queue',
      type: 'solution',
      title: 'Async resize via queue + workers',
      summary:
        'Upload-complete event goes onto a queue; workers generate thumbnails and medium sizes, then mark the photo ready.',
      scenario: 'photo-upload',
      tags: ['queue', 'workers', 'async'],
      requirements: ['Retries with backoff', 'Idempotent workers (same input → same output keys)'],
      whenToUse: 'Image processing is slow and should not block the upload response.',
      tradeoffs: ['Brief "processing" state in the UI'],
    },
    {
      id: 'pu-solution-cdn',
      type: 'solution',
      title: 'Serve images through a CDN',
      summary:
        'Images are immutable once written, so edge caches can hold them for a long time close to users.',
      scenario: 'photo-upload',
      tags: ['cdn', 'latency', 'immutable'],
      requirements: ['Unique key per image version', 'Long Cache-Control max-age'],
      whenToUse: 'Viewers are spread out geographically or views far exceed uploads.',
    },
    {
      id: 'pu-solution-metadata',
      type: 'solution',
      title: 'Photo metadata table',
      summary:
        'A DB row per photo tracks owner, status (uploading/processing/ready), dimensions, and storage keys for each size.',
      scenario: 'photo-upload',
      tags: ['database', 'state'],
      requirements: ['Status column', 'Index on owner + created_at for galleries'],
      whenToUse: 'The app needs to list, filter, or delete photos without scanning storage.',
    },
    {
      id: 'pu-blocker-partial',
      type: 'blocker',
      title: 'Interrupted mobile uploads',
      summary:
        'A 10MB upload over a weak connection fails at 90% and the user must start over.',
      scenario: 'photo-upload',
      tags: ['upload', 'mobile'],
      requirements: ['Multipart / resumable uploads', 'Client-side compression before upload'],
    },
    {
      id: 'pu-blocker-poison',
      type: 'blocker',
      title: 'Corrupt or malicious files',
      summary:
        'A broken or crafted image crashes the resizer and gets retried forever, blocking the queue.',
      scenario: 'photo-upload',
      tags: ['queue', 'security'],
      requirements: ['Max retry count', 'Dead-letter queue', 'Validate file type by content, not name'],
    },
    {
      id: 'pu-blocker-delete',
      type: 'blocker',
      title: 'Deleting a photo that is cached everywhere',
      summary:
        'User deletes a private photo but CDN edges keep serving the cached copy until expiry.',
      scenario: 'photo-upload',
      tags: ['cdn', 'privacy'],
      requirements: ['CDN purge API', 'Signed or unguessable image URLs'],
    },
  ],
  edges: [
    { id: 'e-pu-1', source: 'pu-challenge', target: 'pu-solution-presigned', relation: 'addresses' },
    { id: 'e-pu-2', source: 'pu-challenge', target: 'pu-solution-queue', relation: 'addresses' },
    { id: 'e-pu-3', source: 'pu-challenge', target: 'pu-solution-cdn', relation: 'addresses' },
    { id: 'e-pu-4', source: 'pu-solution-presigned', target: 'pu-solution-queue', relation: 'enables' },
    { id: 'e-pu-5', source: 'pu-solution-metadata', target: 'pu-solution-queue', relation: 'enables' },
    { id: 'e-pu-6', source: 'pu-solution-presigned', target: 'pu-blocker-partial', relation: 'blocked_by' },
    { id: 'e-pu-7', source: 'pu-solution-queue', target: 'pu-blocker-poison', relation: 'blocked_by' },
    { id: 'e-pu-8', source: 'pu-solution-cdn', target: 'pu-blocker-delete', relation: 'blocked_by' },
  ],
}
