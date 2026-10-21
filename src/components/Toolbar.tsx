interface ToolbarProps {
  onFit: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetLayout: () => void
  soundOn: boolean
  onToggleSound: () => void
}

export function Toolbar({
  onFit,
  onZoomIn,
  onZoomOut,
  onResetLayout,
  soundOn,
  onToggleSound,
}: ToolbarProps) {
  return (
    <div className="sda-toolbar" role="toolbar" aria-label="Canvas controls">
      <button type="button" className="sda-btn" onClick={onFit}>
        Fit view
      </button>
      <button type="button" className="sda-btn" onClick={onZoomIn}>
        Zoom +
      </button>
      <button type="button" className="sda-btn" onClick={onZoomOut}>
        Zoom −
      </button>
      <button type="button" className="sda-btn" onClick={onResetLayout}>
        Reset layout
      </button>
      <button
        type="button"
        className="sda-btn sda-btn--sound"
        onClick={onToggleSound}
        aria-pressed={soundOn}
        title={soundOn ? 'Mute sound effects' : 'Turn on sound effects'}
      >
        {soundOn ? 'Sound on' : 'Sound off'}
      </button>
    </div>
  )
}
