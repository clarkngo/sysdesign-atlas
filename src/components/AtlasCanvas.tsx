import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useEffect, useMemo } from 'react'
import type { AtlasEdge, AtlasNode } from '../data/types'
import { layoutGraph } from '../lib/layout'
import {
  BlockerNode,
  ChallengeNode,
  SolutionNode,
  type AtlasNodeData,
} from './nodes/AtlasNodes'

const nodeTypes: NodeTypes = {
  challenge: ChallengeNode,
  solution: SolutionNode,
  blocker: BlockerNode,
}

interface AtlasCanvasProps {
  atlasNodes: AtlasNode[]
  atlasEdges: AtlasEdge[]
  matchIds: Set<string> | null
  selectedId: string | null
  onSelect: (id: string | null) => void
  layoutKey: number
  onReady: (api: {
    fitView: () => void
    zoomIn: () => void
    zoomOut: () => void
  }) => void
}

function CanvasInner({
  atlasNodes,
  atlasEdges,
  matchIds,
  selectedId,
  onSelect,
  layoutKey,
  onReady,
}: AtlasCanvasProps) {
  const { fitView, zoomIn, zoomOut } = useReactFlow()

  const { nodes, edges } = useMemo(
    () => layoutGraph(atlasNodes, atlasEdges),
    [atlasNodes, atlasEdges, layoutKey],
  )

  const decoratedNodes: Node[] = useMemo(
    () =>
      nodes.map((n) => {
        const dimmed = matchIds !== null && !matchIds.has(n.id)
        return {
          ...n,
          selected: n.id === selectedId,
          data: { ...(n.data as AtlasNodeData), dimmed },
          className: dimmed ? 'atlas-rf-dim' : undefined,
        }
      }),
    [nodes, matchIds, selectedId],
  )

  const decoratedEdges = useMemo(
    () =>
      edges.map((e) => {
        const dimmed =
          matchIds !== null &&
          (!matchIds.has(e.source) || !matchIds.has(e.target))
        return {
          ...e,
          style: {
            ...e.style,
            opacity: dimmed ? 0.12 : 1,
          },
          labelStyle: {
            ...e.labelStyle,
            opacity: dimmed ? 0.2 : 1,
          },
        }
      }),
    [edges, matchIds],
  )

  useEffect(() => {
    onReady({
      fitView: () => fitView({ padding: 0.18, duration: 280 }),
      zoomIn: () => zoomIn({ duration: 180 }),
      zoomOut: () => zoomOut({ duration: 180 }),
    })
  }, [fitView, zoomIn, zoomOut, onReady])

  useEffect(() => {
    const t = window.setTimeout(() => {
      fitView({ padding: 0.18, duration: 320 })
    }, 40)
    return () => window.clearTimeout(t)
  }, [layoutKey, atlasNodes, fitView])

  return (
    <ReactFlow
      nodes={decoratedNodes}
      edges={decoratedEdges}
      nodeTypes={nodeTypes}
      onNodeClick={(_, node) => onSelect(node.id)}
      onPaneClick={() => onSelect(null)}
      fitView
      minZoom={0.25}
      maxZoom={1.6}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      panOnScroll
      selectionOnDrag={false}
    >
      <Background
        id="grid"
        variant={BackgroundVariant.Lines}
        gap={28}
        color="var(--grid-line)"
        lineWidth={0.5}
      />
      <Controls showInteractive={false} className="sda-controls" />
      <MiniMap
        className="sda-minimap"
        nodeColor={(n) => {
          if (n.type === 'challenge') return 'var(--challenge)'
          if (n.type === 'blocker') return 'var(--blocker)'
          return 'var(--solution)'
        }}
        maskColor="rgba(8, 12, 20, 0.55)"
      />
    </ReactFlow>
  )
}

export function AtlasCanvas(props: AtlasCanvasProps) {
  return (
    <div className="sda-canvas">
      <ReactFlowProvider>
        <CanvasInner {...props} />
      </ReactFlowProvider>
    </div>
  )
}
