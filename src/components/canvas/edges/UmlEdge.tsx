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
      }, 160)
    }

    useEffect(() => {
      return () => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current)
        }
      }
    }, [])

    const relationshipType: UmlRelationshipType =
      data?.relationshipType || 'association'
    const condition = data?.condition

    // Determine styles based on UML relationship
    let strokeDasharray = 'none'
    let markerEnd = ''
    let labelText = ''
    let shortTypeBadge = ''
    let pillTintBg = 'var(--bg-secondary)'
    let pillTextColor = 'var(--text-primary)'

    switch (relationshipType) {
      case 'include':
        strokeDasharray = '5,4'
        markerEnd = 'url(#uml-arrowhead)'
        labelText = '«include»'
        shortTypeBadge = '«include»'
        pillTintBg = 'var(--notion-blue-bg)'
        pillTextColor = 'var(--notion-blue-text)'
        break
      case 'extend':
        strokeDasharray = '5,4'
        markerEnd = 'url(#uml-arrowhead)'
        labelText = condition ? `«extend» (${condition})` : '«extend»'
        shortTypeBadge = labelText
        pillTintBg = 'var(--notion-yellow-bg)'
        pillTextColor = 'var(--notion-yellow-text)'
        break
      case 'generalization':
        strokeDasharray = 'none'
        markerEnd = 'url(#uml-generalization)'
        labelText = ''
        shortTypeBadge = 'Generalization'
        pillTintBg = 'var(--notion-green-bg)'
        pillTextColor = 'var(--notion-green-text)'
        break
      case 'association':
      default:
        strokeDasharray = 'none'
        markerEnd = ''
        labelText = data?.label || ''
        shortTypeBadge = data?.label || 'Association'
        pillTintBg = 'var(--bg-secondary)'
        pillTextColor = 'var(--text-secondary)'
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
    // Evaluate exact points B(t) on the cubic Bezier path so the badge NEVER detaches from its line,
    // while sliding along the curve if a node or an earlier edge's midpoint overlaps t=0.5.
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

      // Also check midpoints of earlier edges in the list so crossing edges stagger along their own curves
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

      const halfW = 46
      const halfH = 14

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
          (m) => Math.abs(px - m.x) < 76 && Math.abs(py - m.y) < 26
        )

      // Candidate t values strictly ON the curve (never off-curve!)
      const tCandidates = [
        0.5, 0.38, 0.62, 0.3, 0.7, 0.24, 0.76, 0.44, 0.56,
      ]

      // First pass: avoids both nodes and other edge midpoints
      for (const t of tCandidates) {
        const pt = pointAt(t)
        if (!collidesWithNode(pt.x, pt.y) && !collidesWithOtherEdge(pt.x, pt.y)) {
          return { resolvedX: pt.x, resolvedY: pt.y }
        }
      }

      // Second pass: avoids nodes (stays strictly on curve)
      for (const t of tCandidates) {
        const pt = pointAt(t)
        if (!collidesWithNode(pt.x, pt.y)) {
          return { resolvedX: pt.x, resolvedY: pt.y }
        }
      }

      // Fallback: point on the curve furthest from node centers
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
            strokeWidth={9}
            strokeOpacity={0.16}
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
            strokeWidth: selected ? 2.5 : isHovered ? 2.2 : 1.75,
            strokeDasharray,
            stroke: strokeColor,
          }}
        />

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

        {/* Inline curve-anchored badge & floating action popover above it */}
        {(labelText || showActions) && (
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
              {/* Floating Quick Actions Popover — centered directly ABOVE the badge so the badge never shifts off the line */}
              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                    style={{ transformOrigin: 'bottom center' }}
                    className="nodrag nopan absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[6px] p-0.5 shadow-lg z-20"
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      title="Cycle relationship type (Association, Include, Extend, Generalization)"
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
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

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
                      <ArrowLeftRight className="w-3.5 h-3.5" />
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
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Inline Curve-Anchored Relationship Pill — masks the stroke behind it with solid bg + matching border + splice dots */}
              <div
                style={{
                  borderColor: strokeColor,
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[var(--bg-primary)] border-[1.5px] shadow-xs cursor-pointer transition-shadow whitespace-nowrap ${
                  showActions ? 'ring-2 ring-[var(--primary-btn)]/25 shadow-sm' : ''
                }`}
                title="Click to select relationship"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: strokeColor }}
                />
                <span
                  style={{
                    backgroundColor: pillTintBg,
                    color: selected ? 'var(--primary-btn)' : pillTextColor,
                  }}
                  className="px-1.5 py-0.2 rounded-full font-mono text-[10px] font-semibold leading-tight tracking-tight"
                >
                  {labelText || shortTypeBadge}
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: strokeColor }}
                />
              </div>
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    )
  }
)

UmlEdge.displayName = 'UmlEdge'
