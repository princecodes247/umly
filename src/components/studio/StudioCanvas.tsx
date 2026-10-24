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
  reconnectEdge,
  useReactFlow,
  ReactFlowProvider,
  ViewportPortal,
  BackgroundVariant,
  SelectionMode,
  ConnectionMode,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type NodeTypes,
  type EdgeTypes,
  type OnSelectionChangeParams,
  type OnNodeDrag,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion, AnimatePresence } from 'motion/react'
import { AlertCircle, X } from 'lucide-react'

import { ActorNode } from '../canvas/nodes/ActorNode'
import { UseCaseNode } from '../canvas/nodes/UseCaseNode'
import { BoundaryNode } from '../canvas/nodes/BoundaryNode'
import { NoteNode } from '../canvas/nodes/NoteNode'
import { UmlEdge } from '../canvas/edges/UmlEdge'
import { UmlMarkers } from '../canvas/UmlMarkers'
import { StudioToolbar } from './StudioToolbar'
import { StudioBottomDock } from './StudioBottomDock'
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
import {
  getAllowedRelationshipTypes,
  validateUmlConnection,
} from '../../lib/umlValidation'
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

export type AlignmentMode =
  | 'horizontal-row'
  | 'vertical-column'
  | 'align-left'
  | 'align-center-x'
  | 'align-right'
  | 'align-top'
  | 'align-center-y'
  | 'align-bottom'
  | 'distribute-horizontal'
  | 'distribute-vertical'

interface AlignmentGuides {
  vertical: { x: number; y1: number; y2: number } | null
  horizontal: { y: number; x1: number; x2: number } | null
}

