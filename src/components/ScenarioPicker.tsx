import {
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
  type Difficulty,
  type ScenarioId,
  type ScenarioMeta,
} from '../data/types'

interface ScenarioPickerProps {
  scenarios: ScenarioMeta[]
  activeId: ScenarioId
  onChange: (id: ScenarioId) => void
}

export function ScenarioPicker({
  scenarios,
  activeId,
  onChange,
}: ScenarioPickerProps) {
  const active = scenarios.find((s) => s.id === activeId)

  const byDifficulty = DIFFICULTY_ORDER.map((difficulty) => ({
    difficulty,
    items: scenarios.filter((s) => s.difficulty === difficulty),
  })).filter((g) => g.items.length > 0)

  return (
    <nav className="sda-scenarios" aria-label="Scenarios">
      <div className="sda-scenarios__head">
        <div>
          <span className="sda-scenarios__kicker">Scenario</span>
          {active && (
            <p className="sda-scenarios__blurb">{active.blurb}</p>
          )}
        </div>
      </div>

      <div className="sda-scenarios__groups">
        {byDifficulty.map(({ difficulty, items }) => (
          <div key={difficulty} className="sda-scenarios__group">
            <span
              className={`sda-diff sda-diff--${difficulty}`}
              title={`Difficulty: ${DIFFICULTY_LABELS[difficulty as Difficulty]}`}
            >
              {DIFFICULTY_LABELS[difficulty as Difficulty]}
            </span>
            <div
              className="sda-scenarios__chips"
              role="listbox"
              aria-label={`${DIFFICULTY_LABELS[difficulty as Difficulty]} scenarios`}
            >
              {items.map((s) => {
                const selected = s.id === activeId
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`sda-chip ${selected ? 'sda-chip--active' : ''}`}
                    onClick={() => onChange(s.id)}
                    title={s.blurb}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  )
}
