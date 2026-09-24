import { useCallback, useMemo, useState } from 'react'
import { atlasData } from './data/atlas'
import type { AtlasNode, EdgeRelation, ScenarioId } from './data/types'
import { createNodeSearch, matchNodeIds } from './lib/search'
import { AtlasCanvas } from './components/AtlasCanvas'
import { DetailPanel } from './components/DetailPanel'
import { Header } from './components/Header'
import { Legend } from './components/Legend'
import { ScenarioPicker } from './components/ScenarioPicker'
import { Toolbar } from './components/Toolbar'

export default function App() {
  const [scenario, setScenario] = useState<ScenarioId>(
    atlasData.scenarios[0].id,
  )
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [layoutKey, setLayoutKey] = useState(0)
  const [canvasApi, setCanvasApi] = useState<{
    fitView: () => void
    zoomIn: () => void
    zoomOut: () => void
  } | null>(null)

  const scenarioNodes = useMemo(
    () => atlasData.nodes.filter((n) => n.scenario === scenario),
    [scenario],
  )
  const scenarioNodeIds = useMemo(
    () => new Set(scenarioNodes.map((n) => n.id)),
    [scenarioNodes],
  )
  const scenarioEdges = useMemo(
    () =>
      atlasData.edges.filter(
        (e) => scenarioNodeIds.has(e.source) && scenarioNodeIds.has(e.target),
      ),
    [scenarioNodeIds],
  )

  const fuse = useMemo(() => createNodeSearch(scenarioNodes), [scenarioNodes])
  const matchIds = useMemo(() => matchNodeIds(fuse, query), [fuse, query])
  const matchCount = matchIds ? matchIds.size : null

  const selectedNode: AtlasNode | null = useMemo(
    () => scenarioNodes.find((n) => n.id === selectedId) ?? null,
    [scenarioNodes, selectedId],
  )

  const related = useMemo(() => {
    if (!selectedNode) return []
    const out: { relation: EdgeRelation; node: AtlasNode }[] = []
    for (const e of scenarioEdges) {
      if (e.source === selectedNode.id) {
        const node = scenarioNodes.find((n) => n.id === e.target)
        if (node) out.push({ relation: e.relation, node })
      } else if (e.target === selectedNode.id) {
        const node = scenarioNodes.find((n) => n.id === e.source)
        if (node) out.push({ relation: e.relation, node })
      }
    }
    return out
  }, [selectedNode, scenarioEdges, scenarioNodes])

  const onScenarioChange = (id: ScenarioId) => {
    setScenario(id)
    setSelectedId(null)
    setQuery('')
    setLayoutKey((k) => k + 1)
  }

  const onReady = useCallback(
    (api: {
      fitView: () => void
      zoomIn: () => void
      zoomOut: () => void
    }) => {
      setCanvasApi(api)
    },
    [],
  )

  const panelOpen = selectedNode !== null

  return (
    <div className="sda-app">
      <Header
        query={query}
        onQueryChange={setQuery}
        matchCount={matchCount}
      />

      <ScenarioPicker
        scenarios={atlasData.scenarios}
        activeId={scenario}
        onChange={onScenarioChange}
      />

      <Toolbar
        onFit={() => canvasApi?.fitView()}
        onZoomIn={() => canvasApi?.zoomIn()}
        onZoomOut={() => canvasApi?.zoomOut()}
        onResetLayout={() => {
          setLayoutKey((k) => k + 1)
          window.setTimeout(() => canvasApi?.fitView(), 50)
        }}
      />

      <AtlasCanvas
        atlasNodes={scenarioNodes}
        atlasEdges={scenarioEdges}
        matchIds={matchIds}
        selectedId={selectedId}
        onSelect={setSelectedId}
        layoutKey={layoutKey}
        onReady={onReady}
      />

      <Legend />

      <DetailPanel
        node={selectedNode}
        open={panelOpen}
        onClose={() => setSelectedId(null)}
        related={related}
      />

      {matchIds !== null && matchIds.size === 0 && (
        <div className="sda-empty-search" role="status">
          <p>No nodes match “{query.trim()}” in this scenario.</p>
          <button type="button" className="sda-btn" onClick={() => setQuery('')}>
            Clear search
          </button>
        </div>
      )}
    </div>
  )
}
