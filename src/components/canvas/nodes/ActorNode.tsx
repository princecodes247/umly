import { memo, useState, useRef, useEffect } from 'react'
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import { Trash2, Copy, Edit2, ShieldAlert } from 'lucide-react'
import type { UmlNodeData } from '../../../types/game'

export const ActorNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as UmlNodeData
  const { updateNodeData, deleteElements, getNode, addNodes } = useReactFlow()
  const isLocked = Boolean(nodeData.isLocked)

  const [isEditing, setIsEditing] = useState(false)
  const [labelValue, setLabelValue] = useState(nodeData.label || 'Actor')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLabelValue(nodeData.label || 'Actor')
  }, [nodeData.label])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const handleFinishEditing = () => {
    setIsEditing(false)
    const trimmed = labelValue.trim() || 'Actor'
    setLabelValue(trimmed)
    updateNodeData(id, { label: trimmed })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleFinishEditing()
    } else if (e.key === 'Escape') {
      setLabelValue(nodeData.label || 'Actor')
      setIsEditing(false)
    }
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    const current = getNode(id)
    if (!current) return
    const newId = `actor-${Date.now()}`
    addNodes({
      ...current,
      id: newId,
      position: {
        x: current.position.x + 30,
        y: current.position.y + 30,
      },
      selected: true,
      data: {
        ...current.data,
        label: `${nodeData.label} Copy`,
        isLocked: false,
      },
    })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteElements({ nodes: [{ id }] })
  }

  const handleCycleType = (e: React.MouseEvent) => {
    e.stopPropagation()
    const types: Array<'primary' | 'secondary' | 'system'> = [
      'primary',
      'secondary',
      'system',
    ]
    const currentType = nodeData.actorType || 'primary'
    const nextType = types[(types.indexOf(currentType) + 1) % types.length]
    updateNodeData(id, { actorType: nextType })
  }

  const actorType = nodeData.actorType || 'primary'

  return (
    <div
      className={`group relative flex flex-col items-center justify-center p-2.5 rounded-[6px] transition-all duration-150 select-none ${
        selected
          ? 'ring-2 ring-[var(--primary-btn)] bg-[var(--selection-bg)] shadow-xs'
          : 'hover:bg-[var(--hover-bg)]'
      }`}
      style={{ minWidth: 90 }}
      onDoubleClick={() => {
        if (!isLocked) setIsEditing(true)
      }}
    >
      {/* Floating Action Pill when selected (only in free mode or unlocked) */}
      {selected && !isLocked && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[var(--bg-primary)] border border-[var(--border-default)] px-1.5 py-0.5 rounded-[4px] shadow-sm z-50 text-xs">
          <button
            type="button"
            title="Edit Actor Name"
            onClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
            }}
            className="p-1 rounded-[3px] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            title={`Actor Type: ${actorType}. Click to change.`}
            onClick={handleCycleType}
            className="p-1 rounded-[3px] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <ShieldAlert className="w-3 h-3" />
          </button>
          <button
            type="button"
            title="Duplicate Actor"
            onClick={handleDuplicate}
            className="p-1 rounded-[3px] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            type="button"
            title="Delete Actor"
            onClick={handleDelete}
            className="p-1 rounded-[3px] hover:bg-[var(--notion-red-bg)] text-[var(--text-secondary)] hover:text-[var(--notion-red-text)]"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Handles on all 4 sides with both source and target capability */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-[var(--text-primary)] !border !border-[var(--bg-primary)] opacity-40 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="!w-2.5 !h-2.5 !bg-[var(--text-primary)] !border !border-[var(--bg-primary)] opacity-0"
      />

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-[var(--text-primary)] !border !border-[var(--bg-primary)] opacity-40 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!w-2.5 !h-2.5 !bg-[var(--text-primary)] !border !border-[var(--bg-primary)] opacity-0"
      />

      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !bg-[var(--text-primary)] !border !border-[var(--bg-primary)] opacity-40 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="!w-2.5 !h-2.5 !bg-[var(--text-primary)] !border !border-[var(--bg-primary)] opacity-0"
      />

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !bg-[var(--text-primary)] !border !border-[var(--bg-primary)] opacity-40 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!w-2.5 !h-2.5 !bg-[var(--text-primary)] !border !border-[var(--bg-primary)] opacity-0"
      />

      {/* UML Stick Figure / System Icon */}
      <div className="relative mb-1 flex items-center justify-center">
        {actorType === 'system' ? (
          <div className="w-9 h-11 border-2 border-[var(--text-primary)] rounded-[3px] flex flex-col items-center justify-center p-1 bg-[var(--bg-primary)]">
            <div className="w-5 h-2.5 border border-[var(--text-secondary)] rounded-xs mb-1" />
            <div className="w-5 h-2.5 border border-[var(--text-secondary)] rounded-xs" />
          </div>
        ) : (
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
        )}

        {actorType === 'secondary' && (
          <span className="absolute -top-1 -right-3 notion-tag notion-tag-orange text-[9px] uppercase font-mono px-1 py-0 font-semibold shadow-xs">
            Sec
          </span>
        )}
        {actorType === 'system' && (
          <span className="absolute -top-1 -right-3 notion-tag notion-tag-purple text-[9px] uppercase font-mono px-1 py-0 font-semibold shadow-xs">
            Sys
          </span>
        )}
      </div>

      {/* Actor Label */}
      <div className="text-center text-xs tracking-tight text-[var(--text-primary)] max-w-[130px] leading-tight font-sans">
        <div className="text-[10px] text-[var(--text-tertiary)] font-mono">
          {actorType === 'system' ? '«system»' : '«actor»'}
        </div>

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onBlur={handleFinishEditing}
            onKeyDown={handleKeyDown}
            className="w-full text-center text-xs font-semibold px-1 py-0.5 rounded-[3px] border border-[var(--primary-btn)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none"
          />
        ) : (
          <div
            className="font-semibold text-xs text-[var(--text-primary)] mt-0.5 break-words cursor-text"
            title={!isLocked ? 'Double-click to rename' : undefined}
          >
            {nodeData.label}
          </div>
        )}
      </div>
    </div>
  )
})

ActorNode.displayName = 'ActorNode'
