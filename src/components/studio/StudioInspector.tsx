import React, { useState } from 'react'
import type { Node, Edge } from '@xyflow/react'
import {
  User,
  CircleDot,
  SquareDashed,
  StickyNote,
  Trash2,
  Copy,
  ArrowLeftRight,
  Info,
  ChevronRight,
  ChevronLeft,
  Layers,
  XCircle,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignStartVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween,
  History,
  RotateCcw,
  Plus,
  FileCode2,
  Check,
  Route,
  Palette,
} from 'lucide-react'
import type { AlignmentMode } from './StudioCanvas'
import { getAllowedRelationshipTypes } from '../../lib/umlValidation'
import type { DiagramSnapshot } from '../../lib/diagramStorage'
import { generatePlantUml, generateMermaid } from '../../lib/exportDiagram'
import type {
  UmlNodeData,
  UmlEdgeData,
  NodeAccentColor,
} from '../../types/game'

interface StudioInspectorProps {
  selectedNode: Node | null
  selectedEdge: Edge | null
  selectedNodes?: Node[]
  selectedEdges?: Edge[]
  onUpdateNodeData: (id: string, data: Partial<UmlNodeData>) => void
  onUpdateEdgeData: (id: string, data: Partial<UmlEdgeData>) => void
  onDeleteNode: (id: string) => void
  onDuplicateNode: (id: string) => void
  onFlipEdgeDirection: (id: string) => void
  onReconnectEdge?: (edgeId: string, end: 'source' | 'target', newNodeId: string) => void
  onDeleteSelected?: () => void
  onDuplicateSelected?: () => void
  onDeselectAll?: () => void
  onAlignSelected?: (mode: AlignmentMode) => void
  defaultRoutingStyle?: 'straight' | 'orthogonal' | 'bezier'
  onDefaultRoutingStyleChange?: (style: 'straight' | 'orthogonal' | 'bezier') => void
  snapshots?: DiagramSnapshot[]
  onSaveSnapshot?: (label?: string) => void
  onRestoreSnapshot?: (snapshot: DiagramSnapshot) => void
  diagramTitle?: string
  allNodes: Node[]
  allEdges: Edge[]
  isOpen: boolean
  onToggleOpen: () => void
}

const ACCENT_COLORS: {
  id: NodeAccentColor
  label: string
  swatch: string
}[] = [
  { id: 'default', label: 'Default', swatch: 'bg-[var(--text-tertiary)]' },
  { id: 'blue', label: 'Blue', swatch: 'bg-[#2383e2]' },
  { id: 'green', label: 'Green', swatch: 'bg-[#448361]' },
  { id: 'amber', label: 'Amber', swatch: 'bg-[#cb912f]' },
  { id: 'purple', label: 'Purple', swatch: 'bg-[#9065b0]' },
  { id: 'rose', label: 'Rose', swatch: 'bg-[#d44c47]' },
]

