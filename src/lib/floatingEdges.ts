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
/**
 * Returns the 4 handle coordinates `(top, right, bottom, left)` for a node.
 * For `actor` nodes, the handles sit directly on the stick figure body:
 * - top: head `(cx, y + 12)`
 * - left: left hand `(cx - 12, y + 30)`
 * - right: right hand `(cx + 12, y + 30)`
 * - bottom: feet `(cx, y + 53)`
 */
export function getNodeHandles(
  node: Node
): Record<Position, { x: number; y: number; position: Position }> {
  const box = getNodeBox(node)

  if (node.type === 'actor') {
    const isSystemActor = node.data?.actorType === 'system'
    const armHalfSpan = isSystemActor ? 18 : 12
    return {
      [Position.Top]: {
        x: box.cx,
        y: box.y + 12,
        position: Position.Top,
      },
      [Position.Left]: {
        x: box.cx - armHalfSpan,
        y: box.y + 30,
        position: Position.Left,
      },
      [Position.Right]: {
        x: box.cx + armHalfSpan,
        y: box.y + 30,
        position: Position.Right,
      },
      [Position.Bottom]: {
        x: box.cx,
        y: box.y + 53,
        position: Position.Bottom,
      },
    }
  }

  return {
    [Position.Top]: {
      x: box.cx,
      y: box.y,
      position: Position.Top,
    },
    [Position.Right]: {
      x: box.x + box.w,
      y: box.cy,
      position: Position.Right,
    },
    [Position.Bottom]: {
      x: box.cx,
      y: box.y + box.h,
      position: Position.Bottom,
    },
    [Position.Left]: {
      x: box.x,
      y: box.cy,
      position: Position.Left,
    },
  }
}

/**
 * Selects the handle on `node` that best faces `targetPoint`, so relationships always
 * originate and terminate directly at a node handle.
 */
export function getBorderIntersectionPoint(
  node: Node,
  targetPoint: { x: number; y: number }
): { x: number; y: number; position: Position } {
  const box = getNodeBox(node)
  const handles = getNodeHandles(node)

  const anchorCx = box.cx
  const anchorCy = node.type === 'actor' ? box.y + 30 : box.cy

  const dx = targetPoint.x - anchorCx
  const dy = targetPoint.y - anchorCy

  // For wide Use Case ovals, weight horizontal vs vertical distance by aspect ratio so top/bottom handles are chosen naturally when above/below
  const aspect = node.type === 'useCase' ? (box.w / Math.max(box.h, 1)) * 0.75 : 1.15

  if (Math.abs(dx) >= Math.abs(dy) * aspect) {
    return dx >= 0 ? handles[Position.Right] : handles[Position.Left]
  }
  return dy >= 0 ? handles[Position.Bottom] : handles[Position.Top]
}

/**
 * Returns floating edge endpoints `(sx, sy, tx, ty, sourcePos, targetPos)` between two nodes.
 * Applies a small parallel offset if multiple edges connect the same pair of nodes.
 */
export function getFloatingEdgeParams(
  sourceNode: Node,
  targetNode: Node,
  parallelOffset = 0,
  sourceHandle?: string | null,
  targetHandle?: string | null
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

  const sHandles = getNodeHandles(sourceNode)
  const tHandles = getNodeHandles(targetNode)

  const parseHandlePosition = (handleId?: string | null): Position | null => {
    if (!handleId || handleId === 'auto') return null
    const clean = handleId.replace(/-source|-target$/, '')
    if (clean === 'top') return Position.Top
    if (clean === 'right') return Position.Right
    if (clean === 'bottom') return Position.Bottom
    if (clean === 'left') return Position.Left
    return null
  }

  const sPos = parseHandlePosition(sourceHandle)
  const tPos = parseHandlePosition(targetHandle)

  const sIntersect =
    sPos && sHandles[sPos]
      ? sHandles[sPos]
      : getBorderIntersectionPoint(sourceNode, {
          x: tAnchorX + nx,
          y: tAnchorY + ny,
        })

  const tIntersect =
    tPos && tHandles[tPos]
      ? tHandles[tPos]
      : getBorderIntersectionPoint(targetNode, {
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


