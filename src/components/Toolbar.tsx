interface ToolbarProps {
  onFit: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetLayout: () => void
}

export function Toolbar({
  onFit,
  onZoomIn,
  onZoomOut,
  onResetLayout,
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
    </div>
  )
}
