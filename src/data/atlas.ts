import type { AtlasData } from './types'
import { DIFFICULTY_ORDER } from './types'
import { leaderboard } from './scenarios/leaderboard'
import { multiRegionKv } from './scenarios/multi-region-kv'
import { notificationService } from './scenarios/notification-service'
import { pastebin } from './scenarios/pastebin'
import { photoUpload } from './scenarios/photo-upload'
import { rateLimiter } from './scenarios/rate-limiter'
import { realtimeChat } from './scenarios/realtime-chat'
import { socialFeed } from './scenarios/social-feed'
import { urlShortener } from './scenarios/url-shortener'
import { videoStreaming } from './scenarios/video-streaming'
import { webAppScaling } from './scenarios/web-app-scaling'

const bundles = [
  webAppScaling,
  urlShortener,
  pastebin,
  photoUpload,
  leaderboard,
  notificationService,
  rateLimiter,
  socialFeed,
  realtimeChat,
  videoStreaming,
  multiRegionKv,
]

const difficultyRank = Object.fromEntries(
  DIFFICULTY_ORDER.map((d, i) => [d, i]),
) as Record<string, number>

export const atlasData: AtlasData = {
  scenarios: bundles
    .map((b) => b.meta)
    .sort(
      (a, b) =>
        difficultyRank[a.difficulty] - difficultyRank[b.difficulty] ||
        a.label.localeCompare(b.label),
    ),
  nodes: bundles.flatMap((b) => b.nodes),
  edges: bundles.flatMap((b) => b.edges),
}
