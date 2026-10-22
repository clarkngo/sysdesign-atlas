import { useCallback, useMemo, useState } from 'react'
import { atlasData, LEARNING_PATH } from './data/atlas'
import type { AtlasNode, EdgeRelation, ScenarioId } from './data/types'
import { countByScenario, createNodeSearch, searchNodes } from './lib/search'
import { isSoundEnabled, playSound, setSoundEnabled } from './lib/sound'
import { AtlasCanvas } from './components/AtlasCanvas'
import { DetailPanel } from './components/DetailPanel'
import { Header } from './components/Header'
import { Legend } from './components/Legend'
import { ScenarioPicker } from './components/ScenarioPicker'
import { Toolbar } from './components/Toolbar'

export default function App() {
  const [scenario, setScenario] = useState<ScenarioId>(LEARNING_PATH[0])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [layoutKey, setLayoutKey] = useState(0)
  const [soundOn, setSoundOn] = useState(isSoundEnabled)
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

  const fuse = useMemo(() => createNodeSearch(atlasData.nodes), [])
  const allMatches = useMemo(() => searchNodes(fuse, query), [fuse, query])
  const matchCounts = useMemo(
    () => (allMatches ? countByScenario(allMatches) : null),
    [allMatches],
  )
  const matchIds = useMemo(
    () =>
      allMatches
        ? new Set(allMatches.filter((n) => n.scenario === scenario).map((n) => n.id))
        : null,
    [allMatches, scenario],
  )
  const matchCount = matchIds ? matchIds.size : null
  const otherScenarioCount = matchCounts
    ? [...matchCounts.keys()].filter((id) => id !== scenario).length
    : 0

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

  const onSelect = (id: string | null) => {
    if (id === selectedId) return
    if (id === null) {
      playSound('deselect')
    } else {
      const node = scenarioNodes.find((n) => n.id === id)
      if (node) playSound(node.type)
    }
    setSelectedId(id)
  }

  const onToggleSound = () => {
    const next = !soundOn
    setSoundEnabled(next)
    setSoundOn(next)
    if (next) playSound('toggleOn')
  }

  const onScenarioChange = (id: ScenarioId) => {
    if (id !== scenario) playSound('scenario')
    setScenario(id)
    setSelectedId(null)
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
        otherScenarioCount={otherScenarioCount}
      />

      <ScenarioPicker
        scenarios={atlasData.scenarios}
        activeId={scenario}
        onChange={onScenarioChange}
        learningPath={LEARNING_PATH}
        matchCounts={matchCounts}
      />

      <Toolbar
        onFit={() => {
          playSound('fit')
          canvasApi?.fitView()
        }}
        onZoomIn={() => {
          playSound('zoomIn')
          canvasApi?.zoomIn()
        }}
        onZoomOut={() => {
          playSound('zoomOut')
          canvasApi?.zoomOut()
        }}
        onResetLayout={() => {
          playSound('fit')
          setLayoutKey((k) => k + 1)
          window.setTimeout(() => canvasApi?.fitView(), 50)
        }}
        soundOn={soundOn}
        onToggleSound={onToggleSound}
      />

      <AtlasCanvas
        atlasNodes={scenarioNodes}
        atlasEdges={scenarioEdges}
        matchIds={matchIds}
        selectedId={selectedId}
        onSelect={onSelect}
        layoutKey={layoutKey}
        onReady={onReady}
      />

      <Legend />

      <DetailPanel
        node={selectedNode}
        open={panelOpen}
        onClose={() => onSelect(null)}
        related={related}
      />

      {matchIds !== null && matchIds.size === 0 && (
        <div className="sda-empty-search" role="status">
          <p>No nodes match “{query.trim()}” in this scenario.</p>
          {otherScenarioCount > 0 && (
            <p>
              Found in {otherScenarioCount} other scenario
              {otherScenarioCount === 1 ? '' : 's'}: highlighted above.
            </p>
          )}
          <button type="button" className="sda-btn" onClick={() => setQuery('')}>
            Clear search
          </button>
        </div>
      )}
    </div>
  )
}
