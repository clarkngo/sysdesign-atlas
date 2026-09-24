import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { ReactNode } from 'react'
import type { AtlasNode } from '../../data/types'

export type AtlasNodeData = { atlas: AtlasNode; dimmed?: boolean }

function NodeShell({
  kind,
  mark,
  title,
  summary,
  dimmed,
  children,
}: {
  kind: string
  mark: string
  title: string
  summary: string
  dimmed?: boolean
  children?: ReactNode
}) {
  return (
    <div
      className={`atlas-node atlas-node--${kind} ${dimmed ? 'atlas-node--dimmed' : ''}`}
      role="button"
      tabIndex={0}
    >
      <Handle type="target" position={Position.Top} className="atlas-handle" />
      <div className="atlas-node__head">
        <span className="atlas-node__mark" aria-hidden>
          {mark}
        </span>
        <span className="atlas-node__kind">{kind}</span>
      </div>
      <h3 className="atlas-node__title">{title}</h3>
      <p className="atlas-node__summary">{summary}</p>
      {children}
      <Handle type="source" position={Position.Bottom} className="atlas-handle" />
    </div>
  )
}

export function ChallengeNode({ data }: NodeProps) {
  const d = data as AtlasNodeData
  return (
    <NodeShell
      kind="challenge"
      mark="◇"
      title={d.atlas.title}
      summary={d.atlas.summary}
      dimmed={d.dimmed}
    />
  )
}

export function SolutionNode({ data }: NodeProps) {
  const d = data as AtlasNodeData
  return (
    <NodeShell
      kind="solution"
      mark="▣"
      title={d.atlas.title}
      summary={d.atlas.summary}
      dimmed={d.dimmed}
    />
  )
}

export function BlockerNode({ data }: NodeProps) {
  const d = data as AtlasNodeData
  return (
    <NodeShell
      kind="blocker"
      mark="⚠"
      title={d.atlas.title}
      summary={d.atlas.summary}
      dimmed={d.dimmed}
    />
  )
}
