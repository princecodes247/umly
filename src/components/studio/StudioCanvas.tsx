import {
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type EdgeTypes,
  type OnSelectionChangeParams,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { ActorNode } from '../canvas/nodes/ActorNode'
import { UseCaseNode } from '../canvas/nodes/UseCaseNode'
import { BoundaryNode } from '../canvas/nodes/BoundaryNode'
import { NoteNode } from '../canvas/nodes/NoteNode'
import { UmlEdge } from '../canvas/edges/UmlEdge'
import { UmlMarkers } from '../canvas/UmlMarkers'
import { StudioToolbar } from './StudioToolbar'
import { StudioInspector } from './StudioInspector'
import { DIAGRAM_TEMPLATES } from '../../data/templates'
import {
  exportDiagramAsPng,
  exportDiagramAsSvg,
  exportDiagramAsJson,
  parseDiagramJson,
} from '../../lib/exportDiagram'
import {
  getDiagramDraft,
  saveDiagramDraft,
  getLastActiveDiagramId,
  type DiagramDraft,
} from '../../lib/diagramStorage'
import type {
  UmlRelationshipType,
  UmlNodeData,
  UmlEdgeData,
} from '../../types/game'

const nodeTypes: NodeTypes = {
  actor: ActorNode,
  useCase: UseCaseNode,
  boundary: BoundaryNode,
  note: NoteNode,
}

const edgeTypes: EdgeTypes = {
  umlEdge: UmlEdge,
}

interface HistorySnapshot {
  nodes: Node[]
  edges: Edge[]
}

interface StudioCanvasProps {
  diagramId?: string
  onOpenNewDiagram?: () => void
}

function StudioCanvasInner({ diagramId, onOpenNewDiagram }: StudioCanvasProps) {
  const reactFlowInstance = useReactFlow()
  const canvasRef = useRef<HTMLDivElement>(null)

  // Resolve active diagram draft ID
  const activeDraftId = diagramId || getLastActiveDiagramId()
  const initialDraft = getDiagramDraft(activeDraftId)

  // Initial fallback to ATM Banking diagram if draft not found
  const defaultTemplate = DIAGRAM_TEMPLATES[1]

  const [title, setTitle] = useState<string>(
    initialDraft?.title || defaultTemplate.name
  )
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(
    initialDraft?.nodes || defaultTemplate.nodes
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    initialDraft?.edges || defaultTemplate.edges
  )

  const [activeRelationshipType, setActiveRelationshipType] =
    useState<UmlRelationshipType>('association')

  // Selection
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null)
  const [isInspectorOpen, setIsInspectorOpen] = useState(true)
  const [isSaved, setIsSaved] = useState(true)

  // Undo / Redo History
  const [history, setHistory] = useState<HistorySnapshot[]>([
    {
      nodes: initialDraft?.nodes || defaultTemplate.nodes,
      edges: initialDraft?.edges || defaultTemplate.edges,
    },
  ])
  const [historyIndex, setHistoryIndex] = useState(0)
  const isInternalUpdate = useRef(false)

  // When diagramId changes (e.g. switching drafts), load new draft
  useEffect(() => {
    const draft = getDiagramDraft(activeDraftId)
    if (draft) {
      setTitle(draft.title)
      setNodes(draft.nodes)
      setEdges(draft.edges)
      setHistory([{ nodes: draft.nodes, edges: draft.edges }])
      setHistoryIndex(0)
      setSelectedNode(null)
      setSelectedEdge(null)
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 })
      }, 50)
    }
  }, [activeDraftId, setNodes, setEdges, reactFlowInstance])

  // Auto-save to diagram draft storage
  useEffect(() => {
    setIsSaved(false)
    const timeout = setTimeout(() => {
      try {
        const existing = getDiagramDraft(activeDraftId)
        const updatedDraft: DiagramDraft = {
          id: activeDraftId,
          title,
          type: existing?.type || 'use_case',
          createdAt: existing?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nodes,
          edges,
        }
        saveDiagramDraft(updatedDraft)
        setIsSaved(true)
      } catch (err) {
        console.warn('Failed to save diagram draft', err)
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [activeDraftId, title, nodes, edges])

  // Record history snapshot helper
  const pushHistory = useCallback(
    (newNodes: Node[], newEdges: Edge[]) => {
      if (isInternalUpdate.current) return
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1)
        return [...sliced, { nodes: newNodes, edges: newEdges }].slice(-30) // keep last 30 states
      })
      setHistoryIndex((prev) => Math.min(prev + 1, 29))
    },
    [historyIndex]
  )

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1
      const snapshot = history[targetIndex]
      isInternalUpdate.current = true
      setNodes(snapshot.nodes)
      setEdges(snapshot.edges)
      setHistoryIndex(targetIndex)
      setTimeout(() => {
        isInternalUpdate.current = false
      }, 50)
    }
  }, [historyIndex, history, setNodes, setEdges])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1
      const snapshot = history[targetIndex]
      isInternalUpdate.current = true
      setNodes(snapshot.nodes)
      setEdges(snapshot.edges)
      setHistoryIndex(targetIndex)
      setTimeout(() => {
        isInternalUpdate.current = false
      }, 50)
    }
  }, [historyIndex, history, setNodes, setEdges])

  // Keyboard shortcuts (Cmd/Ctrl + Z, Cmd/Ctrl + Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        handleRedo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  // Handle Connections
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        type: 'umlEdge',
        data: {
          relationshipType: activeRelationshipType,
        },
      }

      setEdges((eds) => {
        const next = addEdge(newEdge, eds)
        pushHistory(nodes, next)
        return next
      })
    },
    [activeRelationshipType, nodes, pushHistory, setEdges]
  )

  // Selection change
  const onSelectionChange = useCallback(
    ({ nodes: selNodes, edges: selEdges }: OnSelectionChangeParams) => {
      setSelectedNode(selNodes.length === 1 ? selNodes[0] : null)
      setSelectedEdge(selEdges.length === 1 ? selEdges[0] : null)
    },
    []
  )

  // Custom events from edge UI buttons
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

      setEdges((eds) => {
        const next = eds.map((edge) => {
          if (edge.id !== edgeId) return edge
          const currentType =
            (edge.data?.relationshipType as UmlRelationshipType) ||
            'association'
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
        pushHistory(nodes, next)
        return next
      })
    }

    const handleFlip = (e: Event) => {
      const customEvent = e as CustomEvent<{ edgeId: string }>
      const edgeId = customEvent.detail?.edgeId
      if (!edgeId) return

      setEdges((eds) => {
        const next = eds.map((edge) => {
          if (edge.id !== edgeId) return edge
          return {
            ...edge,
            source: edge.target,
            target: edge.source,
            sourceHandle: edge.targetHandle,
            targetHandle: edge.sourceHandle,
          }
        })
        pushHistory(nodes, next)
        return next
      })
    }

    const handleDelete = (e: Event) => {
      const customEvent = e as CustomEvent<{ edgeId: string }>
      const edgeId = customEvent.detail?.edgeId
      if (!edgeId) return

      setEdges((eds) => {
        const next = eds.filter((edge) => edge.id !== edgeId)
        pushHistory(nodes, next)
        return next
      })
    }

    window.addEventListener('cycle-edge-type', handleCycle)
    window.addEventListener('flip-edge-direction', handleFlip)
    window.addEventListener('delete-edge', handleDelete)

    return () => {
      window.removeEventListener('cycle-edge-type', handleCycle)
      window.removeEventListener('flip-edge-direction', handleFlip)
      window.removeEventListener('delete-edge', handleDelete)
    }
  }, [nodes, pushHistory, setEdges])

  // Add Node handler
  const handleAddNode = useCallback(
    (
      type: 'actor' | 'useCase' | 'boundary' | 'note',
      options?: { actorType?: 'primary' | 'secondary' | 'system' }
    ) => {
      const id = `${type}-${Date.now()}`
      const viewport = reactFlowInstance.getViewport()

      const centerX = (-viewport.x + 350) / viewport.zoom
      const centerY = (-viewport.y + 250) / viewport.zoom

      let initialData: UmlNodeData

      switch (type) {
        case 'actor':
          initialData = {
            nodeType: 'actor',
            label:
              options?.actorType === 'secondary'
                ? 'External Service'
                : options?.actorType === 'system'
                  ? 'Payment System'
                  : 'Actor',
            actorType: options?.actorType || 'primary',
          }
          break
        case 'useCase':
          initialData = {
            nodeType: 'useCase',
            label: 'New Use Case',
          }
          break
        case 'boundary':
          initialData = {
            nodeType: 'boundary',
            boundaryTitle: 'System Boundary',
            label: 'System Boundary',
            width: 440,
            height: 380,
          }
          break
        case 'note':
          initialData = {
            nodeType: 'note',
            label: 'Note',
            description: 'Note / Constraint specification',
          }
          break
      }

      const newNode: Node = {
        id,
        type,
        position: {
          x: Math.round(centerX + (Math.random() * 40 - 20)),
          y: Math.round(centerY + (Math.random() * 40 - 20)),
        },
        data: initialData as unknown as Record<string, unknown>,
        zIndex: type === 'boundary' ? -1 : 1,
      }

      setNodes((nds) => {
        const next = [...nds, newNode]
        pushHistory(next, edges)
        return next
      })
    },
    [reactFlowInstance, pushHistory, edges, setNodes]
  )

  // Node duplication
  const handleDuplicateNode = useCallback(
    (id: string) => {
      const target = nodes.find((n) => n.id === id)
      if (!target) return

      const newId = `${target.type}-${Date.now()}`
      const duplicated: Node = {
        ...target,
        id: newId,
        position: {
          x: target.position.x + 40,
          y: target.position.y + 40,
        },
        selected: true,
        data: {
          ...target.data,
          label: `${(target.data as unknown as UmlNodeData).label} Copy`,
        },
      }

      setNodes((nds) => {
        const next: Node[] = [
          ...nds.map((n) => ({ ...n, selected: false })),
          duplicated,
        ]
        pushHistory(next, edges)
        return next
      })
    },
    [nodes, edges, pushHistory, setNodes]
  )

  // Node deletion
  const handleDeleteNode = useCallback(
    (id: string) => {
      setNodes((nds) => {
        const next = nds.filter((n) => n.id !== id)
        setEdges((eds) => {
          const nextEdges = eds.filter((e) => e.source !== id && e.target !== id)
          pushHistory(next, nextEdges)
          return nextEdges
        })
        return next
      })
      if (selectedNode?.id === id) setSelectedNode(null)
    },
    [selectedNode, pushHistory, setNodes, setEdges]
  )

  // Edge deletion
  const handleDeleteEdge = useCallback(
    (id: string) => {
      setEdges((eds) => {
        const next = eds.filter((e) => e.id !== id)
        pushHistory(nodes, next)
        return next
      })
      if (selectedEdge?.id === id) setSelectedEdge(null)
    },
    [selectedEdge, nodes, pushHistory, setEdges]
  )

  // Flip edge
  const handleFlipEdge = useCallback(
    (id: string) => {
      setEdges((eds) => {
        const next = eds.map((edge) => {
          if (edge.id !== id) return edge
          return {
            ...edge,
            source: edge.target,
            target: edge.source,
            sourceHandle: edge.targetHandle,
            targetHandle: edge.sourceHandle,
          }
        })
        pushHistory(nodes, next)
        return next
      })
    },
    [nodes, pushHistory, setEdges]
  )

  // Update node data from Inspector
  const handleUpdateNodeData = useCallback(
    (id: string, partial: Partial<UmlNodeData>) => {
      reactFlowInstance.updateNodeData(id, partial)
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== id) return n
          return {
            ...n,
            data: {
              ...n.data,
              ...partial,
            },
          }
        })
      )
    },
    [reactFlowInstance, setNodes]
  )

  // Update edge data from Inspector
  const handleUpdateEdgeData = useCallback(
    (id: string, partial: Partial<UmlEdgeData>) => {
      setEdges((eds) => {
        const next = eds.map((e) => {
          if (e.id !== id) return e
          return {
            ...e,
            data: {
              ...e.data,
              ...partial,
            },
          }
        })
        pushHistory(nodes, next)
        return next
      })
    },
    [nodes, pushHistory, setEdges]
  )

  // Template loader
  const handleLoadTemplate = useCallback(
    (templateId: string) => {
      const template = DIAGRAM_TEMPLATES.find((t) => t.id === templateId)
      if (!template) return

      if (
        nodes.length > 0 &&
        !window.confirm(
          `Load template "${template.name}"? This will replace your current canvas.`
        )
      ) {
        return
      }

      setTitle(template.name)
      setNodes(template.nodes)
      setEdges(template.edges)
      setHistory([{ nodes: template.nodes, edges: template.edges }])
      setHistoryIndex(0)
      setSelectedNode(null)
      setSelectedEdge(null)

      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 })
      }, 50)
    },
    [nodes.length, reactFlowInstance, setNodes, setEdges]
  )

  // Clear Canvas
  const handleClearCanvas = useCallback(() => {
    if (nodes.length === 0) return
    if (window.confirm('Clear all nodes and connections from the diagram?')) {
      setTitle('Untitled Diagram')
      setNodes([])
      setEdges([])
      setHistory([{ nodes: [], edges: [] }])
      setHistoryIndex(0)
      setSelectedNode(null)
      setSelectedEdge(null)
    }
  }, [nodes.length, setNodes, setEdges])

  // Fit View
  const handleFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 400 })
  }, [reactFlowInstance])

  // Exports
  const handleExportPng = useCallback(async () => {
    if (!canvasRef.current) return
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    await exportDiagramAsPng(canvasRef.current, `${safeTitle}.png`)
  }, [title])

  const handleExportSvg = useCallback(async () => {
    if (!canvasRef.current) return
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    await exportDiagramAsSvg(canvasRef.current, `${safeTitle}.svg`)
  }, [title])

  const handleExportJson = useCallback(() => {
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    exportDiagramAsJson(
      {
        title,
        version: '1.0',
        updatedAt: new Date().toISOString(),
        nodes,
        edges,
      },
      `${safeTitle}.umly.json`
    )
  }, [title, nodes, edges])

  const handleImportJson = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const parsed = parseDiagramJson(text)
        if (parsed) {
          setTitle(parsed.title || 'Imported Diagram')
          setNodes(parsed.nodes)
          setEdges(parsed.edges)
          setHistory([{ nodes: parsed.nodes, edges: parsed.edges }])
          setHistoryIndex(0)
          setTimeout(() => {
            reactFlowInstance.fitView({ padding: 0.2 })
          }, 50)
        } else {
          alert('Invalid diagram JSON file. Please select a valid .umly.json file.')
        }
      }
      reader.readAsText(file)
    },
    [reactFlowInstance, setNodes, setEdges]
  )

  return (
    <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden p-2 sm:p-3 gap-2 bg-[var(--bg-primary)]">
      {/* Top Toolbar */}
      <StudioToolbar
        title={title}
        onTitleChange={setTitle}
        activeRelationshipType={activeRelationshipType}
        onRelationshipTypeChange={setActiveRelationshipType}
        onAddNode={handleAddNode}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onFitView={handleFitView}
        onClearCanvas={handleClearCanvas}
        onLoadTemplate={handleLoadTemplate}
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onNewDiagram={onOpenNewDiagram}
        isSaved={isSaved}
      />

      {/* Main Studio Workspace: Canvas + Inspector */}
      <div className="flex-1 flex gap-2 min-h-0 overflow-hidden h-full relative">
        {/* Canvas Area */}
        <div
          ref={canvasRef}
          className="flex-1 h-full min-h-0 relative overflow-hidden bg-[var(--bg-secondary)] rounded-[6px] border border-[var(--border-subtle)]"
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
            onSelectionChange={onSelectionChange}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
            maxZoom={2.2}
            deleteKeyCode={['Backspace', 'Delete']}
            proOptions={{ hideAttribution: true }}
            style={{ width: '100%', height: '100%' }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="currentColor"
              className="text-[var(--text-tertiary)] opacity-35"
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

        {/* Right Properties Inspector */}
        <StudioInspector
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onUpdateNodeData={handleUpdateNodeData}
          onUpdateEdgeData={handleUpdateEdgeData}
          onDeleteNode={handleDeleteNode}
          onDeleteEdge={handleDeleteEdge}
          onDuplicateNode={handleDuplicateNode}
          onFlipEdgeDirection={handleFlipEdge}
          allNodes={nodes}
          allEdges={edges}
          isOpen={isInspectorOpen}
          onToggleOpen={() => setIsInspectorOpen(!isInspectorOpen)}
        />
      </div>
    </div>
  )
}

export function StudioCanvas({ diagramId, onOpenNewDiagram }: StudioCanvasProps) {
  return (
    <ReactFlowProvider>
      <StudioCanvasInner diagramId={diagramId} onOpenNewDiagram={onOpenNewDiagram} />
    </ReactFlowProvider>
  )
}
