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
import type { UmlNodeData } from '../../../types/game'
import { useAutoFocusEdit } from './useAutoFocusEdit'
import { NODE_ACCENT_STYLES } from './constants'

type DfdKind = 'dfdProcess' | 'dfdDataStore' | 'dfdExternalEntity'

const DEFAULT_DIMS: Record<DfdKind, { w: number; h: number; minW: number; minH: number }> = {
  dfdProcess: { w: 160, h: 84, minW: 110, minH: 60 },
  dfdDataStore: { w: 184, h: 54, minW: 130, minH: 42 },
  dfdExternalEntity: { w: 148, h: 68, minW: 100, minH: 48 },
}

const DfdBaseNode = memo(
  ({
    id,
    data,
    selected,
    kind,
  }: NodeProps & { kind: DfdKind }) => {
    const nodeData = data as unknown as UmlNodeData
    const isLocked = Boolean(nodeData.isLocked)
    const accent =
      NODE_ACCENT_STYLES[nodeData.accentColor || 'default'] ||
      NODE_ACCENT_STYLES.default
    const dims = DEFAULT_DIMS[kind]

    const { updateNodeData, updateNode, deleteElements, getNodes, addNodes } =
      useReactFlow()

    const defaultLabel =
      kind === 'dfdProcess'
        ? 'Process'
        : kind === 'dfdDataStore'
          ? 'Data Store'
          : 'External Entity'

    const { isEditing, setIsEditing, editRef, shouldIgnoreBlur } =
      useAutoFocusEdit<HTMLDivElement>({
        id,
        autoFocusEdit: nodeData.autoFocusEdit,
        selected: Boolean(selected),
        updateNodeData,
      })

    useEffect(() => {
      if (!isEditing && editRef.current) {
        editRef.current.innerText = nodeData.label || defaultLabel
      }
    }, [nodeData.label, isEditing, defaultLabel])

    const handleFinishEditing = () => {
      if (shouldIgnoreBlur()) return
      setIsEditing(false)
      const raw = editRef.current?.innerText ?? ''
      const trimmed = raw.trim() || defaultLabel
      if (editRef.current) {
        editRef.current.innerText = trimmed
      }
      updateNodeData(id, { label: trimmed, autoFocusEdit: false })
    }

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
          editRef.current.innerText = nodeData.label || defaultLabel
        }
        setIsEditing(false)
      }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault()
      const text = e.clipboardData.getData('text/plain')
      document.execCommand('insertText', false, text)
    }

    useEffect(() => {
      const onStartEdit = (e: Event) => {
        const ce = e as CustomEvent<{ nodeId: string }>
        if (ce.detail?.nodeId === id && !isLocked) {
          setIsEditing(true)
        }
      }
      window.addEventListener('start-node-edit', onStartEdit)
      return () => window.removeEventListener('start-node-edit', onStartEdit)
    }, [id, isLocked, setIsEditing])

    const handleDelete = () => {
      if (isLocked) return
      deleteElements({ nodes: [{ id }] })
    }

    const handleDuplicate = () => {
      if (isLocked) return
      const current = getNodes().find((n) => n.id === id)
      if (!current) return
      addNodes({
        ...current,
        id: `${kind}-${Date.now()}`,
        position: {
          x: current.position.x + 28,
          y: current.position.y + 28,
        },
        selected: true,
        data: {
          ...current.data,
          label: `${nodeData.label} Copy`,
          autoFocusEdit: false,
        },
      })
    }

    const customW = typeof nodeData.width === 'number' ? nodeData.width : dims.w
    const customH = typeof nodeData.height === 'number' ? nodeData.height : dims.h
    const handleVisibility = selected
      ? 'opacity-100'
      : 'opacity-0 group-hover:opacity-100'

    const borderColor = nodeData.isHoveredByDrag
      ? 'var(--primary-btn)'
      : selected
        ? 'var(--primary-btn)'
        : accent.border

    const shapeClass =
      kind === 'dfdProcess'
        ? 'rounded-[14px] border-2'
        : kind === 'dfdDataStore'
          ? 'rounded-l-[4px] border-y-2 border-l-2'
          : 'rounded-[4px] border-2'

    const labelElement = (
      <div
        ref={editRef}
        contentEditable={isEditing && !isLocked}
        suppressContentEditableWarning
        onBlur={handleFinishEditing}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onPointerDown={(e) => {
          if (isEditing) e.stopPropagation()
        }}
        onMouseDown={(e) => {
          if (isEditing) e.stopPropagation()
        }}
        className={`text-xs font-semibold leading-snug outline-none text-center break-words max-w-full ${
          isEditing
            ? 'nodrag select-text cursor-text bg-[var(--bg-primary)] px-1.5 py-0.5 rounded-[3px] ring-1 ring-[var(--primary-btn)] min-w-[60px]'
            : 'cursor-inherit'
        }`}
        style={{ color: accent.text }}
      >
        {nodeData.label ||
          (kind === 'dfdProcess'
            ? 'Process'
            : kind === 'dfdDataStore'
              ? 'Data Store'
              : 'External Entity')}
      </div>
    )

    return (
      <div
        className={`group relative select-none transition-all duration-150 ${shapeClass}`}
        style={{
          width: customW,
          height: customH,
          backgroundColor: accent.bg,
          borderColor,
          boxShadow: selected
            ? '0 0 0 2px var(--selection-bg), 0 4px 12px rgba(0,0,0,0.08)'
            : '0 2px 6px rgba(0,0,0,0.05)',
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          if (!isLocked) setIsEditing(true)
        }}
      >
        {!isLocked && (
          <NodeResizer
            isVisible={selected}
            minWidth={dims.minW}
            minHeight={dims.minH}
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

        {selected && !isLocked && !isEditing && (
          <NodeToolbar
            isVisible={selected && !isLocked && !isEditing}
            position={Position.Top}
            offset={12}
            className="nodrag nopan flex items-center gap-0.5 bg-[var(--bg-primary)] border border-[var(--border-default)] p-0.5 rounded-[5px] shadow-lg z-[99999] text-xs"
          >
            <button
              type="button"
              title="Rename (Enter)"
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
              className="p-1.5 rounded-[3px] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
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

        {/* Shape-specific interior */}
        {kind === 'dfdProcess' && (
          <div className="w-full h-full flex flex-col overflow-hidden rounded-[12px]">
            <div
              className="px-2.5 py-0.5 border-b text-[10px] font-mono font-bold text-center"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: accent.bandBg,
                color: accent.text,
              }}
            >
              {nodeData.processNumber || '1.0'}
            </div>
            <div className="flex-1 flex items-center justify-center px-3 py-1.5">
              {labelElement}
            </div>
          </div>
        )}

        {kind === 'dfdDataStore' && (
          <div className="w-full h-full flex items-stretch">
            <div
              className="w-10 shrink-0 flex items-center justify-center border-r font-mono text-[11px] font-bold"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: accent.bandBg,
                color: accent.text,
              }}
            >
              {nodeData.dataStoreId || 'D1'}
            </div>
            <div className="flex-1 flex items-center justify-center px-2.5 py-1">
              {labelElement}
            </div>
          </div>
        )}

        {kind === 'dfdExternalEntity' && (
          <div className="w-full h-full flex flex-col items-center justify-center px-3 py-2 relative">
            <span className="text-[8.5px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] leading-none mb-1">
              External
            </span>
            {labelElement}
          </div>
        )}

        {/* 4-way dual connection handles */}
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
  }
)

DfdBaseNode.displayName = 'DfdBaseNode'

export const DfdProcessNode = memo((props: NodeProps) => (
  <DfdBaseNode {...props} kind="dfdProcess" />
))
DfdProcessNode.displayName = 'DfdProcessNode'

export const DfdDataStoreNode = memo((props: NodeProps) => (
  <DfdBaseNode {...props} kind="dfdDataStore" />
))
DfdDataStoreNode.displayName = 'DfdDataStoreNode'

export const DfdExternalEntityNode = memo((props: NodeProps) => (
  <DfdBaseNode {...props} kind="dfdExternalEntity" />
))
DfdExternalEntityNode.displayName = 'DfdExternalEntityNode'
