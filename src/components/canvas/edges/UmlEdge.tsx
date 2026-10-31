import { memo, useState, useRef, useEffect, useMemo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  Position,
  getStraightPath,
  getSmoothStepPath,
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
} from '../../../lib/floatingEdges'
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
              targetHandleId
            )
          }
          const tInt = getBorderIntersectionPoint(targetNode, {
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
              sourceHandleId,
              draggingEnd.hoveredHandleId
            )
          }
          const sInt = getBorderIntersectionPoint(sourceNode, {
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
        return getFloatingEdgeParams(
          sourceNode,
          targetNode,
          parallelOffset,
          sourceHandleId,
          targetHandleId
        )
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
    ])

    const routingStyle = data?.routingStyle || 'straight'
    const orthogonalOffset = data?.orthogonalOffset
    const curveOffset = data?.curveOffset
    const hasManualOverride =
      (routingStyle === 'orthogonal' && orthogonalOffset !== undefined) ||
      (routingStyle === 'bezier' && curveOffset !== undefined)

    // Determine orthogonal segment orientation
    const isOrthogonalVerticalMiddle =
      sourcePos === Position.Left || sourcePos === Position.Right
    const defaultOrthogonalSplit = isOrthogonalVerticalMiddle
      ? (sx + tx) / 2
      : (sy + ty) / 2
    const currentOrthogonalSplit =
      defaultOrthogonalSplit + (orthogonalOffset ?? 0)

    // Compute bezier bend apex
    const chordMidX = (sx + tx) / 2
    const chordMidY = (sy + ty) / 2
    const bezierApexX = chordMidX + (curveOffset?.x ?? 0)
    const bezierApexY = chordMidY + (curveOffset?.y ?? 0)

    const [edgePath, labelX, labelY, guideLinePath] = useMemo(() => {
      if (routingStyle === 'orthogonal') {
        const [path, lx, ly] = getSmoothStepPath({
          sourceX: sx,
          sourceY: sy,
          sourcePosition: sourcePos,
          targetX: tx,
          targetY: ty,
          targetPosition: targetPos,
          borderRadius: 8,
          centerX: isOrthogonalVerticalMiddle ? currentOrthogonalSplit : undefined,
          centerY: isOrthogonalVerticalMiddle ? undefined : currentOrthogonalSplit,
        })
        return [path, lx, ly, null]
      }
      if (routingStyle === 'bezier') {
        if (curveOffset) {
          const cp1x = sx + (bezierApexX - sx) * 0.72
          const cp1y = sy + (bezierApexY - sy) * 0.72
          const cp2x = tx + (bezierApexX - tx) * 0.72
          const cp2y = ty + (bezierApexY - ty) * 0.72
          const path = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`
          const guide = `M ${sx} ${sy} L ${bezierApexX} ${bezierApexY} L ${tx} ${ty}`
          return [path, bezierApexX, bezierApexY, guide]
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
      isOrthogonalVerticalMiddle,
      currentOrthogonalSplit,
      curveOffset,
      bezierApexX,
      bezierApexY,
    ])

    const adjustmentHandle = useMemo(() => {
      if (!selected) return null
      if (routingStyle === 'orthogonal') {
        return {
          x: isOrthogonalVerticalMiddle
            ? currentOrthogonalSplit
            : (sx + tx) / 2,
          y: isOrthogonalVerticalMiddle
            ? (sy + ty) / 2
            : currentOrthogonalSplit,
          type: 'orthogonal' as const,
          cursor: isOrthogonalVerticalMiddle ? 'ew-resize' : 'ns-resize',
        }
      }
      if (routingStyle === 'bezier') {
        return {
          x: bezierApexX,
          y: bezierApexY,
          type: 'bezier' as const,
          cursor: 'grab',
        }
      }
      return null
    }, [
      selected,
      routingStyle,
      isOrthogonalVerticalMiddle,
      currentOrthogonalSplit,
      sx,
      tx,
      sy,
      ty,
      bezierApexX,
      bezierApexY,
    ])

    const allowedTypes = useMemo(
      () => getAllowedRelationshipTypes(sourceNode?.type, targetNode?.type),
      [sourceNode?.type, targetNode?.type]
    )

    const relationshipType: UmlRelationshipType =
      data?.relationshipType || 'association'
    const condition = data?.condition

    // Determine styles based on UML 2.5 relationship
    let strokeDasharray = 'none'
    let markerEnd = ''
    let stereotypeText = ''
    let subText = ''
    let textColor = 'var(--text-secondary)'

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
        stereotypeText = ''
        textColor = 'var(--notion-green-text)'
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
        : relationshipType === 'include'
          ? 'var(--notion-blue-text)'
          : relationshipType === 'extend'
            ? 'var(--notion-yellow-text)'
            : relationshipType === 'generalization'
              ? 'var(--notion-green-text)'
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

    const showActions = Boolean(selected || isHovered || draggingEnd)
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

    const [isDraggingAdjustment, setIsDraggingAdjustment] = useState(false)

    const handleStartAdjustmentDrag = (e: React.PointerEvent) => {
      e.stopPropagation()
      e.preventDefault()
      setIsDraggingAdjustment(true)

      const onPointerMove = (moveEvt: PointerEvent) => {
        moveEvt.preventDefault()
        const flowPos = screenToFlowPosition({
          x: moveEvt.clientX,
          y: moveEvt.clientY,
        })
        const isShift = moveEvt.shiftKey

        if (routingStyle === 'orthogonal') {
          if (isOrthogonalVerticalMiddle) {
            let targetX = flowPos.x
            if (!isShift) {
              targetX = Math.round(targetX / 16) * 16
            }
            const offset = Math.round(targetX - defaultOrthogonalSplit)
            setEdges((eds) =>
              eds.map((edge) =>
                edge.id === id
                  ? {
                      ...edge,
                      data: {
                        ...edge.data,
                        orthogonalOffset: offset,
                      },
                    }
                  : edge
              )
            )
          } else {
            let targetY = flowPos.y
            if (!isShift) {
              targetY = Math.round(targetY / 16) * 16
            }
            const offset = Math.round(targetY - defaultOrthogonalSplit)
            setEdges((eds) =>
              eds.map((edge) =>
                edge.id === id
                  ? {
                      ...edge,
                      data: {
                        ...edge.data,
                        orthogonalOffset: offset,
                      },
                    }
                  : edge
              )
            )
          }
        } else if (routingStyle === 'bezier') {
          let targetX = flowPos.x
          let targetY = flowPos.y
          if (!isShift) {
            targetX = Math.round(targetX / 16) * 16
            targetY = Math.round(targetY / 16) * 16
          }
          const offset = {
            x: Math.round(targetX - chordMidX),
            y: Math.round(targetY - chordMidY),
          }
          setEdges((eds) =>
            eds.map((edge) =>
              edge.id === id
                ? {
                    ...edge,
                    data: {
                      ...edge.data,
                      curveOffset: offset,
                    },
                  }
                : edge
            )
          )
        }
      }

      const onPointerUp = () => {
        setIsDraggingAdjustment(false)
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
      }

      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
    }

    const handleResetRouting = () => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id !== id) return edge
          const nextData = { ...edge.data }
          delete nextData.orthogonalOffset
          delete nextData.curveOffset
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
          markerEnd={markerEnd}
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

        {/* Interactive midpoint segment / bend adjustment handle */}
        {adjustmentHandle && selected && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${adjustmentHandle.x}px, ${adjustmentHandle.y}px)`,
                pointerEvents: 'all',
                zIndex: 100002,
              }}
              className="nodrag nopan flex items-center justify-center"
              onPointerDown={handleStartAdjustmentDrag}
              onDoubleClick={(e) => {
                e.stopPropagation()
                handleResetRouting()
              }}
            >
              <div
                style={{
                  transform: `scale(${1 / zoom})`,
                  transformOrigin: 'center center',
                  cursor: adjustmentHandle.cursor,
                }}
                className={`w-3.5 h-3.5 rounded-full bg-[var(--bg-primary)] border-2 border-[var(--primary-btn)] shadow-md hover:scale-125 transition-transform flex items-center justify-center ${
                  isDraggingAdjustment
                    ? 'ring-4 ring-[var(--primary-btn)]/35 bg-[var(--primary-btn)]'
                    : ''
                }`}
                title={
                  adjustmentHandle.type === 'orthogonal'
                    ? 'Drag to slide segment (Hold Shift to disable snap) · Double-click to reset'
                    : 'Drag to bend curve (Hold Shift to disable snap) · Double-click to reset'
                }
              >
                <div
                  className={`w-1 h-1 rounded-full ${
                    isDraggingAdjustment
                      ? 'bg-white'
                      : 'bg-[var(--primary-btn)]'
                  }`}
                />
              </div>
            </div>
          </EdgeLabelRenderer>
        )}

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
                      position: hasVisibleLabel ? 'absolute' : 'relative',
                      bottom: hasVisibleLabel ? '100%' : 'auto',
                      marginBottom: hasVisibleLabel ? `${8 * (1 / zoom)}px` : 0,
                      left: hasVisibleLabel ? '50%' : 'auto',
                      transform: hasVisibleLabel
                        ? `translateX(-50%) scale(${1 / zoom})`
                        : `scale(${1 / zoom})`,
                      transformOrigin: hasVisibleLabel
                        ? 'bottom center'
                        : 'center center',
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
      </>
    )
  }
)

UmlEdge.displayName = 'UmlEdge'
