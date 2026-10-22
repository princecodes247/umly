import { memo, useState, useRef, useEffect } from 'react'
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import { Trash2, Copy, Edit2 } from 'lucide-react'
import type { UmlNodeData } from '../../../types/game'

export const UseCaseNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as UmlNodeData
  const { updateNodeData, deleteElements, getNode, addNodes } = useReactFlow()
  const isLocked = Boolean(nodeData.isLocked)

  const [isEditing, setIsEditing] = useState(false)
  const [labelValue, setLabelValue] = useState(nodeData.label || 'Use Case')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLabelValue(nodeData.label || 'Use Case')
  }, [nodeData.label])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const handleFinishEditing = () => {
    setIsEditing(false)
    const trimmed = labelValue.trim() || 'Use Case'
    setLabelValue(trimmed)
    updateNodeData(id, { label: trimmed })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleFinishEditing()
    } else if (e.key === 'Escape') {
      setLabelValue(nodeData.label || 'Use Case')
      setIsEditing(false)
    }
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    const current = getNode(id)
    if (!current) return
    const newId = `uc-${Date.now()}`
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
        label: `${nodeData.label} (Copy)`,
        isLocked: false,
      },
    })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteElements({ nodes: [{ id }] })
  }

  return (
    <div
      className={`group relative flex items-center justify-center px-5 py-3 transition-all duration-150 select-none ${
        selected
          ? 'border-[var(--primary-btn)] ring-2 ring-[var(--primary-btn)] shadow-md bg-[var(--selection-bg)]'
          : 'border-[var(--border-strong)] bg-[var(--bg-primary)] hover:border-[var(--text-primary)] shadow-xs'
      } border-[1.5px]`}
      style={{
        minWidth: 140,
        minHeight: 56,
        borderRadius: '50% / 50%',
      }}
      onDoubleClick={() => {
        if (!isLocked) setIsEditing(true)
      }}
    >
      {/* Floating Action Pill when selected (only in free mode or unlocked) */}
      {selected && !isLocked && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[var(--bg-primary)] border border-[var(--border-default)] px-1.5 py-0.5 rounded-[4px] shadow-sm z-50 text-xs">
          <button
            type="button"
            title="Edit Use Case Name"
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
            title="Duplicate Use Case"
            onClick={handleDuplicate}
            className="p-1 rounded-[3px] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            type="button"
            title="Delete Use Case"
            onClick={handleDelete}
            className="p-1 rounded-[3px] hover:bg-[var(--notion-red-bg)] text-[var(--text-secondary)] hover:text-[var(--notion-red-text)]"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Handles on all 4 sides with both source & target support */}
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

      {/* Use Case Label */}
      <div className="text-center font-medium text-xs text-[var(--text-primary)] max-w-[140px] leading-snug px-1 font-sans">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onBlur={handleFinishEditing}
            onKeyDown={handleKeyDown}
            className="w-full text-center text-xs font-medium px-1 py-0.5 rounded-[3px] border border-[var(--primary-btn)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none"
          />
        ) : (
          <div
            className="cursor-text break-words"
            title={!isLocked ? 'Double-click to rename' : undefined}
          >
            {nodeData.label}
          </div>
        )}
      </div>
    </div>
  )
})

UseCaseNode.displayName = 'UseCaseNode'
