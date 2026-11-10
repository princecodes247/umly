import { memo, useState, useRef, useEffect, useMemo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  Position,
  getStraightPath,
  getBezierPath,
  useNodes,
  useEdges,
  useReactFlow,
  useViewport,
  type EdgeProps,
} from '@xyflow/react'
import { motion, AnimatePresence } from 'motion/react'
import { Trash2, ArrowLeftRight, RotateCcw } from 'lucide-react'
import { getAllowedRelationshipTypes } from '../../../lib/umlValidation'
import {
  getFloatingEdgeParams,
  getBorderIntersectionPoint,
  getNodeBox,
  getNodeHandles,
  parseHandlePosition,
} from '../../../lib/floatingEdges'
import {
  getOrthogonalPoints,
  getOrthogonalSegments,
  pointsToSmoothSvgPath,
  prepareDragTopology,
  applySegmentDrag,
  simplifyPoints,
} from '../../../lib/orthogonalRouting'
import {
  getCurvePoints,
  getCurveSegments,
  pointsToSmoothCurve,
  prepareCurveDragTopology,
  applyCurveDrag,
  simplifyCurvePoints,
} from '../../../lib/curveRouting'
import type { UmlEdgeData, UmlRelationshipType } from '../../../types/game'

interface UmlEdgeProps extends EdgeProps {
  data?: UmlEdgeData
}

