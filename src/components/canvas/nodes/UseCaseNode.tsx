import { memo, useEffect } from 'react'
import {
  Handle,
  Position,
  NodeToolbar,
  NodeResizer,
  useReactFlow,
  type NodeProps,
} from '@xyflow/react'
import { Trash2, Copy, Pencil } from 'lucide-react'
import type { UmlNodeData, NodeAccentColor } from '../../../types/game'
import { useAutoFocusEdit } from './useAutoFocusEdit'

const ACCENT_STYLES: Record<
  NodeAccentColor,
  { border: string; bg: string }
> = {
  default: {
    border: 'var(--border-strong)',
    bg: 'var(--bg-primary)',
  },
  blue: {
    border: 'var(--notion-blue-text)',
    bg: 'var(--notion-blue-bg)',
  },
  green: {
    border: 'var(--notion-green-text)',
    bg: 'var(--notion-green-bg)',
  },
  amber: {
    border: 'var(--notion-yellow-text)',
    bg: 'var(--notion-yellow-bg)',
  },
  purple: {
    border: 'var(--notion-purple-text)',
    bg: 'var(--notion-purple-bg)',
  },
  rose: {
    border: 'var(--notion-pink-text)',
    bg: 'var(--notion-pink-bg)',
  },
}

export const UseCaseNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as UmlNodeData
  const { updateNode, updateNodeData, deleteElements } = useReactFlow()
  const isLocked = Boolean(nodeData.isLocked)

  const { isEditing, setIsEditing, editRef, shouldIgnoreBlur } =
    useAutoFocusEdit<HTMLDivElement>({
      id,
      autoFocusEdit: nodeData.autoFocusEdit,
      selected: Boolean(selected),
      updateNodeData,
    })

  useEffect(() => {
    if (!isEditing && editRef.current) {
      editRef.current.innerText = nodeData.label || 'Use Case'
    }
  }, [nodeData.label, isEditing])

  // Listen for Enter-to-rename event dispatched by StudioCanvas
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
    if (shouldIgnoreBlur()) return
    setIsEditing(false)
    const raw = editRef.current?.innerText ?? ''
    const trimmed = raw.trim() || 'Use Case'
    if (editRef.current) {
      editRef.current.innerText = trimmed
    }
    updateNodeData(id, { label: trimmed, autoFocusEdit: false })
  }

  // Exit edit mode automatically whenever the node is deselected
  useEffect(() => {
    if (!selected && isEditing) {
      handleFinishEditing()
    }
  }, [selected, isEditing])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
      if (editRef.current) {
        editRef.current.innerText = nodeData.label || 'Use Case'
      }
      setIsEditing(false)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
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

  const accent = ACCENT_STYLES[nodeData.accentColor || 'default'] || ACCENT_STYLES.default
  const handleVisibility = selected
    ? 'opacity-100'
    : 'opacity-0 group-hover:opacity-100'

  const customW =
    typeof nodeData.width === 'number' ? nodeData.width : undefined
  const customH =
    typeof nodeData.height === 'number' ? nodeData.height : undefined

  return (
    <div
      className={`group relative flex flex-col items-center justify-center px-4 py-2 transition-colors select-none border-[1.5px] ${
        selected
          ? 'ring-2 ring-[var(--primary-btn)] shadow-md'
          : 'hover:border-[var(--text-primary)] shadow-sm'
      }`}
      style={{
        width: customW,
        height: customH,
        minWidth: 110,
        minHeight: 48,
        borderRadius: '50% / 50%',
        borderColor: selected ? 'var(--primary-btn)' : accent.border,
        backgroundColor: selected ? 'var(--selection-bg)' : accent.bg,
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (!isLocked) setIsEditing(true)
      }}
    >
      {/* NodeResizer for freeform sizing of the Use Case oval */}
      {!isLocked && (
        <NodeResizer
          isVisible={selected}
          minWidth={110}
          minHeight={48}
          lineClassName="!border-[var(--primary-btn)] pointer-events-auto"
          handleClassName="!w-2.5 !h-2.5 !bg-[var(--bg-primary)] !border-2 !border-[var(--primary-btn)] !rounded-[2px] pointer-events-auto"
          onResize={(_, params) => {
            updateNode(id, (node) => ({
              position: {
                x: Math.round(params.x),
                y: Math.round(params.y),
              },
              data: {
                ...node.data,
                width: Math.round(params.width),
                height: Math.round(params.height),
              },
            }))
          }}
        />
      )}

      {/* Compact toolbar positioned well clear of the selection ring */}
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

      {/* Handles visible only on hover or selection */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={`!w-2.5 !h-2.5 !bg-[var(--primary-btn)] !border-2 !border-[var(--bg-primary)] ${handleVisibility} transition-opacity`}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="!w-2.5 !h-2.5 opacity-0 !pointer-events-none"
      />

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={`!w-2.5 !h-2.5 !bg-[var(--primary-btn)] !border-2 !border-[var(--bg-primary)] ${handleVisibility} transition-opacity`}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!w-2.5 !h-2.5 opacity-0 !pointer-events-none"
      />

      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={`!w-2.5 !h-2.5 !bg-[var(--primary-btn)] !border-2 !border-[var(--bg-primary)] ${handleVisibility} transition-opacity`}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="!w-2.5 !h-2.5 opacity-0 !pointer-events-none"
      />

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={`!w-2.5 !h-2.5 !bg-[var(--primary-btn)] !border-2 !border-[var(--bg-primary)] ${handleVisibility} transition-opacity`}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!w-2.5 !h-2.5 opacity-0 !pointer-events-none"
      />

      {nodeData.stereotype && (
        <span className="text-[9px] font-mono text-[var(--text-tertiary)] leading-none mb-0.5">
          «{nodeData.stereotype.replace(/^[«<]+|[»>]+$/g, '')}»
        </span>
      )}

      {/* Use Case Label */}
      <div className="text-center font-medium text-xs text-[var(--text-primary)] max-w-[85%] leading-snug font-sans">
        <div
          ref={editRef}
          contentEditable={!isLocked && isEditing}
          suppressContentEditableWarning
          onBlur={handleFinishEditing}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className={`cursor-text break-words px-0.5 py-0 whitespace-pre-wrap outline-none caret-[var(--primary-btn)] ${
            isEditing ? 'nodrag nopan select-text' : ''
          }`}
          title={!isLocked && !isEditing ? 'Double-click or press Enter to rename' : undefined}
        >
          {nodeData.label || 'Use Case'}
        </div>
      </div>
    </div>
  )
})

UseCaseNode.displayName = 'UseCaseNode'
