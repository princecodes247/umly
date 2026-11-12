import type {
  ExpectedEdge,
  LevelDefinition,
  SolutionOption,
  UmlEdgeData,
  UmlNodeData,
  ValidationDiagnostic,
  ValidationResult,
} from '../types/game'

export interface EdgeInput {
  id: string
  source: string
  target: string
  data?: UmlEdgeData
}

export interface NodeInput {
  id: string
  data: UmlNodeData
}

export function validateLevelDiagram(
  level: LevelDefinition,
  userNodes: NodeInput[],
  userEdges: EdgeInput[]
): ValidationResult {
  const nodeMap = new Map<string, NodeInput>()
  userNodes.forEach((node) => nodeMap.set(node.id, node))

  // Find labels for quick feedback messages
  const getNodeLabel = (id: string): string => {
    return nodeMap.get(id)?.data.label || id
  }

  // If there are multiple accepted solutions, evaluate each and pick the one with highest correctness score
  let bestResult: ValidationResult | null = null

  for (let sIdx = 0; sIdx < level.solutions.length; sIdx++) {
    const solution = level.solutions[sIdx]
    const result = evaluateSingleSolution(
      solution,
      sIdx,
      userEdges,
      getNodeLabel,
      nodeMap
    )

    if (result.isCorrect) {
      return result
    }

    if (!bestResult || result.score > bestResult.score) {
      bestResult = result
    }
  }

  return (
    bestResult || {
      isCorrect: false,
      diagnostics: [
        {
          type: 'missing',
          message: 'No connections found. Connect the elements to form the use case diagram.',
        },
      ],
      summary: 'Diagram is incomplete.',
      score: 0,
    }
  )
}

