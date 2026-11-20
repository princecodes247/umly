import type { Edge, Node } from '@xyflow/react'
import type { DiagramType } from './diagramStorage'
import type { UmlNodeData, UmlRelationshipType } from '../types/game'
import type {
  CaseStudy,
  CaseStudyEvaluation,
  ConceptCheckResult,
  RelationshipCheckResult,
  SyntaxWarning,
} from '../types/caseStudy'
import { validateUmlConnection } from './umlValidation'

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function singularize(word: string): string {
  if (word.endsWith('ies') && word.length > 4) {
    return `${word.slice(0, -3)}y`
  }
  if (word.endsWith('ses') || word.endsWith('xes') || word.endsWith('ches')) {
    return word.slice(0, -2)
  }
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) {
    return word.slice(0, -1)
  }
  return word
}

function getNodeSearchableText(node: Node): string {
  const data = (node.data || {}) as Partial<UmlNodeData>
  const parts: string[] = [data.label || '']

  if (Array.isArray(data.erAttributes)) {
    for (const attr of data.erAttributes) {
      parts.push(attr.name)
    }
  }
  if (Array.isArray(data.classAttributes)) {
    for (const attr of data.classAttributes) {
      parts.push(attr.name)
    }
  }
  if (Array.isArray(data.classMethods)) {
    for (const method of data.classMethods) {
      parts.push(method.name)
    }
  }

  return parts.join(' ')
}

function getNodeMemberCount(node: Node): number {
  const data = (node.data || {}) as Partial<UmlNodeData>
  const erCount = Array.isArray(data.erAttributes) ? data.erAttributes.length : 0
  const classAttrCount = Array.isArray(data.classAttributes)
    ? data.classAttributes.length
    : 0
  const classMethodCount = Array.isArray(data.classMethods)
    ? data.classMethods.length
    : 0
  return erCount + classAttrCount + classMethodCount
}

function nodeMatchesAlias(node: Node, aliases: string[]): boolean {
  const data = (node.data || {}) as Partial<UmlNodeData>
  const labelNorm = normalizeText(data.label || '')
  const labelSingular = labelNorm.split(' ').map(singularize).join(' ')
  const labelWordSet = new Set(labelNorm ? labelNorm.split(' ') : [])
  const labelSingularSet = new Set(
    labelSingular ? labelSingular.split(' ') : []
  )
  const fullTextNorm = normalizeText(getNodeSearchableText(node))

  for (const rawAlias of aliases) {
    const aliasNorm = normalizeText(rawAlias)
    if (!aliasNorm) continue
    const aliasSingular = aliasNorm.split(' ').map(singularize).join(' ')

    if (labelNorm === aliasNorm || labelSingular === aliasSingular) return true
    if (
      labelNorm.length >= 3 &&
      (labelNorm.includes(aliasNorm) ||
        labelSingular.includes(aliasSingular) ||
        aliasNorm.includes(labelNorm))
    ) {
      return true
    }

    // Only match single-word aliases against individual label words
    if (!aliasNorm.includes(' ')) {
      if (labelWordSet.has(aliasNorm) || labelSingularSet.has(aliasSingular)) {
        return true
      }
    } else if (fullTextNorm.includes(aliasNorm)) {
      return true
    }
  }

  return false
}

