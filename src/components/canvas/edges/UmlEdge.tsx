import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
import { Trash2, RotateCw } from 'lucide-react'
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

    const relationshipType: UmlRelationshipType =
      data?.relationshipType || 'association'

    // Determine styles based on UML relationship
    let strokeDasharray = 'none'
    let markerEnd = ''
    let labelText = ''
    let badgeClass = ''

    switch (relationshipType) {
      case 'include':
        strokeDasharray = '5,4'
        markerEnd = 'url(#uml-arrowhead)'
        labelText = '«include»'
        badgeClass = 'notion-tag notion-tag-blue font-mono text-[10px] shadow-xs'
        break
      case 'extend':
        strokeDasharray = '5,4'
        markerEnd = 'url(#uml-arrowhead)'
        labelText = '«extend»'
        badgeClass = 'notion-tag notion-tag-yellow font-mono text-[10px] shadow-xs'
        break
      case 'generalization':
        strokeDasharray = 'none'
        markerEnd = 'url(#uml-generalization)'
        labelText = ''
        break
      case 'association':
      default:
        strokeDasharray = 'none'
        markerEnd = ''
        labelText = ''
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

    return (
      <>
        {/* The visual edge */}
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          style={{
            strokeWidth: selected ? 2 : 1.5,
            strokeDasharray,
            stroke: strokeColor,
          }}
        />

        {/* Edge label & interactive quick actions */}
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="group flex items-center gap-1 select-none"
          >
            {labelText && (
              <span className={badgeClass}>
                {labelText}
              </span>
            )}

            {/* Quick delete / swap button shown on hover or when edge is selected */}
            <div
              className={`flex items-center gap-0.5 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[4px] p-0.5 shadow-xs transition-opacity duration-150 ${
                selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <button
                type="button"
                title="Cycle relationship type"
                onClick={(e) => {
                  e.stopPropagation()
                  const event = new CustomEvent('cycle-edge-type', {
                    detail: { edgeId: id },
                  })
                  window.dispatchEvent(event)
                }}
                className="p-1 rounded-[3px] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <RotateCw className="w-3 h-3" />
              </button>
              <button
                type="button"
                title="Delete connection"
                onClick={(e) => {
                  e.stopPropagation()
                  const event = new CustomEvent('delete-edge', {
                    detail: { edgeId: id },
                  })
                  window.dispatchEvent(event)
                }}
                className="p-1 rounded-[3px] hover:bg-[var(--notion-red-bg)] text-[var(--text-secondary)] hover:text-[var(--notion-red-text)] transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </EdgeLabelRenderer>
      </>
    )
  }
)

UmlEdge.displayName = 'UmlEdge'