export const StudioInspector: React.FC<StudioInspectorProps> = ({
  selectedNode,
  selectedEdge,
  selectedNodes = [],
  selectedEdges: _selectedEdges = [],
  onUpdateNodeData,
  onUpdateEdgeData,
  onDeleteNode,
  onDuplicateNode,
  onFlipEdgeDirection,
  onReconnectEdge,
  onDeleteSelected,
  onDuplicateSelected,
  onDeselectAll,
  onAlignSelected,
  defaultRoutingStyle = 'straight',
  onDefaultRoutingStyleChange,
  snapshots = [],
  onSaveSnapshot,
  onRestoreSnapshot,
  diagramTitle = 'UML Diagram',
  allNodes,
  allEdges,
  isOpen,
  onToggleOpen,
}) => {
  const [copiedCodeType, setCopiedCodeType] = useState<'puml' | 'mermaid' | null>(
    null
  )

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggleOpen}
        title="Open Properties Inspector"
        className="absolute top-3 right-3 z-30 p-2 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[6px] shadow-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    )
  }

  const isMultiSelection = selectedNodes.length > 1

  // Node stats
  const actorsCount = allNodes.filter((n) => n.type === 'actor').length
  const useCasesCount = allNodes.filter((n) => n.type === 'useCase').length
  const boundariesCount = allNodes.filter((n) => n.type === 'boundary').length
  const edgesCount = allEdges.length

  // Always resolve the freshest node and edge data from source arrays
  const activeEdge = selectedEdge
    ? allEdges.find((e) => e.id === selectedEdge.id) || selectedEdge
    : null
  const activeNode = selectedNode
    ? allNodes.find((n) => n.id === selectedNode.id) || selectedNode
    : null

  const nodeData = activeNode?.data as unknown as UmlNodeData | undefined
  const edgeData = activeEdge?.data as unknown as UmlEdgeData | undefined

  const handleCopyCode = async (kind: 'puml' | 'mermaid') => {
    const text =
      kind === 'puml'
        ? generatePlantUml(diagramTitle, allNodes, allEdges)
        : generateMermaid(diagramTitle, allNodes, allEdges)
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCodeType(kind)
      setTimeout(() => setCopiedCodeType(null), 1800)
    } catch (err) {
      console.warn('Clipboard write failed:', err)
    }
  }

  return (
    <aside className="w-76 shrink-0 h-full flex flex-col bg-[var(--bg-primary)] border-l border-[var(--border-subtle)] overflow-y-auto text-xs font-sans select-none z-20">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--border-subtle)] shrink-0">
        <span className="font-semibold text-xs text-[var(--text-primary)]">
          {isMultiSelection
            ? `${selectedNodes.length} Selected`
            : selectedNode
              ? 'Element Properties'
              : selectedEdge
                ? 'Relationship Properties'
                : 'Diagram Inspector'}
        </span>
        <button
          type="button"
          onClick={onToggleOpen}
          className="p-1 rounded-[3px] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] cursor-pointer"
          title="Collapse Inspector"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3.5 space-y-4 flex-1 overflow-y-auto">
        {/* CASE 0: MULTIPLE ELEMENTS SELECTED */}
        {isMultiSelection ? (
          <div className="space-y-4">
            <div className="p-3 rounded-[6px] bg-[var(--selection-bg)] border border-[var(--primary-btn)]/30 space-y-1.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--primary-btn)]" />
                <span className="font-semibold text-xs text-[var(--primary-btn)]">
                  {selectedNodes.length} Elements Selected
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Smart alignment guides are active by default while dragging. Hold{' '}
                <kbd className="px-1 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono text-[10px]">
                  Shift
                </kbd>{' '}
                while dragging to temporarily disable snapping.
              </p>
            </div>

            {/* Alignment & Distribution Controls */}
            {onAlignSelected && (
              <div className="space-y-2.5 pt-1 border-t border-[var(--border-subtle)]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] font-mono block">
                  Align Selected Elements
                </span>

                {/* Primary 1-Click Horizontal / Vertical Alignment */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onAlignSelected('horizontal-row')}
                    title="Align elements horizontally along a shared row center"
                    className="notion-btn flex items-center justify-center gap-1.5 py-2 text-xs font-medium"
                  >
                    <AlignCenterHorizontal className="w-3.5 h-3.5 text-[var(--primary-btn)]" />
                    <span>Align Row</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAlignSelected('vertical-column')}
                    title="Align elements vertically along a shared column center"
                    className="notion-btn flex items-center justify-center gap-1.5 py-2 text-xs font-medium"
                  >
                    <AlignCenterVertical className="w-3.5 h-3.5 text-[var(--primary-btn)]" />
                    <span>Align Column</span>
                  </button>
                </div>

                {/* Granular Edge & Center Alignment Bar */}
                <div className="grid grid-cols-6 gap-1 p-1 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => onAlignSelected('align-left')}
                    title="Align Left Edges"
                    className="p-1.5 rounded-[4px] hover:bg-[var(--hover-bg-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <AlignStartVertical className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onAlignSelected('align-center-x')}
                    title="Align Horizontal Centers (Column)"
                    className="p-1.5 rounded-[4px] hover:bg-[var(--hover-bg-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <AlignCenterVertical className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onAlignSelected('align-right')}
                    title="Align Right Edges"
                    className="p-1.5 rounded-[4px] hover:bg-[var(--hover-bg-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <AlignEndVertical className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onAlignSelected('align-top')}
                    title="Align Top Edges"
                    className="p-1.5 rounded-[4px] hover:bg-[var(--hover-bg-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <AlignStartHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onAlignSelected('align-center-y')}
                    title="Align Vertical Centers (Row)"
                    className="p-1.5 rounded-[4px] hover:bg-[var(--hover-bg-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <AlignCenterHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onAlignSelected('align-bottom')}
                    title="Align Bottom Edges"
                    className="p-1.5 rounded-[4px] hover:bg-[var(--hover-bg-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <AlignEndHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Equal Spacing / Distribution */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onAlignSelected('distribute-horizontal')}
                    title="Distribute elements with equal horizontal spacing"
                    className="notion-btn flex items-center justify-center gap-1.5 py-1.5 text-[11px]"
                  >
                    <AlignHorizontalSpaceBetween className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    <span>Distribute H</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAlignSelected('distribute-vertical')}
                    title="Distribute elements with equal vertical spacing"
                    className="notion-btn flex items-center justify-center gap-1.5 py-1.5 text-[11px]"
                  >
                    <AlignVerticalSpaceBetween className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    <span>Distribute V</span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={onDuplicateSelected}
                className="w-full notion-btn flex items-center justify-center gap-1.5 py-2"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate Selected ({selectedNodes.length})</span>
              </button>

              <button
                type="button"
                onClick={onDeleteSelected}
                className="w-full notion-btn text-[var(--notion-red-text)] hover:bg-[var(--notion-red-bg)] flex items-center justify-center gap-1.5 py-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedNodes.length})</span>
              </button>

              <button
                type="button"
                onClick={onDeselectAll}
                className="w-full notion-btn notion-btn-ghost flex items-center justify-center gap-1.5 py-1.5 text-[var(--text-secondary)]"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Deselect All</span>
              </button>
            </div>
          </div>
        ) : selectedNode && nodeData ? (
          /* CASE 1: SINGLE NODE SELECTED */
          <div className="space-y-4">
            {/* Node Type Pill */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedNode.type === 'actor' && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[var(--selection-bg)] text-[var(--primary-btn)] font-semibold text-xs">
                    <User className="w-3.5 h-3.5" />
                    <span>Actor</span>
                  </div>
                )}
                {selectedNode.type === 'useCase' && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[var(--notion-blue-bg)] text-[var(--notion-blue-text)] font-semibold text-xs">
                    <CircleDot className="w-3.5 h-3.5" />
                    <span>Use Case</span>
                  </div>
                )}
                {selectedNode.type === 'boundary' && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[var(--notion-purple-bg)] text-[var(--notion-purple-text)] font-semibold text-xs">
                    <SquareDashed className="w-3.5 h-3.5" />
                    <span>System Boundary</span>
                  </div>
                )}
                {selectedNode.type === 'note' && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[var(--notion-yellow-bg)] text-[var(--notion-yellow-text)] font-semibold text-xs">
                    <StickyNote className="w-3.5 h-3.5" />
                    <span>Note</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                Enter to rename · Tab to branch
              </span>
            </div>

            {/* Name / Label Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                {selectedNode.type === 'boundary' ? 'System Name' : 'Name'}
              </label>
              <input
                type="text"
                value={
                  selectedNode.type === 'boundary'
                    ? nodeData.boundaryTitle || nodeData.label || ''
                    : nodeData.label || ''
                }
                onChange={(e) => {
                  const val = e.target.value
                  if (selectedNode.type === 'boundary') {
                    onUpdateNodeData(selectedNode.id, {
                      boundaryTitle: val,
                      label: val,
                    })
                  } else {
                    onUpdateNodeData(selectedNode.id, { label: val })
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-[4px] border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-btn)] text-xs"
                placeholder="Enter name..."
              />
            </div>

            {/* Stereotype Input */}
            {selectedNode.type !== 'note' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center justify-between">
                  <span>Stereotype</span>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                    «optional»
                  </span>
                </label>
                <input
                  type="text"
                  value={nodeData.stereotype || ''}
                  onChange={(e) =>
                    onUpdateNodeData(selectedNode.id, {
                      stereotype: e.target.value.replace(/[«»]/g, ''),
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-[4px] border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-btn)] text-xs font-mono"
                  placeholder="e.g. external, service, core..."
                />
              </div>
            )}

            {/* Description / Documentation Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                {selectedNode.type === 'note'
                  ? 'Note / Constraint Text'
                  : 'Description & Preconditions'}
              </label>
              <textarea
                rows={3}
                value={
                  selectedNode.type === 'note'
                    ? nodeData.description || nodeData.label || ''
                    : nodeData.description || ''
                }
                onChange={(e) => {
                  const val = e.target.value
                  if (selectedNode.type === 'note') {
                    onUpdateNodeData(selectedNode.id, {
                      description: val,
                      label: val,
                    })
                  } else {
                    onUpdateNodeData(selectedNode.id, {
                      description: val,
                    })
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-[4px] border border-[var(--border-default)] bg-[var(--bg-secondary)] text-xs leading-relaxed resize-none focus:outline-none focus:border-[var(--primary-btn)]"
                placeholder={
                  selectedNode.type === 'note'
                    ? 'Specify constraint rules or notes...'
                    : 'Document preconditions, postconditions, or actor responsibilities...'
                }
              />
            </div>

            {/* Color Swatches */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                <Palette className="w-3 h-3 text-[var(--text-tertiary)]" />
                <span>Color Accent</span>
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {ACCENT_COLORS.map((color) => {
                  const isActive =
                    (nodeData.accentColor || 'default') === color.id
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() =>
                        onUpdateNodeData(selectedNode.id, {
                          accentColor: color.id,
                        })
                      }
                      title={color.label}
                      className={`h-6 rounded-[5px] border flex items-center justify-center transition-all cursor-pointer ${
                        isActive
                          ? 'border-[var(--text-primary)] ring-2 ring-[var(--primary-btn)]/30 bg-[var(--bg-secondary)]'
                          : 'border-[var(--border-subtle)] hover:border-[var(--border-default)] bg-[var(--bg-secondary)]/50'
                      }`}
                    >
                      <span
                        className={`w-3 h-3 rounded-full ${color.swatch}`}
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Actor Classification */}
            {selectedNode.type === 'actor' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                  Actor Role
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(
                    [
                      { id: 'primary', label: 'Primary' },
                      { id: 'secondary', label: 'Secondary' },
                      { id: 'system', label: 'System' },
                    ] as const
                  ).map((at) => {
                    const isActive = (nodeData.actorType || 'primary') === at.id
                    return (
                      <button
                        key={at.id}
                        type="button"
                        onClick={() =>
                          onUpdateNodeData(selectedNode.id, {
                            actorType: at.id,
                          })
                        }
                        className={`px-2 py-1.5 rounded-[4px] text-xs font-medium text-center transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-semibold'
                            : 'border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                        }`}
                      >
                        {at.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Boundary Dimensions */}
            {selectedNode.type === 'boundary' && (
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                  Boundary Dimensions (px)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      Width:
                    </span>
                    <input
                      type="number"
                      step={20}
                      min={200}
                      value={nodeData.width || 440}
                      onChange={(e) =>
                        onUpdateNodeData(selectedNode.id, {
                          width: parseInt(e.target.value) || 440,
                        })
                      }
                      className="w-full px-2 py-1 rounded-[4px] border border-[var(--border-default)] bg-[var(--bg-secondary)] text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      Height:
                    </span>
                    <input
                      type="number"
                      step={20}
                      min={150}
                      value={nodeData.height || 380}
                      onChange={(e) =>
                        onUpdateNodeData(selectedNode.id, {
                          height: parseInt(e.target.value) || 380,
                        })
                      }
                      className="w-full px-2 py-1 rounded-[4px] border border-[var(--border-default)] bg-[var(--bg-secondary)] text-xs"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-[var(--text-tertiary)] leading-tight">
                  Dragging a Use Case near the edge automatically grows this
                  boundary.
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDuplicateNode(selectedNode.id)}
                className="flex-1 notion-btn flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteNode(selectedNode.id)}
                className="notion-btn text-[var(--notion-red-text)] hover:bg-[var(--notion-red-bg)] flex items-center gap-1.5"
                title="Delete Node"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ) : activeEdge && edgeData ? (
          /* CASE 2: EDGE SELECTED */
          <div className="space-y-4">
            {(() => {
              const sNode = allNodes.find((n) => n.id === activeEdge.source)
              const tNode = allNodes.find((n) => n.id === activeEdge.target)
              const allowedEdgeTypes = getAllowedRelationshipTypes(
                sNode?.type,
                tNode?.type
              )

              return (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                    Relationship Type
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        {
                          id: 'association',
                          label: 'Association',
                          badge: '—',
                        },
                        {
                          id: 'include',
                          label: '«include»',
                          badge: '«inc»',
                        },
                        {
                          id: 'extend',
                          label: '«extend»',
                          badge: '«ext»',
                        },
                        {
                          id: 'generalization',
                          label: 'Generalization',
                          badge: '—▷',
                        },
                      ] as const
                    ).map((rel) => {
                      const isActive =
                        (edgeData.relationshipType || 'association') === rel.id
                      const isAllowed =
                        allowedEdgeTypes.length === 0 ||
                        allowedEdgeTypes.includes(rel.id)
                      return (
                        <button
                          key={rel.id}
                          type="button"
                          disabled={!isAllowed}
                          title={
                            isAllowed
                              ? `Set relationship to ${rel.label}`
                              : `${rel.label} is not valid between ${sNode?.type || 'source'} and ${tNode?.type || 'target'} in UML 2.5`
                          }
                          onClick={() => {
                            if (!isAllowed) return
                            onUpdateEdgeData(activeEdge.id, {
                              relationshipType: rel.id,
                            })
                          }}
                          className={`px-2 py-1.5 rounded-[4px] text-xs font-medium text-left transition-colors flex items-center justify-between ${
                            isActive
                              ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-semibold'
                              : isAllowed
                                ? 'border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] cursor-pointer'
                                : 'border border-[var(--border-subtle)]/40 text-[var(--text-tertiary)] opacity-40 cursor-not-allowed line-through'
                          }`}
                        >
                          <span>{rel.label}</span>
                          <span className="font-mono text-[10px] opacity-75">
                            {rel.badge}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* Edge Routing Style */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                <Route className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                <span>Line Routing</span>
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    { id: 'straight', label: 'Straight' },
                    { id: 'orthogonal', label: 'Orthogonal' },
                    { id: 'bezier', label: 'Curved' },
                  ] as const
                ).map((rt) => {
                  const isActive =
                    (edgeData.routingStyle || defaultRoutingStyle) === rt.id
                  return (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() =>
                        onUpdateEdgeData(activeEdge.id, {
                          routingStyle: rt.id,
                        })
                      }
                      className={`px-2 py-1.5 rounded-[4px] text-xs font-medium text-center transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-semibold'
                          : 'border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                      }`}
                    >
                      {rt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Flip Direction Button */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                Arrow Direction
              </label>
              <button
                type="button"
                onClick={() => onFlipEdgeDirection(activeEdge.id)}
                className="w-full notion-btn flex items-center justify-center gap-2 py-1.5"
                title="Swap source and target nodes"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Flip Direction (Swap Ends)</span>
              </button>
            </div>

            {/* Connected Elements (Change which element this relationship connects to) */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
              <label className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center justify-between">
                <span>Connected Elements</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">Reassign ends</span>
              </label>
              <div className="space-y-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-tertiary)] block">
                    Source Element (From)
                  </span>
                  <select
                    value={activeEdge.source}
                    onChange={(e) => {
                      const newSourceId = e.target.value
                      if (newSourceId && onReconnectEdge) {
                        onReconnectEdge(activeEdge.id, 'source', newSourceId)
                      }
                    }}
                    className="w-full px-2 py-1.5 rounded-[4px] border border-[var(--border-default)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-btn)]"
                  >
                    {allNodes
                      .filter((n) => n.type !== 'boundary' && n.id !== activeEdge.target)
                      .map((n) => {
                        const name =
                          (n.data?.name as string) ||
                          (n.data?.label as string) ||
                          'Untitled'
                        const typeLabel =
                          n.type === 'actor'
                            ? 'Actor'
                            : n.type === 'useCase'
                              ? 'Use Case'
                              : 'Note'
                        return (
                          <option key={n.id} value={n.id}>
                            {name} ({typeLabel})
                          </option>
                        )
                      })}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[var(--text-tertiary)] block">
                    Target Element (To)
                  </span>
                  <select
                    value={activeEdge.target}
                    onChange={(e) => {
                      const newTargetId = e.target.value
                      if (newTargetId && onReconnectEdge) {
                        onReconnectEdge(activeEdge.id, 'target', newTargetId)
                      }
                    }}
                    className="w-full px-2 py-1.5 rounded-[4px] border border-[var(--border-default)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-btn)]"
                  >
                    {allNodes
                      .filter((n) => n.type !== 'boundary' && n.id !== activeEdge.source)
                      .map((n) => {
                        const name =
                          (n.data?.name as string) ||
                          (n.data?.label as string) ||
                          'Untitled'
                        const typeLabel =
                          n.type === 'actor'
                            ? 'Actor'
                            : n.type === 'useCase'
                              ? 'Use Case'
                              : 'Note'
                        return (
                          <option key={n.id} value={n.id}>
                            {name} ({typeLabel})
                          </option>
                        )
                      })}
                  </select>
                </div>
              </div>
            </div>

            {/* Extension condition or Custom Label */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                {edgeData.relationshipType === 'extend'
                  ? 'Extension Condition'
                  : 'Custom Role / Guard Label'}
              </label>
              <input
                type="text"
                value={
                  edgeData.relationshipType === 'extend'
                    ? edgeData.condition || ''
                    : edgeData.label || ''
                }
                onChange={(e) => {
                  if (edgeData.relationshipType === 'extend') {
                    onUpdateEdgeData(activeEdge.id, {
                      condition: e.target.value,
                    })
                  } else {
                    onUpdateEdgeData(activeEdge.id, {
                      label: e.target.value,
                    })
                  }
                }}
                placeholder={
                  edgeData.relationshipType === 'extend'
                    ? 'e.g. if amount > $500'
                    : 'Optional label...'
                }
                className="w-full px-2.5 py-1.5 rounded-[4px] border border-[var(--border-default)] bg-[var(--bg-secondary)] text-xs focus:outline-none focus:border-[var(--primary-btn)]"
              />
            </div>

            {/* UML Semantic Explanation */}
            <div className="notion-callout notion-callout-blue">
              <Info className="w-3.5 h-3.5 text-[var(--notion-blue-text)] shrink-0" />
              <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                {edgeData.relationshipType === 'include' && (
                  <span>
                    <strong>«include»</strong>: Base use case mandatorily
                    executes the included use case (dashed arrow from Base →
                    Included).
                  </span>
                )}
                {edgeData.relationshipType === 'extend' && (
                  <span>
                    <strong>«extend»</strong>: Optional behavior triggered under
                    conditions (dashed arrow from Extension → Base).
                  </span>
                )}
                {edgeData.relationshipType === 'generalization' && (
                  <span>
                    <strong>Generalization</strong>: Inheritance (hollow
                    triangle from Child → Parent).
                  </span>
                )}
                {(!edgeData.relationshipType ||
                  edgeData.relationshipType === 'association') && (
                  <span>
                    <strong>Association</strong>: Direct communication between
                    Actor and Use Case (solid line).
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* CASE 3: NO SELECTION (OVERVIEW, LAYOUT, EXPORT & VERSION HISTORY) */
          <div className="space-y-4">
            {/* Compact Stats Bar */}
            <div className="grid grid-cols-4 gap-1.5 font-mono text-center">
              <div className="p-2 rounded-[5px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <span className="text-sm font-bold text-[var(--text-primary)] block">
                  {actorsCount}
                </span>
                <span className="text-[9px] text-[var(--text-tertiary)] uppercase">
                  Actors
                </span>
              </div>
              <div className="p-2 rounded-[5px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <span className="text-sm font-bold text-[var(--text-primary)] block">
                  {useCasesCount}
                </span>
                <span className="text-[9px] text-[var(--text-tertiary)] uppercase">
                  Cases
                </span>
              </div>
              <div className="p-2 rounded-[5px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <span className="text-sm font-bold text-[var(--text-primary)] block">
                  {boundariesCount}
                </span>
                <span className="text-[9px] text-[var(--text-tertiary)] uppercase">
                  Bounds
                </span>
              </div>
              <div className="p-2 rounded-[5px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <span className="text-sm font-bold text-[var(--text-primary)] block">
                  {edgesCount}
                </span>
                <span className="text-[9px] text-[var(--text-tertiary)] uppercase">
                  Links
                </span>
              </div>
            </div>

            {/* Canvas Layout & Edge Routing Controls */}
            <div className="space-y-2.5 pt-2 border-t border-[var(--border-subtle)]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] font-mono block">
                Layout & Routing
              </span>

              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    { id: 'straight', label: 'Straight' },
                    { id: 'orthogonal', label: 'Orthogonal' },
                    { id: 'bezier', label: 'Curved' },
                  ] as const
                ).map((rt) => {
                  const isActive = defaultRoutingStyle === rt.id
                  return (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() => onDefaultRoutingStyleChange?.(rt.id)}
                      className={`px-2 py-1.5 rounded-[4px] text-xs font-medium text-center transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-semibold'
                          : 'border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                      }`}
                    >
                      {rt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Diagram-as-Code Quick Copy */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] font-mono">
                  Diagram-as-Code
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopyCode('puml')}
                  className="notion-btn flex items-center justify-center gap-1.5 py-1.5 text-[11px]"
                >
                  {copiedCodeType === 'puml' ? (
                    <Check className="w-3.5 h-3.5 text-[#448361]" />
                  ) : (
                    <FileCode2 className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  )}
                  <span>
                    {copiedCodeType === 'puml' ? 'Copied!' : 'Copy PlantUML'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyCode('mermaid')}
                  className="notion-btn flex items-center justify-center gap-1.5 py-1.5 text-[11px]"
                >
                  {copiedCodeType === 'mermaid' ? (
                    <Check className="w-3.5 h-3.5 text-[#448361]" />
                  ) : (
                    <FileCode2 className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  )}
                  <span>
                    {copiedCodeType === 'mermaid' ? 'Copied!' : 'Copy Mermaid'}
                  </span>
                </button>
              </div>
            </div>

            {/* Version History / Snapshots */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] font-mono flex items-center gap-1">
                  <History className="w-3 h-3" />
                  <span>Version History</span>
                </span>
                {onSaveSnapshot && (
                  <button
                    type="button"
                    onClick={() => onSaveSnapshot('Manual Checkpoint')}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium text-[var(--primary-btn)] hover:bg-[var(--selection-bg)] transition-colors cursor-pointer"
                    title="Create a restore point snapshot"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Save Snapshot</span>
                  </button>
                )}
              </div>

              {snapshots.length === 0 ? (
                <p className="text-[11px] text-[var(--text-tertiary)] py-2">
                  Autosave snapshots appear here as you edit. Click{' '}
                  <strong>Save Snapshot</strong> to pin a restore point.
                </p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                  {snapshots.map((snap) => {
                    const date = new Date(snap.timestamp)
                    const timeStr = date.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                    return (
                      <div
                        key={snap.id}
                        className="group flex items-center justify-between px-2.5 py-1.5 rounded-[5px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 hover:bg-[var(--hover-bg)] transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium text-[var(--text-primary)] truncate">
                            {snap.label}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--text-tertiary)]">
                            {timeStr} · {snap.nodes.length} items
                          </div>
                        </div>
                        {onRestoreSnapshot && (
                          <button
                            type="button"
                            onClick={() => onRestoreSnapshot(snap)}
                            className="opacity-80 group-hover:opacity-100 inline-flex items-center gap-1 px-2 py-1 rounded-[4px] bg-[var(--bg-primary)] border border-[var(--border-default)] text-[10px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shrink-0"
                            title="Restore this version (with Undo support)"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Restore</span>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
