import { memo, useState, useRef, useEffect } from 'react'
import {
  Handle,
  Position,
  NodeToolbar,
  useReactFlow,
  type NodeProps,
} from '@xyflow/react'
import { Trash2, Copy, ShieldAlert, Pencil } from 'lucide-react'
import type { UmlNodeData, NodeAccentColor } from '../../../types/game'

const ACTOR_ACCENT_COLOR: Record<NodeAccentColor, string> = {
  default: 'var(--text-primary)',
  blue: 'var(--notion-blue-text)',
  green: 'var(--notion-green-text)',
  amber: 'var(--notion-yellow-text)',
  purple: 'var(--notion-purple-text)',
  rose: 'var(--notion-pink-text)',
}

export const ActorNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as UmlNodeData
  const { updateNodeData, deleteElements } = useReactFlow()
  const isLocked = Boolean(nodeData.isLocked)

  const [isEditing, setIsEditing] = useState(Boolean(nodeData.autoFocusEdit))
  const [labelValue, setLabelValue] = useState(nodeData.label || 'Actor')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLabelValue(nodeData.label || 'Actor')
  }, [nodeData.label])

  useEffect(() => {
    if (nodeData.autoFocusEdit) {
      setIsEditing(true)
      updateNodeData(id, { autoFocusEdit: false })
    }
  }, [id, nodeData.autoFocusEdit, updateNodeData])

  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [isEditing])

  useEffect(() => {
    const handleStartEdit = (e: Event) => {
      const detail = (e as CustomEvent<{ nodeId: string }>).detail
      if (detail?.nodeId === id && !isLocked) {
        setIsEditing(true)
      }
    }
    window.addEventListener('start-node-edit', handleStartEdit)
    return () => window.removeEventListener('start-node-edit', handleStartEdit)
  }, [id, isLocked])

  const handleFinishEditing = () => {
    setIsEditing(false)
    const trimmed = labelValue.trim() || 'Actor'
    setLabelValue(trimmed)
    updateNodeData(id, { label: trimmed, autoFocusEdit: false })
  }

  // Exit edit mode automatically whenever the node is deselected
  useEffect(() => {
    if (!selected && isEditing) {
      setIsEditing(false)
      const trimmed = labelValue.trim() || 'Actor'
      setLabelValue(trimmed)
      updateNodeData(id, { label: trimmed, autoFocusEdit: false })
    }
  }, [selected, isEditing, id, labelValue, updateNodeData])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      handleFinishEditing()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      e.stopPropagation()
      handleFinishEditing()
      window.dispatchEvent(
        new CustomEvent('create-next-connected', {
          detail: { nodeId: id },
        })
      )
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      setLabelValue(nodeData.label || 'Actor')
      setIsEditing(false)
    }
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.dispatchEvent(
      new CustomEvent('duplicate-node', {
        detail: { nodeId: id },
      })
    )
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
  const strokeColor =
    ACTOR_ACCENT_COLOR[nodeData.accentColor || 'default'] ||
    'var(--text-primary)'
  const handleVisibility = selected
    ? 'opacity-100'
    : 'opacity-0 group-hover:opacity-100'

  const stereotypeLabel = nodeData.stereotype
    ? `«${nodeData.stereotype.replace(/^[«<]+|[»>]+$/g, '')}»`
    : actorType === 'system'
      ? '«system»'
      : '«actor»'

  return (
    <div
      className={`group relative flex flex-col items-center justify-center p-2.5 rounded-[6px] transition-all duration-150 select-none ${
        selected
          ? 'ring-2 ring-[var(--primary-btn)] bg-[var(--selection-bg)] shadow-xs'
          : 'hover:bg-[var(--hover-bg)]'
      }`}
      style={{ minWidth: 88 }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (!isLocked) setIsEditing(true)
      }}
    >
      {/* Compact toolbar positioned clear of the selection ring */}
      {selected && !isLocked && !isEditing && (
        <NodeToolbar
          isVisible={selected && !isLocked && !isEditing}
          position={Position.Top}
          offset={16}
          className="nodrag nopan flex items-center gap-0.5 bg-[var(--bg-primary)] border border-[var(--border-default)] p-0.5 rounded-[5px] shadow-lg z-[99999] text-xs"
        >
          <button
            type="button"
            title="Rename (Enter)"
            onClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
            }}
            className="p-1 rounded-[3px] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            type="button"
            title={`Actor Type: ${actorType}. Click to cycle.`}
            onClick={handleCycleType}
            className="p-1 rounded-[3px] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <ShieldAlert className="w-3 h-3" />
          </button>
          <button
            type="button"
            title="Duplicate (Cmd+D)"
            onClick={handleDuplicate}
            className="p-1 rounded-[3px] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            type="button"
            title="Delete (Backspace)"
            onClick={handleDelete}
            className="p-1 rounded-[3px] hover:bg-[var(--notion-red-bg)] text-[var(--text-secondary)] hover:text-[var(--notion-red-text)] cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </NodeToolbar>
      )}

      {/* UML Stick Figure / System Icon with handles touching the figure body */}
      <div
        className="relative mb-1 flex items-center justify-center"
        style={{ width: 36, height: 46 }}
      >
        {/* Top handle: touches top of head (18, 2) */}
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          style={{
            left: 18,
            top: 2,
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
          }}
          className={`!w-2.5 !h-2.5 !bg-[var(--primary-btn)] !border-2 !border-[var(--bg-primary)] ${handleVisibility} transition-opacity z-10`}
        />
        <Handle
          type="source"
          position={Position.Top}
          id="top-source"
          style={{
            left: 18,
            top: 2,
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
          }}
          className="!w-2.5 !h-2.5 opacity-0 !pointer-events-none"
        />

        {/* Bottom handle: touches feet (18, 43) */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          style={{
            left: 18,
            top: 43,
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
          }}
          className={`!w-2.5 !h-2.5 !bg-[var(--primary-btn)] !border-2 !border-[var(--bg-primary)] ${handleVisibility} transition-opacity z-10`}
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="bottom-target"
          style={{
            left: 18,
            top: 43,
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
          }}
          className="!w-2.5 !h-2.5 opacity-0 !pointer-events-none"
        />

        {/* Left handle: touches left hand (6, 20) */}
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          style={{
            left: 6,
            top: 20,
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
          }}
          className={`!w-2.5 !h-2.5 !bg-[var(--primary-btn)] !border-2 !border-[var(--bg-primary)] ${handleVisibility} transition-opacity z-10`}
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left-source"
          style={{
            left: 6,
            top: 20,
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
          }}
          className="!w-2.5 !h-2.5 opacity-0 !pointer-events-none"
        />

        {/* Right handle: touches right hand (30, 20) */}
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          style={{
            left: 30,
            top: 20,
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
          }}
          className={`!w-2.5 !h-2.5 !bg-[var(--primary-btn)] !border-2 !border-[var(--bg-primary)] ${handleVisibility} transition-opacity z-10`}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="right-target"
          style={{
            left: 30,
            top: 20,
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
          }}
          className="!w-2.5 !h-2.5 opacity-0 !pointer-events-none"
        />

        {actorType === 'system' ? (
          <div
            style={{ borderColor: strokeColor }}
            className="w-9 h-11 border-2 rounded-[3px] flex flex-col items-center justify-center p-1 bg-[var(--bg-primary)]"
          >
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
            style={{ stroke: strokeColor }}
            className="transition-colors"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18" cy="8" r="6" />
            <line x1="18" y1="14" x2="18" y2="30" />
            <line x1="6" y1="20" x2="30" y2="20" />
            <line x1="18" y1="30" x2="8" y2="43" />
            <line x1="18" y1="30" x2="28" y2="43" />
          </svg>
        )}
      </div>

      {/* Actor Label */}
      <div className="text-center text-xs tracking-tight text-[var(--text-primary)] max-w-[130px] leading-tight font-sans">
        <div className="text-[10px] text-[var(--text-tertiary)] font-mono flex items-center justify-center gap-1">
          <span>{stereotypeLabel}</span>
          {actorType === 'secondary' && (
            <span className="notion-tag notion-tag-orange text-[8.5px] uppercase font-mono px-1 py-0 font-semibold shadow-2xs">
              Sec
            </span>
          )}
          {actorType === 'system' && (
            <span className="notion-tag notion-tag-purple text-[8.5px] uppercase font-mono px-1 py-0 font-semibold shadow-2xs">
              Sys
            </span>
          )}
        </div>

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onBlur={handleFinishEditing}
            onKeyDown={handleKeyDown}
            className="nodrag nopan w-28 text-center text-xs font-semibold px-1 py-0.5 rounded-[3px] border border-[var(--primary-btn)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none"
          />
        ) : (
          <div
            className="font-semibold text-xs text-[var(--text-primary)] mt-0.5 break-words cursor-text"
            title={!isLocked ? 'Double-click or press Enter to rename' : undefined}
          >
            {nodeData.label}
          </div>
        )}
      </div>
    </div>
  )
})

ActorNode.displayName = 'ActorNode'
