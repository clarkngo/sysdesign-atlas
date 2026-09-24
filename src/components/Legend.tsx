export function Legend() {
  return (
    <div className="sda-legend" aria-label="Legend">
      <div className="sda-legend__item">
        <span className="sda-legend__swatch sda-legend__swatch--challenge" aria-hidden>
          ◇
        </span>
        <span>Challenge</span>
      </div>
      <div className="sda-legend__item">
        <span className="sda-legend__swatch sda-legend__swatch--solution" aria-hidden>
          ▣
        </span>
        <span>Solution</span>
      </div>
      <div className="sda-legend__item">
        <span className="sda-legend__swatch sda-legend__swatch--blocker" aria-hidden>
          ⚠
        </span>
        <span>Blocker</span>
      </div>
    </div>
  )
}
