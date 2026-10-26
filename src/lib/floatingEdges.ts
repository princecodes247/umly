import { Position, type Node } from '@xyflow/react'

export type EdgeRoutingStyle = 'straight' | 'orthogonal' | 'bezier'

interface BoxMetrics {
  x: number
  y: number
  w: number
  h: number
  cx: number
  cy: number
}

export function getNodeBox(node: Node): BoxMetrics {
  const w =
    node.measured?.width ??
    (node.type === 'actor'
      ? 88
      : node.type === 'useCase'
        ? 148
        : node.type === 'boundary'
          ? (node.data?.width as number) || 440
          : 150)
  const h =
    node.measured?.height ??
    (node.type === 'actor'
      ? 108
      : node.type === 'useCase'
        ? 64
        : node.type === 'boundary'
          ? (node.data?.height as number) || 380
          : 76)

  const x = node.position.x
  const y = node.position.y
  return {
    x,
    y,
    w,
    h,
    cx: x + w / 2,
    cy: y + h / 2,
  }
}

/**
 * Computes the intersection point on the perimeter of `sourceNode` toward the center of `targetNode`.
 * Uses exact ellipse intersection for `useCase` nodes and padded rectangle intersection for `actor` / `note` nodes.
 */
export function getBorderIntersectionPoint(
  node: Node,
  targetPoint: { x: number; y: number }
): { x: number; y: number; position: Position } {
  const box = getNodeBox(node)

  // For Actors, anchor lines to the stick figure icon (36x46 at top-center) rather than the wide outer label container
  const anchorCx = box.cx
  const anchorCy = node.type === 'actor' ? box.y + 33 : box.cy

  const dx = targetPoint.x - anchorCx
  const dy = targetPoint.y - anchorCy

  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
    return { x: anchorCx, y: box.y, position: Position.Top }
  }

  // Determine cardinal Position for orthogonal/bezier tangents
  const angle = Math.atan2(dy, dx)
  const deg = (angle * 180) / Math.PI
  let position: Position = Position.Right
  if (deg >= -45 && deg <= 45) {
    position = Position.Right
  } else if (deg > 45 && deg < 135) {
    position = Position.Bottom
  } else if (deg >= -135 && deg < -45) {
    position = Position.Top
  } else {
    position = Position.Left
  }

  // Elliptical border intersection for Use Case ovals
  if (node.type === 'useCase') {
    const rx = box.w / 2 + 2
    const ry = box.h / 2 + 2
    const scale = 1 / Math.hypot(dx / rx, dy / ry)
    return {
      x: anchorCx + dx * scale,
      y: anchorCy + dy * scale,
      position,
    }
  }

  // Tight visual silhouette intersection for Actor stick figure (so lines meet the figure, not empty space)
  if (node.type === 'actor') {
    const halfW = 19
    const topH = 25
    // If line exits downward through the actor's label (e.g. Actor inheritance below), clear the label bottom
    const bottomH = dy > 0 && Math.abs(dy) > Math.abs(dx) * 1.2 ? Math.max(28, box.h - 33) : 25
    const halfH = dy >= 0 ? bottomH : topH

    const scaleX = Math.abs(dx) > 0.001 ? halfW / Math.abs(dx) : Infinity
    const scaleY = Math.abs(dy) > 0.001 ? halfH / Math.abs(dy) : Infinity
    const scale = Math.min(scaleX, scaleY)

    return {
      x: anchorCx + dx * scale,
      y: anchorCy + dy * scale,
      position,
    }
  }

  // Rectangular border intersection for Note nodes
  const halfW = box.w / 2 + 2
  const halfH = box.h / 2 + 2
  const scaleX = Math.abs(dx) > 0.001 ? halfW / Math.abs(dx) : Infinity
  const scaleY = Math.abs(dy) > 0.001 ? halfH / Math.abs(dy) : Infinity
  const scale = Math.min(scaleX, scaleY)

  return {
    x: anchorCx + dx * scale,
    y: anchorCy + dy * scale,
    position,
  }
}

/**
 * Returns floating edge endpoints `(sx, sy, tx, ty, sourcePos, targetPos)` between two nodes.
 * Applies a small parallel offset if multiple edges connect the same pair of nodes.
 */
export function getFloatingEdgeParams(
  sourceNode: Node,
  targetNode: Node,
  parallelOffset = 0
): {
  sx: number
  sy: number
  tx: number
  ty: number
  sourcePos: Position
  targetPos: Position
} {
  const sBox = getNodeBox(sourceNode)
  const tBox = getNodeBox(targetNode)

  const sAnchorX = sBox.cx
  const sAnchorY = sourceNode.type === 'actor' ? sBox.y + 33 : sBox.cy
  const tAnchorX = tBox.cx
  const tAnchorY = targetNode.type === 'actor' ? tBox.y + 33 : tBox.cy

  const dx = tAnchorX - sAnchorX
  const dy = tAnchorY - sAnchorY
  const len = Math.hypot(dx, dy) || 1
  const nx = (-dy / len) * parallelOffset
  const ny = (dx / len) * parallelOffset

  const sIntersect = getBorderIntersectionPoint(sourceNode, {
    x: tAnchorX + nx,
    y: tAnchorY + ny,
  })
  const tIntersect = getBorderIntersectionPoint(targetNode, {
    x: sAnchorX + nx,
    y: sAnchorY + ny,
  })

  return {
    sx: sIntersect.x,
    sy: sIntersect.y,
    tx: tIntersect.x,
    ty: tIntersect.y,
    sourcePos: sIntersect.position,
    targetPos: tIntersect.position,
  }
}

/**
 * Converts any handle ID on a node to its valid `type="source"` handle counterpart,
 * or `undefined` so React Flow never fails to render an edge due to a source/target handle mismatch.
 */
export function toSourceHandleId(handleId?: string | null): string | undefined {
  if (!handleId) return undefined
  switch (handleId) {
    case 'top':
    case 'top-source':
      return 'top-source'
    case 'bottom':
    case 'bottom-target':
      return 'bottom'
    case 'left':
    case 'left-source':
      return 'left-source'
    case 'right':
    case 'right-target':
      return 'right'
    default:
      return undefined
  }
}

/**
 * Converts any handle ID on a node to its valid `type="target"` handle counterpart,
 * or `undefined` so React Flow never fails to render an edge due to a source/target handle mismatch.
 */
export function toTargetHandleId(handleId?: string | null): string | undefined {
  if (!handleId) return undefined
  switch (handleId) {
    case 'top':
    case 'top-source':
      return 'top'
    case 'bottom':
    case 'bottom-target':
      return 'bottom-target'
    case 'left':
    case 'left-source':
      return 'left'
    case 'right':
    case 'right-target':
      return 'right-target'
    default:
      return undefined
  }
}


