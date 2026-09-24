import Fuse from 'fuse.js'
import type { AtlasNode } from '../data/types'

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

export function matchNodeIds(
  fuse: Fuse<AtlasNode>,
  query: string,
): Set<string> | null {
  const q = query.trim()
  if (!q) return null
  return new Set(fuse.search(q).map((r) => r.item.id))
}
