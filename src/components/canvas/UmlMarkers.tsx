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

        {/* Generalization / Realization hollow triangle arrow */}
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

        {/* Aggregation hollow diamond */}
        <marker
          id="uml-aggregation"
          viewBox="0 0 16 14"
          refX="14"
          refY="7"
          markerWidth="12"
          markerHeight="10"
          orient="auto-start-reverse"
        >
          <path
            d="M 2 7 L 8 2 L 14 7 L 8 12 Z"
            fill="var(--bg-primary, #ffffff)"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </marker>

        {/* Composition filled diamond */}
        <marker
          id="uml-composition"
          viewBox="0 0 16 14"
          refX="14"
          refY="7"
          markerWidth="12"
          markerHeight="10"
          orient="auto-start-reverse"
        >
          <path
            d="M 2 7 L 8 2 L 14 7 L 8 12 Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </marker>

        {/* ER Crow's Foot Markers (Information Engineering notation) */}
        {/* One (single bar) */}
        <marker
          id="er-one"
          viewBox="0 0 24 16"
          refX="23"
          refY="8"
          markerWidth="18"
          markerHeight="12"
          orient="auto-start-reverse"
        >
          <path
            d="M 16 2 L 16 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </marker>

        {/* Mandatory One / One and only one (double bar) */}
        <marker
          id="er-one-only"
          viewBox="0 0 24 16"
          refX="23"
          refY="8"
          markerWidth="18"
          markerHeight="12"
          orient="auto-start-reverse"
        >
          <path
            d="M 12 2 L 12 14 M 17 2 L 17 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </marker>

        {/* Optional One / Zero or one (circle + bar) */}
        <marker
          id="er-zero-or-one"
          viewBox="0 0 24 16"
          refX="23"
          refY="8"
          markerWidth="18"
          markerHeight="12"
          orient="auto-start-reverse"
        >
          <circle
            cx="9"
            cy="8"
            r="3.5"
            fill="var(--bg-primary, #ffffff)"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M 17 2 L 17 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </marker>

        {/* Many (crow's foot) */}
        <marker
          id="er-many"
          viewBox="0 0 24 16"
          refX="23"
          refY="8"
          markerWidth="18"
          markerHeight="12"
          orient="auto-start-reverse"
        >
          <path
            d="M 11 8 L 23 2 M 11 8 L 23 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>

        {/* Mandatory Many / One or many (bar + crow's foot) */}
        <marker
          id="er-one-or-many"
          viewBox="0 0 24 16"
          refX="23"
          refY="8"
          markerWidth="18"
          markerHeight="12"
          orient="auto-start-reverse"
        >
          <path
            d="M 9 2 L 9 14 M 13 8 L 23 2 M 13 8 L 23 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>

        {/* Optional Many / Zero or many (circle + crow's foot) */}
        <marker
          id="er-zero-or-many"
          viewBox="0 0 24 16"
          refX="23"
          refY="8"
          markerWidth="18"
          markerHeight="12"
          orient="auto-start-reverse"
        >
          <circle
            cx="8"
            cy="8"
            r="3.5"
            fill="var(--bg-primary, #ffffff)"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M 13 8 L 23 2 M 13 8 L 23 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
    </svg>
  )
}
