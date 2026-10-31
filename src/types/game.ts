export type UmlRelationshipType = 'association' | 'include' | 'extend' | 'generalization'

export type LevelType = 'build' | 'fix' | 'classify'

export type NodeAccentColor =
  | 'default'
  | 'blue'
  | 'green'
  | 'amber'
  | 'purple'
  | 'rose'

export interface UmlNodeData {
  label: string
  nodeType: 'actor' | 'useCase' | 'boundary' | 'note'
  actorType?: 'primary' | 'secondary' | 'system'
  stereotype?: string
  accentColor?: NodeAccentColor
  boundaryTitle?: string
  width?: number
  height?: number
  description?: string
  isLocked?: boolean
  autoFocusEdit?: boolean
  isHoveredByDrag?: boolean
  [key: string]: unknown
}

export interface UmlEdgeData {
  relationshipType: UmlRelationshipType
  label?: string
  condition?: string
  routingStyle?: 'straight' | 'orthogonal' | 'bezier'
  orthogonalOffset?: number
  curveOffset?: { x: number; y: number }
  waypoints?: Array<{ x: number; y: number }>
  [key: string]: unknown
}

export interface ExpectedEdge {
  source: string // node ID or node label
  target: string // node ID or node label
  type: UmlRelationshipType
  // For associations, direction is bidirectional/undirected
  bidirectional?: boolean
  description?: string
}

export interface SolutionOption {
  description?: string
  edges: ExpectedEdge[]
}

export interface LevelDefinition {
  id: string
  number: number
  title: string
  type: LevelType
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  category: string
  scenario: string
  goal: string
  learningObjective: string
  hints: string[]
  solutionExplanation: string
  // Initial elements on canvas
  initialNodes: Array<{
    id: string
    type: 'actor' | 'useCase' | 'boundary'
    position: { x: number; y: number }
    data: UmlNodeData
  }>
  initialEdges?: Array<{
    id: string
    source: string
    target: string
    data: UmlEdgeData
  }>
  // Nodes available in palette to drag/drop (mainly for build levels)
  paletteNodes?: Array<{
    type: 'actor' | 'useCase' | 'boundary'
    label: string
    actorType?: 'primary' | 'secondary' | 'system'
  }>
  // Allowed solutions (supports multiple valid diagrams)
  solutions: SolutionOption[]
}

export interface ValidationDiagnostic {
  type: 'missing' | 'extra' | 'wrong_type' | 'wrong_direction'
  message: string
  edge?: {
    sourceId: string
    sourceLabel: string
    targetId: string
    targetLabel: string
    actualType?: UmlRelationshipType
    expectedType?: UmlRelationshipType
  }
}

export interface ValidationResult {
  isCorrect: boolean
  matchedSolutionIndex?: number
  diagnostics: ValidationDiagnostic[]
  summary: string
  score: number // 0-100%
}

export interface LevelProgress {
  levelId: string
  completed: boolean
  stars: number // 1, 2, or 3
  attempts: number
  hintsUsed: number
  bestTimeSeconds?: number
  completedAt?: string
}
