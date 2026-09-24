interface HeaderProps {
  query: string
  onQueryChange: (q: string) => void
  matchCount: number | null
}

export function Header({ query, onQueryChange, matchCount }: HeaderProps) {
  return (
    <header className="sda-header">
      <div className="sda-brand">
        <span className="sda-brand__mark" aria-hidden />
        <div>
          <h1 className="sda-brand__title">System Design Atlas</h1>
          <p className="sda-brand__tag">
            Challenge → solution → blocker
            <span className="sda-brand__dot" aria-hidden>
              ·
            </span>
            <span className="sda-brand__by">
              built by{' '}
              <a
                href="https://www.linkedin.com/in/clarkngo/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Clark Ngo
              </a>
            </span>
          </p>
        </div>
      </div>

      <div className="sda-header__controls">
        <label className="sda-field sda-field--search">
          <span className="sda-field__label">Search</span>
          <input
            className="sda-search"
            type="search"
            placeholder="Challenges, solutions, blockers…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            aria-label="Search atlas nodes"
          />
          {matchCount !== null && (
            <span className="sda-search__meta" aria-live="polite">
              {matchCount === 0
                ? 'No matches — try a broader term'
                : `${matchCount} match${matchCount === 1 ? '' : 'es'}`}
            </span>
          )}
        </label>
      </div>
    </header>
  )
}
