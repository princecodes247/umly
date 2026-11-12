export type UmlRelationshipType =
  | 'association'
  | 'include'
  | 'extend'
  | 'generalization'
  | 'aggregation'
  | 'composition'
  | 'realization'
  | 'dependency'
  | 'er'
  | 'data_flow'

export type ClassVisibility = '+' | '-' | '#' | '~'

export type ClassKind = 'class' | 'abstract' | 'interface' | 'enum'

export interface ClassAttribute {
  id: string
  visibility: ClassVisibility
  name: string
  type: string
  isStatic?: boolean
}

export interface ClassMethod {
  id: string
  visibility: ClassVisibility
  name: string
  params?: string
  returnType: string
  isStatic?: boolean
  isAbstract?: boolean
}

export type ErCardinality =
  | 'one'
  | 'one_only'
  | 'zero_or_one'
  | 'many'
  | 'zero_or_many'
  | 'one_or_many'

export interface ErAttribute {
  id: string
  name: string
  dataType: string
  isPrimaryKey?: boolean
  isForeignKey?: boolean
  isNullable?: boolean
  isUnique?: boolean
}

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
  nodeType:
    | 'actor'
    | 'useCase'
    | 'boundary'
    | 'note'
    | 'erEntity'
    | 'umlClass'
    | 'dfdProcess'
    | 'dfdDataStore'
    | 'dfdExternalEntity'
  actorType?: 'primary' | 'secondary' | 'system'
  stereotype?: string
  accentColor?: NodeAccentColor
  boundaryTitle?: string
  attributes?: ErAttribute[]
  isWeakEntity?: boolean
  isMinimized?: boolean
  classKind?: ClassKind
  classAttributes?: ClassAttribute[]
  classMethods?: ClassMethod[]
  processNumber?: string
  dataStoreId?: string
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
  erSourceCardinality?: ErCardinality
  erTargetCardinality?: ErCardinality
  erIdentifying?: boolean
  sourceMultiplicity?: string
  targetMultiplicity?: string
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
  erSourceCardinality?: ErCardinality
  erTargetCardinality?: ErCardinality
  erIdentifying?: boolean
  description?: string
}

export interface SolutionOption {
  description?: string
  edges: ExpectedEdge[]
}

export type PuzzleDiagramType = 'use_case' | 'er' | 'class' | 'dfd'

export type LevelSummary = Pick<
  LevelDefinition,
  | 'id'
  | 'number'
  | 'title'
  | 'diagramType'
  | 'type'
  | 'difficulty'
  | 'category'
  | 'scenario'
>

export interface LevelDefinition {
  id: string
  number: number
  title: string
  diagramType?: PuzzleDiagramType
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
    type: UmlNodeData['nodeType']
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
    type: UmlNodeData['nodeType']
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
