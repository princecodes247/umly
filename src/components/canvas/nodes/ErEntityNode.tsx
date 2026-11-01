import { memo, useState, useRef, useEffect } from 'react'
import {
  Handle,
  Position,
  NodeToolbar,
  NodeResizer,
  useReactFlow,
  type NodeProps,
} from '@xyflow/react'
import { Trash2, Copy, Pencil, Plus, KeyRound, Table2, X } from 'lucide-react'
import type {
  UmlNodeData,
  NodeAccentColor,
  ErAttribute,
} from '../../../types/game'

const ACCENT_STYLES: Record<
  NodeAccentColor,
  { border: string; headerBg: string; headerText: string }
> = {
  default: {
    border: 'var(--border-strong)',
    headerBg: 'var(--bg-secondary)',
    headerText: 'var(--text-primary)',
  },
  blue: {
    border: 'var(--notion-blue-text)',
    headerBg: 'var(--notion-blue-bg)',
    headerText: 'var(--notion-blue-text)',
  },
  green: {
    border: 'var(--notion-green-text)',
    headerBg: 'var(--notion-green-bg)',
    headerText: 'var(--notion-green-text)',
  },
  amber: {
    border: 'var(--notion-yellow-text)',
    headerBg: 'var(--notion-yellow-bg)',
    headerText: 'var(--notion-yellow-text)',
  },
  purple: {
    border: 'var(--notion-purple-text)',
    headerBg: 'var(--notion-purple-bg)',
    headerText: 'var(--notion-purple-text)',
  },
  rose: {
    border: 'var(--notion-pink-text)',
    headerBg: 'var(--notion-pink-bg)',
    headerText: 'var(--notion-pink-text)',
  },
}

