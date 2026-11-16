import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react'
import { X, Download, BookOpenCheck } from 'lucide-react'
import type { CaseStudy } from '../../types/caseStudy'
import { ActorNode } from '../canvas/nodes/ActorNode'
import { UseCaseNode } from '../canvas/nodes/UseCaseNode'
import { BoundaryNode } from '../canvas/nodes/BoundaryNode'
import { NoteNode } from '../canvas/nodes/NoteNode'
import { ErEntityNode } from '../canvas/nodes/ErEntityNode'
import { ClassNode } from '../canvas/nodes/ClassNode'
import {
  DfdProcessNode,
  DfdDataStoreNode,
  DfdExternalEntityNode,
} from '../canvas/nodes/DfdNodes'
import { UmlEdge } from '../canvas/edges/UmlEdge'
import { UmlMarkers } from '../canvas/UmlMarkers'

const NODE_TYPES: NodeTypes = {
  actor: ActorNode,
  useCase: UseCaseNode,
  boundary: BoundaryNode,
  note: NoteNode,
  erEntity: ErEntityNode,
  umlClass: ClassNode,
  dfdProcess: DfdProcessNode,
  dfdDataStore: DfdDataStoreNode,
  dfdExternalEntity: DfdExternalEntityNode,
}

const EDGE_TYPES: EdgeTypes = {
  uml: UmlEdge,
}

interface ReferenceSolutionSplitProps {
  caseStudy: CaseStudy
  onClose: () => void
  onLoadIntoCanvas: () => void
}

export function ReferenceSolutionSplit({
  caseStudy,
  onClose,
  onLoadIntoCanvas,
}: ReferenceSolutionSplitProps) {
  const refNodes = useMemo<Node[]>(
    () =>
      caseStudy.referenceSolution.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data as unknown as Record<string, unknown>,
      })),
    [caseStudy]
  )

  const refEdges = useMemo<Edge[]>(
    () =>
      caseStudy.referenceSolution.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'uml',
        data: e.data,
      })),
    [caseStudy]
  )

  return (
    <section className="w-full lg:w-[44%] xl:w-[42%] shrink-0 h-[420px] lg:h-full border-t lg:border-t-0 lg:border-l border-[var(--border-subtle)] bg-[var(--bg-primary)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-[var(--border-subtle)] flex items-center justify-between gap-2 bg-[var(--bg-secondary)]/50">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpenCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-[var(--text-primary)] truncate">
            Reference Solution
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onLoadIntoCanvas}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
            title="Copy this reference diagram onto your editable canvas"
          >
            <Download className="w-3 h-3" />
            <span>Load into Canvas</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
            aria-label="Close reference solution"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Explanation */}
      <div className="px-3.5 py-2.5 border-b border-[var(--border-subtle)] bg-emerald-50/40 dark:bg-emerald-950/20 text-xs text-[var(--text-secondary)] leading-relaxed">
        {caseStudy.referenceSolution.explanation}
      </div>

      {/* Read-only ReactFlow Preview */}
      <div className="flex-1 relative min-h-0 bg-[var(--bg-canvas)]">
        <UmlMarkers />
        <ReactFlow
          nodes={refNodes}
          edges={refEdges}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </section>
  )
}

