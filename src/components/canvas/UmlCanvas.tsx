import React, { useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type EdgeTypes,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { ActorNode } from './nodes/ActorNode'
import { UseCaseNode } from './nodes/UseCaseNode'
import { BoundaryNode } from './nodes/BoundaryNode'
import { NoteNode } from './nodes/NoteNode'
import { UmlEdge } from './edges/UmlEdge'
import { UmlMarkers } from './UmlMarkers'
import type { UmlRelationshipType } from '../../types/game'

const nodeTypes: NodeTypes = {
  actor: ActorNode,
  useCase: UseCaseNode,
  boundary: BoundaryNode,
  note: NoteNode,
}

const edgeTypes: EdgeTypes = {
  umlEdge: UmlEdge,
}

interface UmlCanvasProps {
  initialNodes: Node[]
  initialEdges?: Edge[]
  activeRelationshipType: UmlRelationshipType
  onDiagramChange?: (nodes: Node[], edges: Edge[]) => void
}

export const UmlCanvas: React.FC<UmlCanvasProps> = ({
  initialNodes,
  initialEdges = [],
  activeRelationshipType,
  onDiagramChange,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Reset when initialNodes or initialEdges change (e.g. changing level)
  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  // Notify parent of updates
  useEffect(() => {
    onDiagramChange?.(nodes, edges)
  }, [nodes, edges, onDiagramChange])

  // Handle new connection created by user dragging between handles
  const onConnect = useCallback(
    (params: Connection) => {
      // Prevent duplicate edges between the exact same pair in same direction
      const exists = edges.some(
        (e) =>
          (e.source === params.source && e.target === params.target) ||
          (activeRelationshipType === 'association' &&
            e.source === params.target &&
            e.target === params.source)
      )

      if (exists) return

      const newEdge: Edge = {
        id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        type: 'umlEdge',
        data: {
          relationshipType: activeRelationshipType,
        },
      }

      setEdges((eds) => addEdge(newEdge, eds))
    },
    [edges, activeRelationshipType, setEdges]
  )

  // Listen to custom events from edge UI buttons (cycle type, flip direction, delete)
  useEffect(() => {
    const handleCycle = (e: Event) => {
      const customEvent = e as CustomEvent<{ edgeId: string }>
      const edgeId = customEvent.detail?.edgeId
      if (!edgeId) return

      const order: UmlRelationshipType[] = [
        'association',
        'include',
        'extend',
        'generalization',
      ]

      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id !== edgeId) return edge
          const currentType =
            (edge.data?.relationshipType as UmlRelationshipType) || 'association'
          const nextIndex = (order.indexOf(currentType) + 1) % order.length
          const nextType = order[nextIndex]

          return {
            ...edge,
            data: {
              ...edge.data,
              relationshipType: nextType,
            },
          }
        })
      )
    }

    const handleFlip = (e: Event) => {
      const customEvent = e as CustomEvent<{ edgeId: string }>
      const edgeId = customEvent.detail?.edgeId
      if (!edgeId) return

      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id !== edgeId) return edge
          return {
            ...edge,
            source: edge.target,
            target: edge.source,
            sourceHandle: edge.targetHandle,
            targetHandle: edge.sourceHandle,
          }
        })
      )
    }

    const handleDelete = (e: Event) => {
      const customEvent = e as CustomEvent<{ edgeId: string }>
      const edgeId = customEvent.detail?.edgeId
      if (!edgeId) return
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId))
    }

    window.addEventListener('cycle-edge-type', handleCycle)
    window.addEventListener('flip-edge-direction', handleFlip)
    window.addEventListener('delete-edge', handleDelete)

    return () => {
      window.removeEventListener('cycle-edge-type', handleCycle)
      window.removeEventListener('flip-edge-direction', handleFlip)
      window.removeEventListener('delete-edge', handleDelete)
    }
  }, [setEdges])

  return (
    <div
      className="w-full h-full relative overflow-hidden bg-[var(--bg-secondary)] rounded-[6px] border border-[var(--border-subtle)]"
      style={{ width: '100%', height: '100%', minHeight: '360px' }}
    >
      <UmlMarkers />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.4}
        maxZoom={1.8}
        deleteKeyCode={['Backspace', 'Delete']}
        style={{ width: '100%', height: '100%', minHeight: '360px' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="currentColor"
          className="text-[var(--text-tertiary)] opacity-30"
        />
        <Controls
          showInteractive={false}
          className="!bg-[var(--bg-primary)] !border-[var(--border-default)] !rounded-[4px] !shadow-xs overflow-hidden"
        />
        <MiniMap
          nodeStrokeWidth={2}
          zoomable
          pannable
          className="!bottom-4 !right-4 !bg-[var(--bg-primary)] !border-[var(--border-default)] !rounded-[4px] !shadow-sm overflow-hidden"
        />
      </ReactFlow>
    </div>
  )
}