function getNodeDimensions(n: Node): { w: number; h: number } {
  if (n.type === 'boundary') {
    return {
      w: (n.data?.width as number) || n.measured?.width || 440,
      h: (n.data?.height as number) || n.measured?.height || 380,
    }
  }
  return {
    w:
      n.measured?.width ??
      (n.type === 'actor' ? 92 : n.type === 'useCase' ? 144 : 150),
    h:
      n.measured?.height ??
      (n.type === 'actor' ? 112 : n.type === 'useCase' ? 64 : 80),
  }
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

  // Selection states
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([])
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([])
  const [isInspectorOpen, setIsInspectorOpen] = useState(true)
  const [isSaved, setIsSaved] = useState(true)

  // Robust Undo / Redo history refs
  const pastRef = useRef<HistorySnapshot[]>([])
  const futureRef = useRef<HistorySnapshot[]>([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Clipboard for Cmd+C and Cmd+V
  const clipboardRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null)

  // Helper: push snapshot of current state before a mutation
  const pushSnapshot = useCallback(() => {
    pastRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    })
    if (pastRef.current.length > 50) {
      pastRef.current.shift()
    }
    futureRef.current = []
    setCanUndo(true)
    setCanRedo(false)
  }, [nodes, edges])

  // Undo execution
  const handleUndo = useCallback(() => {
    if (pastRef.current.length === 0) return

    const previous = pastRef.current.pop()
    if (!previous) return

    futureRef.current.unshift({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    })

    setNodes(previous.nodes)
    setEdges(previous.edges)
    setCanUndo(pastRef.current.length > 0)
    setCanRedo(true)
  }, [nodes, edges, setNodes, setEdges])

  // Redo execution
  const handleRedo = useCallback(() => {
    if (futureRef.current.length === 0) return

    const next = futureRef.current.shift()
    if (!next) return

    pastRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    })

    setNodes(next.nodes)
    setEdges(next.edges)
    setCanUndo(true)
    setCanRedo(futureRef.current.length > 0)
  }, [nodes, edges, setNodes, setEdges])

  // Copy handler
  const handleCopy = useCallback(() => {
    const selNodes = nodes.filter((n) => n.selected)
    if (selNodes.length === 0) return

    const selNodeIds = new Set(selNodes.map((n) => n.id))
    const selEdges = edges.filter(
      (e) => selNodeIds.has(e.source) && selNodeIds.has(e.target)
    )

    clipboardRef.current = {
      nodes: JSON.parse(JSON.stringify(selNodes)),
      edges: JSON.parse(JSON.stringify(selEdges)),
    }
  }, [nodes, edges])

  // Paste handler
  const handlePaste = useCallback(() => {
    if (!clipboardRef.current || clipboardRef.current.nodes.length === 0) return

    pushSnapshot()

    const idMap = new Map<string, string>()
    const newNodes: Node[] = []
    const timestamp = Date.now()

    clipboardRef.current.nodes.forEach((node, idx) => {
      const newId = `${node.type}-${timestamp}-${idx}`
      idMap.set(node.id, newId)
      newNodes.push({
        ...node,
        id: newId,
        position: {
          x: node.position.x + 35,
          y: node.position.y + 35,
        },
        selected: true,
        data: {
          ...node.data,
        },
      })
    })

    const newEdges: Edge[] = []
    clipboardRef.current.edges.forEach((edge, idx) => {
      const newSource = idMap.get(edge.source)
      const newTarget = idMap.get(edge.target)
      if (newSource && newTarget) {
        newEdges.push({
          ...edge,
          id: `edge-${timestamp}-${idx}`,
          source: newSource,
          target: newTarget,
          selected: true,
        })
      }
    })

    // Advance clipboard positions so consecutive pastes tile
    clipboardRef.current.nodes.forEach((n) => {
      n.position.x += 35
      n.position.y += 35
    })

    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false })),
      ...newNodes,
    ])
    setEdges((eds) => [
      ...eds.map((e) => ({ ...e, selected: false })),
      ...newEdges,
    ])
  }, [pushSnapshot, setNodes, setEdges])

  // When diagramId changes (e.g. switching drafts), load new draft
  useEffect(() => {
    const draft = getDiagramDraft(activeDraftId)
    if (draft) {
      setTitle(draft.title)
      setNodes(draft.nodes)
      setEdges(draft.edges)
      pastRef.current = []
      futureRef.current = []
      setCanUndo(false)
      setCanRedo(false)
      setSelectedNodes([])
      setSelectedEdges([])
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

  // System Boundary Contained Children Drag Logic
  const draggingBoundaryChildrenRef = useRef<{
    boundaryId: string
    childInitialPositions: Map<string, { x: number; y: number }>
    boundaryStartPos: { x: number; y: number }
  } | null>(null)

  // Shift-drag snapping & visual alignment guides
  const shiftKeyPressedRef = useRef(false)
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuides>({
    vertical: null,
    horizontal: null,
  })

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shiftKeyPressedRef.current = true
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shiftKeyPressedRef.current = false
        setAlignmentGuides({ vertical: null, horizontal: null })
      }
    }
    const onBlur = () => {
      shiftKeyPressedRef.current = false
      setAlignmentGuides({ vertical: null, horizontal: null })
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  // Custom onNodesChange wrapper that snaps dragged elements to other elements when Shift is held
  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      const draggingPosChanges = changes.filter(
        (c): c is Extract<NodeChange<Node>, { type: 'position' }> =>
          c.type === 'position' && Boolean(c.dragging) && Boolean(c.position)
      )

      const dragEnded = changes.some(
        (c) => c.type === 'position' && c.dragging === false
      )

      if (dragEnded) {
        setAlignmentGuides({ vertical: null, horizontal: null })
      }

      if (draggingPosChanges.length > 0 && shiftKeyPressedRef.current) {
        const primaryChange = draggingPosChanges[0]
        const draggedNode = nodes.find((n) => n.id === primaryChange.id)

        if (
          draggedNode &&
          draggedNode.type !== 'boundary' &&
          primaryChange.position
        ) {
          const { w: nw, h: nh } = getNodeDimensions(draggedNode)
          const rawX = primaryChange.position.x
          const rawY = primaryChange.position.y

          const nLeft = rawX
          const nCenterX = rawX + nw / 2
          const nRight = rawX + nw

          const nTop = rawY
          const nCenterY = rawY + nh / 2
          const nBottom = rawY + nh

          const SNAP_THRESHOLD = 14
          let bestDx: number | null = null
          let bestAbsDx = SNAP_THRESHOLD
          let vGuide: AlignmentGuides['vertical'] = null

          let bestDy: number | null = null
          let bestAbsDy = SNAP_THRESHOLD
          let hGuide: AlignmentGuides['horizontal'] = null

          const draggingIds = new Set(draggingPosChanges.map((c) => c.id))

          for (const other of nodes) {
            if (
              draggingIds.has(other.id) ||
              other.selected ||
              other.type === 'boundary' ||
              other.hidden
            ) {
              continue
            }

            const { w: ow, h: oh } = getNodeDimensions(other)
            const oLeft = other.position.x
            const oCenterX = other.position.x + ow / 2
            const oRight = other.position.x + ow

            const oTop = other.position.y
            const oCenterY = other.position.y + oh / 2
            const oBottom = other.position.y + oh

            // X-axis alignment candidates (vertical guide line)
            const xPairs = [
              { diff: oCenterX - nCenterX, guideX: oCenterX },
              { diff: oLeft - nLeft, guideX: oLeft },
              { diff: oRight - nRight, guideX: oRight },
              { diff: oRight - nLeft, guideX: oRight },
              { diff: oLeft - nRight, guideX: oLeft },
            ]

            for (const pair of xPairs) {
              const absDiff = Math.abs(pair.diff)
              if (absDiff < bestAbsDx) {
                bestAbsDx = absDiff
                bestDx = pair.diff
                vGuide = {
                  x: pair.guideX,
                  y1: Math.min(nTop, oTop) - 24,
                  y2: Math.max(nBottom, oBottom) + 24,
                }
              }
            }

            // Y-axis alignment candidates (horizontal guide line)
            const yPairs = [
              { diff: oCenterY - nCenterY, guideY: oCenterY },
              { diff: oTop - nTop, guideY: oTop },
              { diff: oBottom - nBottom, guideY: oBottom },
              { diff: oBottom - nTop, guideY: oBottom },
              { diff: oTop - nBottom, guideY: oTop },
            ]

            for (const pair of yPairs) {
              const absDiff = Math.abs(pair.diff)
              if (absDiff < bestAbsDy) {
                bestAbsDy = absDiff
                bestDy = pair.diff
                hGuide = {
                  y: pair.guideY,
                  x1: Math.min(nLeft, oLeft) - 24,
                  x2: Math.max(nRight, oRight) + 24,
                }
              }
            }
          }

          setAlignmentGuides({ vertical: vGuide, horizontal: hGuide })

          if (bestDx !== null || bestDy !== null) {
            const snappedChanges = changes.map((c) => {
              if (c.type === 'position' && c.dragging && c.position) {
                return {
                  ...c,
                  position: {
                    x: Math.round(c.position.x + (bestDx ?? 0)),
                    y: Math.round(c.position.y + (bestDy ?? 0)),
                  },
                }
              }
              return c
            })
            onNodesChange(snappedChanges)
            return
          }
        }
      } else if (draggingPosChanges.length > 0 && !shiftKeyPressedRef.current) {
        setAlignmentGuides({ vertical: null, horizontal: null })
      }

      onNodesChange(changes)
    },
    [nodes, onNodesChange]
  )

  const onNodeDragStart: OnNodeDrag<Node> = useCallback(
    (event, node) => {
      shiftKeyPressedRef.current = Boolean(
        (event as unknown as MouseEvent)?.shiftKey || shiftKeyPressedRef.current
      )
      if (node.type === 'boundary') {
        const bWidth = (node.data?.width as number) || 440
        const bHeight = (node.data?.height as number) || 380
        const bx1 = node.position.x
        const by1 = node.position.y
        const bx2 = bx1 + bWidth
        const by2 = by1 + bHeight

        const childMap = new Map<string, { x: number; y: number }>()

        nodes.forEach((n) => {
          if (n.id === node.id || n.type === 'boundary') return
          // Approximate center point of node
          const nw = n.measured?.width ?? 120
          const nh = n.measured?.height ?? 60
          const cx = n.position.x + nw / 2
          const cy = n.position.y + nh / 2

          // If node center is inside boundary bounds, it moves with the boundary
          if (cx >= bx1 && cx <= bx2 && cy >= by1 && cy <= by2) {
            childMap.set(n.id, { x: n.position.x, y: n.position.y })
          }
        })

        draggingBoundaryChildrenRef.current = {
          boundaryId: node.id,
          childInitialPositions: childMap,
          boundaryStartPos: { x: node.position.x, y: node.position.y },
        }
      } else {
        draggingBoundaryChildrenRef.current = null
      }
    },
    [nodes]
  )

  const onNodeDrag: OnNodeDrag<Node> = useCallback(
    (event, node) => {
      shiftKeyPressedRef.current = Boolean(
        (event as unknown as MouseEvent)?.shiftKey
      )
      if (
        node.type === 'boundary' &&
        draggingBoundaryChildrenRef.current &&
        draggingBoundaryChildrenRef.current.boundaryId === node.id
      ) {
        const { boundaryStartPos, childInitialPositions } =
          draggingBoundaryChildrenRef.current
        const dx = node.position.x - boundaryStartPos.x
        const dy = node.position.y - boundaryStartPos.y

        setNodes((nds) =>
          nds.map((n) => {
            const init = childInitialPositions.get(n.id)
            if (init) {
              return {
                ...n,
                position: {
                  x: Math.round(init.x + dx),
                  y: Math.round(init.y + dy),
                },
              }
            }
            return n
          })
        )
      }
    },
    [setNodes]
  )

  const onNodeDragStop: OnNodeDrag<Node> = useCallback(
    (_event, _node) => {
      draggingBoundaryChildrenRef.current = null
      setAlignmentGuides({ vertical: null, horizontal: null })
      pushSnapshot()
    },
    [pushSnapshot]
  )

  // Keyboard shortcuts (Cmd/Ctrl + Z, Y, C, V, A, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // Cmd/Ctrl + Z
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      }
      // Cmd/Ctrl + Y
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        handleRedo()
      }
      // Cmd/Ctrl + C
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        handleCopy()
      }
      // Cmd/Ctrl + V
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        handlePaste()
      }
      // Cmd/Ctrl + A
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        setNodes((nds) => nds.map((n) => ({ ...n, selected: true })))
        setEdges((eds) => eds.map((e) => ({ ...e, selected: true })))
      }
      // Escape
      else if (e.key === 'Escape') {
        setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))
        setEdges((eds) => eds.map((e) => ({ ...e, selected: false })))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo, handleCopy, handlePaste, setNodes, setEdges])

  // Handle Connections with strict UML 2.5 validation
  const [validationNotice, setValidationNotice] = useState<{
    message: string
    suggestedType?: UmlRelationshipType
    pendingConnection?: Connection
  } | null>(null)

  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showValidationWarning = useCallback(
    (
      message: string,
      suggestedType?: UmlRelationshipType,
      pendingConnection?: Connection
    ) => {
      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current)
      }
      setValidationNotice({ message, suggestedType, pendingConnection })
      noticeTimeoutRef.current = setTimeout(() => {
        setValidationNotice(null)
      }, 5500)
    },
    []
  )

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((n) => n.id === params.source)
      const targetNode = nodes.find((n) => n.id === params.target)

      const validation = validateUmlConnection(
        sourceNode,
        targetNode,
        activeRelationshipType
      )

      if (!validation.valid) {
        showValidationWarning(
          validation.reason || 'Invalid UML 2.5 relationship.',
          validation.suggestedType,
          params
        )
        return
      }

      setValidationNotice(null)
      pushSnapshot()
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

      setEdges((eds) => addEdge(newEdge, eds))
    },
    [
      nodes,
      activeRelationshipType,
      pushSnapshot,
      setEdges,
      showValidationWarning,
    ]
  )

  // Handle dragging the source or target end of an existing relationship to reconnect it
  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === newConnection.source)
      const targetNode = nodes.find((n) => n.id === newConnection.target)
      const currentRelType =
        (oldEdge.data?.relationshipType as UmlRelationshipType) || 'association'

      const validation = validateUmlConnection(
        sourceNode,
        targetNode,
        currentRelType
      )

      if (!validation.valid) {
        showValidationWarning(
          validation.reason ||
            'Invalid UML 2.5 relationship for this reconnection.'
        )
        return
      }

      setValidationNotice(null)
      pushSnapshot()
      setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds))
    },
    [nodes, pushSnapshot, setEdges, showValidationWarning]
  )

  // Selection change
  const onSelectionChange = useCallback(
    ({ nodes: selNodes, edges: selEdges }: OnSelectionChangeParams) => {
      setSelectedNodes(selNodes)
      setSelectedEdges(selEdges)
    },
    []
  )

  // Duplicate node: deselects all other elements, selects ONLY clone
  const handleDuplicateNode = useCallback(
    (id: string) => {
      const target = nodes.find((n) => n.id === id)
      if (!target) return

      pushSnapshot()
      const newId = `${target.type}-${Date.now()}`
      const duplicated: Node = {
        ...target,
        id: newId,
        position: {
          x: target.position.x + 35,
          y: target.position.y + 35,
        },
        selected: true,
        data: {
          ...target.data,
          label: `${(target.data as unknown as UmlNodeData).label || ''} Copy`,
        },
      }

      setNodes((nds) => [
        ...nds.map((n) => ({ ...n, selected: false })),
        duplicated,
      ])
      setEdges((eds) => eds.map((e) => ({ ...e, selected: false })))
    },
    [nodes, pushSnapshot, setNodes, setEdges]
  )

  // Duplicate all selected elements
  const handleDuplicateSelected = useCallback(() => {
    handleCopy()
    handlePaste()
  }, [handleCopy, handlePaste])

  // Delete all selected elements
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return

    pushSnapshot()
    const selNodeIds = new Set(selectedNodes.map((n) => n.id))
    const selEdgeIds = new Set(selectedEdges.map((e) => e.id))

    setNodes((nds) => nds.filter((n) => !selNodeIds.has(n.id)))
    setEdges((eds) =>
      eds.filter(
        (e) =>
          !selEdgeIds.has(e.id) &&
          !selNodeIds.has(e.source) &&
          !selNodeIds.has(e.target)
      )
    )
    setSelectedNodes([])
    setSelectedEdges([])
  }, [selectedNodes, selectedEdges, pushSnapshot, setNodes, setEdges])

  const handleDeselectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))
    setEdges((eds) => eds.map((e) => ({ ...e, selected: false })))
    setSelectedNodes([])
    setSelectedEdges([])
  }, [setNodes, setEdges])

  // Align or distribute multiple selected nodes
  const handleAlignSelected = useCallback(
    (mode: AlignmentMode) => {
      if (selectedNodes.length < 2) return

      pushSnapshot()
      const selIds = new Set(selectedNodes.map((n) => n.id))
      const targetNodes = nodes.filter((n) => selIds.has(n.id))
      if (targetNodes.length < 2) return

      const metrics = targetNodes.map((n) => {
        const { w, h } = getNodeDimensions(n)
        return {
          id: n.id,
          x: n.position.x,
          y: n.position.y,
          w,
          h,
          cx: n.position.x + w / 2,
          cy: n.position.y + h / 2,
          right: n.position.x + w,
          bottom: n.position.y + h,
        }
      })

      const newPositions = new Map<string, { x: number; y: number }>()

      if (mode === 'horizontal-row' || mode === 'align-center-y') {
        const avgCy =
          metrics.reduce((sum, m) => sum + m.cy, 0) / metrics.length
        for (const m of metrics) {
          newPositions.set(m.id, {
            x: Math.round(m.x),
            y: Math.round(avgCy - m.h / 2),
          })
        }
      } else if (mode === 'vertical-column' || mode === 'align-center-x') {
        const avgCx =
          metrics.reduce((sum, m) => sum + m.cx, 0) / metrics.length
        for (const m of metrics) {
          newPositions.set(m.id, {
            x: Math.round(avgCx - m.w / 2),
            y: Math.round(m.y),
          })
        }
      } else if (mode === 'align-left') {
        const minX = Math.min(...metrics.map((m) => m.x))
        for (const m of metrics) {
          newPositions.set(m.id, {
            x: Math.round(minX),
            y: Math.round(m.y),
          })
        }
      } else if (mode === 'align-right') {
        const maxRight = Math.max(...metrics.map((m) => m.right))
        for (const m of metrics) {
          newPositions.set(m.id, {
            x: Math.round(maxRight - m.w),
            y: Math.round(m.y),
          })
        }
      } else if (mode === 'align-top') {
        const minY = Math.min(...metrics.map((m) => m.y))
        for (const m of metrics) {
          newPositions.set(m.id, {
            x: Math.round(m.x),
            y: Math.round(minY),
          })
        }
      } else if (mode === 'align-bottom') {
        const maxBottom = Math.max(...metrics.map((m) => m.bottom))
        for (const m of metrics) {
          newPositions.set(m.id, {
            x: Math.round(m.x),
            y: Math.round(maxBottom - m.h),
          })
        }
      } else if (mode === 'distribute-horizontal') {
        const sorted = [...metrics].sort((a, b) => a.cx - b.cx)
        const totalWidth = sorted.reduce((sum, m) => sum + m.w, 0)
        const minLeft = sorted[0].x
        const maxRight = Math.max(...sorted.map((m) => m.right))
        const span = Math.max(
          maxRight - minLeft,
          totalWidth + (sorted.length - 1) * 36
        )
        const gap = (span - totalWidth) / (sorted.length - 1)
        let cursorX = minLeft
        for (const m of sorted) {
          newPositions.set(m.id, {
            x: Math.round(cursorX),
            y: Math.round(m.y),
          })
          cursorX += m.w + gap
        }
      } else if (mode === 'distribute-vertical') {
        const sorted = [...metrics].sort((a, b) => a.cy - b.cy)
        const totalHeight = sorted.reduce((sum, m) => sum + m.h, 0)
        const minTop = sorted[0].y
        const maxBottom = Math.max(...sorted.map((m) => m.bottom))
        const span = Math.max(
          maxBottom - minTop,
          totalHeight + (sorted.length - 1) * 28
        )
        const gap = (span - totalHeight) / (sorted.length - 1)
        let cursorY = minTop
        for (const m of sorted) {
          newPositions.set(m.id, {
            x: Math.round(m.x),
            y: Math.round(cursorY),
          })
          cursorY += m.h + gap
        }
      }

      setNodes((nds) =>
        nds.map((n) => {
          const nextPos = newPositions.get(n.id)
          if (nextPos) {
            return {
              ...n,
              position: nextPos,
            }
          }
          return n
        })
      )
    },
    [selectedNodes, nodes, pushSnapshot, setNodes]
  )

  // Custom events from node & edge UI buttons
  useEffect(() => {
    const handleDuplicateEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ nodeId: string }>
      const nodeId = customEvent.detail?.nodeId
      if (nodeId) handleDuplicateNode(nodeId)
    }

    const handleCycle = (e: Event) => {
      const customEvent = e as CustomEvent<{ edgeId: string }>
      const edgeId = customEvent.detail?.edgeId
      if (!edgeId) return

      const targetEdge = edges.find((ed) => ed.id === edgeId)
      if (!targetEdge) return

      const sNode = nodes.find((n) => n.id === targetEdge.source)
      const tNode = nodes.find((n) => n.id === targetEdge.target)
      const allowed = getAllowedRelationshipTypes(sNode?.type, tNode?.type)

      // Only cycle if more than 1 relationship type is valid for this pair
      if (allowed.length <= 1) return

      pushSnapshot()
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id !== edgeId) return edge
          const currentType =
            (edge.data?.relationshipType as UmlRelationshipType) || allowed[0]
          const currentIdx = allowed.indexOf(currentType)
          const nextIndex =
            currentIdx === -1 ? 0 : (currentIdx + 1) % allowed.length
          const nextType = allowed[nextIndex]

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

      pushSnapshot()
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

      pushSnapshot()
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId))
    }

    window.addEventListener('duplicate-node', handleDuplicateEvent)
    window.addEventListener('cycle-edge-type', handleCycle)
    window.addEventListener('flip-edge-direction', handleFlip)
    window.addEventListener('delete-edge', handleDelete)

    return () => {
      window.removeEventListener('duplicate-node', handleDuplicateEvent)
      window.removeEventListener('cycle-edge-type', handleCycle)
      window.removeEventListener('flip-edge-direction', handleFlip)
      window.removeEventListener('delete-edge', handleDelete)
    }
  }, [handleDuplicateNode, pushSnapshot, setEdges, edges, nodes])

  // Add Node handler
  const handleAddNode = useCallback(
    (
      type: 'actor' | 'useCase' | 'boundary' | 'note',
      options?: { actorType?: 'primary' | 'secondary' | 'system' }
    ) => {
      pushSnapshot()
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
        selected: true,
        data: initialData as unknown as Record<string, unknown>,
        zIndex: type === 'boundary' ? 1 : 10,
      }

      // Deselect existing, select newly added node
      setNodes((nds) => [
        ...nds.map((n) => ({ ...n, selected: false })),
        newNode,
      ])
    },
    [reactFlowInstance, pushSnapshot, setNodes]
  )

  // Node deletion
  const handleDeleteNode = useCallback(
    (id: string) => {
      pushSnapshot()
      setNodes((nds) => nds.filter((n) => n.id !== id))
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
      setSelectedNodes((prev) => prev.filter((n) => n.id !== id))
    },
    [pushSnapshot, setNodes, setEdges]
  )

  // Edge deletion
  const handleDeleteEdge = useCallback(
    (id: string) => {
      pushSnapshot()
      setEdges((eds) => eds.filter((e) => e.id !== id))
      setSelectedEdges((prev) => prev.filter((e) => e.id !== id))
    },
    [pushSnapshot, setEdges]
  )

  // Flip edge
  const handleFlipEdge = useCallback(
    (id: string) => {
      pushSnapshot()
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id !== id) return edge
          return {
            ...edge,
            source: edge.target,
            target: edge.source,
            sourceHandle: edge.targetHandle,
            targetHandle: edge.sourceHandle,
          }
        })
      )
    },
    [pushSnapshot, setEdges]
  )

  // Update node data from Inspector
  const handleUpdateNodeData = useCallback(
    (id: string, partial: Partial<UmlNodeData>) => {
      pushSnapshot()
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
    [pushSnapshot, reactFlowInstance, setNodes]
  )

  // Update edge data from Inspector (with UML 2.5 validation)
  const handleUpdateEdgeData = useCallback(
    (id: string, partial: Partial<UmlEdgeData>) => {
      if (partial.relationshipType) {
        const targetEdge = edges.find((e) => e.id === id)
        if (targetEdge) {
          const sNode = nodes.find((n) => n.id === targetEdge.source)
          const tNode = nodes.find((n) => n.id === targetEdge.target)
          const validation = validateUmlConnection(
            sNode,
            tNode,
            partial.relationshipType
          )
          if (!validation.valid) {
            showValidationWarning(
              validation.reason || 'Invalid UML 2.5 relationship.'
            )
            return
          }
        }
      }

      pushSnapshot()
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id !== id) return e
          return {
            ...e,
            data: {
              ...e.data,
              ...partial,
            },
          }
        })
      )
    },
    [edges, nodes, pushSnapshot, setEdges, showValidationWarning]
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

      pushSnapshot()
      setTitle(template.name)
      setNodes(template.nodes)
      setEdges(template.edges)
      setSelectedNodes([])
      setSelectedEdges([])

      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 })
      }, 50)
    },
    [nodes.length, pushSnapshot, reactFlowInstance, setNodes, setEdges]
  )

  // Clear Canvas
  const handleClearCanvas = useCallback(() => {
    if (nodes.length === 0) return
    if (window.confirm('Clear all nodes and connections from the diagram?')) {
      pushSnapshot()
      setTitle('Untitled Diagram')
      setNodes([])
      setEdges([])
      setSelectedNodes([])
      setSelectedEdges([])
    }
  }, [nodes.length, pushSnapshot, setNodes, setEdges])

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
          pushSnapshot()
          setTitle(parsed.title || 'Imported Diagram')
          setNodes(parsed.nodes)
          setEdges(parsed.edges)
          setTimeout(() => {
            reactFlowInstance.fitView({ padding: 0.2 })
          }, 50)
        } else {
          alert('Invalid diagram JSON file. Please select a valid .umly.json file.')
        }
      }
      reader.readAsText(file)
    },
    [pushSnapshot, reactFlowInstance, setNodes, setEdges]
  )

  return (
    <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden p-2 sm:p-3 gap-2 bg-[var(--bg-primary)]">
      {/* Top Toolbar */}
      <StudioToolbar
        title={title}
        onTitleChange={setTitle}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
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
          {/* UML 2.5 Relationship Validation Toast Banner */}
          <AnimatePresence>
            {validationNotice && (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                className="studio-bottom-dock absolute top-3 left-1/2 -translate-x-1/2 z-40 max-w-lg flex items-center gap-2.5 px-3 py-2 rounded-[8px] bg-[var(--bg-primary)] border border-[var(--notion-red-text)]/40 shadow-xl text-xs font-sans"
              >
                <AlertCircle className="w-4 h-4 text-[var(--notion-red-text)] shrink-0" />
                <span className="text-[var(--text-primary)] leading-snug">
                  {validationNotice.message}
                </span>
                {validationNotice.suggestedType &&
                  validationNotice.pendingConnection && (
                    <button
                      type="button"
                      onClick={() => {
                        const suggested = validationNotice.suggestedType!
                        const conn = validationNotice.pendingConnection!
                        setActiveRelationshipType(suggested)
                        setValidationNotice(null)
                        pushSnapshot()
                        const newEdge: Edge = {
                          id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                          source: conn.source,
                          target: conn.target,
                          sourceHandle: conn.sourceHandle,
                          targetHandle: conn.targetHandle,
                          type: 'umlEdge',
                          data: {
                            relationshipType: suggested,
                          },
                        }
                        setEdges((eds) => addEdge(newEdge, eds))
                      }}
                      className="px-2 py-1 rounded-[5px] bg-[var(--primary-btn)] text-white font-medium text-[11px] whitespace-nowrap hover:bg-[var(--primary-btn-hover)] transition-colors cursor-pointer shrink-0"
                    >
                      Use{' '}
                      {validationNotice.suggestedType === 'include'
                        ? '«include»'
                        : validationNotice.suggestedType === 'extend'
                          ? '«extend»'
                          : validationNotice.suggestedType === 'generalization'
                            ? 'Generalization'
                            : 'Association'}
                    </button>
                  )}
                <button
                  type="button"
                  onClick={() => setValidationNotice(null)}
                  className="p-0.5 rounded-[4px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer shrink-0"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <UmlMarkers />
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStart={onNodeDragStart}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onConnect={onConnect}
            onReconnect={onReconnect}
            edgesReconnectable
            reconnectRadius={14}
            elevateEdgesOnSelect
            connectionMode={ConnectionMode.Loose}
            connectionRadius={28}
            onSelectionChange={onSelectionChange}
            selectionMode={SelectionMode.Partial}
            multiSelectionKeyCode={['Meta', 'Control', 'Shift']}
            selectionKeyCode="Shift"
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
            maxZoom={2.2}
            deleteKeyCode={['Backspace', 'Delete']}
            proOptions={{ hideAttribution: true }}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Shift-Drag Smart Alignment Guide Lines */}
            {(alignmentGuides.vertical || alignmentGuides.horizontal) && (
              <ViewportPortal>
                <svg
                  style={{
                    overflow: 'visible',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 1,
                    height: 1,
                    pointerEvents: 'none',
                    zIndex: 99999,
                  }}
                >
                  {alignmentGuides.vertical && (
                    <g>
                      <line
                        x1={alignmentGuides.vertical.x}
                        y1={alignmentGuides.vertical.y1}
                        x2={alignmentGuides.vertical.x}
                        y2={alignmentGuides.vertical.y2}
                        stroke="var(--primary-btn)"
                        strokeWidth={1.5}
                        strokeDasharray="4,4"
                      />
                      <circle
                        cx={alignmentGuides.vertical.x}
                        cy={alignmentGuides.vertical.y1}
                        r={3}
                        fill="var(--primary-btn)"
                      />
                      <circle
                        cx={alignmentGuides.vertical.x}
                        cy={alignmentGuides.vertical.y2}
                        r={3}
                        fill="var(--primary-btn)"
                      />
                    </g>
                  )}
                  {alignmentGuides.horizontal && (
                    <g>
                      <line
                        x1={alignmentGuides.horizontal.x1}
                        y1={alignmentGuides.horizontal.y}
                        x2={alignmentGuides.horizontal.x2}
                        y2={alignmentGuides.horizontal.y}
                        stroke="var(--primary-btn)"
                        strokeWidth={1.5}
                        strokeDasharray="4,4"
                      />
                      <circle
                        cx={alignmentGuides.horizontal.x1}
                        cy={alignmentGuides.horizontal.y}
                        r={3}
                        fill="var(--primary-btn)"
                      />
                      <circle
                        cx={alignmentGuides.horizontal.x2}
                        cy={alignmentGuides.horizontal.y}
                        r={3}
                        fill="var(--primary-btn)"
                      />
                    </g>
                  )}
                </svg>
              </ViewportPortal>
            )}

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

          {/* Unified Floating Bottom Dock with Popovers */}
          <StudioBottomDock
            activeRelationshipType={activeRelationshipType}
            onRelationshipTypeChange={setActiveRelationshipType}
            onAddNode={handleAddNode}
            onFitView={handleFitView}
            onZoomIn={() => reactFlowInstance.zoomIn({ duration: 300 })}
            onZoomOut={() => reactFlowInstance.zoomOut({ duration: 300 })}
          />
        </div>

        {/* Right Properties Inspector */}
        <StudioInspector
          selectedNode={selectedNodes.length === 1 ? selectedNodes[0] : null}
          selectedEdge={selectedEdges.length === 1 ? selectedEdges[0] : null}
          selectedNodes={selectedNodes}
          selectedEdges={selectedEdges}
          onUpdateNodeData={handleUpdateNodeData}
          onUpdateEdgeData={handleUpdateEdgeData}
          onDeleteNode={handleDeleteNode}
          onDeleteEdge={handleDeleteEdge}
          onDuplicateNode={handleDuplicateNode}
          onFlipEdgeDirection={handleFlipEdge}
          onDeleteSelected={handleDeleteSelected}
          onDuplicateSelected={handleDuplicateSelected}
          onDeselectAll={handleDeselectAll}
          onAlignSelected={handleAlignSelected}
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
