import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { UmlNodeData } from '../../../types/game'

export const UseCaseNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as UmlNodeData

  return (
    <div
      className={`group relative flex items-center justify-center px-5 py-3 transition-all duration-150 select-none ${
        selected
          ? 'border-[var(--primary-btn)] ring-1 ring-[var(--primary-btn)] shadow-sm bg-[var(--selection-bg)]'
          : 'border-[var(--border-strong)] bg-[var(--bg-primary)] hover:border-[var(--text-primary)] shadow-xs'
      } border-[1.5px]`}
      style={{
        minWidth: 140,
        minHeight: 56,
        borderRadius: '50% / 50%',
      }}
    >
      {/* Connecting Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-[var(--text-primary)] !border !border-[var(--bg-primary)] opacity-60 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-[var(--text-primary)] !border !border-[var(--bg-primary)] opacity-60 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !bg-[var(--text-primary)] !border !border-[var(--bg-primary)] opacity-60 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !bg-[var(--text-primary)] !border !border-[var(--bg-primary)] opacity-60 group-hover:opacity-100 transition-opacity"
      />

      {/* Use Case Label */}
      <div className="text-center font-medium text-xs text-[var(--text-primary)] max-w-[130px] leading-snug px-1.5 font-sans">
        {nodeData.label}
      </div>
    </div>
  )
})

UseCaseNode.displayName = 'UseCaseNode'
