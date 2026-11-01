import { Position } from '@xyflow/react'

export interface Point {
  x: number
  y: number
}

export interface CurveSegment {
  index: number
  start: Point
  end: Point
  mid: Point
  length: number
}

/**
 * Projects a point P onto line segment AB, returning the closest point on AB and the distance
 */
export function projectPointToSegment(
  p: Point,
  a: Point,
  b: Point
): { point: Point; dist: number } {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) {
    return { point: a, dist: Math.hypot(p.x - a.x, p.y - a.y) }
  }
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq)
  )
  const proj = { x: a.x + t * dx, y: a.y + t * dy }
  const dist = Math.hypot(p.x - proj.x, p.y - proj.y)
  return { point: proj, dist }
}

/**
 * Simplify curve points by collapsing waypoints that are colinear with their neighbors
 * (e.g. dragged onto the straight line/chord) or too close to adjacent points.
 */
export function simplifyCurvePoints(
  points: Point[],
  colinearThreshold = 3
): Point[] {
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

      // If point is within 4px of prev
      if (Math.hypot(curr.x - prev.x, curr.y - prev.y) < 4) {
        changed = true
        continue
      }

      // If point lies directly on the straight chord between prev and next
      const { dist } = projectPointToSegment(curr, prev, next)
      if (dist < colinearThreshold) {
        changed = true
        continue
      }

      res.push(curr)
    }

    const last = current[current.length - 1]
    const prev = res[res.length - 1]
    if (Math.hypot(last.x - prev.x, last.y - prev.y) >= 4 || res.length <= 1) {
      res.push(last)
    } else {
      res[res.length - 1] = last
      changed = true
    }

    current = res
  }

  return current
}

/**
 * Render a smooth continuous curve with wide rounded arcs and no sharp angles.
 * Respects source and target connection angles.
 */
export function pointsToSmoothCurve(
  points: Point[],
  sourcePos?: Position,
  targetPos?: Position,
  smoothness = 0.38
): string {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  const n = points.length

  // Tangents at ports
  let tStart: Point | null = null
  if (sourcePos === Position.Right) tStart = { x: 1, y: 0 }
  else if (sourcePos === Position.Left) tStart = { x: -1, y: 0 }
  else if (sourcePos === Position.Bottom) tStart = { x: 0, y: 1 }
  else if (sourcePos === Position.Top) tStart = { x: 0, y: -1 }

  let tEnd: Point | null = null
  if (targetPos === Position.Right) tEnd = { x: 1, y: 0 }
  else if (targetPos === Position.Left) tEnd = { x: -1, y: 0 }
  else if (targetPos === Position.Bottom) tEnd = { x: 0, y: 1 }
  else if (targetPos === Position.Top) tEnd = { x: 0, y: -1 }

  if (n === 3) {
    const p0 = points[0]
    const p1 = points[1]
    const p2 = points[2]

    const d01 = Math.hypot(p1.x - p0.x, p1.y - p0.y)
    const d12 = Math.hypot(p2.x - p1.x, p2.y - p1.y)

    // Tangent at p1 is parallel to the overall chord (p2 - p0)
    const chordX = p2.x - p0.x
    const chordY = p2.y - p0.y
    const chordLen = Math.hypot(chordX, chordY) || 1
    const tMidX = chordX / chordLen
    const tMidY = chordY / chordLen

    const hLen0 = d01 * smoothness
    const hLen1 = d12 * smoothness

    // Out of p0
    const dir0 = tStart || {
      x: (p1.x - p0.x) / (d01 || 1),
      y: (p1.y - p0.y) / (d01 || 1),
    }
    const cp0x = p0.x + dir0.x * hLen0
    const cp0y = p0.y + dir0.y * hLen0

    // Into p1 (smooth rounding)
    const cp1ax = p1.x - tMidX * hLen0
    const cp1ay = p1.y - tMidY * hLen0

    // Out of p1 (smooth rounding)
    const cp1bx = p1.x + tMidX * hLen1
    const cp1by = p1.y + tMidY * hLen1

    // Into p2
    const dir2 = tEnd || {
      x: (p2.x - p1.x) / (d12 || 1),
      y: (p2.y - p1.y) / (d12 || 1),
    }
    const cp2x = p2.x - dir2.x * hLen1
    const cp2y = p2.y - dir2.y * hLen1

    return `M ${p0.x} ${p0.y} C ${cp0x} ${cp0y}, ${cp1ax} ${cp1ay}, ${p1.x} ${p1.y} C ${cp1bx} ${cp1by}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }

  // Multi-point spline through arbitrary waypoints (>= 4 points)
  const tangents: Point[] = []
  for (let i = 0; i < n; i++) {
    if (i === 0) {
      tangents.push(
        tStart || {
          x:
            (points[1].x - points[0].x) /
            (Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) ||
              1),
          y:
            (points[1].y - points[0].y) /
            (Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) ||
              1),
        }
      )
    } else if (i === n - 1) {
      tangents.push(
        tEnd || {
          x:
            (points[n - 1].x - points[n - 2].x) /
            (Math.hypot(
              points[n - 1].x - points[n - 2].x,
              points[n - 1].y - points[n - 2].y
            ) || 1),
          y:
            (points[n - 1].y - points[n - 2].y) /
            (Math.hypot(
              points[n - 1].x - points[n - 2].x,
              points[n - 1].y - points[n - 2].y
            ) || 1),
        }
      )
    } else {
      const prev = points[i - 1]
      const next = points[i + 1]
      const dx = next.x - prev.x
      const dy = next.y - prev.y
      const len = Math.hypot(dx, dy) || 1
      tangents.push({ x: dx / len, y: dy / len })
    }
  }

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < n - 1; i++) {
    const pA = points[i]
    const pB = points[i + 1]
    const segLen = Math.hypot(pB.x - pA.x, pB.y - pA.y)
    const hLen = segLen * smoothness

    const tA = tangents[i]
    const tB = tangents[i + 1]

    const cp1x = pA.x + tA.x * hLen
    const cp1y = pA.y + tA.y * hLen
    const cp2x = pB.x - tB.x * hLen
    const cp2y = pB.y - tB.y * hLen

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pB.x} ${pB.y}`
  }

  return d
}

