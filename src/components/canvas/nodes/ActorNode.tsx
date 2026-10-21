import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { UmlNodeData } from '../../../types/game'

export const ActorNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as UmlNodeData
  const isSecondary = nodeData.actorType === 'secondary'

  return (
    <div
      className={`group relative flex flex-col items-center justify-center p-2.5 rounded-[4px] transition-all duration-150 select-none ${
        selected
          ? 'ring-1 ring-[var(--primary-btn)] bg-[var(--selection-bg)]'
          : 'hover:bg-[var(--hover-bg)]'
      }`}
      style={{ minWidth: 90 }}
    >
      {/* Handles */}
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

      {/* UML Stick Figure SVG */}
      <div className="relative mb-1.5 flex items-center justify-center">
        <svg
          width="36"
          height="46"
          viewBox="0 0 36 46"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="stroke-[var(--text-primary)] transition-colors"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Head */}
          <circle cx="18" cy="8" r="6" />
          {/* Torso */}
          <line x1="18" y1="14" x2="18" y2="30" />
          {/* Arms */}
          <line x1="6" y1="20" x2="30" y2="20" />
          {/* Left leg */}
          <line x1="18" y1="30" x2="8" y2="43" />
          {/* Right leg */}
          <line x1="18" y1="30" x2="28" y2="43" />
        </svg>

        {isSecondary && (
          <span className="absolute -top-1 -right-3 notion-tag notion-tag-orange text-[9px] uppercase font-mono px-1 py-0 font-semibold">
            Sec
          </span>
        )}
      </div>

      {/* Actor Label */}
      <div className="text-center text-xs tracking-tight text-[var(--text-primary)] max-w-[120px] leading-tight font-sans">
        <div className="text-[10px] text-[var(--text-tertiary)] font-mono">«actor»</div>
        <div className="font-semibold text-xs text-[var(--text-primary)] mt-0.5">
          {nodeData.label}
        </div>
      </div>
    </div>
  )
})

ActorNode.displayName = 'ActorNode'
