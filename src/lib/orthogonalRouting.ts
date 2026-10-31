import { Position } from '@xyflow/react'

export interface Point {
  x: number
  y: number
}

export interface OrthogonalSegment {
  index: number
  start: Point
  end: Point
  mid: Point
  isHorizontal: boolean
  length: number
}

/**
 * Remove colinear points and duplicate consecutive points
 */
export function simplifyPoints(points: Point[]): Point[] {
  if (points.length <= 2) return points
  const res: Point[] = [points[0]]
  for (let i = 1; i < points.length - 1; i++) {
    const prev = res[res.length - 1]
    const curr = points[i]
    const next = points[i + 1]

    const isH = Math.abs(prev.y - curr.y) < 1 && Math.abs(curr.y - next.y) < 1
    const isV = Math.abs(prev.x - curr.x) < 1 && Math.abs(curr.x - next.x) < 1
    if (isH || isV) continue
    if (Math.hypot(curr.x - prev.x, curr.y - prev.y) < 2) continue
    res.push(curr)
  }
  res.push(points[points.length - 1])
  return res
}

/**
 * Render smooth rounded corners (identical to getSmoothStepPath)
 */
export function pointsToSmoothSvgPath(points: Point[], borderRadius = 8): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]

    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y }
    const v2 = { x: next.x - curr.x, y: next.y - curr.y }
    const len1 = Math.hypot(v1.x, v1.y)
    const len2 = Math.hypot(v2.x, v2.y)
    if (len1 === 0 || len2 === 0) continue

    const d1 = { x: v1.x / len1, y: v1.y / len1 }
    const d2 = { x: v2.x / len2, y: v2.y / len2 }

    const actualR = Math.min(borderRadius, len1 / 2, len2 / 2)
    const cStart = { x: curr.x - d1.x * actualR, y: curr.y - d1.y * actualR }
    const cEnd = { x: curr.x + d2.x * actualR, y: curr.y + d2.y * actualR }

    d += ` L ${cStart.x} ${cStart.y} Q ${curr.x} ${curr.y} ${cEnd.x} ${cEnd.y}`
  }
  const last = points[points.length - 1]
  d += ` L ${last.x} ${last.y}`
  return d
}

/**
 * Compute the full sequence of orthogonal points connecting source to target
 */
export function getOrthogonalPoints(
  source: Point,
  target: Point,
  sourcePos: Position,
  targetPos: Position,
  rawWaypoints?: Point[],
  orthogonalOffset?: number
): Point[] {
  const sx = source.x
  const sy = source.y
  const tx = target.x
  const ty = target.y

  if (!rawWaypoints || rawWaypoints.length === 0) {
    const isVertMiddle = sourcePos === Position.Left || sourcePos === Position.Right
    if (isVertMiddle) {
      const defaultSplit = (sx + tx) / 2
      const splitX = defaultSplit + (orthogonalOffset ?? 0)
      return [
        { x: sx, y: sy },
        { x: splitX, y: sy },
        { x: splitX, y: ty },
        { x: tx, y: ty },
      ]
    } else {
      const defaultSplit = (sy + ty) / 2
      const splitY = defaultSplit + (orthogonalOffset ?? 0)
      return [
        { x: sx, y: sy },
        { x: sx, y: splitY },
        { x: tx, y: splitY },
        { x: tx, y: ty },
      ]
    }
  }

  // Connect endpoints orthogonally to rawWaypoints
  const pts = [
    { x: sx, y: sy },
    ...rawWaypoints.map((p) => ({ ...p })),
    { x: tx, y: ty },
  ]

  // Align first waypoint to exit orthogonally from source
  if (sourcePos === Position.Left || sourcePos === Position.Right) {
    pts[1].y = sy
  } else {
    pts[1].x = sx
  }

  // Align last waypoint to enter orthogonally into target
  const n = pts.length - 1
  if (targetPos === Position.Left || targetPos === Position.Right) {
    pts[n - 1].y = ty
  } else {
    pts[n - 1].x = tx
  }

  return pts
}

/**
 * Break points into individual segments with midpoints and orientations
 */
