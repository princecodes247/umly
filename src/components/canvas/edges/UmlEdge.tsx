import { memo, useState, useRef, useEffect, useMemo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useNodes,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react'
import { Trash2, RotateCw, ArrowLeftRight } from 'lucide-react'
import type { UmlEdgeData, UmlRelationshipType } from '../../../types/game'

interface UmlEdgeProps extends EdgeProps {
  data?: UmlEdgeData
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
    let badgeClass = ''
    let shortTypeBadge = ''

    switch (relationshipType) {
      case 'include':
        strokeDasharray = '5,4'
        markerEnd = 'url(#uml-arrowhead)'
        labelText = '«include»'
        shortTypeBadge = '«include»'
        badgeClass =
          'notion-tag notion-tag-blue font-mono text-[10px] shadow-xs'
        break
      case 'extend':
        strokeDasharray = '5,4'
        markerEnd = 'url(#uml-arrowhead)'
        labelText = condition ? `«extend» (${condition})` : '«extend»'
        shortTypeBadge = labelText
        badgeClass =
          'notion-tag notion-tag-yellow font-mono text-[10px] shadow-xs'
        break
      case 'generalization':
        strokeDasharray = 'none'
        markerEnd = 'url(#uml-generalization)'
        labelText = ''
        shortTypeBadge = 'Generalization'
        badgeClass =
          'notion-tag notion-tag-green font-mono text-[10px] shadow-xs'
        break
      case 'association':
      default:
        strokeDasharray = 'none'
        markerEnd = ''
        labelText = data?.label || ''
        shortTypeBadge = data?.label || 'Association'
        badgeClass =
          'notion-tag notion-tag-gray font-mono text-[10px] shadow-xs'
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

    // Smart collision avoidance: if an Actor, UseCase, or Note overlaps (labelX, labelY),
    // slide the tooltip along the curve or offset it clear of the overlapping node.
    const { resolvedX, resolvedY } = useMemo(() => {
      const solidNodes = nodes.filter((n) => n.type !== 'boundary' && !n.hidden)
      if (solidNodes.length === 0) {
        return { resolvedX: labelX, resolvedY: labelY }
      }

      const halfW = 68
      const halfH = 22

      const getNodeRect = (n: (typeof solidNodes)[number]) => {
        const w =
          n.measured?.width ??
          (n.type === 'actor' ? 96 : n.type === 'useCase' ? 148 : 150)
        const h =
          n.measured?.height ??
          (n.type === 'actor' ? 118 : n.type === 'useCase' ? 68 : 80)
        return {
          left: n.position.x,
          right: n.position.x + w,
          top: n.position.y,
          bottom: n.position.y + h,
          cx: n.position.x + w / 2,
          cy: n.position.y + h / 2,
        }
      }

      const rects = solidNodes.map(getNodeRect)

      const collides = (px: number, py: number) =>
        rects.some(
          (r) =>
            px + halfW > r.left &&
            px - halfW < r.right &&
            py + halfH > r.top &&
            py - halfH < r.bottom
        )

      if (!collides(labelX, labelY)) {
        return { resolvedX: labelX, resolvedY: labelY }
      }

      // Quadratic curve passing through source (t=0), midpoint (labelX, labelY at t=0.5), and target (t=1)
      const ctrlX = 2 * labelX - 0.5 * (sourceX + targetX)
      const ctrlY = 2 * labelY - 0.5 * (sourceY + targetY)
      const pointAt = (t: number) => {
        const u = 1 - t
        return {
          x: u * u * sourceX + 2 * u * t * ctrlX + t * t * targetX,
          y: u * u * sourceY + 2 * u * t * ctrlY + t * t * targetY,
        }
      }

      const candidates: Array<{ x: number; y: number }> = [
        pointAt(0.62),
        pointAt(0.38),
        pointAt(0.72),
        pointAt(0.28),
        pointAt(0.8),
        pointAt(0.2),
        { x: labelX, y: labelY - 44 },
        { x: labelX, y: labelY + 44 },
        { x: labelX, y: labelY - 68 },
        { x: labelX, y: labelY + 68 },
      ]

      for (const c of candidates) {
        if (!collides(c.x, c.y)) {
          return { resolvedX: c.x, resolvedY: c.y }
        }
      }

      // Fallback: pick candidate furthest from any colliding node center
      let best = { x: labelX, y: labelY }
      let bestMinDist = -1
      for (const c of [{ x: labelX, y: labelY - 48 }, ...candidates]) {
        const minDist = Math.min(
          ...rects.map((r) => Math.hypot(c.x - r.cx, c.y - r.cy))
        )
        if (minDist > bestMinDist) {
          bestMinDist = minDist
          best = c
        }
      }

      return { resolvedX: best.x, resolvedY: best.y }
    }, [nodes, labelX, labelY, sourceX, sourceY, targetX, targetY])

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

        {/* Edge label & interactive quick actions — rendered in .react-flow__edgelabel-renderer (z-index: 99999) above all nodes */}
        {(labelText || showActions) && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${resolvedX}px,${resolvedY}px)`,
                pointerEvents: 'all',
                zIndex: showActions ? 100000 : 9999,
              }}
              className="nodrag nopan flex items-center gap-1 select-none"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={selectThisEdge}
            >
              {(labelText || showActions) && (
                <span
                  className={`${badgeClass} cursor-pointer`}
                  title="Click to select relationship"
                >
                  {labelText || shortTypeBadge}
                </span>
              )}

              {/* Quick actions shown when edge is selected or hovered */}
              {showActions && (
                <div
                  className="nodrag nopan flex items-center gap-0.5 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[4px] p-0.5 shadow-md"
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
                    className="p-1 rounded-[3px] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
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
                    className="p-1 rounded-[3px] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
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
                    className="p-1 rounded-[3px] hover:bg-[var(--notion-red-bg)] text-[var(--text-secondary)] hover:text-[var(--notion-red-text)] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
