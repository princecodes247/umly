import type { PuzzleDiagramType, UmlNodeData, UmlRelationshipType } from './game'

export interface ConceptRequirement {
  id: string
  /** Human-readable requirement shown in evaluation results */
  label: string
  /** Expected node types that satisfy this concept (empty = any) */
  acceptedNodeTypes?: Array<UmlNodeData['nodeType']>
  /** Case-insensitive keywords/aliases matched against node label, attributes, or methods */
  aliases: string[]
  /** Optional minimum attributes/methods/columns expected (for ER / Class) */
  minMembers?: number
}

export interface RelationshipRequirement {
  id: string
  label: string
  fromConceptId: string
  toConceptId: string
  acceptedTypes: UmlRelationshipType[]
  /** Whether direction matters (false for undirected associations / ER) */
  directed?: boolean
}

export interface CaseStudyReferenceNode {
  id: string
  type: UmlNodeData['nodeType']
  position: { x: number; y: number }
  data: UmlNodeData
}

export interface CaseStudyReferenceEdge {
  id: string
  source: string
  target: string
  data: Record<string, unknown>
}

export interface CaseStudy {
  id: string
  number: number
  title: string
  diagramType: PuzzleDiagramType
  difficulty: 'Beginner' | 'Easy' | 'Intermediate' | 'Advanced'
  domain: string
  /** Full multi-sentence system statement / requirements brief */
  statement: string
  /** High-level deliverables */
  deliverables: string[]
  hints: string[]
  concepts: ConceptRequirement[]
  relationships: RelationshipRequirement[]
  referenceSolution: {
    explanation: string
    nodes: CaseStudyReferenceNode[]
    edges: CaseStudyReferenceEdge[]
  }
}

export interface ConceptCheckResult {
  requirement: ConceptRequirement
  matched: boolean
  matchedNodeLabels: string[]
  memberWarning?: string
}

export interface RelationshipCheckResult {
  requirement: RelationshipRequirement
  matched: boolean
  matchedDescription?: string
}

export interface SyntaxWarning {
  id: string
  severity: 'error' | 'warning'
  message: string
}

export interface CaseStudyEvaluation {
  score: number // 0-100
  conceptResults: ConceptCheckResult[]
  relationshipResults: RelationshipCheckResult[]
  syntaxWarnings: SyntaxWarning[]
  summary: string
}

export interface CaseStudyProgress {
  caseStudyId: string
  completed: boolean
  bestScore: number
  attempts: number
  lastUpdatedAt: string
}
