import { Position, type Node, type Edge } from '@xyflow/react'
import type { UmlNodeData, UmlEdgeData, ErAttribute } from '../types/game'
import {
  getNodeBox,
  toSourceHandleId,
  toTargetHandleId,
} from './floatingEdges'

function computeErEntitySize(node: Node): { w: number; h: number } {
  const d = (node.data || {}) as Partial<UmlNodeData>
  const label = String(d.label || 'Entity')
  if (d.isMinimized) {
    const w =
      Math.ceil(Math.max(190, Math.min(340, label.length * 7.5 + 64)) / 10) *
      10
    return { w, h: 44 }
  }
  if (node.type === 'umlClass') {
    const cAttrs = Array.isArray(d.classAttributes) ? d.classAttributes : []
    const cMethods = Array.isArray(d.classMethods) ? d.classMethods : []
    const stereoExtra = d.classKind && d.classKind !== 'class' ? 16 : 0
    let maxRowW = label.length * 7.8 + 64
    for (const a of cAttrs) {
      const rw = ((a.name?.length || 0) + (a.type?.length || 0) + 5) * 6.8 + 32
      if (rw > maxRowW) maxRowW = rw
    }
    for (const m of cMethods) {
      const rw =
        ((m.name?.length || 0) +
          (m.params?.length || 0) +
          (m.returnType?.length || 0) +
          7) *
          6.8 +
        32
      if (rw > maxRowW) maxRowW = rw
    }
    const w = Math.ceil(Math.max(210, Math.min(340, maxRowW)) / 10) * 10
    const attrH = Math.max(1, cAttrs.length) * 24
    const methodH = d.classKind === 'enum' ? 0 : Math.max(1, cMethods.length) * 24
    const h = Math.ceil(Math.max(110, 44 + stereoExtra + attrH + methodH) / 10) * 10
    return { w, h }
  }
  const attrs: ErAttribute[] = Array.isArray(d.attributes) ? d.attributes : []
  const weakExtra = d.isWeakEntity ? 44 : 0
  const titleW = label.length * 7.5 + 64 + weakExtra

  let maxAttrW = 0
  for (const attr of attrs) {
    const keyBadgeW = attr.isPrimaryKey ? 38 : attr.isForeignKey ? 28 : 16
    const uqBadgeW = attr.isUnique && !attr.isPrimaryKey ? 26 : 0
    const rowW =
      (attr.name?.length || 0) * 6.8 +
      (attr.dataType?.length || 0) * 6.4 +
      keyBadgeW +
      uqBadgeW +
      36
    if (rowW > maxAttrW) maxAttrW = rowW
  }

  const w =
    Math.ceil(Math.max(210, Math.min(340, Math.max(titleW, maxAttrW))) / 10) *
    10
  const h =
    Math.ceil(
      Math.max(90, 38 + Math.max(1, attrs.length) * 26 + 6) / 10
    ) * 10

  return { w, h }
}

const ALL_PORTS: Position[] = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
]

function pickBestPort(
  nodeId: string,
  ux: number,
  uy: number,
  portUsage: Map<string, Map<Position, number>>
): Position {
  let counts = portUsage.get(nodeId)
  if (!counts) {
    counts = new Map<Position, number>()
    portUsage.set(nodeId, counts)
  }

  const scoreFor = (pos: Position): number => {
    switch (pos) {
      case Position.Top:
        return -uy
      case Position.Right:
        return ux
      case Position.Bottom:
        return uy
      case Position.Left:
        return -ux
    }
  }

  let best = ALL_PORTS[0]
  let bestCount = counts.get(best) ?? 0
  let bestScore = scoreFor(best)

  for (let i = 1; i < ALL_PORTS.length; i++) {
    const pos = ALL_PORTS[i]
    const c = counts.get(pos) ?? 0
    const s = scoreFor(pos)
    if (c < bestCount || (c === bestCount && s > bestScore)) {
      best = pos
      bestCount = c
      bestScore = s
    }
  }

  counts.set(best, bestCount + 1)
  return best
}

/**
 * Recomputes optimal sourceHandle / targetHandle connections for edges after nodes
 * have been repositioned/resized, distributing connections across unused ports before
 * reusing any port, and clears stale manual routing overrides.
 */
