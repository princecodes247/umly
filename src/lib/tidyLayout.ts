import type { Node, Edge } from '@xyflow/react'
import type { UmlNodeData, UmlEdgeData } from '../types/game'

/**
 * Deterministic layered auto-layout ("Tidy Up") for UML 2.5 Use Case diagrams.
 * Minimizes edge crossings using barycenter ordering and automatically sizes the System Boundary
 * around the Use Cases.
 */
export function computeTidyLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes

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