export const UmlEdge = memo(
  ({
    id,
    source,
    target,
    sourceHandleId,
    targetHandleId,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
  }: UmlEdgeProps) => {
    const nodes = useNodes()
    const edges = useEdges()
    const { setEdges, setNodes, screenToFlowPosition } = useReactFlow()
    const { zoom } = useViewport()

    const [isHovered, setIsHovered] = useState(false)
    const [draggingEnd, setDraggingEnd] = useState<{
      end: 'source' | 'target'
      x: number
      y: number
      hoveredNodeId: string | null
      hoveredHandleId: string | null
    } | null>(null)
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleMouseEnter = () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
      setIsHovered(true)
    }

    const handleMouseLeave = () => {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false)
      }, 150)
    }

    useEffect(() => {
      return () => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current)
        }
      }
    }, [])

    const sourceNode = useMemo(
      () => nodes.find((n) => n.id === source),
      [nodes, source]
    )
    const targetNode = useMemo(
      () => nodes.find((n) => n.id === target),
      [nodes, target]
    )

    // Parallel offset if multiple edges connect the same two nodes
    const parallelOffset = useMemo(() => {
      const pairEdges = edges.filter(
        (e) =>
          (e.source === source && e.target === target) ||
          (e.source === target && e.target === source)
      )
      if (pairEdges.length <= 1) return 0
      const idx = pairEdges.findIndex((e) => e.id === id)
      return (idx - (pairEdges.length - 1) / 2) * 18
    }, [edges, source, target, id])

    const routingStyle = data?.routingStyle || 'straight'
    const rawWaypoints = data?.waypoints
    const orthogonalOffset = data?.orthogonalOffset
    const curveOffset = data?.curveOffset
    const hasManualOverride =
      (routingStyle === 'orthogonal' &&
        ((rawWaypoints && rawWaypoints.length > 0) ||
          orthogonalOffset !== undefined)) ||
      (routingStyle === 'bezier' &&
        ((rawWaypoints && rawWaypoints.length > 0) ||
          curveOffset !== undefined))

    // Track established handle positions and node positions to prevent disorienting auto-shifting
    const establishedSourcePosRef = useRef<Position | null>(null)
    const establishedTargetPosRef = useRef<Position | null>(null)
    const prevSourcePosRef = useRef<{ x: number; y: number } | null>(null)
    const prevTargetPosRef = useRef<{ x: number; y: number } | null>(null)

    // Compute floating border intersection coordinates so lines connect to the nearest border point
    const { sx, sy, tx, ty, sourcePos, targetPos } = useMemo(() => {
      if (draggingEnd && sourceNode && targetNode) {
        const hoveredNode = draggingEnd.hoveredNodeId
          ? nodes.find((n) => n.id === draggingEnd.hoveredNodeId)
          : null

        if (draggingEnd.end === 'source') {
          if (hoveredNode && hoveredNode.id !== target) {
            return getFloatingEdgeParams(
              hoveredNode,
              targetNode,
              0,
              draggingEnd.hoveredHandleId,
              targetHandleId || establishedTargetPosRef.current,
              rawWaypoints,
              establishedTargetPosRef.current,
              null
            )
          }
          const tPosToUse =
            parseHandlePosition(targetHandleId) ||
            establishedTargetPosRef.current
          const tHandles = getNodeHandles(targetNode)
          const tInt =
            tPosToUse && tHandles[tPosToUse]
              ? tHandles[tPosToUse]
              : getBorderIntersectionPoint(targetNode, {
                  x: draggingEnd.x,
                  y: draggingEnd.y,
                })
          return {
            sx: draggingEnd.x,
            sy: draggingEnd.y,
            tx: tInt.x,
            ty: tInt.y,
            sourcePos: sourcePosition,
            targetPos: tInt.position,
          }
        } else {
          if (hoveredNode && hoveredNode.id !== source) {
            return getFloatingEdgeParams(
              sourceNode,
              hoveredNode,
              0,
              sourceHandleId || establishedSourcePosRef.current,
              draggingEnd.hoveredHandleId,
              rawWaypoints,
              null,
              establishedSourcePosRef.current
            )
          }
          const sPosToUse =
            parseHandlePosition(sourceHandleId) ||
            establishedSourcePosRef.current
          const sHandles = getNodeHandles(sourceNode)
          const sInt =
            sPosToUse && sHandles[sPosToUse]
              ? sHandles[sPosToUse]
              : getBorderIntersectionPoint(sourceNode, {
                  x: draggingEnd.x,
                  y: draggingEnd.y,
                })
          return {
            sx: sInt.x,
            sy: sInt.y,
            tx: draggingEnd.x,
            ty: draggingEnd.y,
            sourcePos: sInt.position,
            targetPos: targetPosition,
          }
        }
      }

      if (sourceNode && targetNode) {
        const sCur = sourceNode.position
        const tCur = targetNode.position
        const prevS = prevSourcePosRef.current
        const prevT = prevTargetPosRef.current

        const sMoved = Boolean(
          prevS &&
            (Math.abs(prevS.x - sCur.x) > 0.5 ||
              Math.abs(prevS.y - sCur.y) > 0.5)
        )
        const tMoved = Boolean(
          prevT &&
            (Math.abs(prevT.x - tCur.x) > 0.5 ||
              Math.abs(prevT.y - tCur.y) > 0.5)
        )

        const isSourceShifting =
          Boolean(sourceNode.dragging) || (sMoved && !tMoved)
        const isTargetShifting =
          Boolean(targetNode.dragging) || (tMoved && !sMoved)

        let lockedTargetPos: Position | null = null
        let lockedSourcePos: Position | null = null

        if (isSourceShifting && !isTargetShifting) {
          // Source is shifting: pin the other end (target) so it never auto-shifts
          lockedTargetPos = establishedTargetPosRef.current
        } else if (isTargetShifting && !isSourceShifting) {
          // Target is shifting: pin the other end (source) so it never auto-shifts
          lockedSourcePos = establishedSourcePosRef.current
        } else if (
          establishedTargetPosRef.current &&
          establishedSourcePosRef.current
        ) {
          // Idle or both moving together: keep established handles locked
          lockedTargetPos = establishedTargetPosRef.current
          lockedSourcePos = establishedSourcePosRef.current
        }

        const params = getFloatingEdgeParams(
          sourceNode,
          targetNode,
          parallelOffset,
          sourceHandleId,
          targetHandleId,
          rawWaypoints,
          lockedTargetPos,
          lockedSourcePos
        )

        establishedSourcePosRef.current = params.sourcePos
        establishedTargetPosRef.current = params.targetPos
        prevSourcePosRef.current = { x: sCur.x, y: sCur.y }
        prevTargetPosRef.current = { x: tCur.x, y: tCur.y }

        return params
      }

      return {
        sx: sourceX,
        sy: sourceY,
        tx: targetX,
        ty: targetY,
        sourcePos: sourcePosition,
        targetPos: targetPosition,
      }
    }, [
      draggingEnd,
      nodes,
      source,
      target,
      sourceHandleId,
      targetHandleId,
      sourceNode,
      targetNode,
      parallelOffset,
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      rawWaypoints,
    ])

    // Compute full curve points & segments
    const curvePoints = useMemo(() => {
      if (routingStyle !== 'bezier') return []
      return getCurvePoints(
        { x: sx, y: sy },
        { x: tx, y: ty },
        rawWaypoints,
        curveOffset
      )
    }, [routingStyle, sx, sy, tx, ty, rawWaypoints, curveOffset])

    const curveSegments = useMemo(() => {
      if (routingStyle !== 'bezier' || curvePoints.length < 2) return []
      return getCurveSegments(curvePoints)
    }, [routingStyle, curvePoints])

    // Compute full orthogonal polyline points
    const orthogonalPoints = useMemo(() => {
      if (routingStyle !== 'orthogonal') return []
      return getOrthogonalPoints(
        { x: sx, y: sy },
        { x: tx, y: ty },
        sourcePos,
        targetPos,
        rawWaypoints,
        orthogonalOffset
      )
    }, [
      routingStyle,
      sx,
      sy,
      tx,
      ty,
      sourcePos,
      targetPos,
      rawWaypoints,
      orthogonalOffset,
    ])

    const orthogonalSegments = useMemo(() => {
      if (routingStyle !== 'orthogonal' || orthogonalPoints.length < 2) return []
      return getOrthogonalSegments(orthogonalPoints)
    }, [routingStyle, orthogonalPoints])

    const [edgePath, labelX, labelY, guideLinePath] = useMemo(() => {
      const getPolylineMidpoint = (
        segs: Array<{
          start: { x: number; y: number }
          end: { x: number; y: number }
          length: number
        }>
      ) => {
        if (segs.length === 0) return null
        const total = segs.reduce((acc, s) => acc + s.length, 0)
        if (total === 0) return segs[0].start
        let rem = total / 2
        for (let i = 0; i < segs.length; i++) {
          const s = segs[i]
          if (rem <= s.length || i === segs.length - 1) {
            const t = s.length > 0 ? Math.max(0, Math.min(1, rem / s.length)) : 0.5
            return {
              x: s.start.x + (s.end.x - s.start.x) * t,
              y: s.start.y + (s.end.y - s.start.y) * t,
            }
          }
          rem -= s.length
        }
        return segs[0].start
      }

      if (routingStyle === 'orthogonal') {
        const path = pointsToSmoothSvgPath(orthogonalPoints, 8)
        const mid = getPolylineMidpoint(orthogonalSegments)
        const lx = mid ? mid.x : (sx + tx) / 2
        const ly = mid ? mid.y : (sy + ty) / 2
        return [path, lx, ly, null]
      }
      if (routingStyle === 'bezier') {
        if (curvePoints.length > 2) {
          const path = pointsToSmoothCurve(curvePoints, sourcePos, targetPos)
          const guide = curvePoints
            .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
            .join(' ')
          const mid = getPolylineMidpoint(curveSegments)
          const midIdx = Math.floor(curvePoints.length / 2)
          const lx = mid ? mid.x : curvePoints[midIdx].x
          const ly = mid ? mid.y : curvePoints[midIdx].y
          return [path, lx, ly, guide]
        }
        const [path, lx, ly] = getBezierPath({
          sourceX: sx,
          sourceY: sy,
          sourcePosition: sourcePos,
          targetX: tx,
          targetY: ty,
          targetPosition: targetPos,
        })
        return [path, lx, ly, null]
      }
      const [path, lx, ly] = getStraightPath({
        sourceX: sx,
        sourceY: sy,
        targetX: tx,
        targetY: ty,
      })
      return [path, lx, ly, null]
    }, [
      routingStyle,
      sx,
      sy,
      tx,
      ty,
      sourcePos,
      targetPos,
      orthogonalPoints,
      orthogonalSegments,
      curvePoints,
      curveSegments,
    ])

    const allowedTypes = useMemo(
      () => getAllowedRelationshipTypes(sourceNode?.type, targetNode?.type),
      [sourceNode?.type, targetNode?.type]
    )

    const relationshipType: UmlRelationshipType =
      data?.relationshipType || 'association'
    const condition = data?.condition

    // Determine styles based on UML 2.5 / ER relationship
    let strokeDasharray = 'none'
    let markerStart = ''
    let markerEnd = ''
    let stereotypeText = ''
    let subText = ''
    let textColor = 'var(--text-secondary)'

    const erSourceCard = data?.erSourceCardinality || 'one_only'
    const erTargetCard = data?.erTargetCardinality || 'zero_or_many'
    const erIdentifying = Boolean(data?.erIdentifying)

    switch (relationshipType) {
      case 'include':
        strokeDasharray = '6,4'
        markerEnd = 'url(#uml-arrowhead)'
        stereotypeText = '«include»'
        textColor = 'var(--notion-blue-text)'
        break
      case 'extend':
        strokeDasharray = '6,4'
        markerEnd = 'url(#uml-arrowhead)'
        stereotypeText = '«extend»'
        subText = condition ? `[${condition}]` : ''
        textColor = 'var(--notion-yellow-text)'
        break
      case 'generalization':
        strokeDasharray = 'none'
        markerEnd = 'url(#uml-generalization)'
        stereotypeText = data?.label || ''
        textColor = 'var(--notion-green-text)'
        break
      case 'realization':
        strokeDasharray = '6,4'
        markerEnd = 'url(#uml-generalization)'
        stereotypeText = data?.label || ''
        textColor = 'var(--notion-purple-text)'
        break
      case 'aggregation':
        strokeDasharray = 'none'
        markerEnd = 'url(#uml-aggregation)'
        stereotypeText = data?.label || ''
        textColor = 'var(--text-primary)'
        break
      case 'composition':
        strokeDasharray = 'none'
        markerEnd = 'url(#uml-composition)'
        stereotypeText = data?.label || ''
        textColor = 'var(--text-primary)'
        break
      case 'dependency':
        strokeDasharray = '6,4'
        markerEnd = 'url(#uml-arrowhead)'
        stereotypeText = data?.label || ''
        textColor = 'var(--notion-blue-text)'
        break
      case 'er':
        strokeDasharray = erIdentifying ? 'none' : '5,4'
        markerStart = `url(#er-${erSourceCard.replace(/_/g, '-')})`
        markerEnd = `url(#er-${erTargetCard.replace(/_/g, '-')})`
        stereotypeText = data?.label || ''
        textColor = 'var(--text-primary)'
        break
      case 'data_flow':
        strokeDasharray = 'none'
        markerEnd = 'url(#dfd-arrow)'
        stereotypeText = data?.label || ''
        textColor = 'var(--text-primary)'
        break
      case 'association':
      default:
        strokeDasharray = 'none'
        markerEnd = ''
        stereotypeText = data?.label || ''
        textColor = 'var(--text-secondary)'
        break
    }

    const strokeColor = selected
      ? 'var(--primary-btn)'
      : isHovered
        ? 'var(--primary-btn)'
        : relationshipType === 'include' || relationshipType === 'dependency'
          ? 'var(--notion-blue-text)'
          : relationshipType === 'extend'
            ? 'var(--notion-yellow-text)'
            : relationshipType === 'generalization'
              ? 'var(--notion-green-text)'
              : relationshipType === 'realization'
                ? 'var(--notion-purple-text)'
                : 'var(--text-secondary)'

    // Stagger along the line segment if another edge midpoint or node overlaps the exact center
    const { resolvedX, resolvedY } = useMemo(() => {
      const pointAt = (t: number) => ({
        x: sx + (tx - sx) * t,
        y: sy + (ty - sy) * t,
      })

      if (routingStyle !== 'straight') {
        return { resolvedX: labelX, resolvedY: labelY }
      }

      const solidNodes = nodes.filter(
        (n) =>
          n.type !== 'boundary' &&
          !n.hidden &&
          n.id !== source &&
          n.id !== target
      )
      const nodeRects = solidNodes.map((n) => {
        const w =
          n.measured?.width ??
          (n.type === 'actor' ? 88 : n.type === 'useCase' ? 148 : 150)
        const h =
          n.measured?.height ??
          (n.type === 'actor' ? 108 : n.type === 'useCase' ? 64 : 76)
        return {
          left: n.position.x,
          right: n.position.x + w,
          top: n.position.y,
          bottom: n.position.y + h,
        }
      })

      const myIndex = edges.findIndex((e) => e.id === id)
      const earlierMidpoints: Array<{ x: number; y: number }> = []
      if (myIndex > 0) {
        const nodeMap = new Map(nodes.map((n) => [n.id, n]))
        for (let i = 0; i < myIndex; i++) {
          const other = edges[i]
          const sN = nodeMap.get(other.source)
          const tN = nodeMap.get(other.target)
          if (sN && tN) {
            const fp = getFloatingEdgeParams(sN, tN, 0)
            earlierMidpoints.push({
              x: (fp.sx + fp.tx) / 2,
              y: (fp.sy + fp.ty) / 2,
            })
          }
        }
      }

      const collidesWithNode = (px: number, py: number) =>
        nodeRects.some(
          (r) =>
            px + 32 > r.left &&
            px - 32 < r.right &&
            py + 12 > r.top &&
            py - 12 < r.bottom
        )

      const collidesWithEdge = (px: number, py: number) =>
        earlierMidpoints.some(
          (m) => Math.abs(px - m.x) < 58 && Math.abs(py - m.y) < 18
        )

      const tCandidates = [0.5, 0.38, 0.62, 0.3, 0.7, 0.44, 0.56]
      for (const t of tCandidates) {
        const pt = pointAt(t)
        if (!collidesWithNode(pt.x, pt.y) && !collidesWithEdge(pt.x, pt.y)) {
          return { resolvedX: pt.x, resolvedY: pt.y }
        }
      }

      return { resolvedX: labelX, resolvedY: labelY }
    }, [
      routingStyle,
      sx,
      sy,
      tx,
      ty,
      labelX,
      labelY,
      nodes,
      edges,
      id,
      source,
      target,
    ])

    const [activeDragSegIndex, setActiveDragSegIndex] = useState<number | null>(
      null
    )
    const [hoveredSegIndex, setHoveredSegIndex] = useState<number | null>(null)
    const [isDraggingAdjustment, setIsDraggingAdjustment] = useState(false)

    const [activeDragCurve, setActiveDragCurve] = useState<{
      type: 'curve-waypoint' | 'curve-segment'
      index: number
    } | null>(null)

    const showActions = Boolean(
      (selected || isHovered) && !isDraggingAdjustment && !draggingEnd
    )
    const hasVisibleLabel = Boolean(stereotypeText)

    const selectThisEdge = (e: React.MouseEvent) => {
      e.stopPropagation()
      setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          selected: edge.id === id,
        }))
      )
    }

    const handleSetType = (newType: UmlRelationshipType) => {
      window.dispatchEvent(
        new CustomEvent('set-edge-type', {
          detail: { edgeId: id, relationshipType: newType },
        })
      )
    }

    // Interactive adjustment handles for each segment or curve bend point
    const handles = useMemo(() => {
      if (!selected) return []
      if (routingStyle === 'orthogonal') {
        return orthogonalSegments
          .filter((s) => s.length >= 14)
          .map((s) => ({
            id: `seg-${s.index}`,
            segIndex: s.index,
            x: s.mid.x,
            y: s.mid.y,
            cursor: s.isHorizontal ? 'ns-resize' : 'ew-resize',
            title: s.isHorizontal
              ? 'Drag to slide segment up/down (Shift for smooth) · Double-click to reset'
              : 'Drag to slide segment left/right (Shift for smooth) · Double-click to reset',
            type: 'orthogonal' as const,
          }))
      }
      if (routingStyle === 'bezier') {
        const result = []
        // Waypoint handles (actual bend vertices)
        for (let i = 1; i < curvePoints.length - 1; i++) {
          const pt = curvePoints[i]
          result.push({
            id: `curve-wp-${i}`,
            segIndex: i,
            x: pt.x,
            y: pt.y,
            cursor: isDraggingAdjustment ? 'grabbing' : 'grab',
            title:
              'Drag bend point (Shift for smooth) · Double-click to remove',
            type: 'curve-waypoint' as const,
          })
        }
        // Segment handles (midpoints between vertices to pull out new bends)
        for (const seg of curveSegments) {
          if (seg.length >= 18) {
            result.push({
              id: `curve-seg-${seg.index}`,
              segIndex: seg.index,
              x: seg.mid.x,
              y: seg.mid.y,
              cursor: isDraggingAdjustment ? 'grabbing' : 'grab',
              title:
                'Drag to pull out a new curve bend (Shift for smooth)',
              type: 'curve-segment' as const,
            })
          }
        }
        return result
      }
      return []
    }, [
      selected,
      routingStyle,
      orthogonalSegments,
      curvePoints,
      curveSegments,
      isDraggingAdjustment,
    ])

    const handleStartSegmentDrag = (
      segIndex: number,
      e: React.PointerEvent
    ) => {
      e.stopPropagation()
      e.preventDefault()
      setActiveDragSegIndex(segIndex)
      setIsDraggingAdjustment(true)

      // Initialize stable baseline topology once at drag start (prevents back-and-forth topology oscillation/jitter)
      const { points: baselinePoints, activeSegIndex } = prepareDragTopology(
        orthogonalPoints,
        segIndex,
        sourcePos,
        targetPos
      )

      let lastAppliedPoints = baselinePoints

      const seg = orthogonalSegments.find((s) => s.index === segIndex)
      const isH = seg ? seg.isHorizontal : false
      const activeCursor = isH ? 'ns-resize' : 'ew-resize'
      document.body.style.cursor = activeCursor

      let rafId: number | null = null
      let latestEvent: PointerEvent | null = null

      const processDrag = () => {
        rafId = null
        if (!latestEvent) return
        const flowPos = screenToFlowPosition({
          x: latestEvent.clientX,
          y: latestEvent.clientY,
        })
        const isShift = latestEvent.shiftKey
        const rawTarget = isH ? flowPos.y : flowPos.x

        const newPts = applySegmentDrag(
          baselinePoints,
          activeSegIndex,
          rawTarget,
          isShift
        )

        lastAppliedPoints = newPts

        const nextWaypoints = newPts.slice(1, -1)
        setEdges((eds) =>
          eds.map((edge) =>
            edge.id === id
              ? {
                  ...edge,
                  data: {
                    ...edge.data,
                    waypoints: nextWaypoints,
                    orthogonalOffset: undefined,
                  },
                }
              : edge
          )
        )
      }

      const onPointerMove = (moveEvt: PointerEvent) => {
        moveEvt.preventDefault()
        latestEvent = moveEvt
        if (rafId === null) {
          rafId = requestAnimationFrame(processDrag)
        }
      }

      const onPointerUp = () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId)
          rafId = null
        }
        setActiveDragSegIndex(null)
        setIsDraggingAdjustment(false)
        document.body.style.cursor = ''
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)

        // Simplify redundant colinear points & merge aligned segments on release
        const simplifiedWaypoints = simplifyPoints(lastAppliedPoints).slice(1, -1)
        setEdges((eds) =>
          eds.map((edge) =>
            edge.id === id
              ? {
                  ...edge,
                  data: {
                    ...edge.data,
                    waypoints: simplifiedWaypoints,
                  },
                }
              : edge
          )
        )
      }

      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
    }

    const handleStartCurveDrag = (
      targetType: 'curve-waypoint' | 'curve-segment',
      index: number,
      e: React.PointerEvent
    ) => {
      e.stopPropagation()
      e.preventDefault()
      setActiveDragCurve({ type: targetType, index })
      setIsDraggingAdjustment(true)
      document.body.style.cursor = 'grabbing'

      const clickFlowPos = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      })

      const { points: baselinePoints, activePointIndex } =
        prepareCurveDragTopology(
          curvePoints,
          targetType === 'curve-waypoint' ? 'waypoint' : 'segment',
          index,
          clickFlowPos
        )

      let lastAppliedPoints = baselinePoints
      let rafId: number | null = null
      let latestEvent: PointerEvent | null = null

      const processCurveDrag = () => {
        rafId = null
        if (!latestEvent) return
        const flowPos = screenToFlowPosition({
          x: latestEvent.clientX,
          y: latestEvent.clientY,
        })
        const isShift = latestEvent.shiftKey

        const newPts = applyCurveDrag(
          baselinePoints,
          activePointIndex,
          flowPos,
          isShift
        )

        lastAppliedPoints = newPts

        const nextWaypoints = newPts.slice(1, -1)
        setEdges((eds) =>
          eds.map((edge) =>
            edge.id === id
              ? {
                  ...edge,
                  data: {
                    ...edge.data,
                    waypoints: nextWaypoints,
                    curveOffset: undefined,
                  },
                }
              : edge
          )
        )
      }

      const onPointerMove = (moveEvt: PointerEvent) => {
        moveEvt.preventDefault()
        latestEvent = moveEvt
        if (rafId === null) {
          rafId = requestAnimationFrame(processCurveDrag)
        }
      }

      const onPointerUp = () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId)
          rafId = null
        }
        setActiveDragCurve(null)
        setIsDraggingAdjustment(false)
        document.body.style.cursor = ''
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)

        // Simplify colinear curve points & merge back to chord
        const simplifiedWaypoints = simplifyCurvePoints(
          lastAppliedPoints
        ).slice(1, -1)

        setEdges((eds) =>
          eds.map((edge) =>
            edge.id === id
              ? {
                  ...edge,
                  data: {
                    ...edge.data,
                    waypoints:
                      simplifiedWaypoints.length > 0
                        ? simplifiedWaypoints
                        : undefined,
                    curveOffset: undefined,
                  },
                }
              : edge
          )
        )
      }

      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
    }

    const handleRemoveCurveWaypoint = (wpIndex: number) => {
      const nextWaypoints = curvePoints
        .slice(1, -1)
        .filter((_, idx) => idx !== wpIndex - 1)
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === id
            ? {
                ...edge,
                data: {
                  ...edge.data,
                  waypoints:
                    nextWaypoints.length > 0 ? nextWaypoints : undefined,
                  curveOffset: undefined,
                },
              }
            : edge
        )
      )
    }

    const handleResetRouting = () => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id !== id) return edge
          const nextData = { ...edge.data }
          delete nextData.orthogonalOffset
          delete nextData.curveOffset
          delete nextData.waypoints
          return {
            ...edge,
            data: nextData,
          }
        })
      )
    }

    const startEndpointDrag = (
      e: React.PointerEvent,
      end: 'source' | 'target'
    ) => {
      e.stopPropagation()
      e.preventDefault()

      // Select this edge while dragging its endpoint
      setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          selected: edge.id === id,
        }))
      )

      const findTargetHandleAt = (
        flowX: number,
        flowY: number
      ): { nodeId: string; handleId: string } | null => {
        const fixedNodeId = end === 'source' ? target : source
        let closest: { nodeId: string; handleId: string; dist: number } | null = null

        for (const n of nodes) {
          if (n.type === 'boundary' || n.hidden || n.id === fixedNodeId) {
            continue
          }
          const handles = getNodeHandles(n)
          for (const pos of [Position.Top, Position.Right, Position.Bottom, Position.Left]) {
            const h = handles[pos]
            if (!h) continue
            const dist = Math.hypot(flowX - h.x, flowY - h.y)
            if (!closest || dist < closest.dist) {
              closest = { nodeId: n.id, handleId: pos, dist }
            }
          }
        }

        // Snap threshold: if within 42px of any node handle, snap directly to it
        if (closest && closest.dist <= 42) {
          return { nodeId: closest.nodeId, handleId: closest.handleId }
        }

        // If pointer is inside the node's bounding box + 16px padding, snap to nearest handle on that node
        for (const n of nodes) {
          if (n.type === 'boundary' || n.hidden || n.id === fixedNodeId) {
            continue
          }
          const box = getNodeBox(n)
          const pad = 16
          if (
            flowX >= box.x - pad &&
            flowX <= box.x + box.w + pad &&
            flowY >= box.y - pad &&
            flowY <= box.y + box.h + pad
          ) {
            const handles = getNodeHandles(n)
            let bestPos = Position.Top
            let bestD = Infinity
            for (const pos of [Position.Top, Position.Right, Position.Bottom, Position.Left]) {
              const h = handles[pos]
              if (!h) continue
              const d = Math.hypot(flowX - h.x, flowY - h.y)
              if (d < bestD) {
                bestD = d
                bestPos = pos
              }
            }
            return { nodeId: n.id, handleId: bestPos }
          }
        }

        return null
      }

      const initialFlow = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      })

      let latestTarget = findTargetHandleAt(initialFlow.x, initialFlow.y)
      setDraggingEnd({
        end,
        x: initialFlow.x,
        y: initialFlow.y,
        hoveredNodeId: latestTarget?.nodeId ?? null,
        hoveredHandleId: latestTarget?.handleId ?? null,
      })

      const onPointerMove = (ev: PointerEvent) => {
        const pt = screenToFlowPosition({
          x: ev.clientX,
          y: ev.clientY,
        })
        latestTarget = findTargetHandleAt(pt.x, pt.y)
        setDraggingEnd({
          end,
          x: pt.x,
          y: pt.y,
          hoveredNodeId: latestTarget?.nodeId ?? null,
          hoveredHandleId: latestTarget?.handleId ?? null,
        })
      }

      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)

        const previousNodeId = end === 'source' ? source : target
        const previousHandleId =
          end === 'source' ? sourceHandleId : targetHandleId
        const previousHandleClean = previousHandleId
          ? previousHandleId.replace(/-source|-target$/, '')
          : null

        if (latestTarget) {
          const hasNodeChanged = latestTarget.nodeId !== previousNodeId
          const hasHandleChanged =
            latestTarget.handleId !== previousHandleClean
          if (hasNodeChanged || hasHandleChanged) {
            window.dispatchEvent(
              new CustomEvent('reconnect-edge-endpoint', {
                detail: {
                  edgeId: id,
                  end,
                  newNodeId: latestTarget.nodeId,
                  newHandleId: latestTarget.handleId,
                },
              })
            )
          }
        }
        // Revert visual drag state
        setDraggingEnd(null)
      }

      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
    }

    return (
      <>
        {/* Soft highlight halo along the relationship path when hovered or selected */}
        {showActions && (
          <path
            d={edgePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={7}
            strokeOpacity={0.14}
            strokeLinecap="round"
            className="pointer-events-none transition-opacity duration-150"
          />
        )}

        {/* Faint dashed guide lines when dragging or selecting a curved bend handle */}
        {guideLinePath && selected && (
          <path
            d={guideLinePath}
            fill="none"
            stroke="var(--primary-btn)"
            strokeWidth={1}
            strokeDasharray="3 3"
            strokeOpacity={0.35}
            className="pointer-events-none"
          />
        )}

        {/* The visual edge */}
        <BaseEdge
          id={id}
          path={edgePath}
          markerStart={markerStart || undefined}
          markerEnd={markerEnd || undefined}
          style={{
            strokeWidth: selected || draggingEnd ? 2.25 : isHovered ? 2 : 1.65,
            strokeDasharray,
            stroke: strokeColor,
          }}
        />

        {/* Wide invisible hit path so hovering or clicking anywhere on the line is effortless */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={22}
          className="react-flow__edge-interaction cursor-pointer"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />

        {/* Visual glow on segments when hovering or dragging */}
        {selected &&
          routingStyle === 'orthogonal' &&
          orthogonalSegments.map((s) => (
            <path
              key={`glow-${s.index}`}
              d={`M ${s.start.x} ${s.start.y} L ${s.end.x} ${s.end.y}`}
              fill="none"
              stroke="var(--primary-btn)"
              strokeWidth={
                activeDragSegIndex === s.index
                  ? 4
                  : hoveredSegIndex === s.index
                    ? 3
                    : 0
              }
              strokeOpacity={activeDragSegIndex === s.index ? 0.6 : 0.3}
              strokeLinecap="round"
              className="pointer-events-none transition-opacity duration-150"
            />
          ))}

        {/* Draggable segment hit areas covering every orthogonal segment */}
        {selected &&
          routingStyle === 'orthogonal' &&
          orthogonalSegments.map((s) => (
            <path
              key={`hit-${s.index}`}
              d={`M ${s.start.x} ${s.start.y} L ${s.end.x} ${s.end.y}`}
              fill="none"
              stroke="transparent"
              strokeWidth={24}
              className="react-flow__edge-interaction nodrag"
              style={{
                cursor: s.isHorizontal ? 'ns-resize' : 'ew-resize',
              }}
              onMouseEnter={() => setHoveredSegIndex(s.index)}
              onMouseLeave={() => setHoveredSegIndex(null)}
              onPointerDown={(e) => handleStartSegmentDrag(s.index, e)}
              onDoubleClick={(e) => {
                e.stopPropagation()
                handleResetRouting()
              }}
            >
              <title>
                {s.isHorizontal
                  ? 'Drag to slide segment up/down (Shift for smooth) · Double-click to reset'
                  : 'Drag to slide segment left/right (Shift for smooth) · Double-click to reset'}
              </title>
            </path>
          ))}

        {/* Visual glow on the curve when hovering or dragging */}
        {selected && routingStyle === 'bezier' && (
          <path
            d={edgePath}
            fill="none"
            stroke="var(--primary-btn)"
            strokeWidth={isDraggingAdjustment ? 4 : isHovered ? 2.5 : 0}
            strokeOpacity={isDraggingAdjustment ? 0.6 : 0.25}
            strokeLinecap="round"
            className="pointer-events-none transition-opacity duration-150"
          />
        )}

        {/* Draggable curve hit area covering the entire curve when selected */}
        {selected && routingStyle === 'bezier' && (
          <path
            d={edgePath}
            fill="none"
            stroke="transparent"
            strokeWidth={24}
            className="react-flow__edge-interaction nodrag"
            style={{
              cursor: isDraggingAdjustment ? 'grabbing' : 'grab',
            }}
            onPointerDown={(e) => handleStartCurveDrag('curve-segment', 0, e)}
            onDoubleClick={(e) => {
              e.stopPropagation()
              handleResetRouting()
            }}
          >
            <title>
              Drag anywhere on this curve to bend (Hold Shift to disable snap) ·
              Double-click to reset
            </title>
          </path>
        )}

        {/* Interactive draggable endpoint handles on both ends rendered via EdgeLabelRenderer on top of nodes */}
        {showActions && (
          <EdgeLabelRenderer>
            {/* Visual handle snap indicators shown when hovering over a node during endpoint dragging */}
            {draggingEnd?.hoveredNodeId && (() => {
              const hNode = nodes.find((n) => n.id === draggingEnd.hoveredNodeId)
              if (!hNode) return null
              const hHandles = getNodeHandles(hNode)
              return (
                <>
                  {[Position.Top, Position.Right, Position.Bottom, Position.Left].map((pos) => {
                    const h = hHandles[pos]
                    if (!h) return null
                    const isSnapped = draggingEnd.hoveredHandleId === pos
                    return (
                      <div
                        key={`snap-port-${pos}`}
                        style={{
                          position: 'absolute',
                          transform: `translate(-50%, -50%) translate(${h.x}px, ${h.y}px)`,
                          pointerEvents: 'none',
                          zIndex: 100001,
                        }}
                      >
                        <div
                          className={`rounded-full transition-all duration-150 ${isSnapped
                            ? 'w-4 h-4 bg-[var(--primary-btn)] ring-4 ring-[var(--primary-btn)]/35 shadow-sm scale-110'
                            : 'w-2.5 h-2.5 bg-[var(--bg-primary)] border-2 border-[var(--primary-btn)]/60 opacity-60'
                            }`}
                        />
                      </div>
                    )
                  })}
                </>
              )
            })()}

            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${sx}px, ${sy}px)`,
                pointerEvents: 'all',
                zIndex: 100000,
              }}
              className="nodrag nopan flex items-center justify-center"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onPointerDown={(e) => startEndpointDrag(e, 'source')}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 border-[var(--primary-btn)] shadow-md hover:scale-125 transition-transform cursor-grab active:cursor-grabbing flex items-center justify-center ${draggingEnd?.end === 'source'
                  ? 'bg-[var(--primary-btn)] ring-2 ring-[var(--primary-btn)]/35'
                  : 'bg-[var(--bg-primary)]'
                  }`}
                title="Drag to reconnect source element"
              />
            </div>

            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px)`,
                pointerEvents: 'all',
                zIndex: 100000,
              }}
              className="nodrag nopan flex items-center justify-center"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onPointerDown={(e) => startEndpointDrag(e, 'target')}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 border-[var(--primary-btn)] shadow-md hover:scale-125 transition-transform cursor-grab active:cursor-grabbing flex items-center justify-center ${draggingEnd?.end === 'target'
                  ? 'bg-[var(--primary-btn)] ring-2 ring-[var(--primary-btn)]/35'
                  : 'bg-[var(--bg-primary)]'
                  }`}
                title="Drag to reconnect target element"
              />
            </div>
          </EdgeLabelRenderer>
        )}

        {/* Interactive midpoint segment & curve adjustment handles */}
        {selected &&
          handles.map((h) => {
            const isSegmentActive =
              (h.type === 'orthogonal' &&
                (activeDragSegIndex === h.segIndex ||
                  hoveredSegIndex === h.segIndex)) ||
              ((h.type === 'curve-waypoint' || h.type === 'curve-segment') &&
                activeDragCurve?.type === h.type &&
                activeDragCurve?.index === h.segIndex)

            const isWaypointVertex = h.type === 'curve-waypoint'

            return (
              <EdgeLabelRenderer key={h.id}>
                <div
                  style={{
                    position: 'absolute',
                    transform: `translate(-50%, -50%) translate(${h.x}px, ${h.y}px)`,
                    pointerEvents: 'all',
                    zIndex: 100002,
                  }}
                  className="nodrag nopan flex items-center justify-center"
                  onMouseEnter={() => {
                    if (h.type === 'orthogonal') setHoveredSegIndex(h.segIndex)
                  }}
                  onMouseLeave={() => {
                    if (h.type === 'orthogonal') setHoveredSegIndex(null)
                  }}
                  onPointerDown={(e) => {
                    if (h.type === 'orthogonal') {
                      handleStartSegmentDrag(h.segIndex, e)
                    } else if (h.type === 'curve-waypoint') {
                      handleStartCurveDrag('curve-waypoint', h.segIndex, e)
                    } else {
                      handleStartCurveDrag('curve-segment', h.segIndex, e)
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    if (h.type === 'curve-waypoint') {
                      handleRemoveCurveWaypoint(h.segIndex)
                    } else {
                      handleResetRouting()
                    }
                  }}
                >
                  <div
                    style={{
                      transform: `scale(${1 / zoom})`,
                      transformOrigin: 'center center',
                      cursor: h.cursor,
                    }}
                    className={`${
                      isWaypointVertex
                        ? 'w-4 h-4 rounded-full bg-[var(--bg-primary)] border-2 border-[var(--primary-btn)] shadow-md'
                        : 'w-3.5 h-3.5 rounded-full bg-[var(--bg-primary)] border-2 border-[var(--primary-btn)] shadow-md'
                    } hover:scale-125 transition-transform flex items-center justify-center ${
                      isSegmentActive
                        ? 'ring-4 ring-[var(--primary-btn)]/35 bg-[var(--primary-btn)] scale-110'
                        : ''
                    }`}
                    title={h.title}
                  >
                    <div
                      className={`${
                        isWaypointVertex ? 'w-1.5 h-1.5' : 'w-1 h-1'
                      } rounded-full ${
                        isSegmentActive
                          ? 'bg-white'
                          : 'bg-[var(--primary-btn)]'
                      }`}
                    />
                  </div>
                </div>
              </EdgeLabelRenderer>
            )
          })}

        {/* Clean, minimal inline stereotype label & direct post-hoc type switcher */}
        {(hasVisibleLabel || showActions) && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${resolvedX}px,${resolvedY}px)`,
                pointerEvents: 'all',
                zIndex: showActions ? 100000 : 9999,
              }}
              className="nodrag nopan relative flex items-center justify-center select-none"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={selectThisEdge}
            >
              {/* Floating Quick Actions & Post-Hoc Relationship Type Switcher */}
              <AnimatePresence>
                {showActions && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: hasVisibleLabel ? '100%' : '0',
                      marginBottom: `${(hasVisibleLabel ? 12 : 28) * (1 / zoom)}px`,
                      left: '50%',
                      transform: `translateX(-50%) scale(${1 / zoom})`,
                      transformOrigin: 'bottom center',
                      zIndex: 20,
                    }}
                    className="nodrag nopan pointer-events-auto"
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 3, scale: 0.94 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 28 }}
                      style={{ transformOrigin: 'bottom center' }}
                      className="nodrag nopan flex items-center gap-0.5 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[6px] p-0.5 shadow-md whitespace-nowrap"
                    >
                      {/* Direct relationship type pills when multiple valid types exist (e.g. UseCase <-> UseCase) */}
                      {allowedTypes.length > 1 && (
                        <>
                          {allowedTypes.map((t) => {
                            const isCurrent = relationshipType === t
                            const label =
                              t === 'include'
                                ? '«include»'
                                : t === 'extend'
                                  ? '«extend»'
                                  : t === 'generalization'
                                    ? 'Inherit'
                                    : t === 'realization'
                                      ? 'Impl'
                                      : t === 'aggregation'
                                        ? 'Aggreg'
                                        : t === 'composition'
                                          ? 'Compos'
                                          : t === 'dependency'
                                            ? 'Dep'
                                            : t === 'data_flow'
                                              ? 'Flow'
                                              : 'Assoc'
                            return (
                              <button
                                key={t}
                                type="button"
                                onPointerDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSetType(t)
                                }}
                                className={`px-1.5 py-0.5 rounded-[4px] font-mono text-[10px] transition-colors cursor-pointer ${isCurrent
                                  ? 'bg-[var(--selection-bg)] text-[var(--primary-btn)] font-semibold'
                                  : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'
                                  }`}
                              >
                                {label}
                              </button>
                            )
                          })}
                          <div className="h-3.5 w-px bg-[var(--border-subtle)] mx-0.5" />
                        </>
                      )}

                      {/* Quick ER Cardinality presets when this is an ER relationship */}
                      {relationshipType === 'er' && (
                        <>
                          {(
                            [
                              {
                                label: '1:1',
                                src: 'one_only',
                                tgt: 'one_only',
                                title: 'One-to-One (1:1)',
                              },
                              {
                                label: '1:N',
                                src: 'one_only',
                                tgt: 'zero_or_many',
                                title: 'One-to-Many (1:N)',
                              },
                              {
                                label: 'N:M',
                                src: 'zero_or_many',
                                tgt: 'zero_or_many',
                                title: 'Many-to-Many (N:M)',
                              },
                            ] as const
                          ).map((preset) => {
                            const isActive =
                              erSourceCard === preset.src &&
                              erTargetCard === preset.tgt
                            return (
                              <button
                                key={preset.label}
                                type="button"
                                title={preset.title}
                                onPointerDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEdges((eds) =>
                                    eds.map((edge) =>
                                      edge.id === id
                                        ? {
                                            ...edge,
                                            data: {
                                              ...edge.data,
                                              erSourceCardinality: preset.src,
                                              erTargetCardinality: preset.tgt,
                                            },
                                          }
                                        : edge
                                    )
                                  )
                                }}
                                className={`px-1.5 py-0.5 rounded-[4px] font-mono text-[10px] transition-colors cursor-pointer ${
                                  isActive
                                    ? 'bg-[var(--selection-bg)] text-[var(--primary-btn)] font-semibold'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'
                                }`}
                              >
                                {preset.label}
                              </button>
                            )
                          })}
                          <button
                            type="button"
                            title={
                              erIdentifying
                                ? 'Identifying (Solid) — Click for Non-Identifying (Dashed)'
                                : 'Non-Identifying (Dashed) — Click for Identifying (Solid)'
                            }
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation()
                              setEdges((eds) =>
                                eds.map((edge) =>
                                  edge.id === id
                                    ? {
                                        ...edge,
                                        data: {
                                          ...edge.data,
                                          erIdentifying: !erIdentifying,
                                        },
                                      }
                                    : edge
                                )
                              )
                            }}
                            className={`px-1.5 py-0.5 rounded-[4px] font-mono text-[10px] transition-colors cursor-pointer ${
                              erIdentifying
                                ? 'bg-[var(--selection-bg)] text-[var(--primary-btn)] font-semibold'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {erIdentifying ? 'ID' : 'Non-ID'}
                          </button>
                          <div className="h-3.5 w-px bg-[var(--border-subtle)] mx-0.5" />
                        </>
                      )}

                      <button
                        type="button"
                        title="Flip connection direction (swap source & target)"
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation()
                          window.dispatchEvent(
                            new CustomEvent('flip-edge-direction', {
                              detail: { edgeId: id },
                            })
                          )
                        }}
                        className="p-1 rounded-[4px] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                      </button>

                      {hasManualOverride && (
                        <button
                          type="button"
                          title="Reset manual routing to auto"
                          onPointerDown={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleResetRouting()
                          }}
                          className="p-1 rounded-[4px] hover:bg-[var(--hover-bg)] text-[var(--primary-btn)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}

                      <button
                        type="button"
                        title="Delete connection"
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation()
                          window.dispatchEvent(
                            new CustomEvent('delete-edge', {
                              detail: { edgeId: id },
                            })
                          )
                        }}
                        className="p-1 rounded-[4px] hover:bg-[var(--notion-red-bg)] text-[var(--text-secondary)] hover:text-[var(--notion-red-text)] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Minimal inline label on the edge */}
              {hasVisibleLabel && (
                <div
                  style={{
                    color: selected ? 'var(--primary-btn)' : textColor,
                  }}
                  className={`flex flex-col items-center justify-center px-2 py-0.5 rounded-[4px] bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono text-[10px] font-medium leading-tight tracking-tight cursor-pointer transition-all whitespace-nowrap shadow-xs ${selected
                    ? 'ring-2 ring-[var(--primary-btn)]/35 border-[var(--primary-btn)]'
                    : isHovered
                      ? 'border-[var(--border-strong)]'
                      : ''
                    }`}
                  title="Click to select relationship"
                >
                  <span>{stereotypeText}</span>
                  {subText && (
                    <span className="text-[8.5px] opacity-75 font-normal leading-none mt-0.5">
                      {subText}
                    </span>
                  )}
                </div>
              )}
            </div>
          </EdgeLabelRenderer>
        )}

        {/* Class Diagram Multiplicity Labels (source & target ends) */}
        {(data?.sourceMultiplicity || data?.targetMultiplicity) && (() => {
          const getEndLabelStyle = (
            x: number,
            y: number,
            pos: Position,
            extraOffset = 0
          ): React.CSSProperties => {
            const d = 10 + extraOffset
            switch (pos) {
              case Position.Right:
                return {
                  position: 'absolute',
                  transform: `translate(0%, -100%) translate(${x + d}px, ${y - 6}px)`,
                  pointerEvents: 'none',
                  zIndex: 5,
                }
              case Position.Left:
                return {
                  position: 'absolute',
                  transform: `translate(-100%, -100%) translate(${x - d}px, ${y - 6}px)`,
                  pointerEvents: 'none',
                  zIndex: 5,
                }
              case Position.Top:
                return {
                  position: 'absolute',
                  transform: `translate(0%, -100%) translate(${x + 7}px, ${y - d}px)`,
                  pointerEvents: 'none',
                  zIndex: 5,
                }
              case Position.Bottom:
              default:
                return {
                  position: 'absolute',
                  transform: `translate(0%, 0%) translate(${x + 7}px, ${y + d}px)`,
                  pointerEvents: 'none',
                  zIndex: 5,
                }
            }
          }

          const targetMarkerPad =
            data?.relationshipType === 'composition' ||
            data?.relationshipType === 'aggregation' ||
            data?.relationshipType === 'generalization' ||
            data?.relationshipType === 'realization' ||
            data?.relationshipType === 'dependency'
              ? 8
              : 0

          return (
            <EdgeLabelRenderer>
              {data?.sourceMultiplicity && (
                <div
                  style={getEndLabelStyle(sx, sy, sourcePos, 0)}
                  className="text-[10.5px] font-mono font-semibold text-[var(--text-primary)] leading-none select-none"
                >
                  {data.sourceMultiplicity}
                </div>
              )}
              {data?.targetMultiplicity && (
                <div
                  style={getEndLabelStyle(tx, ty, targetPos, targetMarkerPad)}
                  className="text-[10.5px] font-mono font-semibold text-[var(--text-primary)] leading-none select-none"
                >
                  {data.targetMultiplicity}
                </div>
              )}
            </EdgeLabelRenderer>
          )
        })()}
      </>
    )
  }
)

UmlEdge.displayName = 'UmlEdge'
