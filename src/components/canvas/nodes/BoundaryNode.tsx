import { memo, useState, useRef, useEffect } from 'react'
import {
  NodeResizer,
  NodeToolbar,
  Position,
  useReactFlow,
  type NodeProps,
} from '@xyflow/react'
import { Trash2, Pencil } from 'lucide-react'
import type { UmlNodeData, NodeAccentColor } from '../../../types/game'

const BOUNDARY_BORDER_COLOR: Record<NodeAccentColor, string> = {
  default: 'var(--border-strong)',
  blue: 'var(--notion-blue-text)',
  green: 'var(--notion-green-text)',
  amber: 'var(--notion-yellow-text)',
  purple: 'var(--notion-purple-text)',
  rose: 'var(--notion-pink-text)',
}

export const BoundaryNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as UmlNodeData
  const { updateNode, updateNodeData, deleteElements, setNodes, setEdges } =
    useReactFlow()
  const isLocked = Boolean(nodeData.isLocked)

  const handleSelectBoundary = (e: React.MouseEvent) => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected:
          e.shiftKey || e.metaKey || e.ctrlKey
            ? n.id === id
              ? true
              : n.selected
            : n.id === id,
      }))
    )
    if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
      setEdges((eds) => eds.map((edge) => ({ ...edge, selected: false })))
    }
  }

  const [isEditing, setIsEditing] = useState(Boolean(nodeData.autoFocusEdit))
  const [titleValue, setTitleValue] = useState(
    nodeData.boundaryTitle || nodeData.label || 'System Boundary'
  )
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTitleValue(nodeData.boundaryTitle || nodeData.label || 'System Boundary')
  }, [nodeData.boundaryTitle, nodeData.label])

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
    const trimmed = titleValue.trim() || 'System Boundary'
    setTitleValue(trimmed)
    updateNodeData(id, {
      boundaryTitle: trimmed,
      label: trimmed,
      autoFocusEdit: false,
    })
  }

  // Exit edit mode automatically whenever the node is deselected
  useEffect(() => {
    if (!selected && isEditing) {
      setIsEditing(false)
      const trimmed = titleValue.trim() || 'System Boundary'
      setTitleValue(trimmed)
      updateNodeData(id, {
        boundaryTitle: trimmed,
        label: trimmed,
        autoFocusEdit: false,
      })
    }
  }, [selected, isEditing, id, titleValue, updateNodeData])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      handleFinishEditing()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      setTitleValue(
        nodeData.boundaryTitle || nodeData.label || 'System Boundary'
      )
      setIsEditing(false)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteElements({ nodes: [{ id }] })
  }

  const width = nodeData.width || 440
  const height = nodeData.height || 380
  const isHoveredByDrag = Boolean(nodeData.isHoveredByDrag)
  const customBorderColor =
    BOUNDARY_BORDER_COLOR[nodeData.accentColor || 'default'] ||
    'var(--border-strong)'

  return (
    <div
      className={`relative rounded-[8px] border-2 border-dashed transition-colors select-none pointer-events-none ${
        selected
          ? 'bg-[var(--hover-bg)]'
          : isHoveredByDrag
            ? 'bg-[var(--selection-bg)]/40 ring-2 ring-[var(--primary-btn)]/35'
            : 'bg-[var(--bg-primary)]/45'
      }`}
      style={{
        width,
        height,
        minWidth: 200,
        minHeight: 150,
        borderColor:
          selected || isHoveredByDrag
            ? 'var(--primary-btn)'
            : customBorderColor,
      }}
    >
      {/* Minimal delete button positioned clear of resize handles */}
      {selected && !isLocked && !isEditing && (
        <NodeToolbar
          isVisible={selected && !isLocked && !isEditing}
          position={Position.Top}
          offset={16}
          className="nodrag nopan flex items-center bg-[var(--bg-primary)] border border-[var(--border-default)] p-0.5 rounded-[5px] shadow-lg z-[99999] text-xs pointer-events-auto"
        >
          <button
            type="button"
            title="Rename boundary (Enter)"
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
            title="Delete boundary (Backspace)"
            onClick={handleDelete}
            className="p-1 rounded-[3px] hover:bg-[var(--notion-red-bg)] text-[var(--text-secondary)] hover:text-[var(--notion-red-text)] cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </NodeToolbar>
      )}

      {/* 4 explicit 16px border hit-strips (top, right, bottom, left) so clicking or dragging anywhere on the dashed border selects & moves the boundary, while leaving the interior 100% pass-through */}
      <div
        onMouseDown={handleSelectBoundary}
        onClick={handleSelectBoundary}
        className="boundary-interactive absolute -top-1.5 -left-1.5 -right-1.5 h-4 cursor-pointer pointer-events-auto"
      />
      <div
        onMouseDown={handleSelectBoundary}
        onClick={handleSelectBoundary}
        className="boundary-interactive absolute -bottom-1.5 -left-1.5 -right-1.5 h-4 cursor-pointer pointer-events-auto"
      />
      <div
        onMouseDown={handleSelectBoundary}
        onClick={handleSelectBoundary}
        className="boundary-interactive absolute -top-1.5 -bottom-1.5 -left-1.5 w-4 cursor-pointer pointer-events-auto"
      />
      <div
        onMouseDown={handleSelectBoundary}
        onClick={handleSelectBoundary}
        className="boundary-interactive absolute -top-1.5 -bottom-1.5 -right-1.5 w-4 cursor-pointer pointer-events-auto"
      />

      {/* NodeResizer for free resizing */}
      {!isLocked && (
        <NodeResizer
          isVisible={selected}
          minWidth={200}
          minHeight={150}
          lineClassName="!border-[var(--primary-btn)] pointer-events-auto"
          handleClassName="!w-3 !h-3 !bg-[var(--bg-primary)] !border-2 !border-[var(--primary-btn)] !rounded-[2px] pointer-events-auto"
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

      {/* Single Top-Left Editable Boundary Title Header */}
      <div
        onClick={handleSelectBoundary}
        className="boundary-interactive absolute top-2.5 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[var(--bg-primary)] border border-[var(--border-default)] shadow-xs text-xs pointer-events-auto cursor-pointer z-10"
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            backgroundColor:
              nodeData.accentColor && nodeData.accentColor !== 'default'
                ? customBorderColor
                : 'var(--notion-blue-text)',
          }}
        />

        {isEditing ? (
          <div className="inline-grid items-center">
            <span
              className="col-start-1 row-start-1 invisible whitespace-pre font-semibold text-xs text-[var(--text-primary)] px-0.5 select-none pointer-events-none"
              aria-hidden="true"
            >
              {titleValue ? `${titleValue} ` : 'System Boundary '}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleFinishEditing}
              onKeyDown={handleKeyDown}
              className="nodrag nopan col-start-1 row-start-1 w-full font-semibold text-xs text-[var(--text-primary)] bg-transparent border-0 outline-none p-0 m-0 px-0.5 caret-[var(--primary-btn)] focus:ring-0 shadow-none selection:bg-[var(--selection-bg)]"
              spellCheck={false}
            />
          </div>
        ) : (
          <span
            className="font-semibold text-xs text-[var(--text-primary)] cursor-pointer hover:underline px-0.5"
            onDoubleClick={(e) => {
              e.stopPropagation()
              if (!isLocked) setIsEditing(true)
            }}
            title={!isLocked ? 'Double-click or press Enter to rename' : undefined}
          >
            {titleValue}
          </span>
        )}
      </div>
    </div>
  )
})

BoundaryNode.displayName = 'BoundaryNode'
