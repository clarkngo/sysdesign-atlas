import dagre from '@dagrejs/dagre'
import type { Edge, Node } from '@xyflow/react'
import type { AtlasEdge, AtlasNode } from '../data/types'

const NODE_WIDTH = 260
const NODE_HEIGHT = 112

export function layoutGraph(
  atlasNodes: AtlasNode[],
  atlasEdges: AtlasEdge[],
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: 'TB',
    nodesep: 48,
    ranksep: 72,
    marginx: 24,
    marginy: 24,
  })

  for (const n of atlasNodes) {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }
  for (const e of atlasEdges) {
    if (g.hasNode(e.source) && g.hasNode(e.target)) {
      g.setEdge(e.source, e.target)
    }
  }

  dagre.layout(g)

  const nodes: Node[] = atlasNodes.map((n) => {
    const pos = g.node(n.id)
    return {
      id: n.id,
      type: n.type,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
      data: { atlas: n },
      style: { width: NODE_WIDTH },
    }
  })

  const edges: Edge[] = atlasEdges
    .filter((e) => g.hasNode(e.source) && g.hasNode(e.target))
    .map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.relation.replaceAll('_', ' '),
      data: { relation: e.relation },
      type: 'smoothstep',
      animated: e.relation === 'blocked_by',
      style: {
        stroke:
          e.relation === 'blocked_by'
            ? 'var(--edge-blocker)'
            : e.relation === 'trades_off_with'
              ? 'var(--edge-tradeoff)'
              : 'var(--edge-default)',
        strokeWidth: 1.5,
      },
      labelStyle: {
        fill: 'var(--ink-muted)',
        fontSize: 10,
        fontFamily: 'var(--font-mono)',
      },
      labelBgStyle: { fill: 'var(--surface)', fillOpacity: 0.92 },
      labelBgPadding: [4, 6] as [number, number],
      labelBgBorderRadius: 2,
    }))

  return { nodes, edges }
}
