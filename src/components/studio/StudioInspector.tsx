import React from 'react'
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
  BookCheck,
} from 'lucide-react'
import type {
  UmlNodeData,
  UmlEdgeData,
} from '../../types/game'

interface StudioInspectorProps {
  selectedNode: Node | null
  selectedEdge: Edge | null
  onUpdateNodeData: (id: string, data: Partial<UmlNodeData>) => void
  onUpdateEdgeData: (id: string, data: Partial<UmlEdgeData>) => void
  onDeleteNode: (id: string) => void
  onDeleteEdge: (id: string) => void
  onDuplicateNode: (id: string) => void
  onFlipEdgeDirection: (id: string) => void
  allNodes: Node[]
  allEdges: Edge[]
  isOpen: boolean
  onToggleOpen: () => void
}

export const StudioInspector: React.FC<StudioInspectorProps> = ({
  selectedNode,
  selectedEdge,
  onUpdateNodeData,
  onUpdateEdgeData,
  onDeleteNode,
  onDeleteEdge,
  onDuplicateNode,
  onFlipEdgeDirection,
  allNodes,
  allEdges,
  isOpen,
  onToggleOpen,
}) => {
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggleOpen}
        title="Open Properties Inspector"
        className="absolute top-3 right-3 z-30 p-2 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[6px] shadow-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    )
  }

  // Node stats
  const actorsCount = allNodes.filter((n) => n.type === 'actor').length
  const useCasesCount = allNodes.filter((n) => n.type === 'useCase').length
  const boundariesCount = allNodes.filter((n) => n.type === 'boundary').length
  const edgesCount = allEdges.length

  const nodeData = selectedNode?.data as unknown as UmlNodeData | undefined
  const edgeData = selectedEdge?.data as unknown as UmlEdgeData | undefined

  return (
    <aside className="w-80 shrink-0 h-full flex flex-col bg-[var(--bg-primary)] border-l border-[var(--border-subtle)] overflow-y-auto text-xs font-sans select-none z-20">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--border-subtle)] shrink-0">
        <span className="font-semibold text-xs text-[var(--text-primary)]">
          {selectedNode
            ? 'Node Properties'
            : selectedEdge
              ? 'Relationship Properties'
              : 'Diagram Overview'}
        </span>
        <button
          type="button"
          onClick={onToggleOpen}
          className="p-1 rounded-[3px] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]"
          title="Collapse Inspector"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* CASE 1: NODE SELECTED */}
        {selectedNode && nodeData ? (
          <div className="space-y-4">
            {/* Node Type Pill */}
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

              <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                ID: {selectedNode.id}
              </span>
            </div>

            {/* Label Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                {selectedNode.type === 'boundary' ? 'System Name' : 'Name / Label'}
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

            {/* Actor Type Specific Options */}
            {selectedNode.type === 'actor' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                  Actor Classification
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
                        className={`px-2 py-1.5 rounded-[4px] text-xs font-medium text-center transition-colors ${
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
              </div>
            )}

            {/* Note Text Description */}
            {selectedNode.type === 'note' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                  Note / Constraint Details
                </label>
                <textarea
                  rows={4}
                  value={nodeData.description || nodeData.label || ''}
                  onChange={(e) =>
                    onUpdateNodeData(selectedNode.id, {
                      description: e.target.value,
                      label: e.target.value,
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-[4px] border border-[var(--border-default)] bg-[var(--bg-secondary)] text-xs leading-relaxed resize-none focus:outline-none"
                  placeholder="Specify extension point rules, conditions, or business constraints..."
                />
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
        ) : selectedEdge && edgeData ? (
          /* CASE 2: EDGE SELECTED */
          <div className="space-y-4">
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
                  return (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() =>
                        onUpdateEdgeData(selectedEdge.id, {
                          relationshipType: rel.id,
                        })
                      }
                      className={`px-2 py-1.5 rounded-[4px] text-xs font-medium text-left transition-colors flex items-center justify-between ${
                        isActive
                          ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-semibold'
                          : 'border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
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

            {/* Flip Direction Button */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                Arrow Direction
              </label>
              <button
                type="button"
                onClick={() => onFlipEdgeDirection(selectedEdge.id)}
                className="w-full notion-btn flex items-center justify-center gap-2 py-1.5"
                title="Swap source and target nodes"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Flip Direction (Swap Ends)</span>
              </button>
            </div>

            {/* Extension condition */}
            {edgeData.relationshipType === 'extend' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                  Extension Condition (Optional)
                </label>
                <input
                  type="text"
                  value={edgeData.condition || ''}
                  onChange={(e) =>
                    onUpdateEdgeData(selectedEdge.id, {
                      condition: e.target.value,
                    })
                  }
                  placeholder="e.g. if order > $100"
                  className="w-full px-2.5 py-1.5 rounded-[4px] border border-[var(--border-default)] bg-[var(--bg-secondary)] text-xs focus:outline-none"
                />
              </div>
            )}

            {/* UML Semantic Explanation */}
            <div className="notion-callout notion-callout-blue">
              <Info className="w-3.5 h-3.5 text-[var(--notion-blue-text)] shrink-0" />
              <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                {edgeData.relationshipType === 'include' && (
                  <span>
                    <strong>«include»</strong>: The base use case mandatorily
                    executes the included use case. The arrow must point{' '}
                    <em>from Base to Included</em>.
                  </span>
                )}
                {edgeData.relationshipType === 'extend' && (
                  <span>
                    <strong>«extend»</strong>: Optional behavior triggered under
                    certain conditions. The arrow points{' '}
                    <em>from the Extension case to the Base case</em>.
                  </span>
                )}
                {edgeData.relationshipType === 'generalization' && (
                  <span>
                    <strong>Generalization</strong>: Represents inheritance. The
                    triangle points <em>from Child to Parent</em>.
                  </span>
                )}
                {(!edgeData.relationshipType ||
                  edgeData.relationshipType === 'association') && (
                  <span>
                    <strong>Association</strong>: Communication between external
                    Actor and Use Case (solid line).
                  </span>
                )}
              </div>
            </div>

            {/* Delete Edge Action */}
            <div className="pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => onDeleteEdge(selectedEdge.id)}
                className="w-full notion-btn text-[var(--notion-red-text)] hover:bg-[var(--notion-red-bg)] flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Connection</span>
              </button>
            </div>
          </div>
        ) : (
          /* CASE 3: NO SELECTION (OVERVIEW) */
          <div className="space-y-4">
            {/* Diagram Stats Cards */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] font-mono">
                Diagram Elements
              </span>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="p-2 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                  <span className="text-[10px] text-[var(--text-tertiary)] block">
                    Actors
                  </span>
                  <span className="text-base font-bold text-[var(--text-primary)]">
                    {actorsCount}
                  </span>
                </div>
                <div className="p-2 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                  <span className="text-[10px] text-[var(--text-tertiary)] block">
                    Use Cases
                  </span>
                  <span className="text-base font-bold text-[var(--text-primary)]">
                    {useCasesCount}
                  </span>
                </div>
                <div className="p-2 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                  <span className="text-[10px] text-[var(--text-tertiary)] block">
                    Boundaries
                  </span>
                  <span className="text-base font-bold text-[var(--text-primary)]">
                    {boundariesCount}
                  </span>
                </div>
                <div className="p-2 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                  <span className="text-[10px] text-[var(--text-tertiary)] block">
                    Connections
                  </span>
                  <span className="text-base font-bold text-[var(--text-primary)]">
                    {edgesCount}
                  </span>
                </div>
              </div>
            </div>

            {/* UML 2.5 Quick Rules Card */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center gap-1 text-[var(--text-primary)] font-semibold text-xs">
                <BookCheck className="w-3.5 h-3.5 text-[#448361] dark:text-[#529e72]" />
                <span>UML Modeling Best Practices</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-[var(--text-secondary)] leading-relaxed list-disc list-inside">
                <li>
                  <strong>Actors</strong> represent roles outside the system
                  (users or external APIs).
                </li>
                <li>
                  <strong>Use Cases</strong> represent goals achieved by the
                  system and live inside the boundary.
                </li>
                <li>
                  Never connect two actors directly with an association
                  (use generalization for inheritance).
                </li>
                <li>
                  <code className="text-[10px]">«include»</code> arrows point to
                  mandatory sub-tasks.
                </li>
                <li>
                  <code className="text-[10px]">«extend»</code> arrows point
                  back to the base usecase.
                </li>
              </ul>
            </div>

            {/* Quick Tips */}
            <div className="p-2.5 rounded-[4px] bg-[var(--hover-bg)] text-[11px] text-[var(--text-tertiary)] leading-relaxed space-y-1">
              <p>💡 <strong>Tip:</strong> Double-click any element to rename it in place.</p>
              <p>💡 <strong>Tip:</strong> Drag from handles to connect elements.</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
