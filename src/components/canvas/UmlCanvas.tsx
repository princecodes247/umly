import React, { useCallback, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
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
import { toSourceHandleId, toTargetHandleId } from '../../lib/floatingEdges'
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

  // Track connection start node to guarantee relationship points in the drawn direction
  const connectStartRef = useRef<{ nodeId: string | null } | null>(null)

  const onConnectStart = useCallback(
    (_event: MouseEvent | TouchEvent, params?: { nodeId?: string | null }) => {
      connectStartRef.current = {
        nodeId: params?.nodeId ?? null,
      }
    },
    []
  )

  // Handle new connection created by user dragging between handles
  const onConnect = useCallback(
    (params: Connection) => {
      const startNodeId = connectStartRef.current?.nodeId

      let sourceId = params.source
      let targetId = params.target
      let sHandle = params.sourceHandle
      let tHandle = params.targetHandle

      if (startNodeId && params.target === startNodeId) {
        sourceId = params.target
        targetId = params.source
        sHandle = params.targetHandle
        tHandle = params.sourceHandle
      } else if (startNodeId && params.source !== startNodeId) {
        sourceId = startNodeId
        targetId = params.source === startNodeId ? params.target : params.source
      }

      // Prevent duplicate edges between the exact same pair in same direction
      const exists = edges.some(
        (e) =>
          (e.source === sourceId && e.target === targetId) ||
          (activeRelationshipType === 'association' &&
            e.source === targetId &&
            e.target === sourceId)
      )

      if (exists) return

      const newEdge: Edge = {
        id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        source: sourceId,
        target: targetId,
        sourceHandle: sHandle,
        targetHandle: tHandle,
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
            sourceHandle: toSourceHandleId(edge.targetHandle),
            targetHandle: toTargetHandleId(edge.sourceHandle),
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

    const handleReconnectEndpoint = (e: Event) => {
      const customEvent = e as CustomEvent<{
        edgeId: string
        end: 'source' | 'target'
        newNodeId: string
      }>
      const { edgeId, end, newNodeId } = customEvent.detail || {}
      if (!edgeId || !end || !newNodeId) return

      setEdges((eds) =>
        eds.map((ed) => {
          if (ed.id !== edgeId) return ed
          const nextSource = end === 'source' ? newNodeId : ed.source
          const nextTarget = end === 'target' ? newNodeId : ed.target
          if (nextSource === nextTarget) return ed
          return {
            ...ed,
            source: nextSource,
            target: nextTarget,
            sourceHandle: undefined,
            targetHandle: undefined,
          }
        })
      )
    }

    window.addEventListener('cycle-edge-type', handleCycle)
    window.addEventListener('flip-edge-direction', handleFlip)
    window.addEventListener('delete-edge', handleDelete)
    window.addEventListener('reconnect-edge-endpoint', handleReconnectEndpoint)

    return () => {
      window.removeEventListener('cycle-edge-type', handleCycle)
      window.removeEventListener('flip-edge-direction', handleFlip)
      window.removeEventListener('delete-edge', handleDelete)
      window.removeEventListener(
        'reconnect-edge-endpoint',
        handleReconnectEndpoint
      )
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
        onConnectStart={onConnectStart}
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
      </ReactFlow>
    </div>
  )
}