export function computeTidyEdges(tidiedNodes: Node[], edges: Edge[]): Edge[] {
  const nodeMap = new Map(tidiedNodes.map((n) => [n.id, n]))
  const portUsage = new Map<string, Map<Position, number>>()

  return edges.map((edge) => {
    const sNode = nodeMap.get(edge.source)
    const tNode = nodeMap.get(edge.target)
    if (!sNode || !tNode) return edge

    const sBox = getNodeBox(sNode)
    const tBox = getNodeBox(tNode)
    const dx = tBox.cx - sBox.cx
    const dy = tBox.cy - sBox.cy
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len
    const uy = dy / len

    const sourcePos = pickBestPort(edge.source, ux, uy, portUsage)
    const targetPos = pickBestPort(edge.target, -ux, -uy, portUsage)

    const nextData = { ...(edge.data || {}) } as Record<string, unknown>
    delete nextData.orthogonalOffset
    delete nextData.curveOffset
    delete nextData.waypoints

    return {
      ...edge,
      sourceHandle: toSourceHandleId(sourcePos),
      targetHandle: toTargetHandleId(targetPos),
      data: nextData,
    }
  })
}

/**
 * Deterministic layered auto-layout ("Tidy Up") for UML 2.5 Use Case diagrams
 * and ER diagrams.
 */