export function auditDiagramSyntax(
  diagramType: DiagramType,
  nodes: Node[],
  edges: Edge[]
): SyntaxWarning[] {
  const warnings: SyntaxWarning[] = []
  const nonNoteNodes = nodes.filter((n) => {
    const nt = (n.data as Partial<UmlNodeData> | undefined)?.nodeType || n.type
    return nt !== 'note' && nt !== 'boundary'
  })

  if (nonNoteNodes.length === 0) {
    warnings.push({
      id: 'empty-canvas',
      severity: 'error',
      message: 'Your canvas is empty. Add diagram elements to model the system statement.',
    })
    return warnings
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const incomingCount = new Map<string, number>()
  const outgoingCount = new Map<string, number>()

  for (const n of nodes) {
    incomingCount.set(n.id, 0)
    outgoingCount.set(n.id, 0)
  }

  for (const edge of edges) {
    const src = nodeMap.get(edge.source)
    const tgt = nodeMap.get(edge.target)
    if (!src || !tgt) continue

    outgoingCount.set(src.id, (outgoingCount.get(src.id) || 0) + 1)
    incomingCount.set(tgt.id, (incomingCount.get(tgt.id) || 0) + 1)

    const relType = (edge.data?.relationshipType as UmlRelationshipType | undefined) || undefined
    if (relType) {
      const check = validateUmlConnection(src, tgt, relType)
      if (!check.valid) {
        const srcLabel = (src.data as Partial<UmlNodeData>)?.label || src.id
        const tgtLabel = (tgt.data as Partial<UmlNodeData>)?.label || tgt.id
        warnings.push({
          id: `invalid-edge-${edge.id}`,
          severity: 'error',
          message: `${srcLabel} → ${tgtLabel}: ${check.reason || 'Invalid relationship.'}`,
          nodeId: src.id,
        })
      }
    }

    if (
      src.id === tgt.id &&
      (relType === 'generalization' || relType === 'realization')
    ) {
      const srcLabel = (src.data as Partial<UmlNodeData>)?.label || src.id
      warnings.push({
        id: `self-inheritance-${edge.id}`,
        severity: 'error',
        message: `${srcLabel} cannot inherit from or realize itself.`,
        nodeId: src.id,
      })
    }
  }

  // Disconnected node check (when >= 2 connectable nodes exist)
  if (nonNoteNodes.length >= 2) {
    for (const node of nonNoteNodes) {
      const totalDeg =
        (incomingCount.get(node.id) || 0) + (outgoingCount.get(node.id) || 0)
      if (totalDeg === 0) {
        const label = (node.data as Partial<UmlNodeData>)?.label || 'Untitled'
        warnings.push({
          id: `disconnected-${node.id}`,
          severity: 'warning',
          message: `"${label}" is disconnected from the rest of the diagram.`,
          nodeId: node.id,
        })
      }
    }
  }

  if (diagramType === 'er') {
    for (const node of nonNoteNodes) {
      const data = (node.data || {}) as Partial<UmlNodeData>
      if (data.nodeType !== 'erEntity' && node.type !== 'erEntity') continue
      const attrs = Array.isArray(data.erAttributes) ? data.erAttributes : []
      const label = data.label || 'Entity'
      if (attrs.length === 0) {
        warnings.push({
          id: `er-no-attrs-${node.id}`,
          severity: 'warning',
          message: `Entity "${label}" has no attributes yet.`,
          nodeId: node.id,
        })
      } else if (!attrs.some((a) => a.isPrimaryKey)) {
        warnings.push({
          id: `er-no-pk-${node.id}`,
          severity: 'warning',
          message: `Entity "${label}" is missing a Primary Key (PK).`,
          nodeId: node.id,
        })
      }
    }
  }

  if (diagramType === 'class') {
    for (const node of nonNoteNodes) {
      const data = (node.data || {}) as Partial<UmlNodeData>
      if (data.nodeType !== 'umlClass' && node.type !== 'umlClass') continue
      if (data.classKind === 'enum') continue
      const attrs = data.classAttributes || []
      const methods = data.classMethods || []
      if (attrs.length === 0 && methods.length === 0) {
        warnings.push({
          id: `class-empty-${node.id}`,
          severity: 'warning',
          message: `"${data.label || 'Class'}" has no attributes or methods defined.`,
          nodeId: node.id,
        })
      }
    }
  }

  if (diagramType === 'dfd') {
    for (const node of nonNoteNodes) {
      const data = (node.data || {}) as Partial<UmlNodeData>
      const nt = data.nodeType || node.type
      if (nt !== 'dfdProcess') continue
      const inc = incomingCount.get(node.id) || 0
      const out = outgoingCount.get(node.id) || 0
      const label = data.processNumber
        ? `${data.processNumber} ${data.label || 'Process'}`
        : data.label || 'Process'
      if (inc > 0 && out === 0) {
        warnings.push({
          id: `dfd-blackhole-${node.id}`,
          severity: 'warning',
          message: `Process "${label}" is a black hole (receives data but produces no output).`,
          nodeId: node.id,
        })
      } else if (inc === 0 && out > 0) {
        warnings.push({
          id: `dfd-miracle-${node.id}`,
          severity: 'warning',
          message: `Process "${label}" is a miracle (produces output with no input flow).`,
          nodeId: node.id,
        })
      }
    }
  }

  return warnings
}

export function evaluateCaseStudy(
  caseStudy: CaseStudy,
  nodes: Node[],
  edges: Edge[],
  hintsUsed = 0
): CaseStudyEvaluation {
  const syntaxWarnings = auditDiagramSyntax(caseStudy.diagramType, nodes, edges)

  // 1. Match concepts to user nodes
  const conceptToNodeIds = new Map<string, string[]>()
  const conceptResults: ConceptCheckResult[] = caseStudy.concepts.map((req) => {
    const matchedNodes = nodes.filter((node) => {
      const data = (node.data || {}) as Partial<UmlNodeData>
      const nodeType = (data.nodeType || node.type) as UmlNodeData['nodeType']
      if (
        req.acceptedNodeTypes &&
        req.acceptedNodeTypes.length > 0 &&
        !req.acceptedNodeTypes.includes(nodeType)
      ) {
        return false
      }
      return nodeMatchesAlias(node, req.aliases)
    })

    conceptToNodeIds.set(
      req.id,
      matchedNodes.map((n) => n.id)
    )

    let memberWarning: string | undefined
    if (matchedNodes.length > 0 && req.minMembers && req.minMembers > 0) {
      const maxMembers = Math.max(...matchedNodes.map(getNodeMemberCount))
      if (maxMembers < req.minMembers) {
        memberWarning = `Add at least ${req.minMembers} attributes/methods to capture all required details.`
      }
    }

    return {
      requirement: req,
      matched: matchedNodes.length > 0,
      matchedNodeLabels: matchedNodes.map(
        (n) => ((n.data as Partial<UmlNodeData>)?.label || 'Untitled')
      ),
      memberWarning,
    }
  })

  // 2. Match relationship patterns between matched concepts
  const relationshipResults: RelationshipCheckResult[] =
    caseStudy.relationships.map((req) => {
      const fromIds = new Set(conceptToNodeIds.get(req.fromConceptId) || [])
      const toIds = new Set(conceptToNodeIds.get(req.toConceptId) || [])

      const matchingEdge = edges.find((edge) => {
        const relType = edge.data?.relationshipType as
          | UmlRelationshipType
          | undefined
        if (!relType || !req.acceptedTypes.includes(relType)) return false

        const forward = fromIds.has(edge.source) && toIds.has(edge.target)
        if (forward) return true

        if (!req.directed) {
          return fromIds.has(edge.target) && toIds.has(edge.source)
        }
        return false
      })

      return {
        requirement: req,
        matched: Boolean(matchingEdge),
      }
    })

  // 3. Calculate score
  const totalConcepts = conceptResults.length
  const matchedConcepts = conceptResults.filter((c) => c.matched).length
  const totalRels = relationshipResults.length
  const matchedRels = relationshipResults.filter((r) => r.matched).length

  const errorCount = syntaxWarnings.filter((w) => w.severity === 'error').length
  const warningCount = syntaxWarnings.filter((w) => w.severity === 'warning').length

  let score = 0
  if (totalConcepts === 0 && totalRels === 0) {
    // Custom statement mode
    score =
      nodes.length >= 2 && errorCount === 0
        ? Math.max(60, 100 - warningCount * 10)
        : Math.max(0, 40 - errorCount * 20)
  } else {
    const conceptWeight = totalRels > 0 ? 55 : 90
    const relWeight = totalRels > 0 ? 35 : 0
    const syntaxWeight = 10

    const conceptScore =
      totalConcepts > 0 ? (matchedConcepts / totalConcepts) * conceptWeight : conceptWeight
    const relScore =
      totalRels > 0 ? (matchedRels / totalRels) * relWeight : relWeight
    const syntaxScore = Math.max(
      0,
      syntaxWeight - errorCount * 5 - warningCount * 2
    )

    score = Math.round(conceptScore + relScore + syntaxScore)
  }

  let summary = ''
  if (score >= 90 && errorCount === 0) {
    summary = 'Strong model! You captured the core concepts, relationships, and diagram rules.'
  } else if (score >= 70) {
    summary = 'Solid progress. Review the missing concepts or syntax hints to tighten your model.'
  } else {
    summary = 'Keep building—use the checklist below to add missing domain elements and links.'
  }

  const clampedScore = Math.max(0, Math.min(100, score))
  const stars =
    clampedScore >= 80
      ? hintsUsed === 0
        ? 3
        : hintsUsed === 1
          ? 2
          : 1
      : 0
  const offendingNodeIds = Array.from(
    new Set(
      syntaxWarnings
        .map((w) => w.nodeId)
        .filter((id): id is string => Boolean(id))
    )
  )

  return {
    score: clampedScore,
    stars,
    conceptResults,
    relationshipResults,
    syntaxWarnings,
    offendingNodeIds,
    summary,
  }
}