function evaluateSingleSolution(
  solution: SolutionOption,
  solutionIndex: number,
  userEdges: EdgeInput[],
  getNodeLabel: (id: string) => string,
  nodeMap: Map<string, NodeInput>
): ValidationResult {
  const diagnostics: ValidationDiagnostic[] = []
  const expectedEdges = solution.edges
  const matchedUserEdgeIds = new Set<string>()

  // Helper to check match
  const matchesEdge = (
    expected: ExpectedEdge,
    actual: EdgeInput
  ): { matches: boolean; reversed: boolean; wrongType: boolean } => {
    const actualType = actual.data?.relationshipType || 'association'
    const expectedType = expected.type

    // Match by ID or label
    const sourceLabel = getNodeLabel(actual.source).toLowerCase()
    const targetLabel = getNodeLabel(actual.target).toLowerCase()
    const expSource = expected.source.toLowerCase()
    const expTarget = expected.target.toLowerCase()

    const normalDirection =
      (actual.source.toLowerCase() === expSource || sourceLabel === expSource) &&
      (actual.target.toLowerCase() === expTarget || targetLabel === expTarget)

    const reversedDirection =
      (actual.source.toLowerCase() === expTarget || sourceLabel === expTarget) &&
      (actual.target.toLowerCase() === expSource || targetLabel === expSource)

    // For association and ER relationships, connection is undirected
    if (expectedType === 'association' || expectedType === 'er') {
      if (normalDirection || reversedDirection) {
        return {
          matches: actualType === expectedType,
          reversed: false,
          wrongType: actualType !== expectedType,
        }
      }
    } else {
      // For directed relationships (include, extend, generalization, realization, dependency, aggregation, composition, data_flow): direction matters strictly
      if (normalDirection) {
        return {
          matches: actualType === expectedType,
          reversed: false,
          wrongType: actualType !== expectedType,
        }
      }
      if (reversedDirection) {
        return {
          matches: false,
          reversed: true,
          wrongType: actualType !== expectedType,
        }
      }
    }

    return { matches: false, reversed: false, wrongType: false }
  }

  // 1. Check each expected edge in this solution
  let matchedCount = 0
  for (const expected of expectedEdges) {
    let found = false

    for (const actual of userEdges) {
      if (matchedUserEdgeIds.has(actual.id)) continue

      const matchInfo = matchesEdge(expected, actual)

      if (matchInfo.matches) {
        matchedUserEdgeIds.add(actual.id)
        matchedCount++
        found = true
        break
      } else if (matchInfo.reversed) {
        matchedUserEdgeIds.add(actual.id)
        found = true

        let directionTip = ''
        if (expected.type === 'include') {
          directionTip = `«include» must point from the base use case ('${getNodeLabel(expected.source)}') to the included use case ('${getNodeLabel(expected.target)}').`
        } else if (expected.type === 'extend') {
          directionTip = `«extend» arrow points from the optional/extension use case ('${getNodeLabel(expected.source)}') back to the base use case ('${getNodeLabel(expected.target)}').`
        } else if (expected.type === 'generalization') {
          directionTip = `Generalization points from the specialized element ('${getNodeLabel(expected.source)}') to the general element ('${getNodeLabel(expected.target)}').`
        }

        diagnostics.push({
          type: 'wrong_direction',
          message: `Reversed arrow: Connection between '${getNodeLabel(actual.source)}' and '${getNodeLabel(actual.target)}' has the wrong direction. ${directionTip}`,
          edge: {
            sourceId: actual.source,
            sourceLabel: getNodeLabel(actual.source),
            targetId: actual.target,
            targetLabel: getNodeLabel(actual.target),
            actualType: actual.data?.relationshipType,
            expectedType: expected.type,
          },
        })
        break
      } else if (matchInfo.wrongType) {
        matchedUserEdgeIds.add(actual.id)
        found = true
        diagnostics.push({
          type: 'wrong_type',
          message: `Incorrect relationship between '${getNodeLabel(actual.source)}' and '${getNodeLabel(actual.target)}'. You used '${actual.data?.relationshipType}', but this scenario calls for '${expected.type}' (${expected.description || ''}).`,
          edge: {
            sourceId: actual.source,
            sourceLabel: getNodeLabel(actual.source),
            targetId: actual.target,
            targetLabel: getNodeLabel(actual.target),
            actualType: actual.data?.relationshipType,
            expectedType: expected.type,
          },
        })
        break
      }
    }

    if (!found) {
      diagnostics.push({
        type: 'missing',
        message: `Missing connection: A ${expected.type} relationship is missing between '${getNodeLabel(expected.source)}' and '${getNodeLabel(expected.target)}'. ${expected.description ? `(${expected.description})` : ''}`,
        edge: {
          sourceId: expected.source,
          sourceLabel: getNodeLabel(expected.source),
          targetId: expected.target,
          targetLabel: getNodeLabel(expected.target),
          expectedType: expected.type,
        },
      })
    }
  }

  // 2. Check for extra/spurious user edges
  for (const actual of userEdges) {
    if (!matchedUserEdgeIds.has(actual.id)) {
      const srcNode = nodeMap.get(actual.source)
      const tgtNode = nodeMap.get(actual.target)

      let extraMsg = `Unexpected connection between '${getNodeLabel(actual.source)}' and '${getNodeLabel(actual.target)}'.`
      if (srcNode?.data.nodeType === 'actor' && tgtNode?.data.nodeType === 'actor') {
        extraMsg += ` Direct associations between actors are not valid in UML use case diagrams unless modeling actor generalization.`
      } else if (
        actual.data?.relationshipType === 'include' ||
        actual.data?.relationshipType === 'extend'
      ) {
        if (srcNode?.data.nodeType === 'actor' || tgtNode?.data.nodeType === 'actor') {
          extraMsg += ` «include» and «extend» relationships can only exist between two Use Cases, never directly with an Actor.`
        }
      }

      diagnostics.push({
        type: 'extra',
        message: extraMsg,
        edge: {
          sourceId: actual.source,
          sourceLabel: getNodeLabel(actual.source),
          targetId: actual.target,
          targetLabel: getNodeLabel(actual.target),
          actualType: actual.data?.relationshipType,
        },
      })
    }
  }

  const isCorrect = diagnostics.length === 0
  const totalItems = Math.max(expectedEdges.length, 1)
  const penalty = diagnostics.length
  const score = isCorrect
    ? 100
    : Math.max(0, Math.round(((matchedCount - penalty * 0.5) / totalItems) * 100))

  let summary = ''
  if (isCorrect) {
    summary = 'Outstanding! All relationships match the specification perfectly.'
  } else {
    const missingCount = diagnostics.filter((d) => d.type === 'missing').length
    const wrongCount = diagnostics.filter(
      (d) => d.type === 'wrong_type' || d.type === 'wrong_direction'
    ).length
    const extraCount = diagnostics.filter((d) => d.type === 'extra').length

    const parts: string[] = []
    if (missingCount > 0) parts.push(`${missingCount} missing`)
    if (wrongCount > 0) parts.push(`${wrongCount} incorrect`)
    if (extraCount > 0) parts.push(`${extraCount} extra/unneeded`)

    summary = `Diagram has issues: ${parts.join(', ')}.`
  }

  return {
    isCorrect,
    matchedSolutionIndex: solutionIndex,
    diagnostics,
    summary,
    score,
  }
}