export const ErEntityNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as UmlNodeData
  const { updateNode, updateNodeData, deleteElements } = useReactFlow()
  const isLocked = Boolean(nodeData.isLocked)

  const [isEditingTitle, setIsEditingTitle] = useState(
    Boolean(nodeData.autoFocusEdit)
  )
  const [editingAttrId, setEditingAttrId] = useState<string | null>(null)
  const [editingAttrValue, setEditingAttrValue] = useState('')
  const titleRef = useRef<HTMLDivElement>(null)

  const attributes: ErAttribute[] = Array.isArray(nodeData.attributes)
    ? nodeData.attributes
    : []

  useEffect(() => {
    if (nodeData.autoFocusEdit) {
      setIsEditingTitle(true)
      updateNodeData(id, { autoFocusEdit: false })
    }
  }, [id, nodeData.autoFocusEdit, updateNodeData])

  useEffect(() => {
    if (isEditingTitle && titleRef.current) {
      titleRef.current.focus()
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(titleRef.current)
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }, [isEditingTitle])

  useEffect(() => {
    if (!isEditingTitle && titleRef.current) {
      titleRef.current.innerText = nodeData.label || 'Entity'
    }
  }, [nodeData.label, isEditingTitle])

  useEffect(() => {
    const handleStartEdit = (e: Event) => {
      const detail = (e as CustomEvent<{ nodeId: string }>).detail
      if (detail?.nodeId === id && !isLocked) {
        setIsEditingTitle(true)
      }
    }
    window.addEventListener('start-node-edit', handleStartEdit)
    return () => window.removeEventListener('start-node-edit', handleStartEdit)
  }, [id, isLocked])

  const handleFinishEditingTitle = () => {
    setIsEditingTitle(false)
    const raw = titleRef.current?.innerText ?? ''
    const trimmed = raw.trim() || 'Entity'
    if (titleRef.current) {
      titleRef.current.innerText = trimmed
    }
    updateNodeData(id, { label: trimmed, autoFocusEdit: false })
  }

  useEffect(() => {
    if (!selected && isEditingTitle) {
      handleFinishEditingTitle()
    }
  }, [selected, isEditingTitle])

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      handleFinishEditingTitle()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      e.stopPropagation()
      handleFinishEditingTitle()
      window.dispatchEvent(
        new CustomEvent('create-next-connected', {
          detail: { nodeId: id },
        })
      )
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      if (titleRef.current) {
        titleRef.current.innerText = nodeData.label || 'Entity'
      }
      setIsEditingTitle(false)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  const handleAddAttribute = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (isLocked) return
    const nextAttr: ErAttribute = {
      id: `attr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: `column_${attributes.length + 1}`,
      dataType: 'varchar',
      isPrimaryKey: false,
      isForeignKey: false,
      isNullable: false,
    }
    updateNodeData(id, {
      attributes: [...attributes, nextAttr],
    })
    setEditingAttrId(nextAttr.id)
    setEditingAttrValue(nextAttr.name)
  }

  const handleRemoveAttribute = (attrId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLocked) return
    updateNodeData(id, {
      attributes: attributes.filter((a) => a.id !== attrId),
    })
  }

  const commitAttrRename = (attrId: string) => {
    const trimmed = editingAttrValue.trim()
    if (trimmed) {
      updateNodeData(id, {
        attributes: attributes.map((a) =>
          a.id === attrId ? { ...a, name: trimmed } : a
        ),
      })
    }
    setEditingAttrId(null)
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

  const accent =
    ACCENT_STYLES[nodeData.accentColor || 'default'] || ACCENT_STYLES.default
  const handleVisibility = selected
    ? 'opacity-100'
    : 'opacity-0 group-hover:opacity-100'

  const customW =
    typeof nodeData.width === 'number' ? nodeData.width : undefined
  const customH =
    typeof nodeData.height === 'number' ? nodeData.height : undefined

  const isWeak = Boolean(nodeData.isWeakEntity)

  return (
    <div
      className={`group relative flex flex-col rounded-[6px] bg-[var(--bg-primary)] transition-colors select-none border-[1.5px] ${
        selected
          ? 'ring-2 ring-[var(--primary-btn)] shadow-md'
          : 'hover:border-[var(--text-primary)] shadow-sm'
      } ${isWeak ? 'outline-2 outline-offset-[3px] outline-[var(--border-strong)]' : ''}`}
      style={{
        width: customW ?? 230,
        height: customH,
        minWidth: 190,
        minHeight: 88,
        borderColor: selected ? 'var(--primary-btn)' : accent.border,
      }}
    >
      {!isLocked && (
        <NodeResizer
          isVisible={selected}
          minWidth={190}
          minHeight={88}
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

      {selected && !isLocked && !isEditingTitle && (
        <NodeToolbar
          isVisible={selected && !isLocked && !isEditingTitle}
          position={Position.Top}
          offset={16}
          className="nodrag nopan flex items-center gap-0.5 bg-[var(--bg-primary)] border border-[var(--border-default)] p-0.5 rounded-[5px] shadow-lg z-[99999] text-xs"
        >
          <button
            type="button"
            title="Rename entity (Enter)"
            onClick={(e) => {
              e.stopPropagation()
              setIsEditingTitle(true)
            }}
            className="p-1.5 rounded-[3px] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Add attribute"
            onClick={handleAddAttribute}
            className="p-1.5 rounded-[3px] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--primary-btn)] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Duplicate"
            onClick={handleDuplicate}
            className="p-1.5 rounded-[3px] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3.5 bg-[var(--border-subtle)] mx-0.5" />
          <button
            type="button"
            title="Delete"
            onClick={handleDelete}
            className="p-1.5 rounded-[3px] hover:bg-[var(--notion-red-bg)] text-[var(--text-secondary)] hover:text-[var(--notion-red-text)] transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </NodeToolbar>
      )}

      {/* Entity Header */}
      <div
        className="flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-t-[5px] border-b border-[var(--border-default)]"
        style={{ backgroundColor: accent.headerBg }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          if (!isLocked) setIsEditingTitle(true)
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <Table2
            className="w-3.5 h-3.5 shrink-0 opacity-80"
            style={{ color: accent.headerText }}
          />
          <div
            ref={titleRef}
            contentEditable={isEditingTitle && !isLocked}
            suppressContentEditableWarning
            onBlur={handleFinishEditingTitle}
            onKeyDown={handleTitleKeyDown}
            onPaste={handlePaste}
            onPointerDown={(e) => {
              if (isEditingTitle) e.stopPropagation()
            }}
            onMouseDown={(e) => {
              if (isEditingTitle) e.stopPropagation()
            }}
            style={{ color: accent.headerText }}
            className={`text-xs font-bold leading-snug outline-none truncate ${
              isEditingTitle
                ? 'nodrag select-text cursor-text bg-[var(--bg-primary)] px-1 rounded-[3px] ring-1 ring-[var(--primary-btn)] min-w-[60px]'
                : 'cursor-inherit'
            }`}
          >
            {nodeData.label || 'Entity'}
          </div>
        </div>

        {isWeak && (
          <span className="shrink-0 text-[9px] font-mono uppercase px-1 py-0.5 rounded bg-[var(--bg-primary)]/70 border border-[var(--border-subtle)] text-[var(--text-tertiary)]">
            weak
          </span>
        )}
      </div>

      {/* Attributes List */}
      <div className="flex-1 flex flex-col divide-y divide-[var(--border-subtle)]/60 overflow-hidden">
        {attributes.length === 0 ? (
          <div className="px-2.5 py-2.5 text-[11px] text-[var(--text-tertiary)] italic text-center">
            No attributes
          </div>
        ) : (
          attributes.map((attr) => (
            <div
              key={attr.id}
              className="group/attr flex items-center justify-between gap-1.5 px-2.5 py-1 text-[11px] hover:bg-[var(--hover-bg)]/60 transition-colors"
              onDoubleClick={(e) => {
                e.stopPropagation()
                if (!isLocked) {
                  setEditingAttrId(attr.id)
                  setEditingAttrValue(attr.name)
                }
              }}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {attr.isPrimaryKey ? (
                  <span
                    title="Primary Key"
                    className="inline-flex items-center gap-0.5 px-1 py-0 rounded text-[9px] font-mono font-bold bg-[var(--notion-yellow-bg)] text-[var(--notion-yellow-text)] shrink-0"
                  >
                    <KeyRound className="w-2.5 h-2.5" />
                    PK
                  </span>
                ) : attr.isForeignKey ? (
                  <span
                    title="Foreign Key"
                    className="inline-flex items-center px-1 py-0 rounded text-[9px] font-mono font-bold bg-[var(--notion-blue-bg)] text-[var(--notion-blue-text)] shrink-0"
                  >
                    FK
                  </span>
                ) : (
                  <span className="w-3.5 text-center text-[var(--text-tertiary)] shrink-0">
                    ·
                  </span>
                )}

                {editingAttrId === attr.id ? (
                  <input
                    type="text"
                    autoFocus
                    value={editingAttrValue}
                    onChange={(e) => setEditingAttrValue(e.target.value)}
                    onBlur={() => commitAttrRename(attr.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        commitAttrRename(attr.id)
                      } else if (e.key === 'Escape') {
                        e.preventDefault()
                        setEditingAttrId(null)
                      }
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="nodrag w-full px-1 py-0 text-[11px] font-mono bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--primary-btn)] rounded-[2px] outline-none"
                  />
                ) : (
                  <span
                    className={`truncate font-mono ${
                      attr.isPrimaryKey
                        ? 'font-semibold text-[var(--text-primary)] underline decoration-[var(--notion-yellow-text)]/50'
                        : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {attr.name}
                    {attr.isNullable ? '?' : ''}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {attr.isUnique && !attr.isPrimaryKey && (
                  <span className="text-[8.5px] font-mono px-1 rounded bg-[var(--notion-purple-bg)] text-[var(--notion-purple-text)]">
                    UQ
                  </span>
                )}
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                  {attr.dataType || 'varchar'}
                </span>
                {selected && !isLocked && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveAttribute(attr.id, e)}
                    title="Remove attribute"
                    className="opacity-0 group-hover/attr:opacity-100 p-0.5 rounded hover:bg-[var(--notion-red-bg)] text-[var(--text-tertiary)] hover:text-[var(--notion-red-text)] transition-opacity cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inline Add Attribute footer when selected */}
      {selected && !isLocked && (
        <button
          type="button"
          onClick={handleAddAttribute}
          onPointerDown={(e) => e.stopPropagation()}
          className="nodrag flex items-center justify-center gap-1 py-1 text-[10px] font-medium text-[var(--text-tertiary)] hover:text-[var(--primary-btn)] hover:bg-[var(--hover-bg)] border-t border-[var(--border-subtle)] rounded-b-[5px] transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Add attribute</span>
        </button>
      )}

      {/* 4-way connection handles */}
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className={`!w-2.5 !h-2.5 !bg-[var(--primary-btn)] !border-2 !border-[var(--bg-primary)] hover:!scale-125 transition-all ${handleVisibility}`}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!w-2.5 !h-2.5 !opacity-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className={`!w-2.5 !h-2.5 !bg-[var(--primary-btn)] !border-2 !border-[var(--bg-primary)] hover:!scale-125 transition-all ${handleVisibility}`}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!w-2.5 !h-2.5 !opacity-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className={`!w-2.5 !h-2.5 !bg-[var(--primary-btn)] !border-2 !border-[var(--bg-primary)] hover:!scale-125 transition-all ${handleVisibility}`}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!w-2.5 !h-2.5 !opacity-0"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className={`!w-2.5 !h-2.5 !bg-[var(--primary-btn)] !border-2 !border-[var(--bg-primary)] hover:!scale-125 transition-all ${handleVisibility}`}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!w-2.5 !h-2.5 !opacity-0"
      />
    </div>
  )
})

ErEntityNode.displayName = 'ErEntityNode'