/**
 * Compute the full curve points sequence
 */
export function getCurvePoints(
  source: Point,
  target: Point,
  rawWaypoints?: Point[],
  curveOffset?: Point
): Point[] {
  if (rawWaypoints && rawWaypoints.length > 0) {
    return [source, ...rawWaypoints.map((p) => ({ ...p })), target]
  }

  if (curveOffset) {
    const chordMidX = (source.x + target.x) / 2
    const chordMidY = (source.y + target.y) / 2
    const apex = {
      x: chordMidX + curveOffset.x,
      y: chordMidY + curveOffset.y,
    }
    return [source, apex, target]
  }

  // Default auto-curve: initially 2 points (endpoints)
  return [source, target]
}

/**
 * Break points into segments between waypoints
 */
export function getCurveSegments(points: Point[]): CurveSegment[] {
  const segments: CurveSegment[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    segments.push({
      index: i,
      start: p1,
      end: p2,
      mid: {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      },
      length: Math.hypot(p2.x - p1.x, p2.y - p1.y),
    })
  }
  return segments
}

/**
 * Set up stable baseline topology once at drag start.
 * If dragging an existing waypoint, keeps it as active.
 * If dragging a curve segment, inserts a new bend point between p[segIndex] and p[segIndex + 1].
 */
export function prepareCurveDragTopology(
  points: Point[],
  targetType: 'waypoint' | 'segment',
  index: number,
  clickPos?: Point
): { points: Point[]; activePointIndex: number } {
  const pts = points.map((p) => ({ ...p }))

  if (targetType === 'waypoint') {
    return { points: pts, activePointIndex: index }
  }

  // Segment drag: if curve only has 2 points, insert single apex bend point
  if (pts.length === 2) {
    const mid = clickPos || {
      x: (pts[0].x + pts[1].x) / 2,
      y: (pts[0].y + pts[1].y) / 2,
    }
    return {
      points: [pts[0], mid, pts[1]],
      activePointIndex: 1,
    }
  }

  // Insert a new bend point into this segment
  const insertAt = index + 1
  const mid = clickPos || {
    x: (pts[index].x + pts[index + 1].x) / 2,
    y: (pts[index].y + pts[index + 1].y) / 2,
  }
  pts.splice(insertAt, 0, mid)
  return {
    points: pts,
    activePointIndex: insertAt,
  }
}

/**
 * Apply live dragging to baseline topology with magnetic snapping.
 * Maintains fixed array length throughout the gesture to completely prevent oscillation/jitter.
 */
export function applyCurveDrag(
  baselinePoints: Point[],
  activePointIndex: number,
  rawTarget: Point,
  isShift = false
): Point[] {
  const pts = baselinePoints.map((p) => ({ ...p }))
  if (activePointIndex <= 0 || activePointIndex >= pts.length - 1) {
    return pts
  }

  const prev = pts[activePointIndex - 1]
  const next = pts[activePointIndex + 1]

  let targetPoint = { ...rawTarget }

  if (!isShift) {
    // 1. Magnetic snap to the straight chord connecting prev and next neighbors (threshold: 8.5px)
    const { point: projPoint, dist } = projectPointToSegment(
      rawTarget,
      prev,
      next
    )
    if (dist <= 8.5) {
      targetPoint = projPoint
    } else {
      // 2. Magnetic snap to other existing waypoints if within 8.5px
      let snappedToOther = false
      for (let i = 1; i < pts.length - 1; i++) {
        if (i === activePointIndex) continue
        const other = pts[i]
        if (Math.hypot(rawTarget.x - other.x, rawTarget.y - other.y) <= 8.5) {
          targetPoint = { ...other }
          snappedToOther = true
          break
        }
      }

      if (!snappedToOther) {
        // 3. Soft magnetic snap to 16px grid within 4px
        const gridX = Math.round(rawTarget.x / 16) * 16
        const gridY = Math.round(rawTarget.y / 16) * 16
        if (Math.abs(rawTarget.x - gridX) <= 4) targetPoint.x = gridX
        if (Math.abs(rawTarget.y - gridY) <= 4) targetPoint.y = gridY
      }
    }
  }

  pts[activePointIndex] = targetPoint
  return pts
}
