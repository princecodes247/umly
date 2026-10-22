import { memo, useState, useRef, useEffect } from 'react'
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import { Trash2, Edit2 } from 'lucide-react'
import type { UmlNodeData } from '../../../types/game'

export const NoteNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as UmlNodeData
  const { updateNodeData, deleteElements } = useReactFlow()
  const isLocked = Boolean(nodeData.isLocked)

  const [isEditing, setIsEditing] = useState(false)
  const [textValue, setTextValue] = useState(
    nodeData.description || nodeData.label || 'Note / Constraint'
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTextValue(nodeData.description || nodeData.label || 'Note / Constraint')
  }, [nodeData.description, nodeData.label])

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus()
      textareaRef.current?.select()
    }
  }, [isEditing])

  const handleFinishEditing = () => {
    setIsEditing(false)
    const trimmed = textValue.trim() || 'Note'
    setTextValue(trimmed)
    updateNodeData(id, { description: trimmed, label: trimmed })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteElements({ nodes: [{ id }] })
  }

  return (
    <div
      className={`group relative p-3 rounded-[3px] transition-all select-none bg-[var(--notion-yellow-bg)] border border-[#e3d7b8] dark:border-[#524522] text-[var(--notion-yellow-text)] shadow-xs ${
        selected ? 'ring-2 ring-[var(--primary-btn)] shadow-md' : 'hover:shadow-sm'
      }`}
      style={{
        minWidth: 120,
        maxWidth: 200,
        clipPath:
          'polygon(0% 0%, calc(100% - 12px) 0%, 100% 12px, 100% 100%, 0% 100%)',
      }}
      onDoubleClick={() => {
        if (!isLocked) setIsEditing(true)
      }}
    >
      {/* Dog-ear fold */}
      <div
        className="absolute top-0 right-0 w-3 h-3 bg-[#dfce9f] dark:bg-[#463819] pointer-events-none"
        style={{
          clipPath: 'polygon(0% 0%, 100% 100%, 0% 100%)',
        }}
      />

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2 !h-2 !bg-[#cb912f] opacity-40 group-hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2 !h-2 !bg-[#cb912f] opacity-40 group-hover:opacity-100"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-[#cb912f] opacity-40 group-hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-[#cb912f] opacity-40 group-hover:opacity-100"
      />

      {/* Actions */}
      {selected && !isLocked && (
        <div className="absolute -top-7 right-0 flex items-center gap-0.5 bg-[var(--bg-primary)] border border-[var(--border-default)] px-1 py-0.5 rounded-[3px] shadow-xs z-50 text-xs">
          <button
            type="button"
            title="Edit note"
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
            title="Delete note"
            onClick={handleDelete}
            className="p-0.5 rounded-[2px] hover:bg-[var(--notion-red-bg)] text-[var(--text-secondary)] hover:text-[var(--notion-red-text)]"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
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
            className="w-full text-[11px] p-1 rounded-[2px] bg-transparent border border-[var(--primary-btn)] focus:outline-none resize-none"
          />
        ) : (
          <div className="whitespace-pre-wrap">{textValue}</div>
        )}
      </div>
    </div>
  )
})

NoteNode.displayName = 'NoteNode'

