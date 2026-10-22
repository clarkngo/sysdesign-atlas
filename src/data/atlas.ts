import type { AtlasData } from './types'
import { DIFFICULTY_ORDER } from './types'
import { apiDesign } from './scenarios/api-design'
import { chooseDatabase } from './scenarios/choose-database'
import { databaseIndexing } from './scenarios/database-indexing'
import { distributedCache } from './scenarios/distributed-cache'
import { gameMatchmaking } from './scenarios/game-matchmaking'
import { gamePatchDelivery } from './scenarios/game-patch-delivery'
import { leaderboard } from './scenarios/leaderboard'
import { lmsAssignmentDeadline } from './scenarios/lms-assignment-deadline'
import { lmsGradebook } from './scenarios/lms-gradebook'
import { lmsMultiTenant } from './scenarios/lms-multi-tenant'
import { monitoringBasics } from './scenarios/monitoring-basics'
import { multiRegionKv } from './scenarios/multi-region-kv'
import { notificationService } from './scenarios/notification-service'
import { pastebin } from './scenarios/pastebin'
import { photoUpload } from './scenarios/photo-upload'
import { rateLimiter } from './scenarios/rate-limiter'
import { realtimeChat } from './scenarios/realtime-chat'
import { realtimeGameServer } from './scenarios/realtime-game-server'
import { searchAutocomplete } from './scenarios/search-autocomplete'
import { shardingBasics } from './scenarios/sharding-basics'
import { socialFeed } from './scenarios/social-feed'
import { ticketBooking } from './scenarios/ticket-booking'
import { uniqueIdGenerator } from './scenarios/unique-id-generator'
import { urlShortener } from './scenarios/url-shortener'
import { userAuth } from './scenarios/user-auth'
import { videoStreaming } from './scenarios/video-streaming'
import { webAppScaling } from './scenarios/web-app-scaling'
import { webCrawler } from './scenarios/web-crawler'

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
  gameMatchmaking,
  realtimeGameServer,
  gamePatchDelivery,
  lmsGradebook,
  lmsAssignmentDeadline,
  lmsMultiTenant,
  uniqueIdGenerator,
  searchAutocomplete,
  webCrawler,
  distributedCache,
  ticketBooking,
  databaseIndexing,
  chooseDatabase,
  apiDesign,
  userAuth,
  shardingBasics,
  monitoringBasics,
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
