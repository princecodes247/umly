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
 * Remove colinear points, zero-length segments, and merge aligned parallel segments
 */
export function mergeColinearPoints(points: Point[]): Point[] {
  if (points.length <= 2) return points

  let current = points.map((p) => ({ ...p }))
  let changed = true
  let iterations = 0

  while (changed && iterations < 10) {
    changed = false
    iterations++
    const res: Point[] = [current[0]]

    for (let i = 1; i < current.length - 1; i++) {
      const prev = res[res.length - 1]
      const curr = current[i]
      const next = current[i + 1]

      // Zero-length segment (curr is at prev)
      if (Math.hypot(curr.x - prev.x, curr.y - prev.y) < 1.5) {
        changed = true
        continue
      }

      // Colinear: prev -> curr -> next in a straight horizontal or vertical line
      const isH =
        Math.abs(prev.y - curr.y) < 1.5 && Math.abs(curr.y - next.y) < 1.5
      const isV =
        Math.abs(prev.x - curr.x) < 1.5 && Math.abs(curr.x - next.x) < 1.5
      if (isH || isV) {
        changed = true
        continue
      }

      res.push(curr)
    }

    const last = current[current.length - 1]
    const prev = res[res.length - 1]
    if (Math.hypot(last.x - prev.x, last.y - prev.y) >= 1.5 || res.length <= 1) {
      res.push(last)
    } else {
      res[res.length - 1] = last
      changed = true
    }

    current = res
  }

  return current
}

export const simplifyPoints = mergeColinearPoints

/**
 * Render smooth rounded corners (matching getSmoothStepPath)
 */
export function pointsToSmoothSvgPath(
  points: Point[],
  borderRadius = 8
): string {
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
    const isVertMiddle =
      sourcePos === Position.Left || sourcePos === Position.Right
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

  return mergeColinearPoints(pts)
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
 * Establish stable baseline polyline topology once when a drag session begins
 */
export function prepareDragTopology(
  points: Point[],
  segIndex: number,
  sourcePos: Position,
  targetPos: Position
): { points: Point[]; activeSegIndex: number } {
  const n = points.length - 1
  if (segIndex < 0 || segIndex >= n) {
    return { points: points.map((p) => ({ ...p })), activeSegIndex: segIndex }
  }

  // Interior segment: keep topology as-is
  if (segIndex > 0 && segIndex < n - 1) {
    return { points: points.map((p) => ({ ...p })), activeSegIndex: segIndex }
  }

  // Segment 0: split into stub + elbow + dragged segment
  if (segIndex === 0) {
    const pts = points.map((p) => ({ ...p }))
    const isH = Math.abs(pts[0].y - pts[1].y) < Math.abs(pts[0].x - pts[1].x)
    if (isH) {
      const dir = sourcePos === Position.Left ? -1 : 1
      const stubLen = Math.min(28, Math.max(16, Math.abs(pts[1].x - pts[0].x) / 3))
      const stubX = pts[0].x + dir * stubLen
      const A = { x: stubX, y: pts[0].y }
      const B = { x: stubX, y: pts[1].y }
      return {
        points: [pts[0], A, B, ...pts.slice(1)],
        activeSegIndex: 2,
      }
    } else {
      const dir = sourcePos === Position.Top ? -1 : 1
      const stubLen = Math.min(28, Math.max(16, Math.abs(pts[1].y - pts[0].y) / 3))
      const stubY = pts[0].y + dir * stubLen
      const A = { x: pts[0].x, y: stubY }
      const B = { x: pts[1].x, y: stubY }
      return {
        points: [pts[0], A, B, ...pts.slice(1)],
        activeSegIndex: 2,
      }
    }
  }

  // Segment n - 1: split into dragged segment + elbow + stub
  if (segIndex === n - 1) {
    const pts = points.map((p) => ({ ...p }))
    const isH = Math.abs(pts[n - 1].y - pts[n].y) < Math.abs(pts[n - 1].x - pts[n].x)
    if (isH) {
      const dir = targetPos === Position.Right ? 1 : -1
      const stubLen = Math.min(28, Math.max(16, Math.abs(pts[n].x - pts[n - 1].x) / 3))
      const stubX = pts[n].x + dir * stubLen
      const B = { x: stubX, y: pts[n - 1].y }
      const A = { x: stubX, y: pts[n].y }
      return {
        points: [...pts.slice(0, n), B, A, pts[n]],
        activeSegIndex: segIndex,
      }
    } else {
      const dir = targetPos === Position.Bottom ? 1 : -1
      const stubLen = Math.min(28, Math.max(16, Math.abs(pts[n].y - pts[n - 1].y) / 3))
      const stubY = pts[n].y + dir * stubLen
      const B = { x: pts[n - 1].x, y: stubY }
      const A = { x: pts[n].x, y: stubY }
      return {
        points: [...pts.slice(0, n), B, A, pts[n]],
        activeSegIndex: segIndex,
      }
    }
  }

  return { points: points.map((p) => ({ ...p })), activeSegIndex: segIndex }
}

/**
 * Apply live dragging to baseline topology with magnetic snapping.
 * Maintains fixed array length throughout the gesture to completely prevent oscillation/jitter.
 */
export function applySegmentDrag(
  baselinePoints: Point[],
  activeSegIndex: number,
  rawTargetCoord: number,
  isShift = false
): Point[] {
  const pts = baselinePoints.map((p) => ({ ...p }))
  const p1 = pts[activeSegIndex]
  const p2 = pts[activeSegIndex + 1]
  if (!p1 || !p2) return pts

  const isH = Math.abs(p1.y - p2.y) < Math.abs(p1.x - p2.x)

  let targetCoord = rawTargetCoord

  if (!isShift) {
    let minDiff = 8.5
    let bestSnap: number | null = null

    // Magnetic alignment snap to other parallel segments
    for (let i = 0; i < pts.length - 1; i++) {
      if (i === activeSegIndex) continue
      const s1 = pts[i]
      const s2 = pts[i + 1]
      const segIsH = Math.abs(s1.y - s2.y) < Math.abs(s1.x - s2.x)
      if (segIsH === isH) {
        const segCoord = isH ? s1.y : s1.x
        const diff = Math.abs(rawTargetCoord - segCoord)
        if (diff < minDiff) {
          minDiff = diff
          bestSnap = segCoord
        }
      }
    }

    if (bestSnap !== null) {
      targetCoord = bestSnap
    } else {
      // Soft magnetic snap to 16px grid within 4px
      const nearestGrid = Math.round(rawTargetCoord / 16) * 16
      if (Math.abs(rawTargetCoord - nearestGrid) <= 4) {
        targetCoord = nearestGrid
      }
    }
  }

  if (isH) {
    p1.y = targetCoord
    p2.y = targetCoord
  } else {
    p1.x = targetCoord
    p2.x = targetCoord
  }

  return pts
}
