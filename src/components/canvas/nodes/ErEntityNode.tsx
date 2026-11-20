import { memo, useState, useRef, useEffect } from 'react'
import {
  Handle,
  Position,
  NodeToolbar,
  NodeResizer,
  useReactFlow,
  type NodeProps,
} from '@xyflow/react'
import {
  Trash2,
  Copy,
  Pencil,
  Plus,
  KeyRound,
  Table2,
  X,
  Minimize2,
  Maximize2,
  GripVertical,
} from 'lucide-react'
import type {
  UmlNodeData,
  ErAttribute,
} from '../../../types/game'
import { NODE_ACCENT_STYLES } from './constants'

export const ErEntityNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as UmlNodeData
  const { updateNode, updateNodeData, deleteElements } = useReactFlow()
  const isLocked = Boolean(nodeData.isLocked)

  const [isEditingTitle, setIsEditingTitle] = useState(
    Boolean(nodeData.autoFocusEdit)
  )
  const [editingAttrId, setEditingAttrId] = useState<string | null>(null)
  const [editingAttrValue, setEditingAttrValue] = useState('')
  const [dragAttrState, setDragAttrState] = useState<{
    draggingId: string
    insertIndex: number
  } | null>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const attrRowRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const autoFocusGraceUntilRef = useRef(
    nodeData.autoFocusEdit ? Date.now() + 180 : 0
  )

  const focusTitleAndSelect = () => {
    const el = titleRef.current
    if (!el) return
    el.focus()
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(el)
    selection?.removeAllRanges()
    selection?.addRange(range)
  }

  const attributes: ErAttribute[] = Array.isArray(nodeData.attributes)
    ? nodeData.attributes
    : []
  const attributesRef = useRef<ErAttribute[]>(attributes)
  attributesRef.current = attributes

  useEffect(() => {
    if (nodeData.autoFocusEdit) {
      autoFocusGraceUntilRef.current = Date.now() + 180
      setIsEditingTitle(true)
      updateNodeData(id, { autoFocusEdit: false })
    }
  }, [id, nodeData.autoFocusEdit, updateNodeData])

  useEffect(() => {
    if (!isEditingTitle) return
    focusTitleAndSelect()
    const ensureFocused = () => {
      if (titleRef.current && document.activeElement !== titleRef.current) {
        focusTitleAndSelect()
      }
    }
    const rafId = requestAnimationFrame(ensureFocused)
    const timerId = window.setTimeout(ensureFocused, 40)
    return () => {
      cancelAnimationFrame(rafId)
      window.clearTimeout(timerId)
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
    if (Date.now() < autoFocusGraceUntilRef.current && selected) {
      requestAnimationFrame(() => {
        focusTitleAndSelect()
      })
      return
    }
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

  const handleDuplicateAttribute = (attrId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLocked) return
    const idx = attributes.findIndex((a) => a.id === attrId)
    if (idx === -1) return
    const source = attributes[idx]
    const existingNames = new Set(attributes.map((a) => a.name))
    let copyName = `${source.name}_copy`
    let suffix = 2
    while (existingNames.has(copyName)) {
      copyName = `${source.name}_copy_${suffix++}`
    }
    const duplicated: ErAttribute = {
      ...source,
      id: `attr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: copyName,
    }
    const next = [...attributes]
    next.splice(idx + 1, 0, duplicated)
    updateNodeData(id, { attributes: next })
    setEditingAttrId(duplicated.id)
    setEditingAttrValue(duplicated.name)
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

  const handleStartAttrDrag = (
    attrId: string,
    startIndex: number,
    e: React.PointerEvent
  ) => {
    if (isLocked || attributesRef.current.length < 2) return
    e.stopPropagation()
    e.preventDefault()

    let currentInsertIndex = startIndex
    setDragAttrState({ draggingId: attrId, insertIndex: startIndex })

    const computeInsertIndex = (clientY: number) => {
      const list = attributesRef.current
      for (let i = 0; i < list.length; i++) {
        const el = attrRowRefs.current.get(list[i].id)
        if (!el) continue
        const rect = el.getBoundingClientRect()
        if (clientY < rect.top + rect.height / 2) {
          return i
        }
      }
      return list.length
    }

    const onPointerMove = (ev: PointerEvent) => {
      const nextIdx = computeInsertIndex(ev.clientY)
      if (nextIdx !== currentInsertIndex) {
        currentInsertIndex = nextIdx
        setDragAttrState({ draggingId: attrId, insertIndex: nextIdx })
      }
    }

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)

      const list = attributesRef.current
      const fromIndex = list.findIndex((a) => a.id === attrId)
      const targetIndex =
        currentInsertIndex > fromIndex
          ? currentInsertIndex - 1
          : currentInsertIndex

      if (
        fromIndex !== -1 &&
        targetIndex >= 0 &&
        targetIndex < list.length &&
        targetIndex !== fromIndex
      ) {
        const reordered = [...list]
        const [moved] = reordered.splice(fromIndex, 1)
        reordered.splice(targetIndex, 0, moved)
        updateNodeData(id, { attributes: reordered })
      }
      setDragAttrState(null)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
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

  const rawAccent =
    NODE_ACCENT_STYLES[nodeData.accentColor || 'default'] ||
    NODE_ACCENT_STYLES.default
  const accent = {
    ...rawAccent,
    headerBg: rawAccent.bandBg,
    headerText: rawAccent.text,
  }
  const handleVisibility = selected
    ? 'opacity-100'
    : 'opacity-0 group-hover:opacity-100'

  const customW =
    typeof nodeData.width === 'number' ? nodeData.width : undefined
  const customH =
    typeof nodeData.height === 'number' ? nodeData.height : undefined

  const isWeak = Boolean(nodeData.isWeakEntity)
  const isMinimized = Boolean(nodeData.isMinimized)

  const handleToggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateNodeData(id, { isMinimized: !isMinimized })
  }

  return (
    <div
      className={`group relative flex flex-col rounded-[6px] bg-[var(--bg-primary)] transition-colors select-none border-[1.5px] ${
        isMinimized ? 'justify-center' : ''
      } ${
        selected
          ? 'ring-2 ring-[var(--primary-btn)] shadow-md'
          : 'hover:border-[var(--text-primary)] shadow-sm'
      }`}
      style={{
        width: customW ?? 230,
        height: isMinimized ? 44 : customH,
        minWidth: 190,
        minHeight: isMinimized ? 44 : 88,
        borderColor: selected ? 'var(--primary-btn)' : accent.border,
        backgroundColor: isMinimized ? accent.headerBg : undefined,
      }}
    >
      {/* Weak entity diamond shape inscribed within the entity */}
      {isWeak && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 w-full h-full z-[1]"
        >
          <polygon
            points="50,0 100,50 50,100 0,50"
            fill="none"
            stroke={selected ? 'var(--primary-btn)' : accent.border}
            strokeOpacity={0.45}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      {!isLocked && (
        <NodeResizer
          isVisible={selected && !isMinimized}
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

      {isMinimized ? (
        <div
          className="relative flex items-center justify-center w-full h-full px-7 rounded-[5px]"
          onDoubleClick={(e) => {
            e.stopPropagation()
            if (!isLocked) setIsEditingTitle(true)
          }}
        >
          <button
            type="button"
            title="Expand entity"
            onClick={handleToggleMinimize}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ color: accent.headerText }}
            className="nodrag nopan absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-[3px] opacity-0 group-hover:opacity-100 hover:bg-[var(--hover-bg)] transition-opacity cursor-pointer z-[2]"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
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
            className={`text-xs font-bold leading-snug outline-none text-center truncate max-w-full ${
              isEditingTitle
                ? 'nodrag select-text cursor-text bg-[var(--bg-primary)] px-1 rounded-[3px] ring-1 ring-[var(--primary-btn)] min-w-[60px]'
                : 'cursor-inherit'
            }`}
          >
            {nodeData.label || 'Entity'}
          </div>
        </div>
      ) : (
        <>
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
              <div className="relative w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                <Table2
                  className="w-3.5 h-3.5 opacity-80 transition-opacity group-hover:opacity-0"
                  style={{ color: accent.headerText }}
                />
                <button
                  type="button"
                  title="Minimize entity"
                  onClick={handleToggleMinimize}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{ color: accent.headerText }}
                  className="nodrag nopan absolute inset-0 flex items-center justify-center rounded-[3px] opacity-0 group-hover:opacity-100 hover:bg-[var(--hover-bg)] transition-opacity cursor-pointer"
                >
                  <Minimize2 className="w-3 h-3" />
                </button>
              </div>
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
              attributes.map((attr, index) => {
                const isDraggingThis = dragAttrState?.draggingId === attr.id
                const showTopIndicator =
                  dragAttrState !== null &&
                  dragAttrState.insertIndex === index &&
                  !isDraggingThis
                const showBottomIndicator =
                  dragAttrState !== null &&
                  index === attributes.length - 1 &&
                  dragAttrState.insertIndex === attributes.length &&
                  !isDraggingThis

                return (
                <div
                  key={attr.id}
                  ref={(el) => {
                    if (el) attrRowRefs.current.set(attr.id, el)
                    else attrRowRefs.current.delete(attr.id)
                  }}
                  style={{
                    boxShadow: showTopIndicator
                      ? 'inset 0 2px 0 0 var(--primary-btn)'
                      : showBottomIndicator
                        ? 'inset 0 -2px 0 0 var(--primary-btn)'
                        : undefined,
                  }}
                  className={`group/attr flex items-center justify-between gap-1.5 px-2.5 py-1 text-[11px] hover:bg-[var(--hover-bg)]/60 transition-colors ${
                    isDraggingThis ? 'opacity-45 bg-[var(--hover-bg)]' : ''
                  }`}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    if (!isLocked) {
                      setEditingAttrId(attr.id)
                      setEditingAttrValue(attr.name)
                    }
                  }}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {selected && !isLocked && attributes.length > 1 && (
                      <span
                        title="Drag to reorder"
                        onPointerDown={(e) =>
                          handleStartAttrDrag(attr.id, index, e)
                        }
                        onMouseDown={(e) => e.stopPropagation()}
                        className="nodrag nopan cursor-grab active:cursor-grabbing opacity-0 group-hover/attr:opacity-70 hover:!opacity-100 text-[var(--text-tertiary)] shrink-0 -ml-1 flex items-center"
                      >
                        <GripVertical className="w-3 h-3" />
                      </span>
                    )}
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
                      <div className="opacity-0 group-hover/attr:opacity-100 flex items-center gap-0.5 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handleDuplicateAttribute(attr.id, e)}
                          onPointerDown={(e) => e.stopPropagation()}
                          title="Duplicate attribute"
                          className="nodrag nopan p-0.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          <Copy className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveAttribute(attr.id, e)}
                          onPointerDown={(e) => e.stopPropagation()}
                          title="Remove attribute"
                          className="nodrag nopan p-0.5 rounded hover:bg-[var(--notion-red-bg)] text-[var(--text-tertiary)] hover:text-[var(--notion-red-text)] cursor-pointer"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                )
              })
            )}
          </div>

          {/* Floating Add Attribute bar below node when selected */}
          {selected && !isLocked && (
            <NodeToolbar
              isVisible={selected && !isLocked && !isMinimized}
              position={Position.Bottom}
              offset={10}
              className="nodrag nopan flex items-center bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[5px] shadow-md overflow-hidden z-[99999]"
            >
              <button
                type="button"
                onClick={handleAddAttribute}
                onPointerDown={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-1 px-3 py-1 text-[10px] font-medium text-[var(--text-secondary)] hover:text-[var(--primary-btn)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add attribute</span>
              </button>
            </NodeToolbar>
          )}
        </>
      )}

      {/* 4-way connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={`!w-2.5 !h-2.5 !bg-[var(--primary-btn)] !border-2 !border-[var(--bg-primary)] hover:!scale-125 transition-all ${handleVisibility}`}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="!w-2.5 !h-2.5 opacity-0 !pointer-events-none"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={`!w-2.5 !h-2.5 !bg-[var(--primary-btn)] !border-2 !border-[var(--bg-primary)] hover:!scale-125 transition-all ${handleVisibility}`}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!w-2.5 !h-2.5 opacity-0 !pointer-events-none"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={`!w-2.5 !h-2.5 !bg-[var(--primary-btn)] !border-2 !border-[var(--bg-primary)] hover:!scale-125 transition-all ${handleVisibility}`}
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
        className={`!w-2.5 !h-2.5 !bg-[var(--primary-btn)] !border-2 !border-[var(--bg-primary)] hover:!scale-125 transition-all ${handleVisibility}`}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="!w-2.5 !h-2.5 opacity-0 !pointer-events-none"
      />
    </div>
  )
})

ErEntityNode.displayName = 'ErEntityNode'

