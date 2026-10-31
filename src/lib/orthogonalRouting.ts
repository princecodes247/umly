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
      // Last point overlapped with prev, keep last
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
 * Magnetic snap helper: snaps to parallel segments, endpoints, or subtle grid
 */
export function snapOrthogonalCoord(
  rawCoord: number,
  isH: boolean,
  points: Point[],
  currentSegIdx: number,
  isShift: boolean
): number {
  if (isShift) return rawCoord

  // 1. Magnetic snap to other parallel segments in the route (threshold: 8px)
  let bestTarget: number | null = null
  let minDiff = 8.5

  for (let i = 0; i < points.length - 1; i++) {
    if (i === currentSegIdx) continue
    const p1 = points[i]
    const p2 = points[i + 1]
    const segIsH = Math.abs(p1.y - p2.y) < Math.abs(p1.x - p2.x)
    if (segIsH === isH) {
      const segCoord = isH ? p1.y : p1.x
      const diff = Math.abs(rawCoord - segCoord)
      if (diff < minDiff) {
        minDiff = diff
        bestTarget = segCoord
      }
    }
  }

  if (bestTarget !== null) {
    return bestTarget
  }

  // 2. Soft snap to 16px grid within 4px magnetic threshold
  const nearestGrid = Math.round(rawCoord / 16) * 16
  if (Math.abs(rawCoord - nearestGrid) <= 4) {
    return nearestGrid
  }

  // 3. Otherwise, buttery-smooth 1:1 movement
  return rawCoord
}

/**
 * Drag a segment, auto-split on endpoints, magnetically snap & auto-merge aligned segments
 */
export function dragOrthogonalSegment(
  currentPoints: Point[],
  segIndex: number,
  rawTargetCoord: number,
  sourcePos: Position,
  targetPos: Position,
  isShift = false
): { points: Point[]; activeSegIndex: number } {
  const n = currentPoints.length - 1
  if (segIndex < 0 || segIndex >= n) {
    return { points: currentPoints, activeSegIndex: segIndex }
  }

  const pStart = currentPoints[segIndex]
  const pEnd = currentPoints[segIndex + 1]
  const isH = Math.abs(pStart.y - pEnd.y) < Math.abs(pStart.x - pEnd.x)

  const targetCoord = snapOrthogonalCoord(
    rawTargetCoord,
    isH,
    currentPoints,
    segIndex,
    isShift
  )

  let nextPoints: Point[] = []

  // Interior segment: shift the segment's coordinate
  if (segIndex > 0 && segIndex < n - 1) {
    const pts = currentPoints.map((p) => ({ ...p }))
    if (isH) {
      pts[segIndex].y = targetCoord
      pts[segIndex + 1].y = targetCoord
    } else {
      pts[segIndex].x = targetCoord
      pts[segIndex + 1].x = targetCoord
    }
    nextPoints = pts
  } else if (segIndex === 0) {
    // Segment 0: connected to source node, split to introduce stub & elbow
    const pts = currentPoints.map((p) => ({ ...p }))
    if (isH) {
      const dir = sourcePos === Position.Left ? -1 : 1
      const stubLen = Math.min(28, Math.max(16, Math.abs(pts[1].x - pts[0].x) / 3))
      const stubX = pts[0].x + dir * stubLen
      const A = { x: stubX, y: pts[0].y }
      const B = { x: stubX, y: targetCoord }
      pts[1].y = targetCoord
      nextPoints = [pts[0], A, B, ...pts.slice(1)]
    } else {
      const dir = sourcePos === Position.Top ? -1 : 1
      const stubLen = Math.min(28, Math.max(16, Math.abs(pts[1].y - pts[0].y) / 3))
      const stubY = pts[0].y + dir * stubLen
      const A = { x: pts[0].x, y: stubY }
      const B = { x: targetCoord, y: stubY }
      pts[1].x = targetCoord
      nextPoints = [pts[0], A, B, ...pts.slice(1)]
    }
  } else {
    // Segment n - 1: connected to target node, split to introduce stub & elbow
    const pts = currentPoints.map((p) => ({ ...p }))
    if (isH) {
      const dir = targetPos === Position.Right ? 1 : -1
      const stubLen = Math.min(28, Math.max(16, Math.abs(pts[n].x - pts[n - 1].x) / 3))
      const stubX = pts[n].x + dir * stubLen
      pts[n - 1].y = targetCoord
      const B = { x: stubX, y: targetCoord }
      const A = { x: stubX, y: pts[n].y }
      nextPoints = [...pts.slice(0, n), B, A, pts[n]]
    } else {
      const dir = targetPos === Position.Bottom ? 1 : -1
      const stubLen = Math.min(28, Math.max(16, Math.abs(pts[n].y - pts[n - 1].y) / 3))
      const stubY = pts[n].y + dir * stubLen
      pts[n - 1].x = targetCoord
      const B = { x: targetCoord, y: stubY }
      const A = { x: pts[n].x, y: stubY }
      nextPoints = [...pts.slice(0, n), B, A, pts[n]]
    }
  }

  // Merge any aligned parallel segments automatically
  const merged = mergeColinearPoints(nextPoints)

  // Find which segment in the merged array corresponds to the segment being dragged
  let activeIdx = 0
  let found = false
  for (let i = 0; i < merged.length - 1; i++) {
    const s1 = merged[i]
    const s2 = merged[i + 1]
    const segIsH = Math.abs(s1.y - s2.y) < Math.abs(s1.x - s2.x)
    if (segIsH === isH) {
      const coord = isH ? s1.y : s1.x
      if (Math.abs(coord - targetCoord) < 1.5) {
        activeIdx = i
        found = true
        break
      }
    }
  }

  if (!found) {
    activeIdx = Math.min(segIndex, merged.length - 2)
  }

  return { points: merged, activeSegIndex: activeIdx }
}
