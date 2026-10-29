import { memo, useState, useRef, useEffect } from 'react'
import {
  Handle,
  Position,
  NodeToolbar,
  useReactFlow,
  type NodeProps,
} from '@xyflow/react'
import { Trash2, Copy, Pencil } from 'lucide-react'
import type { UmlNodeData } from '../../../types/game'

export const NoteNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as UmlNodeData
  const { updateNodeData, deleteElements } = useReactFlow()
  const isLocked = Boolean(nodeData.isLocked)

  const [isEditing, setIsEditing] = useState(Boolean(nodeData.autoFocusEdit))
  const [textValue, setTextValue] = useState(
    nodeData.description || nodeData.label || 'Note / Constraint'
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTextValue(nodeData.description || nodeData.label || 'Note / Constraint')
  }, [nodeData.description, nodeData.label])

  useEffect(() => {
    if (nodeData.autoFocusEdit) {
      setIsEditing(true)
      updateNodeData(id, { autoFocusEdit: false })
    }
  }, [id, nodeData.autoFocusEdit, updateNodeData])

  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        textareaRef.current?.focus()
        textareaRef.current?.select()
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
    const trimmed = textValue.trim() || 'Note'
    setTextValue(trimmed)
    updateNodeData(id, {
      label: trimmed,
      description: trimmed,
      autoFocusEdit: false,
    })
  }

  // Exit edit mode automatically whenever the node is deselected
  useEffect(() => {
    if (!selected && isEditing) {
      setIsEditing(false)
      const trimmed = textValue.trim() || 'Note'
      setTextValue(trimmed)
      updateNodeData(id, {
        label: trimmed,
        description: trimmed,
        autoFocusEdit: false,
      })
    }
  }, [selected, isEditing, id, textValue, updateNodeData])

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

  const handleVisibility = selected
    ? 'opacity-100'
    : 'opacity-0 group-hover:opacity-100'

  return (
    <div
      className={`group relative p-3 rounded-[4px] bg-[var(--notion-yellow-bg)] text-[var(--text-primary)] border transition-all select-none shadow-xs ${
        selected
          ? 'border-[var(--primary-btn)] ring-2 ring-[var(--primary-btn)]'
          : 'border-[#e6d59c] dark:border-[#5c512c]'
      }`}
      style={{
        minWidth: 150,
        maxWidth: 220,
        minHeight: 68,
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (!isLocked) setIsEditing(true)
      }}
    >
      {/* Folded corner effect */}
      <div className="absolute top-0 right-0 w-3 h-3 bg-[#e6d59c] dark:bg-[#5c512c] rounded-bl-[3px]" />

      {/* Handles visible only on hover or selection */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={`!w-2 !h-2 !bg-[var(--primary-btn)] !border !border-[var(--bg-primary)] ${handleVisibility} transition-opacity`}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="!w-2 !h-2 opacity-0 !pointer-events-none"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={`!w-2 !h-2 !bg-[var(--primary-btn)] !border !border-[var(--bg-primary)] ${handleVisibility} transition-opacity`}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!w-2 !h-2 opacity-0 !pointer-events-none"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={`!w-2 !h-2 !bg-[var(--primary-btn)] !border !border-[var(--bg-primary)] ${handleVisibility} transition-opacity`}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="!w-2 !h-2 opacity-0 !pointer-events-none"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={`!w-2 !h-2 !bg-[var(--primary-btn)] !border !border-[var(--bg-primary)] ${handleVisibility} transition-opacity`}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!w-2 !h-2 opacity-0 !pointer-events-none"
      />

      {/* Compact toolbar positioned clear of selection */}
      {selected && !isLocked && !isEditing && (
        <NodeToolbar
          isVisible={selected && !isLocked && !isEditing}
          position={Position.Top}
          offset={16}
          className="nodrag nopan flex items-center gap-0.5 bg-[var(--bg-primary)] border border-[var(--border-default)] p-0.5 rounded-[5px] shadow-lg z-[99999] text-xs"
        >
          <button
            type="button"
            title="Edit (Enter)"
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

      {/* Content */}
      <div className="text-[11px] leading-snug font-sans break-words pr-2">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            rows={3}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onBlur={handleFinishEditing}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                e.stopPropagation()
                setIsEditing(false)
              } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                e.stopPropagation()
                handleFinishEditing()
              }
            }}
            className="nodrag nopan w-full text-[11px] p-1 rounded-[2px] bg-transparent border border-[var(--primary-btn)] focus:outline-none resize-none"
          />
        ) : (
          <div className="whitespace-pre-wrap">{textValue}</div>
        )}
      </div>
    </div>
  )
})

NoteNode.displayName = 'NoteNode'
