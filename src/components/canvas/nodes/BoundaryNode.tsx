import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { UmlNodeData } from '../../../types/game'

export const BoundaryNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as UmlNodeData
  const width = nodeData.width || 420
  const height = nodeData.height || 380
  const title = nodeData.boundaryTitle || 'System'

  return (
    <div
      className={`relative rounded-[4px] border border-dashed transition-all select-none pointer-events-none ${
        selected
          ? 'border-[var(--primary-btn)] bg-[var(--selection-bg)]'
          : 'border-[var(--border-strong)] bg-transparent'
      }`}
      style={{
        width,
        height,
      }}
    >
      {/* Boundary Title Tag */}
      <div className="absolute top-2.5 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] bg-[var(--bg-primary)] border border-[var(--border-subtle)] pointer-events-auto shadow-xs text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]" />
        <span className="font-semibold text-[11px] text-[var(--text-primary)]">
          {title}
        </span>
      </div>

      <div className="absolute bottom-2 right-2.5 text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider font-mono">
        System Boundary
      </div>
    </div>
  )
})

BoundaryNode.displayName = 'BoundaryNode'