export function computeTidyLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes

  const erEntities = nodes.filter(
    (n) => n.type === 'erEntity' || n.type === 'umlClass'
  )
  if (erEntities.length > 0) {
    const boundaries = nodes.filter((n) => n.type === 'boundary')
    const notes = nodes.filter((n) => n.type === 'note')
    const cols = Math.max(1, Math.min(3, Math.ceil(Math.sqrt(erEntities.length))))
    const hGap = 100
    const vGap = 90
    const startX = 120
    const startY = 120

    const sorted = [...erEntities].sort((a, b) =>
      Math.abs(a.position.y - b.position.y) < 40
        ? a.position.x - b.position.x
        : a.position.y - b.position.y
    )

    const sized = sorted.map((n) => ({
      node: n,
      size: computeErEntitySize(n),
    }))

    const rows = Math.ceil(sized.length / cols)
    const colWidths = Array.from({ length: cols }, () => 220)
    const rowHeights = Array.from({ length: rows }, () => 120)

    sized.forEach(({ size }, idx) => {
      const col = idx % cols
      const row = Math.floor(idx / cols)
      if (size.w > colWidths[col]) colWidths[col] = size.w
      if (size.h > rowHeights[row]) rowHeights[row] = size.h
    })

    const colX: number[] = []
    let accX = startX
    for (let c = 0; c < cols; c++) {
      colX.push(accX)
      accX += colWidths[c] + hGap
    }

    const rowY: number[] = []
    let accY = startY
    for (let r = 0; r < rows; r++) {
      rowY.push(accY)
      accY += rowHeights[r] + vGap
    }

    const positionedEntities = sized.map(({ node, size }, idx) => {
      const col = idx % cols
      const row = Math.floor(idx / cols)
      return {
        ...node,
        position: {
          x: Math.round(colX[col]),
          y: Math.round(rowY[row]),
        },
        data: {
          ...node.data,
          width: size.w,
          ...(node.data?.isMinimized ? {} : { height: size.h }),
        },
      }
    })

    const totalW = accX - hGap - startX
    const totalH = accY - vGap - startY

    const positionedBoundaries = boundaries.map((b, idx) => ({
      ...b,
      position: { x: startX - 50 + idx * 20, y: startY - 60 + idx * 20 },
      data: {
        ...b.data,
        width: Math.max(440, totalW + 100),
        height: Math.max(320, totalH + 110),
      },
    }))

    const positionedNotes = notes.map((n, idx) => ({
      ...n,
      position: {
        x: Math.round(startX + totalW + 80),
        y: Math.round(startY + idx * 110),
      },
    }))

    const posMap = new Map(
      [...positionedEntities, ...positionedBoundaries, ...positionedNotes].map(
        (n) => [n.id, n]
      )
    )
    return nodes.map((n) => posMap.get(n.id) || n)
  }

  const boundaries = nodes.filter((n) => n.type === 'boundary')
  const useCases = nodes.filter((n) => n.type === 'useCase')
  const actors = nodes.filter((n) => n.type === 'actor')
  const notes = nodes.filter((n) => n.type === 'note')

  const primaryActors = actors.filter((a) => {
    const d = a.data as unknown as UmlNodeData
    return !d.actorType || d.actorType === 'primary'
  })
  const rightActors = actors.filter((a) => {
    const d = a.data as unknown as UmlNodeData
    return d.actorType === 'secondary' || d.actorType === 'system'
  })

  // Build adjacency lookups
  const ucIds = new Set(useCases.map((u) => u.id))
  const rightActorIds = new Set(rightActors.map((a) => a.id))

  // Determine Use Case column rank:
  // Rank 0 = base use cases (connected to primary actors, or not strictly secondary)
  // Rank 1 = included / extending / secondary-actor-only use cases
  const ucRank = new Map<string, number>()
  useCases.forEach((u) => ucRank.set(u.id, 0))

  edges.forEach((e) => {
    const rel = (e.data as unknown as UmlEdgeData)?.relationshipType || 'association'
    if (ucIds.has(e.source) && ucIds.has(e.target)) {
      if (rel === 'include') {
        // source includes target -> target goes to rank 1
        ucRank.set(e.target, 1)
      } else if (rel === 'extend') {
        // source extends target -> source (extending uc) goes to rank 1
        ucRank.set(e.source, 1)
      }
    }
  })

  // If a use case is ONLY connected to secondary/system actors and no primary actors, prefer rank 1 if rank 0 is non-empty
  const hasRank0 = Array.from(ucRank.values()).some((r) => r === 0)
  if (hasRank0 && useCases.length > 3) {
    useCases.forEach((u) => {
      const connectedEdges = edges.filter(
        (e) => e.source === u.id || e.target === u.id
      )
      const touchesRightOnly =
        connectedEdges.length > 0 &&
        connectedEdges.every(
          (e) => rightActorIds.has(e.source) || rightActorIds.has(e.target)
        )
      if (touchesRightOnly) {
        ucRank.set(u.id, 1)
      }
    })
  }

  let col0 = useCases.filter((u) => (ucRank.get(u.id) ?? 0) === 0)
  let col1 = useCases.filter((u) => (ucRank.get(u.id) ?? 0) === 1)

  if (col0.length === 0 && col1.length > 0) {
    col0 = col1
    col1 = []
  }

  // Initial Y ordering by current vertical position
  col0.sort((a, b) => a.position.y - b.position.y)
  col1.sort((a, b) => a.position.y - b.position.y)
  primaryActors.sort((a, b) => a.position.y - b.position.y)
  rightActors.sort((a, b) => a.position.y - b.position.y)

  const tempY = new Map<string, number>()
  col0.forEach((u, i) => tempY.set(u.id, i * 100))
  col1.forEach((u, i) => tempY.set(u.id, i * 100))
  primaryActors.forEach((a, i) => tempY.set(a.id, i * 130))
  rightActors.forEach((a, i) => tempY.set(a.id, i * 130))

  const getNeighbors = (id: string) => {
    const res: string[] = []
    edges.forEach((e) => {
      if (e.source === id) res.push(e.target)
      else if (e.target === id) res.push(e.source)
    })
    return res
  }

  // 2 passes of barycenter sorting to untangle crossing edges
  for (let pass = 0; pass < 2; pass++) {
    // Sort col0 by connected actors & col1
    col0.sort((a, b) => {
      const na = getNeighbors(a.id).filter((id) => tempY.has(id))
      const nb = getNeighbors(b.id).filter((id) => tempY.has(id))
      const ba =
        na.length > 0
          ? na.reduce((s, id) => s + (tempY.get(id) ?? 0), 0) / na.length
          : (tempY.get(a.id) ?? 0)
      const bb =
        nb.length > 0
          ? nb.reduce((s, id) => s + (tempY.get(id) ?? 0), 0) / nb.length
          : (tempY.get(b.id) ?? 0)
      return ba - bb
    })
    col0.forEach((u, i) => tempY.set(u.id, i * 100))

    // Sort col1 by connected col0 & rightActors
    col1.sort((a, b) => {
      const na = getNeighbors(a.id).filter((id) => tempY.has(id))
      const nb = getNeighbors(b.id).filter((id) => tempY.has(id))
      const ba =
        na.length > 0
          ? na.reduce((s, id) => s + (tempY.get(id) ?? 0), 0) / na.length
          : (tempY.get(a.id) ?? 0)
      const bb =
        nb.length > 0
          ? nb.reduce((s, id) => s + (tempY.get(id) ?? 0), 0) / nb.length
          : (tempY.get(b.id) ?? 0)
      return ba - bb
    })
    col1.forEach((u, i) => tempY.set(u.id, i * 100))

    // Sort primaryActors by connected useCases
    primaryActors.sort((a, b) => {
      const na = getNeighbors(a.id).filter((id) => tempY.has(id))
      const nb = getNeighbors(b.id).filter((id) => tempY.has(id))
      const ba =
        na.length > 0
          ? na.reduce((s, id) => s + (tempY.get(id) ?? 0), 0) / na.length
          : (tempY.get(a.id) ?? 0)
      const bb =
        nb.length > 0
          ? nb.reduce((s, id) => s + (tempY.get(id) ?? 0), 0) / nb.length
          : (tempY.get(b.id) ?? 0)
      return ba - bb
    })
    primaryActors.forEach((a, i) => tempY.set(a.id, i * 130))

    // Sort rightActors by connected useCases
    rightActors.sort((a, b) => {
      const na = getNeighbors(a.id).filter((id) => tempY.has(id))
      const nb = getNeighbors(b.id).filter((id) => tempY.has(id))
      const ba =
        na.length > 0
          ? na.reduce((s, id) => s + (tempY.get(id) ?? 0), 0) / na.length
          : (tempY.get(a.id) ?? 0)
      const bb =
        nb.length > 0
          ? nb.reduce((s, id) => s + (tempY.get(id) ?? 0), 0) / nb.length
          : (tempY.get(b.id) ?? 0)
      return ba - bb
    })
    rightActors.forEach((a, i) => tempY.set(a.id, i * 130))
  }

  // Compute coordinates
  const boundaryLeft = 260
  const boundaryTop = 60
  const ucRowGap = 96
  const ucCol0X = boundaryLeft + 60
  const ucCol1X = boundaryLeft + 300

  const maxUcRows = Math.max(col0.length, col1.length, 1)
  const boundaryPaddingTop = 68
  const boundaryPaddingBottom = 48
  const computedBoundaryWidth = col1.length > 0 ? 510 : 280
  const computedBoundaryHeight = Math.max(
    320,
    boundaryPaddingTop + maxUcRows * ucRowGap + boundaryPaddingBottom - 24
  )

  const newPositions = new Map<string, { x: number; y: number }>()
  const newSizes = new Map<string, { width: number; height: number }>()

  // Place primary boundary (and any extra boundaries)
  boundaries.forEach((b, idx) => {
    const bx = boundaryLeft + idx * (computedBoundaryWidth + 60)
    const by = boundaryTop
    newPositions.set(b.id, { x: bx, y: by })
    newSizes.set(b.id, {
      width: computedBoundaryWidth,
      height: computedBoundaryHeight,
    })
  })

  // Center col0 vertically inside boundary
  const col0Height = (col0.length - 1) * ucRowGap + 60
  const col0StartY =
    boundaryTop +
    boundaryPaddingTop +
    Math.max(
      0,
      (computedBoundaryHeight -
        boundaryPaddingTop -
        boundaryPaddingBottom -
        col0Height) /
        2
    )
  col0.forEach((u, idx) => {
    newPositions.set(u.id, {
      x: Math.round(ucCol0X),
      y: Math.round(col0StartY + idx * ucRowGap),
    })
  })

  // Center col1 vertically inside boundary
  const col1Height = (col1.length - 1) * ucRowGap + 60
  const col1StartY =
    boundaryTop +
    boundaryPaddingTop +
    Math.max(
      0,
      (computedBoundaryHeight -
        boundaryPaddingTop -
        boundaryPaddingBottom -
        col1Height) /
        2
    )
  col1.forEach((u, idx) => {
    newPositions.set(u.id, {
      x: Math.round(ucCol1X),
      y: Math.round(col1StartY + idx * ucRowGap),
    })
  })

  // Place primary actors on the left
  const actorRowGap = 150
  const pActorsHeight = (primaryActors.length - 1) * actorRowGap + 110
  const pActorsStartY =
    boundaryTop + Math.max(20, (computedBoundaryHeight - pActorsHeight) / 2)
  primaryActors.forEach((a, idx) => {
    newPositions.set(a.id, {
      x: 60,
      y: Math.round(pActorsStartY + idx * actorRowGap),
    })
  })

  // Place secondary / system actors on the right
  const rightActorX = boundaryLeft + computedBoundaryWidth + 100
  const rActorsHeight = (rightActors.length - 1) * actorRowGap + 110
  const rActorsStartY =
    boundaryTop + Math.max(20, (computedBoundaryHeight - rActorsHeight) / 2)
  rightActors.forEach((a, idx) => {
    newPositions.set(a.id, {
      x: Math.round(rightActorX),
      y: Math.round(rActorsStartY + idx * actorRowGap),
    })
  })

  // Place notes neatly below the boundary
  notes.forEach((n, idx) => {
    newPositions.set(n.id, {
      x: Math.round(boundaryLeft + idx * 210),
      y: Math.round(boundaryTop + computedBoundaryHeight + 36),
    })
  })

  return nodes.map((n) => {
    const pos = newPositions.get(n.id)
    const size = newSizes.get(n.id)
    if (!pos && !size) return n
    return {
      ...n,
      position: pos ?? n.position,
      data: size
        ? {
            ...n.data,
            width: size.width,
            height: size.height,
          }
        : n.data,
    }
  })
}

