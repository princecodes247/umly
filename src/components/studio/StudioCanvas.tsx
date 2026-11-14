import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  reconnectEdge,
  useReactFlow,
  useStoreApi,
  ReactFlowProvider,
  ViewportPortal,
  BackgroundVariant,
  SelectionMode,
  ConnectionMode,
  ConnectionLineType,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type NodeTypes,
  type EdgeTypes,
  type OnSelectionChangeParams,
  type OnNodeDrag,
  type FinalConnectionState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion, AnimatePresence } from 'motion/react'
import {
  AlertCircle,
  X,
  CircleDot,
  User,
  StickyNote,
  ArrowLeftRight,
  Trash2,
  Check,
  Table2,
  Boxes,
  Cpu,
  HardDrive,
  SquareUser,
} from 'lucide-react'

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
import { StudioToolbar } from './StudioToolbar'
import { StudioBottomDock } from './StudioBottomDock'
import { StudioInspector } from './StudioInspector'
import { CommandPalette } from './CommandPalette'
import { ShortcutsModal } from './ShortcutsModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { DIAGRAM_TEMPLATES } from '../../data/templates'
import {
  exportDiagramAsPng,
  exportDiagramAsSvg,
  exportDiagramAsJson,
  parseDiagramJson,
  copyDiagramAsPngToClipboard,
  generatePlantUml,
  generateMermaid,
  downloadTextFile,
} from '../../lib/exportDiagram'
import { parseDrawioXml } from '../../lib/importDrawio'
import {
  getDiagramDraft,
  saveDiagramDraft,
  getLastActiveDiagramId,
  listDiagramSnapshots,
  saveDiagramSnapshot,
  type DiagramDraft,
  type DiagramSnapshot,
  type DiagramType,
} from '../../lib/diagramStorage'
import {
  getAllowedRelationshipTypes,
  inferRelationshipType,
  validateUmlConnection,
} from '../../lib/umlValidation'
import { computeTidyLayout, computeTidyEdges } from '../../lib/tidyLayout'
import {
  toSourceHandleId,
  toTargetHandleId,
  getFloatingEdgeParams,
} from '../../lib/floatingEdges'
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
  erEntity: ErEntityNode,
  umlClass: ClassNode,
  dfdProcess: DfdProcessNode,
  dfdDataStore: DfdDataStoreNode,
  dfdExternalEntity: DfdExternalEntityNode,
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

interface DropCreateMenuState {
  sourceNodeId: string
  sourceNodeType: string
  clientX: number
  clientY: number
  flowX: number
  flowY: number
}

interface EdgeContextMenuState {
  edgeId: string
  clientX: number
  clientY: number
}

function getNodeDimensions(n: Node): { w: number; h: number } {
  if (n.type === 'boundary') {
    return {
      w: (n.data?.width as number) || n.measured?.width || 440,
      h: (n.data?.height as number) || n.measured?.height || 380,
    }
  }
  if (n.type === 'erEntity') {
    return {
      w: (n.data?.width as number) || n.measured?.width || 230,
      h: (n.data?.height as number) || n.measured?.height || 140,
    }
  }
  if (n.type === 'umlClass') {
    return {
      w: (n.data?.width as number) || n.measured?.width || 230,
      h: (n.data?.height as number) || n.measured?.height || 160,
    }
  }
  if (n.type === 'dfdProcess') {
    return {
      w: (n.data?.width as number) || n.measured?.width || 160,
      h: (n.data?.height as number) || n.measured?.height || 84,
    }
  }
  if (n.type === 'dfdDataStore') {
    return {
      w: (n.data?.width as number) || n.measured?.width || 184,
      h: (n.data?.height as number) || n.measured?.height || 54,
    }
  }
  if (n.type === 'dfdExternalEntity') {
    return {
      w: (n.data?.width as number) || n.measured?.width || 148,
      h: (n.data?.height as number) || n.measured?.height || 68,
    }
  }
  return {
    w:
      n.measured?.width ??
      (n.type === 'actor' ? 92 : n.type === 'useCase' ? 148 : 150),
    h:
      n.measured?.height ??
      (n.type === 'actor' ? 112 : n.type === 'useCase' ? 68 : 80),
  }
}

function expandIdsWithBoundaryChildren(
  initialIds: Set<string>,
  allNodes: Node[]
): Set<string> {
  const result = new Set(initialIds)
  let changed = true
  while (changed) {
    changed = false
    for (const b of allNodes) {
      if (!result.has(b.id) || b.type !== 'boundary') continue
      const { w: bw, h: bh } = getNodeDimensions(b)
      const bx1 = b.position.x
      const by1 = b.position.y
      const bx2 = bx1 + bw
      const by2 = by1 + bh

      for (const n of allNodes) {
        if (result.has(n.id)) continue
        const { w: nw, h: nh } = getNodeDimensions(n)
        const cx = n.position.x + nw / 2
        const cy = n.position.y + nh / 2
        if (cx >= bx1 && cx <= bx2 && cy >= by1 && cy <= by2) {
          result.add(n.id)
          changed = true
        }
      }
    }
  }
  return result
}

const MULTI_SELECTION_KEY_CODES = ['Meta', 'Control', 'Shift']

export interface StudioCanvasPuzzleProps {
  initialNodes: Node[]
  initialEdges: Edge[]
  diagramType?: DiagramType
  title?: string
  resetKey?: string | number
  onDiagramChange?: (nodes: Node[], edges: Edge[]) => void
  customHeader?: React.ReactNode
  leftSidebar?: React.ReactNode
  hideInspector?: boolean
}

interface StudioCanvasProps {
  diagramId?: string
  puzzle?: StudioCanvasPuzzleProps
}

