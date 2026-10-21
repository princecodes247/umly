import React from 'react'

export const UmlMarkers: React.FC = () => {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
      <defs>
        {/* Open arrow for include and extend */}
        <marker
          id="uml-arrowhead"
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path
            d="M 1 2 L 10 6 L 1 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>

        {/* Generalization hollow triangle arrow */}
        <marker
          id="uml-generalization"
          viewBox="0 0 14 14"
          refX="12"
          refY="7"
          markerWidth="10"
          markerHeight="10"
          orient="auto-start-reverse"
        >
          <path
            d="M 2 2 L 12 7 L 2 12 Z"
            fill="var(--bg-primary, #ffffff)"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
    </svg>
  )
}
