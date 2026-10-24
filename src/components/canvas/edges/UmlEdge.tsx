import { memo, useState, useRef, useEffect, useMemo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  getSmoothStepPath,
  getBezierPath,
  useNodes,
  useEdges,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react'
import { motion, AnimatePresence } from 'motion/react'
import { Trash2, ArrowLeftRight } from 'lucide-react'
import { getAllowedRelationshipTypes } from '../../../lib/umlValidation'
import {
  getFloatingEdgeParams,
  getBorderIntersectionPoint,
  getNodeBox,
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

    const [isHovered, setIsHovered] = useState(false)
    const [draggingEnd, setDraggingEnd] = useState<{
      end: 'source' | 'target'
      x: number
      y: number
      hoveredNodeId: string | null
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
            return getFloatingEdgeParams(hoveredNode, targetNode, 0)
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
            return getFloatingEdgeParams(sourceNode, hoveredNode, 0)
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
        return getFloatingEdgeParams(sourceNode, targetNode, parallelOffset)
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

    const [edgePath, labelX, labelY] = useMemo(() => {
      if (routingStyle === 'orthogonal') {
        return getSmoothStepPath({
          sourceX: sx,
          sourceY: sy,
          sourcePosition: sourcePos,
          targetX: tx,
          targetY: ty,
          targetPosition: targetPos,
          borderRadius: 8,
        })
      }
      if (routingStyle === 'bezier') {
        return getBezierPath({
          sourceX: sx,
          sourceY: sy,
          sourcePosition: sourcePos,
          targetX: tx,
          targetY: ty,
          targetPosition: targetPos,
        })
      }
      return getStraightPath({
        sourceX: sx,
        sourceY: sy,
        targetX: tx,
        targetY: ty,
      })
    }, [routingStyle, sx, sy, tx, ty, sourcePos, targetPos])

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

    const startEndpointDrag = (
      e: React.PointerEvent<SVGGElement>,
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

      const findTargetNodeAt = (flowX: number, flowY: number): string | null => {
        const fixedNodeId = end === 'source' ? target : source
        for (const n of nodes) {
          if (n.type === 'boundary' || n.hidden || n.id === fixedNodeId) {
            continue
          }
          const box = getNodeBox(n)
          const pad = 14
          if (
            flowX >= box.x - pad &&
            flowX <= box.x + box.w + pad &&
            flowY >= box.y - pad &&
            flowY <= box.y + box.h + pad
          ) {
            return n.id
          }
        }
        return null
      }

      const initialFlow = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      })

      let latestHoveredId = findTargetNodeAt(initialFlow.x, initialFlow.y)
      setDraggingEnd({
        end,
        x: initialFlow.x,
        y: initialFlow.y,
        hoveredNodeId: latestHoveredId,
      })

      const onPointerMove = (ev: PointerEvent) => {
        const pt = screenToFlowPosition({
          x: ev.clientX,
          y: ev.clientY,
        })
        latestHoveredId = findTargetNodeAt(pt.x, pt.y)
        setDraggingEnd({
          end,
          x: pt.x,
          y: pt.y,
          hoveredNodeId: latestHoveredId,
        })
      }

      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)

        const previousNodeId = end === 'source' ? source : target
        if (latestHoveredId && latestHoveredId !== previousNodeId) {
          window.dispatchEvent(
            new CustomEvent('reconnect-edge-endpoint', {
              detail: {
                edgeId: id,
                end,
                newNodeId: latestHoveredId,
              },
            })
          )
        }
        // Revert visual drag state (either snaps to new node if valid, or reverts to previous node if invalid/empty)
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

        {/* Interactive draggable endpoint handles on both ends of the relationship */}
        <g
          className="nodrag nopan"
          style={{ pointerEvents: 'all', cursor: 'grab' }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onPointerDown={(e) => startEndpointDrag(e, 'source')}
        >
          <title>Drag to reconnect source end</title>
          <circle cx={sx} cy={sy} r={13} fill="transparent" />
          {showActions && (
            <circle
              cx={sx}
              cy={sy}
              r={
                draggingEnd?.end === 'source'
                  ? 6.5
                  : selected
                    ? 5.5
                    : 4.5
              }
              fill={
                draggingEnd?.end === 'source'
                  ? 'var(--primary-btn)'
                  : 'var(--bg-primary)'
              }
              stroke="var(--primary-btn)"
              strokeWidth={2}
            />
          )}
        </g>

        <g
          className="nodrag nopan"
          style={{ pointerEvents: 'all', cursor: 'grab' }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onPointerDown={(e) => startEndpointDrag(e, 'target')}
        >
          <title>Drag to reconnect target end</title>
          <circle cx={tx} cy={ty} r={13} fill="transparent" />
          {showActions && (
            <circle
              cx={tx}
              cy={ty}
              r={
                draggingEnd?.end === 'target'
                  ? 6.5
                  : selected
                    ? 5.5
                    : 4.5
              }
              fill={
                draggingEnd?.end === 'target'
                  ? 'var(--primary-btn)'
                  : 'var(--bg-primary)'
              }
              stroke="var(--primary-btn)"
              strokeWidth={2}
            />
          )}
        </g>

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
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 3, scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 520, damping: 28 }}
                    style={{ transformOrigin: 'bottom center' }}
                    className={`nodrag nopan ${
                      hasVisibleLabel
                        ? 'absolute bottom-full mb-1 left-1/2 -translate-x-1/2'
                        : 'relative'
                    } flex items-center gap-0.5 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[6px] p-0.5 shadow-md z-20 whitespace-nowrap`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
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
                              className={`px-1.5 py-0.5 rounded-[4px] font-mono text-[10px] transition-colors cursor-pointer ${
                                isCurrent
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
                )}
              </AnimatePresence>

              {/* Minimal inline label on the edge */}
              {hasVisibleLabel && (
                <div
                  style={{
                    color: selected ? 'var(--primary-btn)' : textColor,
                  }}
                  className={`flex flex-col items-center justify-center px-1.5 py-[1px] rounded-[3px] bg-[var(--bg-secondary)] font-mono text-[10px] font-medium leading-tight tracking-tight cursor-pointer transition-colors whitespace-nowrap ${
                    selected
                      ? 'ring-1 ring-[var(--primary-btn)]/50'
                      : isHovered
                        ? 'ring-1 ring-[var(--border-default)]'
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