function StudioCanvasInner({ diagramId, puzzle }: StudioCanvasProps) {
  const reactFlowInstance = useReactFlow()
  const storeApi = useStoreApi()
  const canvasRef = useRef<HTMLDivElement>(null)

  const isPuzzleMode = Boolean(puzzle)

  // Resolve active diagram draft ID
  const activeDraftId = diagramId || getLastActiveDiagramId()
  const initialDraft = isPuzzleMode ? null : getDiagramDraft(activeDraftId)

  const defaultTemplate = DIAGRAM_TEMPLATES[1]

  const [title, setTitle] = useState<string>(
    puzzle?.title || initialDraft?.title || defaultTemplate.name
  )
  const [diagramType, setDiagramType] = useState<DiagramType>(
    puzzle?.diagramType || initialDraft?.type || 'use_case'
  )
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(
    puzzle?.initialNodes || initialDraft?.nodes || defaultTemplate.nodes
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    puzzle?.initialEdges || initialDraft?.edges || defaultTemplate.edges
  )

  // Default routing style for edges ('straight' | 'orthogonal' | 'bezier')
  const [defaultRoutingStyle, setDefaultRoutingStyle] = useState<
    'straight' | 'orthogonal' | 'bezier'
  >('straight')

  // Modals & floating menus
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string
    description: string
    confirmLabel: string
    variant: 'danger' | 'default'
    onConfirm: () => void
  } | null>(null)
  const [dropCreateMenu, setDropCreateMenu] =
    useState<DropCreateMenuState | null>(null)
  const [edgeContextMenu, setEdgeContextMenu] =
    useState<EdgeContextMenuState | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Version history snapshots
  const [snapshots, setSnapshots] = useState<DiagramSnapshot[]>(() =>
    listDiagramSnapshots(activeDraftId)
  )

  // Selection states
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([])
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([])
  const [isInspectorOpen, setIsInspectorOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  )
  const [isSaved, setIsSaved] = useState(true)

  // Robust Undo / Redo history refs
  const pastRef = useRef<HistorySnapshot[]>([])
  const futureRef = useRef<HistorySnapshot[]>([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Pre-drag snapshot ref so dragging/moving nodes records the exact pre-move state for Undo
  const dragStartSnapshotRef = useRef<HistorySnapshot | null>(null)

  // Clipboard for Cmd+C and Cmd+V
  const clipboardRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null)

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev))
    }, 2200)
  }, [])

  // Helper: push snapshot of current state before a mutation
  const pushSnapshot = useCallback(() => {
    pastRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    })
    if (pastRef.current.length > 60) {
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

  // Save a version snapshot
  const handleSaveSnapshot = useCallback(
    (label = 'Snapshot') => {
      const updated = saveDiagramSnapshot(activeDraftId, label, nodes, edges)
      setSnapshots(updated)
      if (label === 'Manual Checkpoint') {
        showToast('Snapshot saved to Version History')
      }
    },
    [activeDraftId, nodes, edges, showToast]
  )

  // Restore a version snapshot with Undo support
  const handleRestoreSnapshot = useCallback(
    (snap: DiagramSnapshot) => {
      pushSnapshot()
      setNodes(JSON.parse(JSON.stringify(snap.nodes)))
      setEdges(JSON.parse(JSON.stringify(snap.edges)))
      showToast(`Restored "${snap.label}"`)
    },
    [pushSnapshot, setNodes, setEdges, showToast]
  )

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
          autoFocusEdit: false,
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

  // When diagramId or puzzle resetKey changes, load new draft or reset puzzle
  useEffect(() => {
    if (puzzle) {
      setTitle(puzzle.title || 'Puzzle')
      setDiagramType(puzzle.diagramType || 'use_case')
      setNodes(puzzle.initialNodes)
      setEdges(puzzle.initialEdges)
      pastRef.current = []
      futureRef.current = []
      setCanUndo(false)
      setCanRedo(false)
      setSelectedNodes([])
      setSelectedEdges([])
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 })
      }, 50)
      return
    }

    const draft = getDiagramDraft(activeDraftId)
    if (draft) {
      setTitle(draft.title)
      setDiagramType(draft.type || 'use_case')
      setNodes(draft.nodes)
      setEdges(draft.edges)
      pastRef.current = []
      futureRef.current = []
      setCanUndo(false)
      setCanRedo(false)
      setSelectedNodes([])
      setSelectedEdges([])
      setSnapshots(listDiagramSnapshots(activeDraftId))
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 })
      }, 50)
    }
  }, [activeDraftId, isPuzzleMode, puzzle?.resetKey, setNodes, setEdges, reactFlowInstance])

  // Notify puzzle host when nodes/edges change
  useEffect(() => {
    if (!isPuzzleMode) return
    puzzle?.onDiagramChange?.(nodes, edges)
  }, [isPuzzleMode, nodes, edges, puzzle?.onDiagramChange])

  // Auto-save to diagram draft storage + periodic version history snapshots
  const lastSnapshotTimeRef = useRef<number>(Date.now())
  useEffect(() => {
    if (isPuzzleMode) return
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

        // Save an automatic version history snapshot every 45 seconds of active editing
        const now = Date.now()
        if (now - lastSnapshotTimeRef.current > 45000 && nodes.length > 0) {
          lastSnapshotTimeRef.current = now
          const updatedSnaps = saveDiagramSnapshot(
            activeDraftId,
            'Autosave',
            nodes,
            edges
          )
          setSnapshots(updatedSnaps)
        }
      } catch (err) {
        console.warn('Failed to save diagram draft', err)
      }
    }, 450)

    return () => clearTimeout(timeout)
  }, [isPuzzleMode, activeDraftId, title, nodes, edges])

  // Close floating menus on outside pointerdown
  useEffect(() => {
    if (!dropCreateMenu && !edgeContextMenu) return
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('.floating-context-menu')) return
      setDropCreateMenu(null)
      setEdgeContextMenu(null)
    }
    window.addEventListener('pointerdown', handlePointerDown, true)
    return () =>
      window.removeEventListener('pointerdown', handlePointerDown, true)
  }, [dropCreateMenu, edgeContextMenu])

  // System Boundary Contained Children Drag Logic
  const draggingBoundaryChildrenRef = useRef<{
    boundaryId: string
    childInitialPositions: Map<string, { x: number; y: number }>
    boundaryStartPos: { x: number; y: number }
  } | null>(null)

  // Smart alignment guides ON by default; holding Shift temporarily disables snapping
  const shiftKeyPressedRef = useRef(false)
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuides>({
    vertical: null,
    horizontal: null,
  })

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shiftKeyPressedRef.current = true
        setAlignmentGuides({ vertical: null, horizontal: null })
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shiftKeyPressedRef.current = false
      }
    }
    const onBlur = () => {
      shiftKeyPressedRef.current = false
      setAlignmentGuides({ vertical: null, horizontal: null })
      if (storeApi.getState().multiSelectionActive) {
        storeApi.setState({ multiSelectionActive: false })
      }
    }
    const onVisibilityChange = () => {
      if (document.hidden) {
        onBlur()
      }
    }
    const onPointerDownCapture = (e: PointerEvent) => {
      if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
        shiftKeyPressedRef.current = false
        if (storeApi.getState().multiSelectionActive) {
          storeApi.setState({ multiSelectionActive: false })
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pointerdown', onPointerDownCapture, true)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pointerdown', onPointerDownCapture, true)
    }
  }, [storeApi])

  // Custom onNodesChange wrapper: Snaps by default unless Shift is held
  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      const removedIds = new Set(
        changes
          .filter((c): c is Extract<NodeChange<Node>, { type: 'remove' }> => c.type === 'remove')
          .map((c) => c.id)
      )
      if (removedIds.size > 0) {
        const expandedIds = expandIdsWithBoundaryChildren(removedIds, nodes)
        if (expandedIds.size > removedIds.size) {
          const extraRemoves: NodeChange<Node>[] = []
          expandedIds.forEach((id) => {
            if (!removedIds.has(id)) {
              extraRemoves.push({ type: 'remove', id })
            }
          })
          setEdges((eds) =>
            eds.filter(
              (e) => !expandedIds.has(e.source) && !expandedIds.has(e.target)
            )
          )
          onNodesChange([...changes, ...extraRemoves])
          return
        }
      }

      const posChanges = changes.filter(
        (c): c is Extract<NodeChange<Node>, { type: 'position' }> =>
          c.type === 'position' && Boolean(c.position)
      )
      const isActivelyDragging = posChanges.some((c) => Boolean(c.dragging))

      const dragEnded = changes.some(
        (c) => c.type === 'position' && c.dragging === false
      )

      if (dragEnded) {
        setAlignmentGuides({ vertical: null, horizontal: null })
      }

      // Snapping is ON by default; holding Shift disables snapping
      if (posChanges.length > 0 && !shiftKeyPressedRef.current) {
        const primaryChange = posChanges[0]
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

          const SNAP_THRESHOLD = 10
          let bestDx: number | null = null
          let bestAbsDx = SNAP_THRESHOLD
          let vGuide: AlignmentGuides['vertical'] = null

          let bestDy: number | null = null
          let bestAbsDy = SNAP_THRESHOLD
          let hGuide: AlignmentGuides['horizontal'] = null

          const draggingIds = new Set(posChanges.map((c) => c.id))

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

          if (isActivelyDragging) {
            setAlignmentGuides({ vertical: vGuide, horizontal: hGuide })
          }

          if (bestDx !== null || bestDy !== null) {
            const snappedChanges = changes.map((c) => {
              if (c.type === 'position' && c.position) {
                return {
                  ...c,
                  position: {
                    x:
                      bestDx !== null
                        ? c.position.x + bestDx
                        : Math.round(c.position.x),
                    y:
                      bestDy !== null
                        ? c.position.y + bestDy
                        : Math.round(c.position.y),
                  },
                }
              }
              return c
            })
            onNodesChange(snappedChanges)
            return
          }
        }
      } else if (isActivelyDragging && shiftKeyPressedRef.current) {
        setAlignmentGuides({ vertical: null, horizontal: null })
      }

      onNodesChange(changes)
    },
    [nodes, onNodesChange, setEdges]
  )

  const onNodeDragStart: OnNodeDrag<Node> = useCallback(
    (event, node) => {
      shiftKeyPressedRef.current = Boolean(
        (event as unknown as MouseEvent)?.shiftKey
      )
      // Capture pre-drag state for rock-solid move undo
      dragStartSnapshotRef.current = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      }

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
          const nw = n.measured?.width ?? 120
          const nh = n.measured?.height ?? 60
          const cx = n.position.x + nw / 2
          const cy = n.position.y + nh / 2

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
    [nodes, edges]
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

      // Clear boundary hover highlight
      setNodes((nds) =>
        nds.map((n) =>
          n.type === 'boundary' && n.data?.isHoveredByDrag
            ? { ...n, data: { ...n.data, isHoveredByDrag: false } }
            : n
        )
      )

      // Push pre-drag snapshot if any node actually moved
      if (dragStartSnapshotRef.current) {
        const pre = dragStartSnapshotRef.current
        const moved = pre.nodes.some((pn) => {
          const cur = nodes.find((cn) => cn.id === pn.id)
          return (
            cur &&
            (Math.round(cur.position.x) !== Math.round(pn.position.x) ||
              Math.round(cur.position.y) !== Math.round(pn.position.y))
          )
        })
        if (moved) {
          pastRef.current.push(pre)
          if (pastRef.current.length > 60) {
            pastRef.current.shift()
          }
          futureRef.current = []
          setCanUndo(true)
          setCanRedo(false)
        }
        dragStartSnapshotRef.current = null
      }
    },
    [nodes, setNodes]
  )

  // Add Node helper: auto-drops at visible viewport center (avoiding overlap) or at explicit drag-drop position
  const handleAddNode = useCallback(
    (
      type:
        | 'actor'
        | 'useCase'
        | 'boundary'
        | 'note'
        | 'erEntity'
        | 'umlClass'
        | 'dfdProcess'
        | 'dfdDataStore'
        | 'dfdExternalEntity',
      options?: {
        actorType?: 'primary' | 'secondary' | 'system'
        position?: { x: number; y: number }
        autoFocusEdit?: boolean
      }
    ) => {
      pushSnapshot()
      const id = `${type}-${Date.now()}`

      const nodeW =
        type === 'boundary'
          ? 440
          : type === 'erEntity' || type === 'umlClass'
            ? 230
            : type === 'dfdDataStore'
              ? 184
              : type === 'dfdProcess'
                ? 160
                : type === 'dfdExternalEntity' || type === 'useCase'
                  ? 148
                  : type === 'actor'
                    ? 88
                    : 150
      const nodeH =
        type === 'boundary'
          ? 380
          : type === 'erEntity'
            ? 140
            : type === 'umlClass'
              ? 160
              : type === 'dfdProcess'
                ? 84
                : type === 'dfdExternalEntity'
                  ? 68
                  : type === 'dfdDataStore'
                    ? 54
                    : type === 'useCase'
                      ? 64
                      : type === 'actor'
                        ? 108
                        : 76

      let posX: number
      let posY: number

      if (options?.position) {
        posX = options.position.x
        posY = options.position.y
      } else {
        // Compute exact center of the visible canvas container
        const rect = canvasRef.current?.getBoundingClientRect()
        const centerClientX = rect
          ? rect.left + rect.width / 2
          : window.innerWidth / 2
        const centerClientY = rect
          ? rect.top + rect.height / 2
          : window.innerHeight / 2

        const flowCenter = reactFlowInstance.screenToFlowPosition({
          x: centerClientX,
          y: centerClientY,
        })

        // Place actors slightly to the left of center by default, useCases at center
        posX =
          type === 'actor'
            ? flowCenter.x - nodeW / 2 - 180
            : flowCenter.x - nodeW / 2
        posY = flowCenter.y - nodeH / 2

        // Step diagonally if another node of the same/solid layer is already at this spot
        let attempts = 0
        while (
          attempts < 12 &&
          nodes.some(
            (n) =>
              n.type !== 'boundary' &&
              Math.abs(n.position.x - posX) < 42 &&
              Math.abs(n.position.y - posY) < 42
          )
        ) {
          posX += 32
          posY += 32
          attempts++
        }
      }

      let initialData: UmlNodeData

      switch (type) {
        case 'actor':
          initialData = {
            nodeType: 'actor',
            label:
              options?.actorType === 'secondary'
                ? 'External Service'
                : options?.actorType === 'system'
                  ? 'System Actor'
                  : 'Actor',
            actorType: options?.actorType || 'primary',
            autoFocusEdit: options?.autoFocusEdit ?? true,
          }
          break
        case 'useCase':
          initialData = {
            nodeType: 'useCase',
            label: 'New Use Case',
            autoFocusEdit: options?.autoFocusEdit ?? true,
          }
          break
        case 'erEntity':
          initialData = {
            nodeType: 'erEntity',
            label: 'NewEntity',
            width: 230,
            attributes: [
              {
                id: `attr-${Date.now()}-1`,
                name: 'id',
                dataType: 'uuid',
                isPrimaryKey: true,
              },
              {
                id: `attr-${Date.now()}-2`,
                name: 'name',
                dataType: 'varchar',
              },
              {
                id: `attr-${Date.now()}-3`,
                name: 'created_at',
                dataType: 'timestamp',
              },
            ],
            autoFocusEdit: options?.autoFocusEdit ?? true,
          }
          break
        case 'umlClass':
          initialData = {
            nodeType: 'umlClass',
            label: 'NewClass',
            width: 230,
            classKind: 'class',
            classAttributes: [
              {
                id: `attr-${Date.now()}-1`,
                visibility: '-',
                name: 'id',
                type: 'string',
              },
              {
                id: `attr-${Date.now()}-2`,
                visibility: '+',
                name: 'name',
                type: 'string',
              },
            ],
            classMethods: [
              {
                id: `meth-${Date.now()}-1`,
                visibility: '+',
                name: 'getName',
                params: '',
                returnType: 'string',
              },
            ],
            autoFocusEdit: options?.autoFocusEdit ?? true,
          }
          break
        case 'dfdProcess': {
          const procCount = nodes.filter((n) => n.type === 'dfdProcess').length + 1
          initialData = {
            nodeType: 'dfdProcess',
            label: 'Process',
            processNumber: `${procCount}.0`,
            autoFocusEdit: options?.autoFocusEdit ?? true,
          }
          break
        }
        case 'dfdDataStore': {
          const storeCount = nodes.filter((n) => n.type === 'dfdDataStore').length + 1
          initialData = {
            nodeType: 'dfdDataStore',
            label: 'Data Store',
            dataStoreId: `D${storeCount}`,
            autoFocusEdit: options?.autoFocusEdit ?? true,
          }
          break
        }
        case 'dfdExternalEntity':
          initialData = {
            nodeType: 'dfdExternalEntity',
            label: 'External Entity',
            autoFocusEdit: options?.autoFocusEdit ?? true,
          }
          break
        case 'boundary':
          initialData = {
            nodeType: 'boundary',
            boundaryTitle:
              diagramType === 'er'
                ? 'Schema Group'
                : diagramType === 'class'
                  ? 'Package'
                  : 'System Boundary',
            label:
              diagramType === 'er'
                ? 'Schema Group'
                : diagramType === 'class'
                  ? 'Package'
                  : 'System Boundary',
            width: 440,
            height: 380,
            autoFocusEdit: options?.autoFocusEdit ?? true,
          }
          break
        case 'note':
          initialData = {
            nodeType: 'note',
            label: 'Note',
            description: 'Note / Constraint',
            autoFocusEdit: options?.autoFocusEdit ?? true,
          }
          break
      }

      const newNode: Node = {
        id,
        type,
        position: { x: Math.round(posX), y: Math.round(posY) },
        selected: true,
        data: initialData as unknown as Record<string, unknown>,
        zIndex: type === 'boundary' ? 1 : 10,
      }

      setNodes((nds) => [
        ...nds.map((n) => ({ ...n, selected: false })),
        newNode,
      ])
      setEdges((eds) => eds.map((e) => ({ ...e, selected: false })))
      return newNode
    },
    [reactFlowInstance, nodes, pushSnapshot, setNodes, setEdges]
  )

  // Create & connect next element (triggered by Tab key or Drop-on-Empty-Canvas menu)
  const createConnectedElement = useCallback(
    (
      sourceNodeId: string,
      targetType:
        | 'useCase'
        | 'actor'
        | 'note'
        | 'erEntity'
        | 'umlClass'
        | 'dfdProcess'
        | 'dfdDataStore'
        | 'dfdExternalEntity',
      relationshipType: UmlRelationshipType,
      flowPos?: { x: number; y: number }
    ) => {
      const sourceNode = nodes.find((n) => n.id === sourceNodeId)
      if (!sourceNode) return

      pushSnapshot()
      const timestamp = Date.now()
      const newNodeId = `${targetType}-${timestamp}`

      const { w: sw, h: sh } = getNodeDimensions(sourceNode)
      const defaultPos =
        sourceNode.type === 'actor'
          ? {
            x: Math.round(sourceNode.position.x + sw + 130),
            y: Math.round(sourceNode.position.y + sh / 2 - 34),
          }
          : {
            x: Math.round(sourceNode.position.x + sw + 110),
            y: Math.round(sourceNode.position.y),
          }

      const pos = flowPos
        ? { x: Math.round(flowPos.x - 70), y: Math.round(flowPos.y - 32) }
        : defaultPos

      const newNodeData: UmlNodeData =
        targetType === 'actor'
          ? {
            nodeType: 'actor',
            label: 'Actor',
            actorType: 'primary',
            autoFocusEdit: true,
          }
          : targetType === 'note'
            ? {
              nodeType: 'note',
              label: 'Note',
              description: 'Constraint',
              autoFocusEdit: true,
            }
            : targetType === 'erEntity'
              ? {
                nodeType: 'erEntity',
                label: 'NewEntity',
                width: 230,
                attributes: [
                  {
                    id: `attr-${timestamp}-1`,
                    name: 'id',
                    dataType: 'uuid',
                    isPrimaryKey: true,
                  },
                  {
                    id: `attr-${timestamp}-2`,
                    name: 'name',
                    dataType: 'varchar',
                  },
                ],
                autoFocusEdit: true,
              }
              : targetType === 'umlClass'
                ? {
                  nodeType: 'umlClass',
                  label: 'NewClass',
                  width: 230,
                  classKind: 'class',
                  classAttributes: [
                    {
                      id: `attr-${timestamp}-1`,
                      visibility: '-',
                      name: 'id',
                      type: 'string',
                    },
                  ],
                  classMethods: [
                    {
                      id: `meth-${timestamp}-1`,
                      visibility: '+',
                      name: 'execute',
                      params: '',
                      returnType: 'void',
                    },
                  ],
                  autoFocusEdit: true,
                }
                : targetType === 'dfdProcess'
                  ? {
                    nodeType: 'dfdProcess',
                    label: 'Process',
                    processNumber: `${nodes.filter((n) => n.type === 'dfdProcess').length + 1}.0`,
                    autoFocusEdit: true,
                  }
                  : targetType === 'dfdDataStore'
                    ? {
                      nodeType: 'dfdDataStore',
                      label: 'Data Store',
                      dataStoreId: `D${nodes.filter((n) => n.type === 'dfdDataStore').length + 1}`,
                      autoFocusEdit: true,
                    }
                    : targetType === 'dfdExternalEntity'
                      ? {
                        nodeType: 'dfdExternalEntity',
                        label: 'External Entity',
                        autoFocusEdit: true,
                      }
                      : {
                        nodeType: 'useCase',
                        label: 'New Use Case',
                        autoFocusEdit: true,
                      }

      const newNode: Node = {
        id: newNodeId,
        type: targetType,
        position: pos,
        selected: true,
        data: newNodeData as unknown as Record<string, unknown>,
        zIndex: 10,
      }

      const initialParams = getFloatingEdgeParams(sourceNode, newNode)
      const newEdge: Edge = {
        id: `edge-${timestamp}`,
        source: sourceNodeId,
        target: newNodeId,
        sourceHandle: toSourceHandleId(initialParams.sourcePos),
        targetHandle: toTargetHandleId(initialParams.targetPos),
        type: 'umlEdge',
        data: {
          relationshipType,
          routingStyle: defaultRoutingStyle,
          ...(relationshipType === 'er'
            ? {
              erSourceCardinality: 'one_only',
              erTargetCardinality: 'zero_or_many',
              erIdentifying: false,
            }
            : {}),
        },
      }

      setNodes((nds) => [
        ...nds.map((n) => ({ ...n, selected: false })),
        newNode,
      ])
      setEdges((eds) => [
        ...eds.map((e) => ({ ...e, selected: false })),
        newEdge,
      ])
    },
    [nodes, pushSnapshot, defaultRoutingStyle, setNodes, setEdges]
  )

  // Handle Connections with automatic relationship type inference (Item 2)
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

  const connectedInLastAttemptRef = useRef(false)
  const connectStartRef = useRef<{
    nodeId: string | null
    handleId: string | null
  } | null>(null)

  const onConnect = useCallback(
    (params: Connection) => {
      connectedInLastAttemptRef.current = true
      const startNodeId = connectStartRef.current?.nodeId

      // Ensure the relationship always points in the exact direction it was drawn in:
      // Drag start -> source (tail), Drag release -> target (arrowhead)
      let sourceId = params.source
      let targetId = params.target
      let sHandle = params.sourceHandle
      let tHandle = params.targetHandle

      if (startNodeId && params.target === startNodeId) {
        // React Flow inverted source and target because connection started from a 'target' handle
        sourceId = params.target
        targetId = params.source
        sHandle = params.targetHandle
        tHandle = params.sourceHandle
      } else if (startNodeId && params.source !== startNodeId) {
        sourceId = startNodeId
        targetId = params.source === startNodeId ? params.target : params.source
      }

      const sourceNode = nodes.find((n) => n.id === sourceId)
      const targetNode = nodes.find((n) => n.id === targetId)

      // Infer relationship type automatically based on source and target node types
      const inferredType: UmlRelationshipType =
        inferRelationshipType(sourceNode?.type, targetNode?.type) ||
        'association'

      const validation = validateUmlConnection(
        sourceNode,
        targetNode,
        inferredType
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

      if ((!sHandle || !tHandle) && sourceNode && targetNode) {
        const initialParams = getFloatingEdgeParams(sourceNode, targetNode)
        if (!sHandle) sHandle = initialParams.sourcePos
        if (!tHandle) tHandle = initialParams.targetPos
      }

      const newEdge: Edge = {
        id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        source: sourceId,
        target: targetId,
        sourceHandle: toSourceHandleId(sHandle),
        targetHandle: toTargetHandleId(tHandle),
        type: 'umlEdge',
        selected: true,
        data: {
          relationshipType: inferredType,
          routingStyle: defaultRoutingStyle,
          ...(inferredType === 'er'
            ? {
              erSourceCardinality: 'one_only',
              erTargetCardinality: 'zero_or_many',
              erIdentifying: false,
            }
            : {}),
        },
      }

      // Deselect all previous selections; select the newly drawn relationship line
      setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))
      setSelectedNodes([])
      setEdges((eds) => [
        ...eds.map((ed) => ({ ...ed, selected: false })),
        newEdge,
      ])
      setSelectedEdges([newEdge])

      // React Flow may process handle mouseup in the same tick; ensure edge remains the only selected element
      requestAnimationFrame(() => {
        setNodes((nds) =>
          nds.some((n) => n.selected)
            ? nds.map((n) => ({ ...n, selected: false }))
            : nds
        )
        setEdges((eds) =>
          eds.map((ed) => ({
            ...ed,
            selected: ed.id === newEdge.id,
          }))
        )
        setSelectedNodes([])
        setSelectedEdges([newEdge])
      })
    },
    [
      nodes,
      defaultRoutingStyle,
      pushSnapshot,
      setEdges,
      setNodes,
      setSelectedNodes,
      setSelectedEdges,
      showValidationWarning,
    ]
  )

  // Drop connection line on empty canvas -> open "Create Connected Element" menu (Item 2)
  const onConnectStart = useCallback(
    (_event: MouseEvent | TouchEvent, params?: { nodeId?: string | null; handleId?: string | null }) => {
      connectedInLastAttemptRef.current = false
      connectStartRef.current = {
        nodeId: params?.nodeId ?? null,
        handleId: params?.handleId ?? null,
      }
    },
    []
  )

  const onConnectEnd = useCallback(
    (
      event: MouseEvent | TouchEvent,
      connectionState: FinalConnectionState
    ) => {
      if (connectedInLastAttemptRef.current) return
      if (connectionState.isValid) return
      const fromNode = connectionState.fromNode
      if (!fromNode || fromNode.type === 'boundary') return

      const clientX =
        'changedTouches' in event
          ? event.changedTouches[0]?.clientX ?? 0
          : event.clientX
      const clientY =
        'changedTouches' in event
          ? event.changedTouches[0]?.clientY ?? 0
          : event.clientY

      // Check if dropped onto an existing node element (in case loose handle wasn't hit directly)
      const elemUnderCursor = document.elementFromPoint(clientX, clientY)
      const targetNodeEl = elemUnderCursor?.closest('.react-flow__node')
      if (targetNodeEl) {
        const targetId = targetNodeEl.getAttribute('data-id')
        if (targetId && targetId !== fromNode.id) {
          onConnect({
            source: fromNode.id,
            target: targetId,
            sourceHandle: connectionState.fromHandle?.id || null,
            targetHandle: null,
          })
          return
        }
      }

      const flowPos = reactFlowInstance.screenToFlowPosition({
        x: clientX,
        y: clientY,
      })

      setDropCreateMenu({
        sourceNodeId: fromNode.id,
        sourceNodeType: fromNode.type || 'useCase',
        clientX,
        clientY,
        flowX: flowPos.x,
        flowY: flowPos.y,
      })
    },
    [reactFlowInstance, onConnect]
  )

  // Handle dragging the source or target end of an existing relationship to reconnect it
  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === newConnection.source)
      const targetNode = nodes.find((n) => n.id === newConnection.target)
      const currentRelType: UmlRelationshipType =
        (oldEdge.data?.relationshipType as UmlRelationshipType) ||
        inferRelationshipType(sourceNode?.type, targetNode?.type) ||
        'association'

      const validation = validateUmlConnection(
        sourceNode,
        targetNode,
        currentRelType
      )

      const finalRelType: UmlRelationshipType = validation.valid
        ? currentRelType
        : validation.suggestedType ||
        inferRelationshipType(sourceNode?.type, targetNode?.type) ||
        'association'

      const recheck = validateUmlConnection(
        sourceNode,
        targetNode,
        finalRelType
      )

      if (!recheck.valid) {
        showValidationWarning(
          recheck.reason ||
          'Invalid UML 2.5 relationship for this reconnection.'
        )
        return
      }

      setValidationNotice(null)
      pushSnapshot()
      const normalizedConnection: Connection = {
        ...newConnection,
        sourceHandle: toSourceHandleId(newConnection.sourceHandle) ?? null,
        targetHandle: toTargetHandleId(newConnection.targetHandle) ?? null,
      }
      setEdges((eds) =>
        reconnectEdge(oldEdge, normalizedConnection, eds).map((e) =>
          e.id === oldEdge.id
            ? {
              ...e,
              sourceHandle: toSourceHandleId(normalizedConnection.sourceHandle),
              targetHandle: toTargetHandleId(normalizedConnection.targetHandle),
              data: {
                ...e.data,
                relationshipType: finalRelType,
              },
            }
            : e
        )
      )
    },
    [nodes, pushSnapshot, setEdges, showValidationWarning]
  )

  // Right-click on edge opens context menu to change relationship type or routing (Item 2)
  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault()
      setEdgeContextMenu({
        edgeId: edge.id,
        clientX: event.clientX,
        clientY: event.clientY,
      })
    },
    []
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
          autoFocusEdit: false,
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
    const selNodeIds = expandIdsWithBoundaryChildren(
      new Set(selectedNodes.map((n) => n.id)),
      nodes
    )
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
  }, [selectedNodes, selectedEdges, nodes, pushSnapshot, setNodes, setEdges])

  const handleDeselectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))
    setEdges((eds) => eds.map((e) => ({ ...e, selected: false })))
    setSelectedNodes([])
    setSelectedEdges([])
  }, [setNodes, setEdges])

  // One-click Tidy Up auto-layout (Item 5)
  const handleTidyLayout = useCallback(() => {
    if (nodes.length === 0) return
    pushSnapshot()
    const tidied = computeTidyLayout(nodes, edges)
    const tidiedEdges = computeTidyEdges(tidied, edges)
    setNodes(tidied)
    setEdges(tidiedEdges)
    handleSaveSnapshot('Before Tidy Layout')
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 350 })
    }, 60)
    showToast('Diagram layout tidied')
  }, [
    nodes,
    edges,
    pushSnapshot,
    setNodes,
    setEdges,
    handleSaveSnapshot,
    reactFlowInstance,
    showToast,
  ])

  // Change default routing style and apply to edges
  const handleDefaultRoutingStyleChange = useCallback(
    (style: 'straight' | 'orthogonal' | 'bezier') => {
      setDefaultRoutingStyle(style)
      pushSnapshot()
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          data: {
            ...e.data,
            routingStyle: style,
          },
        }))
      )
    },
    [pushSnapshot, setEdges]
  )

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

  // Direct reconnection of an edge endpoint (with smart UML 2.5 type adaptation)
  const handleReconnectEdge = useCallback(
    (
      edgeId: string,
      end: 'source' | 'target',
      newNodeId: string,
      newHandleId?: string | null
    ) => {
      const targetEdge = edges.find((ed) => ed.id === edgeId)
      if (!targetEdge) return

      const nextSourceId = end === 'source' ? newNodeId : targetEdge.source
      const nextTargetId = end === 'target' ? newNodeId : targetEdge.target

      if (nextSourceId === nextTargetId) return

      const sNode = nodes.find((n) => n.id === nextSourceId)
      const tNode = nodes.find((n) => n.id === nextTargetId)
      const currentRelType: UmlRelationshipType =
        (targetEdge.data?.relationshipType as UmlRelationshipType) ||
        'association'

      const validation = validateUmlConnection(sNode, tNode, currentRelType)
      const finalRelType: UmlRelationshipType = validation.valid
        ? currentRelType
        : validation.suggestedType ||
        inferRelationshipType(sNode?.type, tNode?.type) ||
        'association'

      const recheck = validateUmlConnection(sNode, tNode, finalRelType)
      if (!recheck.valid) {
        showValidationWarning(
          recheck.reason ||
          'Invalid UML 2.5 relationship for this reconnection.'
        )
        return
      }

      const nextSourceHandle =
        end === 'source'
          ? (newHandleId !== undefined ? toSourceHandleId(newHandleId) : targetEdge.sourceHandle)
          : targetEdge.sourceHandle

      const nextTargetHandle =
        end === 'target'
          ? (newHandleId !== undefined ? toTargetHandleId(newHandleId) : targetEdge.targetHandle)
          : targetEdge.targetHandle

      setValidationNotice(null)
      pushSnapshot()
      setEdges((eds) =>
        eds.map((ed) =>
          ed.id === edgeId
            ? {
              ...ed,
              source: nextSourceId,
              target: nextTargetId,
              sourceHandle: nextSourceHandle,
              targetHandle: nextTargetHandle,
              data: {
                ...ed.data,
                relationshipType: finalRelType,
              },
            }
            : ed
        )
      )
      setSelectedEdges((prev) =>
        prev.map((ed) =>
          ed.id === edgeId
            ? {
              ...ed,
              source: nextSourceId,
              target: nextTargetId,
              sourceHandle: nextSourceHandle,
              targetHandle: nextTargetHandle,
              data: {
                ...ed.data,
                relationshipType: finalRelType,
              },
            }
            : ed
        )
      )
    },
    [edges, nodes, pushSnapshot, setEdges, setSelectedEdges, showValidationWarning]
  )

  // Custom events from node & edge UI buttons
  useEffect(() => {
    const handleDuplicateEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ nodeId: string }>
      const nodeId = customEvent.detail?.nodeId
      if (nodeId) handleDuplicateNode(nodeId)
    }

    const handleSetEdgeType = (e: Event) => {
      const customEvent = e as CustomEvent<{
        edgeId: string
        relationshipType: UmlRelationshipType
      }>
      const { edgeId, relationshipType } = customEvent.detail || {}
      if (!edgeId || !relationshipType) return

      pushSnapshot()
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === edgeId
            ? {
              ...edge,
              data: {
                ...edge.data,
                relationshipType,
              },
            }
            : edge
        )
      )
      setSelectedEdges((prev) =>
        prev.map((edge) =>
          edge.id === edgeId
            ? {
              ...edge,
              data: {
                ...edge.data,
                relationshipType,
              },
            }
            : edge
        )
      )
    }

    const handleCreateNextConnected = (e: Event) => {
      const customEvent = e as CustomEvent<{ nodeId: string }>
      const nodeId = customEvent.detail?.nodeId
      if (!nodeId) return
      const sNode = nodes.find((n) => n.id === nodeId)
      if (!sNode) return
      if (sNode.type === 'erEntity') {
        createConnectedElement(nodeId, 'erEntity', 'er')
        return
      }
      if (sNode.type === 'umlClass') {
        createConnectedElement(nodeId, 'umlClass', 'association')
        return
      }
      if (
        sNode.type === 'dfdProcess' ||
        sNode.type === 'dfdDataStore' ||
        sNode.type === 'dfdExternalEntity'
      ) {
        createConnectedElement(nodeId, 'dfdProcess', 'data_flow')
        return
      }
      const rel = sNode.type === 'actor' ? 'association' : 'include'
      createConnectedElement(nodeId, 'useCase', rel)
    }

    const handleFlip = (e: Event) => {
      const customEvent = e as CustomEvent<{ edgeId: string }>
      const edgeId = customEvent.detail?.edgeId
      if (!edgeId) return

      const swapEndpoints = (edge: Edge): Edge =>
        edge.id !== edgeId
          ? edge
          : {
            ...edge,
            source: edge.target,
            target: edge.source,
            sourceHandle: toSourceHandleId(edge.targetHandle),
            targetHandle: toTargetHandleId(edge.sourceHandle),
          }

      pushSnapshot()
      setEdges((eds) => eds.map(swapEndpoints))
      setSelectedEdges((prev) => prev.map(swapEndpoints))
    }

    const handleDelete = (e: Event) => {
      const customEvent = e as CustomEvent<{ edgeId: string }>
      const edgeId = customEvent.detail?.edgeId
      if (!edgeId) return

      pushSnapshot()
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId))
    }

    const handleReconnectEndpoint = (e: Event) => {
      const customEvent = e as CustomEvent<{
        edgeId: string
        end: 'source' | 'target'
        newNodeId: string
        newHandleId?: string | null
      }>
      const { edgeId, end, newNodeId, newHandleId } = customEvent.detail || {}
      if (!edgeId || !end || !newNodeId) return
      handleReconnectEdge(edgeId, end, newNodeId, newHandleId)
    }

    window.addEventListener('duplicate-node', handleDuplicateEvent)
    window.addEventListener('set-edge-type', handleSetEdgeType)
    window.addEventListener('create-next-connected', handleCreateNextConnected)
    window.addEventListener('flip-edge-direction', handleFlip)
    window.addEventListener('delete-edge', handleDelete)
    window.addEventListener('reconnect-edge-endpoint', handleReconnectEndpoint)

    return () => {
      window.removeEventListener('duplicate-node', handleDuplicateEvent)
      window.removeEventListener('set-edge-type', handleSetEdgeType)
      window.removeEventListener(
        'create-next-connected',
        handleCreateNextConnected
      )
      window.removeEventListener('flip-edge-direction', handleFlip)
      window.removeEventListener('delete-edge', handleDelete)
      window.removeEventListener(
        'reconnect-edge-endpoint',
        handleReconnectEndpoint
      )
    }
  }, [
    handleDuplicateNode,
    createConnectedElement,
    pushSnapshot,
    setEdges,
    edges,
    nodes,
    showValidationWarning,
  ])

  // Node deletion
  const handleDeleteNode = useCallback(
    (id: string) => {
      pushSnapshot()
      const idsToDelete = expandIdsWithBoundaryChildren(new Set([id]), nodes)
      setNodes((nds) => nds.filter((n) => !idsToDelete.has(n.id)))
      setEdges((eds) =>
        eds.filter(
          (e) => !idsToDelete.has(e.source) && !idsToDelete.has(e.target)
        )
      )
      setSelectedNodes((prev) => prev.filter((n) => !idsToDelete.has(n.id)))
    },
    [nodes, pushSnapshot, setNodes, setEdges]
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
      const swapEndpoints = (edge: Edge): Edge =>
        edge.id !== id
          ? edge
          : {
            ...edge,
            source: edge.target,
            target: edge.source,
            sourceHandle: toSourceHandleId(edge.targetHandle),
            targetHandle: toTargetHandleId(edge.sourceHandle),
          }

      pushSnapshot()
      setEdges((eds) => eds.map(swapEndpoints))
      setSelectedEdges((prev) => prev.map(swapEndpoints))
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
      setSelectedNodes((prev) =>
        prev.map((n) => {
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
    [pushSnapshot, reactFlowInstance, setNodes, setSelectedNodes]
  )

  // Update node position from Inspector
  const handleUpdateNodePosition = useCallback(
    (id: string, position: { x: number; y: number }) => {
      pushSnapshot()
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== id) return n
          return {
            ...n,
            position: {
              x: Math.round(position.x),
              y: Math.round(position.y),
            },
          }
        })
      )
      setSelectedNodes((prev) =>
        prev.map((n) => {
          if (n.id !== id) return n
          return {
            ...n,
            position: {
              x: Math.round(position.x),
              y: Math.round(position.y),
            },
          }
        })
      )
    },
    [pushSnapshot, setNodes, setSelectedNodes]
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
      setSelectedEdges((prev) =>
        prev.map((e) => {
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
    [edges, nodes, pushSnapshot, setEdges, setSelectedEdges, showValidationWarning]
  )

  // Template loader
  const applyTemplate = useCallback(
    (templateId: string) => {
      const template = DIAGRAM_TEMPLATES.find((t) => t.id === templateId)
      if (!template) return

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
    [pushSnapshot, reactFlowInstance, setNodes, setEdges]
  )

  const handleLoadTemplate = useCallback(
    (templateId: string) => {
      const template = DIAGRAM_TEMPLATES.find((t) => t.id === templateId)
      if (!template) return

      if (nodes.length > 0) {
        setConfirmDialog({
          title: 'Load template?',
          description: `Load "${template.name}"? This will replace your current canvas.`,
          confirmLabel: 'Load Template',
          variant: 'default',
          onConfirm: () => {
            setConfirmDialog(null)
            applyTemplate(templateId)
          },
        })
        return
      }

      applyTemplate(templateId)
    },
    [applyTemplate, nodes.length]
  )

  // Clear Canvas
  const handleClearCanvas = useCallback(() => {
    if (nodes.length === 0) return
    setConfirmDialog({
      title: 'Clear canvas?',
      description: 'Clear all nodes and connections from the diagram?',
      confirmLabel: 'Clear Canvas',
      variant: 'danger',
      onConfirm: () => {
        pushSnapshot()
        setTitle('Untitled Diagram')
        setNodes([])
        setEdges([])
        setSelectedNodes([])
        setSelectedEdges([])
        setConfirmDialog(null)
      },
    })
  }, [nodes.length, pushSnapshot, setNodes, setEdges])

  // Fit View
  const handleFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 350 })
  }, [reactFlowInstance])

  // Exports
  const handleExportPng = useCallback(async () => {
    if (!canvasRef.current) return
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    await exportDiagramAsPng(canvasRef.current, `${safeTitle}.png`)
  }, [title])

  const handleCopyPngClipboard = useCallback(async () => {
    if (!canvasRef.current) return false
    const ok = await copyDiagramAsPngToClipboard(canvasRef.current)
    if (ok) {
      showToast('Copied diagram image to clipboard')
    } else {
      showToast('Could not copy image to clipboard')
    }
    return ok
  }, [showToast])

  const handleExportSvg = useCallback(async () => {
    if (!canvasRef.current) return
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    await exportDiagramAsSvg(canvasRef.current, `${safeTitle}.svg`)
  }, [title])

  const handleExportPlantUml = useCallback(() => {
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const puml = generatePlantUml(title, nodes, edges)
    downloadTextFile(puml, `${safeTitle}.puml`)
    showToast('Exported PlantUML (.puml)')
  }, [title, nodes, edges, showToast])

  const handleCopyPlantUml = useCallback(async () => {
    try {
      const puml = generatePlantUml(title, nodes, edges)
      await navigator.clipboard.writeText(puml)
      showToast('Copied PlantUML to clipboard')
    } catch {
      showToast('Failed to copy PlantUML')
    }
  }, [title, nodes, edges, showToast])

  const handleExportMermaid = useCallback(() => {
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const mmd = generateMermaid(title, nodes, edges)
    downloadTextFile(mmd, `${safeTitle}.mmd`)
    showToast('Exported Mermaid (.mmd)')
  }, [title, nodes, edges, showToast])

  const handleCopyMermaid = useCallback(async () => {
    try {
      const mmd = generateMermaid(title, nodes, edges)
      await navigator.clipboard.writeText(mmd)
      showToast('Copied Mermaid to clipboard')
    } catch {
      showToast('Failed to copy Mermaid')
    }
  }, [title, nodes, edges, showToast])

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

  // Keyboard-first shortcuts (Item 3 & Item 7)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return
      }

      // Cmd/Ctrl + K -> Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen((prev) => !prev)
        return
      }

      // Cmd/Ctrl + Shift + C -> Copy PNG to Clipboard
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === 'c'
      ) {
        e.preventDefault()
        handleCopyPngClipboard()
        return
      }

      // Cmd/Ctrl + D -> Duplicate selected
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        if (selectedNodes.length === 1) {
          handleDuplicateNode(selectedNodes[0].id)
        } else if (selectedNodes.length > 1) {
          handleDuplicateSelected()
        }
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
        return
      }
      // Cmd/Ctrl + Y
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        handleRedo()
        return
      }
      // Cmd/Ctrl + C
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        handleCopy()
        return
      }
      // Cmd/Ctrl + V
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        handlePaste()
        return
      }
      // Cmd/Ctrl + A
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        setNodes((nds) => nds.map((n) => ({ ...n, selected: true })))
        setEdges((eds) => eds.map((e) => ({ ...e, selected: true })))
        return
      }

      // Don't trigger single-key shortcuts when modifiers are held
      if (e.metaKey || e.ctrlKey || e.altKey) return

      // ? -> Keyboard Shortcuts Overlay
      if (e.key === '?') {
        e.preventDefault()
        setIsShortcutsOpen((prev) => !prev)
        return
      }

      // Single-key instant element auto-drop: E, C, U, A, B, N
      const keyLower = e.key.toLowerCase()
      if (keyLower === 'e' && diagramType === 'er') {
        e.preventDefault()
        handleAddNode('erEntity')
        return
      }
      if (keyLower === 'c' && diagramType === 'class') {
        e.preventDefault()
        handleAddNode('umlClass')
        return
      }
      if (keyLower === 'p' && diagramType === 'dfd') {
        e.preventDefault()
        handleAddNode('dfdProcess')
        return
      }
      if (keyLower === 'd' && diagramType === 'dfd') {
        e.preventDefault()
        handleAddNode('dfdDataStore')
        return
      }
      if (keyLower === 'e' && diagramType === 'dfd') {
        e.preventDefault()
        handleAddNode('dfdExternalEntity')
        return
      }
      if (keyLower === 'u' && diagramType === 'use_case') {
        e.preventDefault()
        handleAddNode('useCase')
        return
      }
      if (keyLower === 'a' && diagramType === 'use_case') {
        e.preventDefault()
        handleAddNode('actor')
        return
      }
      if (keyLower === 'b') {
        e.preventDefault()
        handleAddNode('boundary')
        return
      }
      if (keyLower === 'n') {
        e.preventDefault()
        handleAddNode('note')
        return
      }

      // Enter -> Rename selected node inline
      if (e.key === 'Enter' && selectedNodes.length === 1) {
        e.preventDefault()
        window.dispatchEvent(
          new CustomEvent('start-node-edit', {
            detail: { nodeId: selectedNodes[0].id },
          })
        )
        return
      }

      // Tab -> Create & connect next element from selected node
      if (e.key === 'Tab' && selectedNodes.length === 1) {
        e.preventDefault()
        const sNode = selectedNodes[0]
        if (sNode.type === 'erEntity') {
          createConnectedElement(sNode.id, 'erEntity', 'er')
        } else if (sNode.type === 'umlClass') {
          createConnectedElement(sNode.id, 'umlClass', 'association')
        } else if (
          sNode.type === 'dfdProcess' ||
          sNode.type === 'dfdDataStore' ||
          sNode.type === 'dfdExternalEntity'
        ) {
          createConnectedElement(sNode.id, 'dfdProcess', 'data_flow')
        } else if (sNode.type !== 'boundary') {
          const rel = sNode.type === 'actor' ? 'association' : 'include'
          createConnectedElement(sNode.id, 'useCase', rel)
        }
        return
      }

      // Arrow keys -> Nudge selected elements (1px, or 10px with Shift)
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) &&
        selectedNodes.length > 0
      ) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const dx =
          e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0
        const dy =
          e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0

        pushSnapshot()
        const selIds = new Set(selectedNodes.map((n) => n.id))
        setNodes((nds) =>
          nds.map((n) =>
            selIds.has(n.id)
              ? {
                ...n,
                position: {
                  x: Math.round(n.position.x + dx),
                  y: Math.round(n.position.y + dy),
                },
              }
              : n
          )
        )
        return
      }

      // Escape -> close menus, deselect
      if (e.key === 'Escape') {
        setDropCreateMenu(null)
        setEdgeContextMenu(null)
        setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))
        setEdges((eds) => eds.map((e) => ({ ...e, selected: false })))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    selectedNodes,
    handleAddNode,
    handleUndo,
    handleRedo,
    handleCopy,
    handlePaste,
    handleDuplicateNode,
    handleDuplicateSelected,
    handleCopyPngClipboard,
    createConnectedElement,
    pushSnapshot,
    setNodes,
    setEdges,
  ])

  // Pane click: close any open floating context menus
  const onPaneClick = useCallback(() => {
    setDropCreateMenu(null)
    setEdgeContextMenu(null)
  }, [])

  // Double-click empty canvas -> immediately create a Use Case in inline edit mode (Item 3)
  const onCanvasDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (
        target.closest('.react-flow__node') ||
        target.closest('.react-flow__edge') ||
        target.closest('.react-flow__edgelabel-renderer') ||
        target.closest('.studio-bottom-dock') ||
        target.closest('.react-flow__controls')
      ) {
        return
      }

      const flowPos = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      handleAddNode('useCase', {
        position: { x: flowPos.x - 72, y: flowPos.y - 32 },
        autoFocusEdit: true,
      })
    },
    [reactFlowInstance, handleAddNode]
  )

  // Drag-from-palette onto canvas (Item 3)
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const rawType = event.dataTransfer.getData('application/umly-node-type')
      if (
        rawType !== 'actor' &&
        rawType !== 'useCase' &&
        rawType !== 'boundary' &&
        rawType !== 'note' &&
        rawType !== 'erEntity' &&
        rawType !== 'umlClass' &&
        rawType !== 'dfdProcess' &&
        rawType !== 'dfdDataStore' &&
        rawType !== 'dfdExternalEntity'
      ) {
        return
      }

      const flowPos = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      const offsetX =
        rawType === 'boundary'
          ? -220
          : rawType === 'erEntity' || rawType === 'umlClass'
            ? -115
            : rawType === 'dfdDataStore'
              ? -92
              : rawType === 'dfdProcess'
                ? -80
                : rawType === 'dfdExternalEntity' || rawType === 'useCase'
                  ? -74
                  : -45
      const offsetY =
        rawType === 'boundary'
          ? -190
          : rawType === 'erEntity'
            ? -70
            : rawType === 'umlClass'
              ? -80
              : rawType === 'dfdProcess'
                ? -42
                : rawType === 'dfdExternalEntity'
                  ? -34
                  : rawType === 'dfdDataStore'
                    ? -27
                    : rawType === 'useCase'
                      ? -32
                      : -50

      handleAddNode(rawType, {
        position: { x: flowPos.x + offsetX, y: flowPos.y + offsetY },
        autoFocusEdit: true,
      })
    },
    [reactFlowInstance, handleAddNode]
  )

  return (
    <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden bg-[var(--bg-primary)]">
      {/* Top Document Bar */}
      {puzzle?.customHeader ?? (
        <StudioToolbar
          title={title}
          onTitleChange={setTitle}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onClearCanvas={handleClearCanvas}
          onLoadTemplate={handleLoadTemplate}
          onExportPng={handleExportPng}
          onCopyImageToClipboard={handleCopyPngClipboard}
          onExportSvg={handleExportSvg}
          onExportPlantUml={handleExportPlantUml}
          onCopyPlantUml={handleCopyPlantUml}
          onExportMermaid={handleExportMermaid}
          onCopyMermaid={handleCopyMermaid}
          onExportJson={handleExportJson}
          isSaved={isSaved}
          snapshots={snapshots}
          onSaveSnapshot={handleSaveSnapshot}
          onRestoreSnapshot={handleRestoreSnapshot}
        />
      )}

      {/* Main Studio Workspace: Optional Left Sidebar + Canvas + Inspector */}
      <div className="flex-1 flex flex-col md:flex-row p-1.5 sm:p-2 gap-2 min-h-0 overflow-hidden h-full relative">
        {puzzle?.leftSidebar}
        {/* Canvas Area */}
        <div
          ref={canvasRef}
          onDoubleClick={onCanvasDoubleClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className="flex-1 h-full min-h-0 relative overflow-hidden bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-subtle)] shadow-xs"
        >

          {/* Subtle Action Toast */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                className="studio-bottom-dock absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] bg-[var(--bg-primary)] border border-[var(--border-default)] shadow-lg text-xs font-medium text-[var(--text-primary)]"
              >
                <Check className="w-3.5 h-3.5 text-[#448361]" />
                <span>{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* UML 2.5 Relationship Validation Toast Banner */}
          <AnimatePresence>
            {validationNotice && (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                className="studio-bottom-dock absolute top-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] sm:w-auto max-w-lg flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--notion-red-text)]/40 shadow-xl text-xs font-sans"
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
                        setValidationNotice(null)
                        pushSnapshot()
                        const newEdge: Edge = {
                          id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                          source: conn.source,
                          target: conn.target,
                          sourceHandle: conn.sourceHandle,
                          targetHandle: conn.targetHandle,
                          type: 'umlEdge',
                          selected: true,
                          data: {
                            relationshipType: suggested,
                            routingStyle: defaultRoutingStyle,
                          },
                        }
                        setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))
                        setSelectedNodes([])
                        setEdges((eds) => [
                          ...eds.map((ed) => ({ ...ed, selected: false })),
                          newEdge,
                        ])
                        setSelectedEdges([newEdge])

                        requestAnimationFrame(() => {
                          setNodes((nds) =>
                            nds.some((n) => n.selected)
                              ? nds.map((n) => ({ ...n, selected: false }))
                              : nds
                          )
                          setEdges((eds) =>
                            eds.map((ed) => ({
                              ...ed,
                              selected: ed.id === newEdge.id,
                            }))
                          )
                          setSelectedNodes([])
                          setSelectedEdges([newEdge])
                        })
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

          {/* Drop Connection on Empty Canvas: "Create Connected Element" Menu (Item 2) */}
          <AnimatePresence>
            {dropCreateMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 4 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: 'fixed',
                  left: Math.min(dropCreateMenu.clientX, window.innerWidth - 220),
                  top: Math.min(dropCreateMenu.clientY, window.innerHeight - 200),
                  zIndex: 100000,
                }}
                className="floating-context-menu studio-bottom-dock w-52 p-1.5 rounded-[9px] bg-[var(--bg-primary)] border border-[var(--border-default)] shadow-2xl text-xs font-sans"
              >
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] font-mono">
                  Connect to New...
                </div>
                {dropCreateMenu.sourceNodeType === 'erEntity' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        createConnectedElement(
                          dropCreateMenu.sourceNodeId,
                          'erEntity',
                          'er',
                          {
                            x: dropCreateMenu.flowX,
                            y: dropCreateMenu.flowY,
                          }
                        )
                        setDropCreateMenu(null)
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <Table2 className="w-3.5 h-3.5 text-[#2383e2]" />
                        <span>Entity</span>
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                        1 : N
                      </span>
                    </button>
                  </>
                ) : dropCreateMenu.sourceNodeType === 'umlClass' ? (
                  <>
                    {(
                      [
                        { rel: 'association', label: 'Class (Association)', badge: '──' },
                        { rel: 'generalization', label: 'Class (Inherits)', badge: '──▷' },
                        { rel: 'realization', label: 'Interface (Impl)', badge: '- -▷' },
                        { rel: 'aggregation', label: 'Class (Aggregation)', badge: '◇──' },
                        { rel: 'composition', label: 'Class (Composition)', badge: '◆──' },
                        { rel: 'dependency', label: 'Class (Dependency)', badge: '- - >' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.rel}
                        type="button"
                        onClick={() => {
                          createConnectedElement(
                            dropCreateMenu.sourceNodeId,
                            'umlClass',
                            opt.rel,
                            {
                              x: dropCreateMenu.flowX,
                              y: dropCreateMenu.flowY,
                            }
                          )
                          setDropCreateMenu(null)
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <Boxes className="w-3.5 h-3.5 text-[#2383e2]" />
                          <span>{opt.label}</span>
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                          {opt.badge}
                        </span>
                      </button>
                    ))}
                  </>
                ) : dropCreateMenu.sourceNodeType === 'dfdProcess' ||
                  dropCreateMenu.sourceNodeType === 'dfdDataStore' ||
                  dropCreateMenu.sourceNodeType === 'dfdExternalEntity' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        createConnectedElement(
                          dropCreateMenu.sourceNodeId,
                          'dfdProcess',
                          'data_flow',
                          {
                            x: dropCreateMenu.flowX,
                            y: dropCreateMenu.flowY,
                          }
                        )
                        setDropCreateMenu(null)
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <Cpu className="w-3.5 h-3.5 text-[#2383e2]" />
                        <span>Process</span>
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                        flow
                      </span>
                    </button>
                    {dropCreateMenu.sourceNodeType === 'dfdProcess' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            createConnectedElement(
                              dropCreateMenu.sourceNodeId,
                              'dfdDataStore',
                              'data_flow',
                              {
                                x: dropCreateMenu.flowX,
                                y: dropCreateMenu.flowY,
                              }
                            )
                            setDropCreateMenu(null)
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2 font-medium">
                            <HardDrive className="w-3.5 h-3.5 text-[#448361]" />
                            <span>Data Store</span>
                          </span>
                          <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                            flow
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            createConnectedElement(
                              dropCreateMenu.sourceNodeId,
                              'dfdExternalEntity',
                              'data_flow',
                              {
                                x: dropCreateMenu.flowX,
                                y: dropCreateMenu.flowY,
                              }
                            )
                            setDropCreateMenu(null)
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2 font-medium">
                            <SquareUser className="w-3.5 h-3.5 text-[#9065b0]" />
                            <span>External Entity</span>
                          </span>
                          <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                            flow
                          </span>
                        </button>
                      </>
                    )}
                  </>
                ) : dropCreateMenu.sourceNodeType === 'actor' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        createConnectedElement(
                          dropCreateMenu.sourceNodeId,
                          'useCase',
                          'association',
                          {
                            x: dropCreateMenu.flowX,
                            y: dropCreateMenu.flowY,
                          }
                        )
                        setDropCreateMenu(null)
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <CircleDot className="w-3.5 h-3.5 text-[#2383e2]" />
                        <span>Use Case</span>
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                        Association
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        createConnectedElement(
                          dropCreateMenu.sourceNodeId,
                          'actor',
                          'generalization',
                          {
                            x: dropCreateMenu.flowX,
                            y: dropCreateMenu.flowY,
                          }
                        )
                        setDropCreateMenu(null)
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <User className="w-3.5 h-3.5 text-[#9065b0]" />
                        <span>Parent Actor</span>
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                        Inherit —▷
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        createConnectedElement(
                          dropCreateMenu.sourceNodeId,
                          'useCase',
                          'include',
                          {
                            x: dropCreateMenu.flowX,
                            y: dropCreateMenu.flowY,
                          }
                        )
                        setDropCreateMenu(null)
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <CircleDot className="w-3.5 h-3.5 text-[#2383e2]" />
                        <span>Use Case</span>
                      </span>
                      <span className="text-[10px] font-mono text-[#2383e2]">
                        «include»
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        createConnectedElement(
                          dropCreateMenu.sourceNodeId,
                          'useCase',
                          'extend',
                          {
                            x: dropCreateMenu.flowX,
                            y: dropCreateMenu.flowY,
                          }
                        )
                        setDropCreateMenu(null)
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <CircleDot className="w-3.5 h-3.5 text-[#cb912f]" />
                        <span>Use Case</span>
                      </span>
                      <span className="text-[10px] font-mono text-[#cb912f]">
                        «extend»
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        createConnectedElement(
                          dropCreateMenu.sourceNodeId,
                          'actor',
                          'association',
                          {
                            x: dropCreateMenu.flowX,
                            y: dropCreateMenu.flowY,
                          }
                        )
                        setDropCreateMenu(null)
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <User className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                        <span>Actor</span>
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                        Association
                      </span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    createConnectedElement(
                      dropCreateMenu.sourceNodeId,
                      'note',
                      'association',
                      {
                        x: dropCreateMenu.flowX,
                        y: dropCreateMenu.flowY,
                      }
                    )
                    setDropCreateMenu(null)
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <StickyNote className="w-3.5 h-3.5 text-[#cb912f]" />
                    <span>Note</span>
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                    Link
                  </span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right-Click Edge Context Menu (Item 2) */}
          <AnimatePresence>
            {edgeContextMenu &&
              (() => {
                const targetEdge = edges.find(
                  (e) => e.id === edgeContextMenu.edgeId
                )
                if (!targetEdge) return null
                const sNode = nodes.find((n) => n.id === targetEdge.source)
                const tNode = nodes.find((n) => n.id === targetEdge.target)
                const allowed = getAllowedRelationshipTypes(
                  sNode?.type,
                  tNode?.type
                )
                const currentRel =
                  (targetEdge.data?.relationshipType as UmlRelationshipType) ||
                  'association'

                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    style={{
                      position: 'fixed',
                      left: Math.min(
                        edgeContextMenu.clientX,
                        window.innerWidth - 200
                      ),
                      top: Math.min(
                        edgeContextMenu.clientY,
                        window.innerHeight - 220
                      ),
                      zIndex: 100000,
                    }}
                    className="floating-context-menu studio-bottom-dock w-48 p-1.5 rounded-[9px] bg-[var(--bg-primary)] border border-[var(--border-default)] shadow-2xl text-xs font-sans"
                  >
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] font-mono">
                      Relationship Type
                    </div>
                    {(
                      [
                        { id: 'association', label: 'Association' },
                        { id: 'include', label: '«include»' },
                        { id: 'extend', label: '«extend»' },
                        { id: 'generalization', label: 'Generalization' },
                      ] as const
                    )
                      .filter(
                        (r) => allowed.length === 0 || allowed.includes(r.id)
                      )
                      .map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            handleUpdateEdgeData(targetEdge.id, {
                              relationshipType: r.id,
                            })
                            setEdgeContextMenu(null)
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer ${currentRel === r.id
                            ? 'bg-[var(--selection-bg)] text-[var(--primary-btn)] font-semibold'
                            : 'hover:bg-[var(--hover-bg)] text-[var(--text-primary)]'
                            }`}
                        >
                          <span>{r.label}</span>
                          {currentRel === r.id && (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                      ))}

                    <div className="h-px bg-[var(--border-subtle)] my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        handleFlipEdge(targetEdge.id)
                        setEdgeContextMenu(null)
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                      <span>Flip Direction</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteEdge(targetEdge.id)
                        setEdgeContextMenu(null)
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--notion-red-bg)] text-[var(--notion-red-text)] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Connection</span>
                    </button>
                  </motion.div>
                )
              })()}
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
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onReconnect={onReconnect}
            onPaneClick={onPaneClick}
            onEdgeContextMenu={onEdgeContextMenu}
            edgesReconnectable
            connectionLineType={
              defaultRoutingStyle === 'orthogonal'
                ? ConnectionLineType.SmoothStep
                : defaultRoutingStyle === 'bezier'
                  ? ConnectionLineType.Bezier
                  : ConnectionLineType.Straight
            }
            connectionLineStyle={{
              stroke: 'var(--primary-btn)',
              strokeWidth: 2,
            }}
            reconnectRadius={14}
            elevateEdgesOnSelect
            connectionMode={ConnectionMode.Loose}
            connectionRadius={28}
            onSelectionChange={onSelectionChange}
            selectionMode={SelectionMode.Partial}
            multiSelectionKeyCode={MULTI_SELECTION_KEY_CODES}
            selectionKeyCode="Shift"
            panActivationKeyCode="Space"
            zoomOnDoubleClick={false}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.25}
            maxZoom={2.4}
            deleteKeyCode={['Backspace', 'Delete']}
            proOptions={{ hideAttribution: true }}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Smart Alignment Guide Lines (On by Default, Hold Shift to Disable) */}
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
              className="text-[var(--text-tertiary)] opacity-45"
            />
            <Controls
              showInteractive={false}
              className="!mb-14 sm:!mb-0 !bg-[var(--bg-primary)] !border-[var(--border-default)] !rounded-xl !shadow-xs overflow-hidden"
            />
          </ReactFlow>

          {/* Direct-Manipulation Bottom Dock */}
          <StudioBottomDock
            diagramType={diagramType}
            onAddNode={(type) => handleAddNode(type)}
            onTidyLayout={handleTidyLayout}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
          />
        </div>

        {/* Right Properties Inspector */}
        {(() => {
          const activeNode =
            selectedNodes.length === 1
              ? nodes.find((n) => n.id === selectedNodes[0].id) || selectedNodes[0]
              : null
          const activeEdge =
            selectedEdges.length === 1
              ? edges.find((e) => e.id === selectedEdges[0].id) || selectedEdges[0]
              : null
          const selNodeIds = new Set(selectedNodes.map((n) => n.id))
          const currentNodes = nodes.filter((n) => selNodeIds.has(n.id) || n.selected)
          const selEdgeIds = new Set(selectedEdges.map((e) => e.id))
          const currentEdges = edges.filter((e) => selEdgeIds.has(e.id) || e.selected)

          return (
            <StudioInspector
              selectedNode={activeNode}
              selectedEdge={activeEdge}
              selectedNodes={currentNodes}
              selectedEdges={currentEdges}
              onUpdateNodeData={handleUpdateNodeData}
              onUpdateNodePosition={handleUpdateNodePosition}
              onUpdateEdgeData={handleUpdateEdgeData}
              onDeleteNode={handleDeleteNode}
              onDuplicateNode={handleDuplicateNode}
              onFlipEdgeDirection={handleFlipEdge}
              onReconnectEdge={handleReconnectEdge}
              onDeleteSelected={handleDeleteSelected}
              onDuplicateSelected={handleDuplicateSelected}
              onDeselectAll={handleDeselectAll}
              onAlignSelected={handleAlignSelected}
              defaultRoutingStyle={defaultRoutingStyle}
              onDefaultRoutingStyleChange={handleDefaultRoutingStyleChange}
              diagramTitle={title}
              diagramType={diagramType}
              allNodes={nodes}
              allEdges={edges}
              isOpen={isInspectorOpen}
              onToggleOpen={() => setIsInspectorOpen(!isInspectorOpen)}
            />
          )
        })()}
      </div>

      {/* Cmd+K Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={[
          ...(diagramType === 'er'
            ? [
              {
                id: 'add-entity',
                category: 'Create',
                label: 'New Entity Table',
                shortcut: 'E',
                icon: <Table2 className="w-3.5 h-3.5 text-[#2383e2]" />,
                onSelect: () => handleAddNode('erEntity'),
              },
              {
                id: 'add-boundary',
                category: 'Create',
                label: 'New Schema Group',
                shortcut: 'B',
                icon: <CircleDot className="w-3.5 h-3.5 text-[#9065b0]" />,
                onSelect: () => handleAddNode('boundary'),
              },
            ]
            : diagramType === 'class'
              ? [
                {
                  id: 'add-class',
                  category: 'Create',
                  label: 'New Class',
                  shortcut: 'C',
                  icon: <Boxes className="w-3.5 h-3.5 text-[#2383e2]" />,
                  onSelect: () => handleAddNode('umlClass'),
                },
                {
                  id: 'add-boundary',
                  category: 'Create',
                  label: 'New Package',
                  shortcut: 'B',
                  icon: <CircleDot className="w-3.5 h-3.5 text-[#9065b0]" />,
                  onSelect: () => handleAddNode('boundary'),
                },
              ]
              : diagramType === 'dfd'
                ? [
                  {
                    id: 'add-dfd-process',
                    category: 'Create',
                    label: 'New Process',
                    shortcut: 'P',
                    icon: <Cpu className="w-3.5 h-3.5 text-[#2383e2]" />,
                    onSelect: () => handleAddNode('dfdProcess'),
                  },
                  {
                    id: 'add-dfd-store',
                    category: 'Create',
                    label: 'New Data Store',
                    shortcut: 'D',
                    icon: <HardDrive className="w-3.5 h-3.5 text-[#448361]" />,
                    onSelect: () => handleAddNode('dfdDataStore'),
                  },
                  {
                    id: 'add-dfd-external',
                    category: 'Create',
                    label: 'New External Entity',
                    shortcut: 'E',
                    icon: <SquareUser className="w-3.5 h-3.5 text-[#9065b0]" />,
                    onSelect: () => handleAddNode('dfdExternalEntity'),
                  },
                ]
                : [
                  {
                    id: 'add-usecase',
                    category: 'Create',
                    label: 'New Use Case',
                    shortcut: 'U',
                    icon: <CircleDot className="w-3.5 h-3.5 text-[#2383e2]" />,
                    onSelect: () => handleAddNode('useCase'),
                  },
                  {
                    id: 'add-actor',
                    category: 'Create',
                    label: 'New Actor',
                    shortcut: 'A',
                    icon: <User className="w-3.5 h-3.5 text-[var(--primary-btn)]" />,
                    onSelect: () => handleAddNode('actor'),
                  },
                  {
                    id: 'add-boundary',
                    category: 'Create',
                    label: 'New System Boundary',
                    shortcut: 'B',
                    icon: <CircleDot className="w-3.5 h-3.5 text-[#9065b0]" />,
                    onSelect: () => handleAddNode('boundary'),
                  },
                ]),
          {
            id: 'add-note',
            category: 'Create',
            label: 'New Note / Constraint',
            shortcut: 'N',
            icon: <StickyNote className="w-3.5 h-3.5 text-[#cb912f]" />,
            onSelect: () => handleAddNode('note'),
          },
          {
            id: 'tidy-layout',
            category: 'Layout & Routing',
            label: 'Tidy Up Layout (Auto-Arrange)',
            icon: <Check className="w-3.5 h-3.5 text-[#448361]" />,
            onSelect: handleTidyLayout,
          },
          {
            id: 'route-straight',
            category: 'Layout & Routing',
            label: 'Set Edge Routing: Straight Lines',
            icon: <ArrowLeftRight className="w-3.5 h-3.5" />,
            onSelect: () => handleDefaultRoutingStyleChange('straight'),
          },
          {
            id: 'route-orthogonal',
            category: 'Layout & Routing',
            label: 'Set Edge Routing: Orthogonal Step',
            icon: <ArrowLeftRight className="w-3.5 h-3.5" />,
            onSelect: () => handleDefaultRoutingStyleChange('orthogonal'),
          },
          {
            id: 'fit-view',
            category: 'Canvas',
            label: 'Fit Diagram to Screen',
            icon: <CircleDot className="w-3.5 h-3.5" />,
            onSelect: handleFitView,
          },
          {
            id: 'copy-image',
            category: 'Export & Share',
            label: 'Copy Diagram as PNG to Clipboard',
            shortcut: '⌘⇧C',
            icon: <Check className="w-3.5 h-3.5" />,
            onSelect: () => {
              handleCopyPngClipboard()
            },
          },
          {
            id: 'export-png',
            category: 'Export & Share',
            label: 'Export PNG Image',
            icon: <Check className="w-3.5 h-3.5" />,
            onSelect: () => {
              handleExportPng()
            },
          },
          {
            id: 'export-svg',
            category: 'Export & Share',
            label: 'Export SVG Vector',
            icon: <Check className="w-3.5 h-3.5" />,
            onSelect: () => {
              handleExportSvg()
            },
          },
          {
            id: 'copy-puml',
            category: 'Export & Share',
            label: 'Copy PlantUML to Clipboard',
            icon: <Check className="w-3.5 h-3.5" />,
            onSelect: handleCopyPlantUml,
          },
          {
            id: 'export-puml',
            category: 'Export & Share',
            label: 'Export PlantUML (.puml)',
            icon: <Check className="w-3.5 h-3.5" />,
            onSelect: handleExportPlantUml,
          },
          {
            id: 'copy-mermaid',
            category: 'Export & Share',
            label: 'Copy Mermaid to Clipboard',
            icon: <Check className="w-3.5 h-3.5" />,
            onSelect: handleCopyMermaid,
          },
          {
            id: 'export-mermaid',
            category: 'Export & Share',
            label: 'Export Mermaid (.mmd)',
            icon: <Check className="w-3.5 h-3.5" />,
            onSelect: handleExportMermaid,
          },
          {
            id: 'save-snapshot',
            category: 'History',
            label: 'Save Version Snapshot',
            icon: <Check className="w-3.5 h-3.5" />,
            onSelect: () => handleSaveSnapshot('Manual Checkpoint'),
          },
          {
            id: 'undo',
            category: 'History',
            label: 'Undo',
            shortcut: '⌘Z',
            icon: <ArrowLeftRight className="w-3.5 h-3.5" />,
            onSelect: handleUndo,
          },
          {
            id: 'redo',
            category: 'History',
            label: 'Redo',
            shortcut: '⌘⇧Z',
            icon: <ArrowLeftRight className="w-3.5 h-3.5" />,
            onSelect: handleRedo,
          },
          {
            id: 'shortcuts',
            category: 'Help',
            label: 'Show Keyboard Shortcuts',
            shortcut: '?',
            icon: <AlertCircle className="w-3.5 h-3.5" />,
            onSelect: () => setIsShortcutsOpen(true),
          },
          {
            id: 'clear-canvas',
            category: 'Danger Zone',
            label: 'Clear Entire Canvas',
            icon: <Trash2 className="w-3.5 h-3.5 text-[var(--notion-red-text)]" />,
            onSelect: handleClearCanvas,
          },
        ]}
      />

      {/* ? Keyboard Shortcuts Overlay Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <ConfirmDialog
        isOpen={confirmDialog !== null}
        title={confirmDialog?.title ?? ''}
        description={confirmDialog?.description ?? ''}
        confirmLabel={confirmDialog?.confirmLabel}
        variant={confirmDialog?.variant}
        onConfirm={() => confirmDialog?.onConfirm()}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  )
}

export function StudioCanvas({ diagramId, puzzle }: StudioCanvasProps) {
  return (
    <ReactFlowProvider>
      <StudioCanvasInner diagramId={diagramId} puzzle={puzzle} />
    </ReactFlowProvider>
  )
}