export function getOrthogonalSegments(points: Point[]): OrthogonalSegment[] {
  const segments: OrthogonalSegment[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    const isH = Math.abs(p1.y - p2.y) < Math.abs(p1.x - p2.x)
    segments.push({
      index: i,
      start: p1,
      end: p2,
      mid: {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      },
      isHorizontal: isH,
      length: Math.hypot(p2.x - p1.x, p2.y - p1.y),
    })
  }
  return segments
}

/**
 * Drag a segment and return the updated points along with the new active segment index
 */
export function dragOrthogonalSegment(
  currentPoints: Point[],
  segIndex: number,
  targetCoord: number,
  sourcePos: Position,
  targetPos: Position
): { points: Point[]; activeSegIndex: number } {
  const n = currentPoints.length - 1
  if (segIndex < 0 || segIndex >= n) {
    return { points: currentPoints, activeSegIndex: segIndex }
  }

  // Interior segment: simply shift the segment's coordinate
  if (segIndex > 0 && segIndex < n - 1) {
    const pts = currentPoints.map((p) => ({ ...p }))
    const isH = Math.abs(pts[segIndex].y - pts[segIndex + 1].y) < Math.abs(pts[segIndex].x - pts[segIndex + 1].x)
    if (isH) {
      pts[segIndex].y = targetCoord
      pts[segIndex + 1].y = targetCoord
    } else {
      pts[segIndex].x = targetCoord
      pts[segIndex + 1].x = targetCoord
    }
    return { points: pts, activeSegIndex: segIndex }
  }

  // Segment 0: connected to source node, split to introduce stub & elbow
  if (segIndex === 0) {
    const isH = Math.abs(currentPoints[0].y - currentPoints[1].y) < Math.abs(currentPoints[0].x - currentPoints[1].x)
    const pts = currentPoints.map((p) => ({ ...p }))
    if (isH) {
      const dir = sourcePos === Position.Left ? -1 : 1
      const stubLen = Math.min(28, Math.max(16, Math.abs(pts[1].x - pts[0].x) / 3))
      const stubX = pts[0].x + dir * stubLen
      const A = { x: stubX, y: pts[0].y }
      const B = { x: stubX, y: targetCoord }
      pts[1].y = targetCoord
      return {
        points: [pts[0], A, B, ...pts.slice(1)],
        activeSegIndex: 2,
      }
    } else {
      const dir = sourcePos === Position.Top ? -1 : 1
      const stubLen = Math.min(28, Math.max(16, Math.abs(pts[1].y - pts[0].y) / 3))
      const stubY = pts[0].y + dir * stubLen
      const A = { x: pts[0].x, y: stubY }
      const B = { x: targetCoord, y: stubY }
      pts[1].x = targetCoord
      return {
        points: [pts[0], A, B, ...pts.slice(1)],
        activeSegIndex: 2,
      }
    }
  }

  // Segment n - 1: connected to target node, split to introduce stub & elbow
  if (segIndex === n - 1) {
    const isH = Math.abs(currentPoints[n - 1].y - currentPoints[n].y) < Math.abs(currentPoints[n - 1].x - currentPoints[n].x)
    const pts = currentPoints.map((p) => ({ ...p }))
    if (isH) {
      const dir = targetPos === Position.Right ? 1 : -1
      const stubLen = Math.min(28, Math.max(16, Math.abs(pts[n].x - pts[n - 1].x) / 3))
      const stubX = pts[n].x + dir * stubLen
      pts[n - 1].y = targetCoord
      const B = { x: stubX, y: targetCoord }
      const A = { x: stubX, y: pts[n].y }
      return {
        points: [...pts.slice(0, n), B, A, pts[n]],
        activeSegIndex: segIndex,
      }
    } else {
      const dir = targetPos === Position.Bottom ? 1 : -1
      const stubLen = Math.min(28, Math.max(16, Math.abs(pts[n].y - pts[n - 1].y) / 3))
      const stubY = pts[n].y + dir * stubLen
      pts[n - 1].x = targetCoord
      const B = { x: targetCoord, y: stubY }
      const A = { x: pts[n].x, y: stubY }
      return {
        points: [...pts.slice(0, n), B, A, pts[n]],
        activeSegIndex: segIndex,
      }
    }
  }

  return { points: currentPoints, activeSegIndex: segIndex }
}

