import type { Node } from '@xyflow/react'
import type { UmlRelationshipType } from '../types/game'

/**
 * Returns the valid UML 2.5 Use Case relationship types between a source node type and target node type.
 */
export function getAllowedRelationshipTypes(
  sourceType?: string,
  targetType?: string
): UmlRelationshipType[] {
  if (!sourceType || !targetType) return []

  // System boundaries are containers, not connectable nodes
  if (sourceType === 'boundary' || targetType === 'boundary') {
    return []
  }

  // Notes can attach to any element using a plain association link
  if (sourceType === 'note' || targetType === 'note') {
    return ['association']
  }

  // Actor <-> Use Case: only Association is valid in UML 2.5
  if (
    (sourceType === 'actor' && targetType === 'useCase') ||
    (sourceType === 'useCase' && targetType === 'actor')
  ) {
    return ['association']
  }

  // Actor <-> Actor: only Generalization (inheritance) is valid in UML 2.5
  if (sourceType === 'actor' && targetType === 'actor') {
    return ['generalization']
  }

  // Use Case <-> Use Case: Include, Extend, or Generalization
  if (sourceType === 'useCase' && targetType === 'useCase') {
    return ['include', 'extend', 'generalization']
  }

  // ER Entity <-> ER Entity: ER Crow's Foot relationship
  if (sourceType === 'erEntity' && targetType === 'erEntity') {
    return ['er']
  }

  return []
}

/**
 * Automatically infers the natural UML 2.5 relationship type when connecting two nodes directly.
 * - Actor <-> Use Case -> 'association'
 * - Use Case -> Use Case -> 'include'
 * - Actor -> Actor -> 'generalization'
 * - Note <-> Any -> 'association'
 */
export function inferRelationshipType(
  sourceType?: string,
  targetType?: string
): UmlRelationshipType | null {
  const allowed = getAllowedRelationshipTypes(sourceType, targetType)
  if (allowed.length === 0) return null
  return allowed[0]
}

export interface UmlConnectionValidation {
  valid: boolean
  reason?: string
  suggestedType?: UmlRelationshipType
  allowedTypes: UmlRelationshipType[]
}

const RELATIONSHIP_LABELS: Record<UmlRelationshipType, string> = {
  association: 'Association',
  include: '«include»',
  extend: '«extend»',
  generalization: 'Generalization',
  er: 'ER Relationship',
}

const NODE_TYPE_LABELS: Record<string, string> = {
  actor: 'Actor',
  useCase: 'Use Case',
  boundary: 'System Boundary',
  note: 'Note',
  erEntity: 'Entity',
}

/**
 * Validates whether a requested UML relationship type is logically valid between two nodes.
 */
export function validateUmlConnection(
  sourceNode: Node | undefined,
  targetNode: Node | undefined,
  requestedType: UmlRelationshipType
): UmlConnectionValidation {
  if (!sourceNode || !targetNode) {
    return {
      valid: false,
      reason: 'Both source and target elements must exist.',
      allowedTypes: [],
    }
  }

  if (sourceNode.id === targetNode.id) {
    return {
      valid: false,
      reason: 'An element cannot connect to itself.',
      allowedTypes: [],
    }
  }

  const sType = sourceNode.type
  const tType = targetNode.type
  const allowedTypes = getAllowedRelationshipTypes(sType, tType)

  if (allowedTypes.length === 0) {
    return {
      valid: false,
      reason: `Cannot connect a ${NODE_TYPE_LABELS[sType || ''] || 'node'} to a ${NODE_TYPE_LABELS[tType || ''] || 'node'}.`,
      allowedTypes: [],
    }
  }

  if (allowedTypes.includes(requestedType)) {
    return {
      valid: true,
      allowedTypes,
    }
  }

  const suggestedType = allowedTypes[0]

  // Build specific, educational UML 2.5 error message
  if (
    (requestedType === 'include' || requestedType === 'extend') &&
    (sType === 'actor' || tType === 'actor')
  ) {
    return {
      valid: false,
      reason: `${RELATIONSHIP_LABELS[requestedType]} can only connect two Use Cases. An Actor cannot be included or extended—use Association instead.`,
      suggestedType,
      allowedTypes,
    }
  }

  if (requestedType === 'generalization' && sType !== tType) {
    return {
      valid: false,
      reason:
        'Generalization (inheritance) can only connect two elements of the same type (Actor → Actor or Use Case → Use Case).',
      suggestedType,
      allowedTypes,
    }
  }

  if (
    requestedType === 'association' &&
    sType === 'useCase' &&
    tType === 'useCase'
  ) {
    return {
      valid: false,
      reason:
        'Two Use Cases cannot be linked with a plain Association. Use «include», «extend», or Generalization.',
      suggestedType: 'include',
      allowedTypes,
    }
  }

  if (
    requestedType === 'association' &&
    sType === 'actor' &&
    tType === 'actor'
  ) {
    return {
      valid: false,
      reason:
        'Two Actors cannot be linked with a plain Association. Use Generalization for Actor inheritance.',
      suggestedType: 'generalization',
      allowedTypes,
    }
  }

  return {
    valid: false,
    reason: `${RELATIONSHIP_LABELS[requestedType]} is not valid between ${NODE_TYPE_LABELS[sType || ''] || sType} and ${NODE_TYPE_LABELS[tType || ''] || tType}.`,
    suggestedType,
    allowedTypes,
  }
}

