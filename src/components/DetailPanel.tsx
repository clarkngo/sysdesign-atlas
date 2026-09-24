import { RELATION_LABELS, type AtlasNode, type EdgeRelation } from '../data/types'

interface DetailPanelProps {
  node: AtlasNode | null
  open: boolean
  onClose: () => void
  related: { relation: EdgeRelation; node: AtlasNode }[]
}

export function DetailPanel({ node, open, onClose, related }: DetailPanelProps) {
  return (
    <>
      <div
        className={`sda-sheet-backdrop ${open ? 'sda-sheet-backdrop--open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`sda-panel ${open ? 'sda-panel--open' : ''}`}
        aria-hidden={!open}
        aria-label="Node details"
      >
        {node ? (
          <div className="sda-panel__inner">
            <div className="sda-panel__top">
              <span className={`sda-pill sda-pill--${node.type}`}>{node.type}</span>
              <button
                type="button"
                className="sda-btn sda-btn--ghost"
                onClick={onClose}
                aria-label="Close details"
              >
                Close
              </button>
            </div>
            <h2 className="sda-panel__title">{node.title}</h2>
            <p className="sda-panel__summary">{node.summary}</p>

            {node.scaleHint && (
              <p className="sda-panel__hint">
                <span className="sda-kicker">Scale</span> {node.scaleHint}
              </p>
            )}
            {node.whenToUse && (
              <p className="sda-panel__hint">
                <span className="sda-kicker">When</span> {node.whenToUse}
              </p>
            )}

            {node.requirements.length > 0 && (
              <section className="sda-panel__section">
                <h3>Requirements</h3>
                <ul>
                  {node.requirements.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </section>
            )}

            {node.tradeoffs && node.tradeoffs.length > 0 && (
              <section className="sda-panel__section">
                <h3>Tradeoffs</h3>
                <ul>
                  {node.tradeoffs.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </section>
            )}

            {node.tags.length > 0 && (
              <div className="sda-tags">
                {node.tags.map((t) => (
                  <span key={t} className="sda-tag">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {related.length > 0 && (
              <section className="sda-panel__section">
                <h3>Linked</h3>
                <ul className="sda-related">
                  {related.map(({ relation, node: n }) => (
                    <li key={`${relation}-${n.id}`}>
                      <span className="sda-related__rel">
                        {RELATION_LABELS[relation]}
                      </span>
                      <span className="sda-related__title">{n.title}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        ) : (
          <div className="sda-panel__empty">
            <p>Select a node to inspect requirements, tradeoffs, and links.</p>
          </div>
        )}
      </aside>
    </>
  )
}
