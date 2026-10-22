import Fuse from 'fuse.js'
import type { AtlasNode, ScenarioId } from '../data/types'

export function createNodeSearch(nodes: AtlasNode[]) {
  return new Fuse(nodes, {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'summary', weight: 0.25 },
      { name: 'tags', weight: 0.2 },
      { name: 'requirements', weight: 0.1 },
      { name: 'tradeoffs', weight: 0.05 },
    ],
    threshold: 0.38,
    ignoreLocation: true,
  })
}

export function searchNodes(
  fuse: Fuse<AtlasNode>,
  query: string,
): AtlasNode[] | null {
  const q = query.trim()
  if (!q) return null
  return fuse.search(q).map((r) => r.item)
}

export function countByScenario(nodes: AtlasNode[]) {
  const counts = new Map<ScenarioId, number>()
  for (const n of nodes) counts.set(n.scenario, (counts.get(n.scenario) ?? 0) + 1)
  return counts
}
