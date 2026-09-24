export type NodeKind = 'challenge' | 'solution' | 'blocker'

export type EdgeRelation =
  | 'addresses'
  | 'enables'
  | 'blocked_by'
  | 'trades_off_with'

export type Difficulty = 'intro' | 'intermediate' | 'advanced'

export type ScenarioId =
  | 'url-shortener'
  | 'rate-limiter'
  | 'social-feed'
  | 'realtime-chat'
  | 'video-streaming'
  | 'multi-region-kv'

export interface AtlasNode {
  id: string
  type: NodeKind
  title: string
  summary: string
  scenario: ScenarioId
  tags: string[]
  requirements: string[]
  tradeoffs?: string[]
  whenToUse?: string
  scaleHint?: string
}

export interface AtlasEdge {
  id: string
  source: string
  target: string
  relation: EdgeRelation
}

export interface ScenarioMeta {
  id: ScenarioId
  label: string
  blurb: string
  difficulty: Difficulty
}

export interface ScenarioBundle {
  meta: ScenarioMeta
  nodes: AtlasNode[]
  edges: AtlasEdge[]
}

export interface AtlasData {
  scenarios: ScenarioMeta[]
  nodes: AtlasNode[]
  edges: AtlasEdge[]
}

export const RELATION_LABELS: Record<EdgeRelation, string> = {
  addresses: 'addresses',
  enables: 'enables',
  blocked_by: 'blocked by',
  trades_off_with: 'trades off with',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  intro: 'Intro',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export const DIFFICULTY_ORDER: Difficulty[] = [
  'intro',
  'intermediate',
  'advanced',
]
