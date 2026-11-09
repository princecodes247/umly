import { memo, useState, useEffect } from 'react'
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
  Boxes,
  X,
  Minimize2,
  Maximize2,
} from 'lucide-react'
import type {
  UmlNodeData,
  NodeAccentColor,
  ClassAttribute,
  ClassMethod,
  ClassVisibility,
  ClassKind,
} from '../../../types/game'
import { useAutoFocusEdit } from './useAutoFocusEdit'

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

const VISIBILITY_CYCLE: ClassVisibility[] = ['+', '-', '#', '~']

function nextVisibility(v: ClassVisibility): ClassVisibility {
  const idx = VISIBILITY_CYCLE.indexOf(v)
  return VISIBILITY_CYCLE[(idx + 1) % VISIBILITY_CYCLE.length]
}

const KIND_STEREOTYPE: Record<ClassKind, string | null> = {
  class: null,
  abstract: '«abstract»',
  interface: '«interface»',
  enum: '«enumeration»',
}

export const ClassNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as UmlNodeData
  const { updateNode, updateNodeData, deleteElements } = useReactFlow()
  const isLocked = Boolean(nodeData.isLocked)

  const {
    isEditing: isEditingTitle,
    setIsEditing: setIsEditingTitle,
    editRef: titleRef,
    shouldIgnoreBlur,
  } = useAutoFocusEdit<HTMLDivElement>({
    id,
    autoFocusEdit: nodeData.autoFocusEdit,
    selected: Boolean(selected),
    updateNodeData,
  })

  const [editingMember, setEditingMember] = useState<{
    kind: 'attr' | 'method'
    id: string
    value: string
  } | null>(null)

  const classKind: ClassKind = nodeData.classKind || 'class'
  const classAttributes: ClassAttribute[] = Array.isArray(
    nodeData.classAttributes
  )
    ? nodeData.classAttributes
    : []
  const classMethods: ClassMethod[] = Array.isArray(nodeData.classMethods)
    ? nodeData.classMethods
    : []

  useEffect(() => {
    if (!isEditingTitle && titleRef.current) {
      titleRef.current.innerText = nodeData.label || 'ClassName'
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
    if (shouldIgnoreBlur()) return
    setIsEditingTitle(false)
    const raw = titleRef.current?.innerText ?? ''
    const trimmed = raw.trim() || 'ClassName'
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
        titleRef.current.innerText = nodeData.label || 'ClassName'
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
    const nextAttr: ClassAttribute = {
      id: `cattr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      visibility: '-',
      name: `field${classAttributes.length + 1}`,
      type: 'string',
    }
    updateNodeData(id, {
      classAttributes: [...classAttributes, nextAttr],
    })
    setEditingMember({ kind: 'attr', id: nextAttr.id, value: nextAttr.name })
  }

  const handleAddMethod = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (isLocked) return
    const nextMethod: ClassMethod = {
      id: `cmethod-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      visibility: '+',
      name: `method${classMethods.length + 1}`,
      params: '',
      returnType: 'void',
    }
    updateNodeData(id, {
      classMethods: [...classMethods, nextMethod],
    })
    setEditingMember({
      kind: 'method',
      id: nextMethod.id,
      value: nextMethod.name,
    })
  }

  const commitMemberRename = () => {
    if (!editingMember) return
    const trimmed = editingMember.value.trim()
    if (trimmed) {
      if (editingMember.kind === 'attr') {
        updateNodeData(id, {
          classAttributes: classAttributes.map((a) =>
            a.id === editingMember.id ? { ...a, name: trimmed } : a
          ),
        })
      } else {
        updateNodeData(id, {
          classMethods: classMethods.map((m) =>
            m.id === editingMember.id ? { ...m, name: trimmed } : m
          ),
        })
      }
    }
    setEditingMember(null)
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

  const isMinimized = Boolean(nodeData.isMinimized)
  const stereotype = KIND_STEREOTYPE[classKind]

  const handleToggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateNodeData(id, { isMinimized: !isMinimized })
  }

  return (
    <div
      className={`group relative flex flex-col rounded-[6px] bg-[var(--bg-primary)] transition-colors select-none border-[1.5px] ${isMinimized ? 'justify-center' : ''
        } ${selected
          ? 'ring-2 ring-[var(--primary-btn)] shadow-md'
          : 'hover:border-[var(--text-primary)] shadow-sm'
        }`}
      style={{
        width: customW ?? 230,
        height: isMinimized ? 44 : customH,
        minWidth: 190,
        minHeight: isMinimized ? 44 : 110,
        borderColor: selected ? 'var(--primary-btn)' : accent.border,
        backgroundColor: isMinimized ? accent.headerBg : undefined,
      }}
    >
      {!isLocked && (
        <NodeResizer
          isVisible={selected && !isMinimized}
          minWidth={190}
          minHeight={110}
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
            title="Rename class (Enter)"
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
            className="px-1.5 py-1 rounded-[3px] hover:bg-[var(--hover-bg)] text-[10px] font-mono text-[var(--text-secondary)] hover:text-[var(--primary-btn)] transition-colors cursor-pointer flex items-center gap-0.5"
          >
            <Plus className="w-3 h-3" />
            <span>Attr</span>
          </button>
          {classKind !== 'enum' && (
            <button
              type="button"
              title="Add method"
              onClick={handleAddMethod}
              className="px-1.5 py-1 rounded-[3px] hover:bg-[var(--hover-bg)] text-[10px] font-mono text-[var(--text-secondary)] hover:text-[var(--primary-btn)] transition-colors cursor-pointer flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" />
              <span>Method</span>
            </button>
          )}
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
            title="Expand class"
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
            className={`text-xs font-bold leading-snug outline-none text-center truncate max-w-full ${classKind === 'abstract' ? 'italic' : ''
              } ${isEditingTitle
                ? 'nodrag select-text cursor-text bg-[var(--bg-primary)] px-1 rounded-[3px] ring-1 ring-[var(--primary-btn)] min-w-[60px]'
                : 'cursor-inherit'
              }`}
          >
            {nodeData.label || 'ClassName'}
          </div>
        </div>
      ) : (
        <>
          {/* Class Header Compartment */}
          <div
            className="flex flex-col px-2.5 py-2 rounded-t-[5px] border-b border-[var(--border-default)]"
            style={{ backgroundColor: accent.headerBg }}
            onDoubleClick={(e) => {
              e.stopPropagation()
              if (!isLocked) setIsEditingTitle(true)
            }}
          >
            {stereotype && (
              <span
                className="text-[9.5px] font-mono text-center opacity-75 leading-tight mb-0.5"
                style={{ color: accent.headerText }}
              >
                {stereotype}
              </span>
            )}
            <div className="flex items-center justify-between gap-1.5">
              <div className="relative w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                <Boxes
                  className="w-3.5 h-3.5 opacity-80 transition-opacity group-hover:opacity-0"
                  style={{ color: accent.headerText }}
                />
                <button
                  type="button"
                  title="Minimize class"
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
                className={`flex-1 text-center text-xs font-bold leading-snug outline-none truncate ${classKind === 'abstract' ? 'italic' : ''
                  } ${isEditingTitle
                    ? 'nodrag select-text cursor-text bg-[var(--bg-primary)] px-1 rounded-[3px] ring-1 ring-[var(--primary-btn)] min-w-[60px]'
                    : 'cursor-inherit'
                  }`}
              >
                {nodeData.label || 'ClassName'}
              </div>
              <div className="w-3.5 shrink-0" />
            </div>
          </div>

          {/* Attributes Compartment */}
          <div className="flex flex-col divide-y divide-[var(--border-subtle)]/50 border-b-2 border-[var(--border-default)]">
            {classAttributes.length === 0 ? (
              <div className="px-2.5 py-1.5 text-[10.5px] text-[var(--text-tertiary)] italic text-center">
                {classKind === 'enum' ? 'No enum values' : 'No attributes'}
              </div>
            ) : (
              classAttributes.map((attr) => (
                <div
                  key={attr.id}
                  className="group/member flex items-center justify-between gap-1.5 px-2.5 py-1 text-[11px] font-mono hover:bg-[var(--hover-bg)]/60 transition-colors"
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    if (!isLocked) {
                      setEditingMember({
                        kind: 'attr',
                        id: attr.id,
                        value: attr.name,
                      })
                    }
                  }}
                >
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    {classKind !== 'enum' && (
                      <button
                        type="button"
                        title="Cycle visibility (+, -, #, ~)"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isLocked) return
                          updateNodeData(id, {
                            classAttributes: classAttributes.map((a) =>
                              a.id === attr.id
                                ? {
                                  ...a,
                                  visibility: nextVisibility(a.visibility),
                                }
                                : a
                            ),
                          })
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="nodrag nopan w-3.5 text-center font-bold text-[var(--primary-btn)] hover:bg-[var(--selection-bg)] rounded-[2px] shrink-0 cursor-pointer"
                      >
                        {attr.visibility}
                      </button>
                    )}

                    {editingMember?.kind === 'attr' &&
                      editingMember.id === attr.id ? (
                      <input
                        type="text"
                        autoFocus
                        value={editingMember.value}
                        onChange={(e) =>
                          setEditingMember({
                            ...editingMember,
                            value: e.target.value,
                          })
                        }
                        onBlur={commitMemberRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            commitMemberRename()
                          } else if (e.key === 'Escape') {
                            e.preventDefault()
                            setEditingMember(null)
                          }
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="nodrag w-full px-1 py-0 text-[11px] font-mono bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--primary-btn)] rounded-[2px] outline-none"
                      />
                    ) : (
                      <span
                        className={`truncate text-[var(--text-primary)] ${attr.isStatic ? 'underline' : ''
                          }`}
                      >
                        {attr.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {classKind !== 'enum' && attr.type && (
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        : {attr.type}
                      </span>
                    )}
                    {selected && !isLocked && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          updateNodeData(id, {
                            classAttributes: classAttributes.filter(
                              (a) => a.id !== attr.id
                            ),
                          })
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        title="Remove attribute"
                        className="nodrag nopan opacity-0 group-hover/member:opacity-100 p-0.5 rounded hover:bg-[var(--notion-red-bg)] text-[var(--text-tertiary)] hover:text-[var(--notion-red-text)] transition-opacity cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Methods Compartment */}
          {classKind !== 'enum' && (
            <div className="flex-1 flex flex-col divide-y divide-[var(--border-subtle)]/50">
              {classMethods.length === 0 ? (
                <div className="px-2.5 py-1.5 text-[10.5px] text-[var(--text-tertiary)] italic text-center">
                  No methods
                </div>
              ) : (
                classMethods.map((method) => (
                  <div
                    key={method.id}
                    className="group/member flex items-center justify-between gap-1.5 px-2.5 py-1 text-[11px] font-mono hover:bg-[var(--hover-bg)]/60 transition-colors"
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      if (!isLocked) {
                        setEditingMember({
                          kind: 'method',
                          id: method.id,
                          value: method.name,
                        })
                      }
                    }}
                  >
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <button
                        type="button"
                        title="Cycle visibility (+, -, #, ~)"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isLocked) return
                          updateNodeData(id, {
                            classMethods: classMethods.map((m) =>
                              m.id === method.id
                                ? {
                                  ...m,
                                  visibility: nextVisibility(m.visibility),
                                }
                                : m
                            ),
                          })
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="nodrag nopan w-3.5 text-center font-bold text-[var(--primary-btn)] hover:bg-[var(--selection-bg)] rounded-[2px] shrink-0 cursor-pointer"
                      >
                        {method.visibility}
                      </button>

                      {editingMember?.kind === 'method' &&
                        editingMember.id === method.id ? (
                        <input
                          type="text"
                          autoFocus
                          value={editingMember.value}
                          onChange={(e) =>
                            setEditingMember({
                              ...editingMember,
                              value: e.target.value,
                            })
                          }
                          onBlur={commitMemberRename}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              commitMemberRename()
                            } else if (e.key === 'Escape') {
                              e.preventDefault()
                              setEditingMember(null)
                            }
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="nodrag w-full px-1 py-0 text-[11px] font-mono bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--primary-btn)] rounded-[2px] outline-none"
                        />
                      ) : (
                        <span
                          className={`truncate text-[var(--text-primary)] ${method.isAbstract ? 'italic' : ''
                            } ${method.isStatic ? 'underline' : ''}`}
                        >
                          {method.name}({method.params || ''})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {method.returnType && (
                        <span className="text-[10px] text-[var(--text-tertiary)]">
                          : {method.returnType}
                        </span>
                      )}
                      {selected && !isLocked && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateNodeData(id, {
                              classMethods: classMethods.filter(
                                (m) => m.id !== method.id
                              ),
                            })
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          title="Remove method"
                          className="nodrag nopan opacity-0 group-hover/member:opacity-100 p-0.5 rounded hover:bg-[var(--notion-red-bg)] text-[var(--text-tertiary)] hover:text-[var(--notion-red-text)] transition-opacity cursor-pointer"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Floating Add Bar below node when selected (out of flow so node height never shifts) */}
          {selected && !isLocked && (
            <div className="nodrag nopan absolute left-0 right-0 top-full mt-2 z-20 flex items-center divide-x divide-[var(--border-subtle)] bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[5px] shadow-md overflow-hidden">
              <button
                type="button"
                onClick={handleAddAttribute}
                onPointerDown={(e) => e.stopPropagation()}
                className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-medium text-[var(--text-secondary)] hover:text-[var(--primary-btn)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{classKind === 'enum' ? 'Value' : 'Attr'}</span>
              </button>
              {classKind !== 'enum' && (
                <button
                  type="button"
                  onClick={handleAddMethod}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-medium text-[var(--text-secondary)] hover:text-[var(--primary-btn)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Method</span>
                </button>
              )}
            </div>
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

ClassNode.displayName = 'ClassNode'

