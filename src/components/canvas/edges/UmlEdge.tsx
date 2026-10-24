import { memo, useState, useRef, useEffect, useMemo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useNodes,
  useEdges,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react'
import { motion, AnimatePresence } from 'motion/react'
import { Trash2, RotateCw, ArrowLeftRight } from 'lucide-react'
import { getAllowedRelationshipTypes } from '../../../lib/umlValidation'
import type { UmlEdgeData, UmlRelationshipType } from '../../../types/game'

interface UmlEdgeProps extends EdgeProps {
  data?: UmlEdgeData
}

/**
 * Parse cubic Bezier control points from React Flow's `M sx,sy C c1x,c1y c2x,c2y tx,ty` path string.
 */
function parseCubicBezier(
  path: string,
  sx: number,
  sy: number,
  tx: number,
  ty: number
) {
  const nums = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number)
  if (nums && nums.length >= 8) {
    return {
      p0x: nums[0],
      p0y: nums[1],
      c1x: nums[2],
      c1y: nums[3],
      c2x: nums[4],
      c2y: nums[5],
      p1x: nums[6],
      p1y: nums[7],
    }
  }
  return {
    p0x: sx,
    p0y: sy,
    c1x: (sx + tx) / 2,
    c1y: sy,
    c2x: (sx + tx) / 2,
    c2y: ty,
    p1x: tx,
    p1y: ty,
  }
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
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    })

    const nodes = useNodes()
    const edges = useEdges()
    const { setEdges, setNodes } = useReactFlow()

    const [isHovered, setIsHovered] = useState(false)
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

    const allowedTypes = useMemo(
      () => getAllowedRelationshipTypes(sourceNode?.type, targetNode?.type),
      [sourceNode?.type, targetNode?.type]
    )
    const canCycleType = allowedTypes.length > 1

    const relationshipType: UmlRelationshipType =
      data?.relationshipType || 'association'
    const condition = data?.condition

    // Determine styles based on UML relationship
    let strokeDasharray = 'none'
    let markerEnd = ''
    let stereotypeText = ''
    let subText = ''
    let textColor = 'var(--text-secondary)'

    switch (relationshipType) {
      case 'include':
        strokeDasharray = '5,4'
        markerEnd = 'url(#uml-arrowhead)'
        stereotypeText = '«include»'
        textColor = 'var(--notion-blue-text)'
        break
      case 'extend':
        strokeDasharray = '5,4'
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

    // Strictly curve-mounted placement:
    // Evaluate exact points B(t) on the cubic Bezier path so the label sits cleanly on the line.
    const { resolvedX, resolvedY } = useMemo(() => {
      const bez = parseCubicBezier(
        edgePath,
        sourceX,
        sourceY,
        targetX,
        targetY
      )

      const pointAt = (t: number) => {
        const u = 1 - t
        const u2 = u * u
        const u3 = u2 * u
        const t2 = t * t
        const t3 = t2 * t
        return {
          x:
            u3 * bez.p0x +
            3 * u2 * t * bez.c1x +
            3 * u * t2 * bez.c2x +
            t3 * bez.p1x,
          y:
            u3 * bez.p0y +
            3 * u2 * t * bez.c1y +
            3 * u * t2 * bez.c2y +
            t3 * bez.p1y,
        }
      }

      const solidNodes = nodes.filter((n) => n.type !== 'boundary' && !n.hidden)
      const nodeRects = solidNodes.map((n) => {
        const w =
          n.measured?.width ??
          (n.type === 'actor' ? 92 : n.type === 'useCase' ? 144 : 145)
        const h =
          n.measured?.height ??
          (n.type === 'actor' ? 112 : n.type === 'useCase' ? 64 : 76)
        return {
          left: n.position.x,
          right: n.position.x + w,
          top: n.position.y,
          bottom: n.position.y + h,
          cx: n.position.x + w / 2,
          cy: n.position.y + h / 2,
        }
      })

      const myIndex = edges.findIndex((e) => e.id === id)
      const earlierEdgeMidpoints: Array<{ x: number; y: number }> = []
      if (myIndex > 0) {
        const nodeMap = new Map(nodes.map((n) => [n.id, n]))
        for (let i = 0; i < myIndex; i++) {
          const other = edges[i]
          const sNode = nodeMap.get(other.source)
          const tNode = nodeMap.get(other.target)
          if (sNode && tNode) {
            const sw = sNode.measured?.width ?? 120
            const sh = sNode.measured?.height ?? 60
            const tw = tNode.measured?.width ?? 120
            const th = tNode.measured?.height ?? 60
            earlierEdgeMidpoints.push({
              x: (sNode.position.x + sw / 2 + tNode.position.x + tw / 2) / 2,
              y: (sNode.position.y + sh / 2 + tNode.position.y + th / 2) / 2,
            })
          }
        }
      }

      const halfW = 34
      const halfH = 11

      const collidesWithNode = (px: number, py: number) =>
        nodeRects.some(
          (r) =>
            px + halfW > r.left &&
            px - halfW < r.right &&
            py + halfH > r.top &&
            py - halfH < r.bottom
        )

      const collidesWithOtherEdge = (px: number, py: number) =>
        earlierEdgeMidpoints.some(
          (m) => Math.abs(px - m.x) < 62 && Math.abs(py - m.y) < 20
        )

      const tCandidates = [
        0.5, 0.38, 0.62, 0.3, 0.7, 0.24, 0.76, 0.44, 0.56,
      ]

      for (const t of tCandidates) {
        const pt = pointAt(t)
        if (!collidesWithNode(pt.x, pt.y) && !collidesWithOtherEdge(pt.x, pt.y)) {
          return { resolvedX: pt.x, resolvedY: pt.y }
        }
      }

      for (const t of tCandidates) {
        const pt = pointAt(t)
        if (!collidesWithNode(pt.x, pt.y)) {
          return { resolvedX: pt.x, resolvedY: pt.y }
        }
      }

      let bestPt = { x: labelX, y: labelY }
      let bestDist = -1
      for (const t of tCandidates) {
        const pt = pointAt(t)
        const minDist =
          nodeRects.length > 0
            ? Math.min(
                ...nodeRects.map((r) => Math.hypot(pt.x - r.cx, pt.y - r.cy))
              )
            : 0
        if (minDist > bestDist) {
          bestDist = minDist
          bestPt = pt
        }
      }

      return { resolvedX: bestPt.x, resolvedY: bestPt.y }
    }, [
      edgePath,
      sourceX,
      sourceY,
      targetX,
      targetY,
      nodes,
      edges,
      id,
      labelX,
      labelY,
    ])

    const showActions = Boolean(selected || isHovered)
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

    return (
      <>
        {/* Soft highlight halo along the entire relationship path when hovered or selected */}
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
            strokeWidth: selected ? 2.25 : isHovered ? 2 : 1.65,
            strokeDasharray,
            stroke: strokeColor,
          }}
        />

        {/* Visible draggable endpoint handles when the relationship is selected or hovered */}
        {showActions && (
          <g className="pointer-events-none">
            <circle
              cx={sourceX}
              cy={sourceY}
              r={selected ? 5 : 4}
              fill="var(--bg-primary)"
              stroke="var(--primary-btn)"
              strokeWidth={2}
            />
            <circle
              cx={targetX}
              cy={targetY}
              r={selected ? 5 : 4}
              fill="var(--bg-primary)"
              stroke="var(--primary-btn)"
              strokeWidth={2}
            />
          </g>
        )}

        {/* Wide invisible hit path so hovering anywhere on the line reveals the relationship tooltip */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={24}
          className="react-flow__edge-interaction cursor-pointer"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />

        {/* Clean, minimal inline stereotype label & floating action popover */}
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
              {/* Floating Quick Actions Popover */}
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
                    } flex items-center gap-0.5 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[6px] p-0.5 shadow-md z-20`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {canCycleType && (
                      <button
                        type="button"
                        title="Cycle valid relationship type («include», «extend», Generalization)"
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation()
                          const event = new CustomEvent('cycle-edge-type', {
                            detail: { edgeId: id },
                          })
                          window.dispatchEvent(event)
                        }}
                        className="p-1 rounded-[4px] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                    )}

                    <button
                      type="button"
                      title="Flip connection direction (swap source & target)"
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        const event = new CustomEvent('flip-edge-direction', {
                          detail: { edgeId: id },
                        })
                        window.dispatchEvent(event)
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
                        const event = new CustomEvent('delete-edge', {
                          detail: { edgeId: id },
                        })
                        window.dispatchEvent(event)
                      }}
                      className="p-1 rounded-[4px] hover:bg-[var(--notion-red-bg)] text-[var(--text-secondary)] hover:text-[var(--notion-red-text)] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Minimal, lightweight inline label — just a tight canvas knockout behind the text */}
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
