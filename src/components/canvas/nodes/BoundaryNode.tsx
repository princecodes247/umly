import { memo, useState, useRef, useEffect } from 'react'
import { NodeResizer, useReactFlow, type NodeProps } from '@xyflow/react'
import { Trash2, Edit2 } from 'lucide-react'
import type { UmlNodeData } from '../../../types/game'

export const BoundaryNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as UmlNodeData
  const { updateNodeData, deleteElements } = useReactFlow()
  const isLocked = Boolean(nodeData.isLocked)

  const [isEditing, setIsEditing] = useState(false)
  const [titleValue, setTitleValue] = useState(
    nodeData.boundaryTitle || nodeData.label || 'System'
  )
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTitleValue(nodeData.boundaryTitle || nodeData.label || 'System')
  }, [nodeData.boundaryTitle, nodeData.label])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const handleFinishEditing = () => {
    setIsEditing(false)
    const trimmed = titleValue.trim() || 'System'
    setTitleValue(trimmed)
    updateNodeData(id, { boundaryTitle: trimmed, label: trimmed })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleFinishEditing()
    } else if (e.key === 'Escape') {
      setTitleValue(nodeData.boundaryTitle || nodeData.label || 'System')
      setIsEditing(false)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteElements({ nodes: [{ id }] })
  }

  const width = nodeData.width || 440
  const height = nodeData.height || 380

  return (
    <div
      className={`relative rounded-[6px] border-2 border-dashed transition-all select-none ${
        selected
          ? 'border-[var(--primary-btn)] bg-[var(--hover-bg)]'
          : 'border-[var(--border-strong)] bg-transparent'
      }`}
      style={{
        width,
        height,
        minWidth: 200,
        minHeight: 150,
      }}
    >
      {/* NodeResizer for free resizing */}
      {!isLocked && (
        <NodeResizer
          isVisible={selected}
          minWidth={200}
          minHeight={150}
          lineClassName="!border-[var(--primary-btn)]"
          handleClassName="!w-3 !h-3 !bg-[var(--bg-primary)] !border-2 !border-[var(--primary-btn)] !rounded-[2px]"
          onResize={(_, params) => {
            updateNodeData(id, {
              width: Math.round(params.width),
              height: Math.round(params.height),
            })
          }}
        />
      )}

      {/* Boundary Title Tag & Controls */}
      <div className="absolute top-2.5 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[var(--bg-primary)] border border-[var(--border-default)] shadow-xs text-xs pointer-events-auto">
        <span className="w-2 h-2 rounded-full bg-[var(--notion-blue-text)]" />

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleFinishEditing}
            onKeyDown={handleKeyDown}
            className="w-28 text-xs font-semibold px-1 py-0.5 rounded-[2px] border border-[var(--primary-btn)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none"
          />
        ) : (
          <span
            className="font-semibold text-xs text-[var(--text-primary)] cursor-pointer hover:underline"
            onDoubleClick={(e) => {
              e.stopPropagation()
              if (!isLocked) setIsEditing(true)
            }}
            title={!isLocked ? 'Double-click to edit boundary title' : undefined}
          >
            {titleValue}
          </span>
        )}

        {selected && !isLocked && (
          <div className="flex items-center gap-0.5 ml-1 border-l border-[var(--border-subtle)] pl-1">
            <button
              type="button"
              title="Edit boundary title"
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
              className="p-0.5 rounded-[2px] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"
            >
              <Edit2 className="w-2.5 h-2.5" />
            </button>
            <button
              type="button"
              title="Delete boundary"
              onClick={handleDelete}
              className="p-0.5 rounded-[2px] hover:bg-[var(--notion-red-bg)] text-[var(--text-secondary)] hover:text-[var(--notion-red-text)]"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-2 right-2.5 text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider font-mono pointer-events-none">
        System Boundary
      </div>
    </div>
  )
})

BoundaryNode.displayName = 'BoundaryNode'
