import type { Node, Edge } from '@xyflow/react'
import type {
  ErAttribute,
  ErCardinality,
  UmlEdgeData,
  UmlNodeData,
  UmlRelationshipType,
} from '../types/game'
import type { DiagramType } from './diagramStorage'

export interface ImportedDrawioDiagram {
  title: string
  diagramType: DiagramType
  nodes: Node[]
  edges: Edge[]
}

function decodeHtmlText(raw: string): string {
  if (!raw) return ''
  // Replace <br> / <div> / <p> boundaries with newlines before stripping tags
  const withBreaks = raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')

  const textarea = document.createElement('textarea')
  textarea.innerHTML = withBreaks
  return textarea.value
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function parseStyle(styleStr: string): Record<string, string> {
  const map: Record<string, string> = {}
  if (!styleStr) return map
  for (const part of styleStr.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) {
      map[trimmed] = '1'
    } else {
      map[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim()
    }
  }
  return map
}

async function decompressDiagramContent(encoded: string): Promise<string> {
  const trimmed = encoded.trim()
  if (!trimmed || trimmed.startsWith('<')) return trimmed

  const binaryStr = atob(trimmed)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }

  if (typeof DecompressionStream === 'undefined') {
    throw new Error(
      'Compressed .drawio files require DecompressionStream support.'
    )
  }

  const ds = new DecompressionStream('deflate-raw')
  const writer = ds.writable.getWriter()
  writer.write(bytes)
  writer.close()

  const decompressed = await new Response(ds.readable).text()
  return decodeURIComponent(decompressed)
}

function mapErArrowToCardinality(arrow?: string): ErCardinality | undefined {
  switch (arrow) {
    case 'ERone':
    case 'ERmandOne':
      return 'one_only'
    case 'ERzeroToOne':
      return 'zero_or_one'
    case 'ERoneToMany':
      return 'one_or_many'
    case 'ERmany':
    case 'ERzeroToMany':
      return 'zero_or_many'
    default:
      return undefined
  }
}

function parseAttributeLine(
  rawText: string,
  index: number,
  prefixHint?: string
): ErAttribute | null {
  const text = rawText.trim()
  if (!text) return null

  const combined = prefixHint ? `${prefixHint.trim()} ${text}` : text
  const isPrimaryKey = /\bPK\b|\bprimary\b|\b🔑\b/i.test(combined)
  const isForeignKey = /\bFK\b|\bforeign\b/i.test(combined)
  const isUnique = /\bUQ\b|\bunique\b/i.test(combined)
  const isNullable = /\?/.test(text) || /\bnull(able)?\b/i.test(combined)

  const cleaned = text
    .replace(/^(PK|FK|UQ|🔑|\*|·)\s+/i, '')
    .replace(/\b(PK|FK|UQ)\b/gi, '')
    .replace(/\?/g, '')
    .trim()

  let name = cleaned
  let dataType = 'varchar'

  const colonMatch = cleaned.match(/^([^:]+):\s*(.+)$/)
  const parenMatch = cleaned.match(/^([^\s(]+)\s*\(([^)]+)\)$/)
  const spaceMatch = cleaned.match(/^([^\s]+)\s+([a-zA-Z0-9_()[\],]+)$/)

  if (colonMatch) {
    name = colonMatch[1].trim()
    dataType = colonMatch[2].trim()
  } else if (parenMatch) {
    name = parenMatch[1].trim()
    dataType = parenMatch[2].trim()
  } else if (spaceMatch) {
    name = spaceMatch[1].trim()
    dataType = spaceMatch[2].trim()
  }

  if (!name) name = `column_${index + 1}`

  return {
    id: `attr-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 5)}`,
    name,
    dataType,
    isPrimaryKey,
    isForeignKey,
    isUnique,
    isNullable,
  }
}

interface RawCell {
  id: string
  value: string
  styleStr: string
  style: Record<string, string>
  vertex: boolean
  edge: boolean
  parent: string
  source: string
  target: string
  x: number
  y: number
  width: number
  height: number
}

function isActorCell(c: RawCell): boolean {
  const shape = c.style['shape'] || ''
  return (
    shape === 'umlActor' ||
    shape === 'actor' ||
    /uml\.actor/i.test(shape)
  )
}

function isUseCaseCell(c: RawCell): boolean {
  const shape = c.style['shape'] || ''
  return (
    'ellipse' in c.style ||
    shape === 'ellipse' ||
    shape === 'umlUseCase' ||
    (c.style['rounded'] === '1' && c.style['arcSize'] === '50')
  )
}

function isNoteCell(c: RawCell): boolean {
  return c.style['shape'] === 'note' || c.style['shape'] === 'note2'
}

export async function parseDrawioXml(
  xmlText: string,
  fallbackTitle = 'Imported Draw.io Diagram'
): Promise<ImportedDrawioDiagram | null> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'text/xml')
  if (doc.querySelector('parsererror')) {
    return null
  }

  let diagramName = fallbackTitle
  let modelDoc: Document = doc

  const mxfile = doc.querySelector('mxfile')
  if (mxfile) {
    const diagramEl = mxfile.querySelector('diagram')
    if (!diagramEl) return null
    const attrName = diagramEl.getAttribute('name')
    if (attrName && attrName.trim() && attrName !== 'Page-1') {
      diagramName = attrName.trim()
    }

    const directModel = diagramEl.querySelector('mxGraphModel')
    if (directModel) {
      modelDoc = doc
    } else {
      const innerText = diagramEl.textContent?.trim() || ''
      if (!innerText) return null
      const decompressed = await decompressDiagramContent(innerText)
      modelDoc = parser.parseFromString(decompressed, 'text/xml')
      if (modelDoc.querySelector('parsererror')) return null
    }
  } else if (!doc.querySelector('mxGraphModel')) {
    return null
  }

  const root = modelDoc.querySelector('mxGraphModel > root')
  if (!root) return null

  const rawCells: RawCell[] = []
  const cellMap = new Map<string, RawCell>()

  const pushCellElement = (
    cellEl: Element,
    overrideId?: string,
    overrideValue?: string
  ) => {
    const id = overrideId || cellEl.getAttribute('id') || ''
    if (!id || id === '0' || id === '1') return

    const value = overrideValue ?? cellEl.getAttribute('value') ?? ''
    const styleStr = cellEl.getAttribute('style') ?? ''
    const style = parseStyle(styleStr)
    const vertex = cellEl.getAttribute('vertex') === '1'
    const edge = cellEl.getAttribute('edge') === '1'
    const parent = cellEl.getAttribute('parent') ?? '1'
    const source = cellEl.getAttribute('source') ?? ''
    const target = cellEl.getAttribute('target') ?? ''

    const geom = cellEl.querySelector(':scope > mxGeometry')
    const x = parseFloat(geom?.getAttribute('x') || '0') || 0
    const y = parseFloat(geom?.getAttribute('y') || '0') || 0
    const width = parseFloat(geom?.getAttribute('width') || '0') || 0
    const height = parseFloat(geom?.getAttribute('height') || '0') || 0

    const cell: RawCell = {
      id,
      value,
      styleStr,
      style,
      vertex,
      edge,
      parent,
      source,
      target,
      x,
      y,
      width,
      height,
    }
    rawCells.push(cell)
    cellMap.set(id, cell)
  }

  for (const child of Array.from(root.children)) {
    if (child.tagName === 'mxCell') {
      pushCellElement(child)
    } else if (child.tagName === 'object' || child.tagName === 'UserObject') {
      const innerCell = child.querySelector(':scope > mxCell')
      if (innerCell) {
        pushCellElement(
          innerCell,
          child.getAttribute('id') || undefined,
          child.getAttribute('label') ?? undefined
        )
      }
    }
  }

  const childrenByParent = new Map<string, RawCell[]>()
  for (const c of rawCells) {
    const list = childrenByParent.get(c.parent) || []
    list.push(c)
    childrenByParent.set(c.parent, list)
  }

  const getAbsPosition = (cell: RawCell): { x: number; y: number } => {
    let x = cell.x
    let y = cell.y
    let currParentId = cell.parent
    const visited = new Set<string>([cell.id])
    while (currParentId && currParentId !== '0' && currParentId !== '1') {
      if (visited.has(currParentId)) break
      visited.add(currParentId)
      const p = cellMap.get(currParentId)
      if (!p) break
      x += p.x
      y += p.y
      currParentId = p.parent
    }
    return { x, y }
  }

  // Any vertex whose parent is an edge (edgeLabel or text on an edge) is an edge label
  const edgeLabelByEdgeId = new Map<string, string>()
  const edgeChildCellIds = new Set<string>()
  for (const c of rawCells) {
    if (c.vertex && (c.style['edgeLabel'] || cellMap.get(c.parent)?.edge)) {
      edgeChildCellIds.add(c.id)
      const txt = decodeHtmlText(c.value)
      if (txt && cellMap.get(c.parent)?.edge) {
        edgeLabelByEdgeId.set(c.parent, txt)
      }
    }
  }

  const hasUseCaseHints = rawCells.some((c) => {
    if (c.edge) {
      const lbl = edgeLabelByEdgeId.get(c.id) || decodeHtmlText(c.value)
      return /(«|<<)\s*(use|uses|include|includes|extend|extends)\s*(»|>>)/i.test(
        lbl
      )
    }
    return isActorCell(c) || isUseCaseCell(c)
  })

  const hasErHints = rawCells.some((c) => {
    if (c.edge) {
      return (
        String(c.style['startArrow'] || '').startsWith('ER') ||
        String(c.style['endArrow'] || '').startsWith('ER')
      )
    }
    return (
      c.style['shape'] === 'table' ||
      c.style['shape'] === 'tableRow' ||
      c.styleStr.includes('erEntity')
    )
  })

  const isTableContainer = (c: RawCell): boolean => {
    if (c.style['shape'] === 'table') return true
    if ('swimlane' in c.style) {
      const kids = (childrenByParent.get(c.id) || []).filter(
        (k) => k.vertex && !edgeChildCellIds.has(k.id)
      )
      // If any child is an actor, use case, or note, this swimlane is a System Boundary, not an ER table
      if (kids.some((k) => isActorCell(k) || isUseCaseCell(k) || isNoteCell(k))) {
        return false
      }
      if (
        kids.some(
          (k) =>
            k.style['shape'] === 'tableRow' ||
            k.style['shape'] === 'partialRectangle'
        )
      ) {
        return true
      }
      if (
        hasErHints &&
        !hasUseCaseHints &&
        kids.every((k) => k.height > 0 && k.height <= 42)
      ) {
        return true
      }
    }
    return false
  }

  const absorbedCellIds = new Set<string>(edgeChildCellIds)
  const nodes: Node[] = []
  const cellIdToNodeId = new Map<string, string>()

  const collectTableAttributes = (tableCell: RawCell): ErAttribute[] => {
    const attrs: ErAttribute[] = []
    const directKids = [...(childrenByParent.get(tableCell.id) || [])].sort(
      (a, b) => a.y - b.y
    )

    for (const kid of directKids) {
      absorbedCellIds.add(kid.id)
      const subKids = [...(childrenByParent.get(kid.id) || [])].sort(
        (a, b) => a.x - b.x
      )
      if (subKids.length > 0) {
        subKids.forEach((sk) => absorbedCellIds.add(sk.id))
        const texts = subKids
          .map((sk) => decodeHtmlText(sk.value))
          .filter(Boolean)
        if (texts.length >= 2) {
          const parsed = parseAttributeLine(texts[1], attrs.length, texts[0])
          if (parsed) attrs.push(parsed)
        } else if (texts.length === 1) {
          const parsed = parseAttributeLine(texts[0], attrs.length)
          if (parsed) attrs.push(parsed)
        }
      } else {
        const text = decodeHtmlText(kid.value)
        if (text) {
          for (const line of text.split('\n')) {
            const parsed = parseAttributeLine(line, attrs.length)
            if (parsed) attrs.push(parsed)
          }
        }
      }
    }
    return attrs
  }

  // Pre-compute absolute bounds for all vertex cells (used for geometric boundary containment)
  const absBoundsMap = new Map<
    string,
    { x: number; y: number; w: number; h: number }
  >()
  for (const c of rawCells) {
    if (!c.vertex || absorbedCellIds.has(c.id)) continue
    const pos = getAbsPosition(c)
    absBoundsMap.set(c.id, {
      x: pos.x,
      y: pos.y,
      w: c.width || 0,
      h: c.height || 0,
    })
  }

  // First pass: mark all absorbed table sub-cells
  for (const c of rawCells) {
    if (!c.vertex || absorbedCellIds.has(c.id)) continue
    if (isTableContainer(c)) {
      const kids = childrenByParent.get(c.id) || []
      for (const kid of kids) {
        absorbedCellIds.add(kid.id)
        const grandKids = childrenByParent.get(kid.id) || []
        grandKids.forEach((gk) => absorbedCellIds.add(gk.id))
      }
    }
  }

  // Helper: check if a rectangle cell geometrically wraps use cases / actors / notes
  const geometricallyContainsDiagramElements = (c: RawCell): boolean => {
    const b = absBoundsMap.get(c.id)
    if (!b || b.w < 160 || b.h < 120) return false
    for (const other of rawCells) {
      if (
        !other.vertex ||
        other.id === c.id ||
        absorbedCellIds.has(other.id)
      ) {
        continue
      }
      if (!isUseCaseCell(other) && !isActorCell(other) && !isNoteCell(other)) {
        continue
      }
      const ob = absBoundsMap.get(other.id)
      if (!ob) continue
      const cx = ob.x + ob.w / 2
      const cy = ob.y + ob.h / 2
      if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) {
        return true
      }
    }
    return false
  }

  // Second pass: convert vertex cells to ReactFlow nodes
  const standaloneStereotypeTextCells: RawCell[] = []
  for (const c of rawCells) {
    if (!c.vertex || absorbedCellIds.has(c.id)) continue

    const label = decodeHtmlText(c.value)
    const isTextLike =
      ('text' in c.style || c.style['strokeColor'] === 'none') &&
      !isActorCell(c) &&
      !isUseCaseCell(c) &&
      !isNoteCell(c)
    if (
      isTextLike &&
      /^(«|<<)?\s*(use|uses|include|includes|extend|extends)\s*(»|>>)?$/i.test(
        label
      )
    ) {
      standaloneStereotypeTextCells.push(c)
      continue
    }
    const absPos = getAbsPosition(c)
    const nodeId = `drawio-${c.id}`

    if (isTableContainer(c)) {
      const attrs = collectTableAttributes(c)
      const isWeak =
        c.style['double'] === '1' || /<<\s*weak\s*>>/i.test(label)
      const cleanLabel =
        label.replace(/<<\s*weak\s*>>/gi, '').trim() || 'Entity'
      const data: UmlNodeData = {
        nodeType: 'erEntity',
        label: cleanLabel,
        isWeakEntity: isWeak,
        attributes: attrs,
        width: Math.max(210, Math.round(c.width || 230)),
        height: Math.max(96, Math.round(c.height || 140)),
      }
      nodes.push({
        id: nodeId,
        type: 'erEntity',
        position: { x: Math.round(absPos.x), y: Math.round(absPos.y) },
        data: data as unknown as Record<string, unknown>,
        zIndex: 10,
      })
      cellIdToNodeId.set(c.id, nodeId)
      continue
    }

    if (isActorCell(c)) {
      const isSystem = /(«|<<)\s*system\s*(»|>>)/i.test(label)
      const cleanLabel =
        label.replace(/(«|<<)\s*system\s*(»|>>)/gi, '').trim() || 'Actor'
      // Center Umly's ActorNode (~88x108) on draw.io's actor center
      const actorX =
        c.width > 0 ? absPos.x + c.width / 2 - 44 : absPos.x
      const actorY =
        c.height > 0 ? absPos.y + c.height / 2 - 54 : absPos.y
      const data: UmlNodeData = {
        nodeType: 'actor',
        label: cleanLabel,
        actorType: isSystem ? 'system' : 'primary',
      }
      nodes.push({
        id: nodeId,
        type: 'actor',
        position: { x: Math.round(actorX), y: Math.round(actorY) },
        data: data as unknown as Record<string, unknown>,
        zIndex: 10,
      })
      cellIdToNodeId.set(c.id, nodeId)
      continue
    }

    if (isUseCaseCell(c)) {
      const data: UmlNodeData = {
        nodeType: 'useCase',
        label: label || 'Use Case',
        width: Math.max(110, Math.round(c.width || 148)),
        height: Math.max(48, Math.round(c.height || 64)),
      }
      nodes.push({
        id: nodeId,
        type: 'useCase',
        position: { x: Math.round(absPos.x), y: Math.round(absPos.y) },
        data: data as unknown as Record<string, unknown>,
        zIndex: 10,
      })
      cellIdToNodeId.set(c.id, nodeId)
      continue
    }

    if (isNoteCell(c)) {
      const data: UmlNodeData = {
        nodeType: 'note',
        label: label || 'Note',
        description: label || 'Note',
      }
      nodes.push({
        id: nodeId,
        type: 'note',
        position: { x: Math.round(absPos.x), y: Math.round(absPos.y) },
        data: data as unknown as Record<string, unknown>,
        zIndex: 10,
      })
      cellIdToNodeId.set(c.id, nodeId)
      continue
    }

    const hasChildVertices = (childrenByParent.get(c.id) || []).some(
      (k) => k.vertex && !absorbedCellIds.has(k.id)
    )
    const isTextOnly = 'text' in c.style && c.style['strokeColor'] === 'none'
    const isBoundaryLike =
      !isTextOnly &&
      (hasChildVertices ||
        'swimlane' in c.style ||
        c.style['container'] === '1' ||
        c.style['shape'] === 'umlFrame' ||
        geometricallyContainsDiagramElements(c) ||
        (c.width >= 220 &&
          c.height >= 160 &&
          (c.style['dashed'] === '1' || c.style['fillColor'] === 'none')))

    if (isBoundaryLike) {
      let boundaryTitle = label
      // If boundary has no direct value, check if a text child near its top serves as its title
      if (!boundaryTitle) {
        const kids = childrenByParent.get(c.id) || []
        const titleCandidate = kids.find(
          (k) =>
            k.vertex &&
            !absorbedCellIds.has(k.id) &&
            !isUseCaseCell(k) &&
            !isActorCell(k) &&
            'text' in k.style &&
            k.y <= 50
        )
        if (titleCandidate) {
          boundaryTitle = decodeHtmlText(titleCandidate.value)
          absorbedCellIds.add(titleCandidate.id)
        }
      }
      const data: UmlNodeData = {
        nodeType: 'boundary',
        boundaryTitle: boundaryTitle || 'System Boundary',
        label: boundaryTitle || 'System Boundary',
        width: Math.max(240, Math.round(c.width || 440)),
        height: Math.max(180, Math.round(c.height || 380)),
      }
      nodes.push({
        id: nodeId,
        type: 'boundary',
        position: { x: Math.round(absPos.x), y: Math.round(absPos.y) },
        data: data as unknown as Record<string, unknown>,
        zIndex: 1,
      })
      cellIdToNodeId.set(c.id, nodeId)
      continue
    }

    // Fallback for generic rectangles/text shapes
    if (hasErHints && !hasUseCaseHints) {
      const lines = label
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
      const titleLine = lines[0] || 'Entity'
      const attrs = lines
        .slice(1)
        .map((line, i) => parseAttributeLine(line, i))
        .filter((a): a is ErAttribute => a !== null)
      const data: UmlNodeData = {
        nodeType: 'erEntity',
        label: titleLine,
        isWeakEntity: c.style['double'] === '1',
        attributes: attrs,
        width: Math.max(210, Math.round(c.width || 230)),
        height: Math.max(96, Math.round(c.height || 140)),
      }
      nodes.push({
        id: nodeId,
        type: 'erEntity',
        position: { x: Math.round(absPos.x), y: Math.round(absPos.y) },
        data: data as unknown as Record<string, unknown>,
        zIndex: 10,
      })
      cellIdToNodeId.set(c.id, nodeId)
    } else {
      const data: UmlNodeData = {
        nodeType: 'note',
        label: label || 'Note',
        description: label || 'Note',
      }
      nodes.push({
        id: nodeId,
        type: 'note',
        position: { x: Math.round(absPos.x), y: Math.round(absPos.y) },
        data: data as unknown as Record<string, unknown>,
        zIndex: 10,
      })
      cellIdToNodeId.set(c.id, nodeId)
    }
  }

  const isErDiagram =
    (hasErHints && !hasUseCaseHints) ||
    nodes.some((n) => n.type === 'erEntity')
  const diagramType: DiagramType = isErDiagram ? 'er' : 'use_case'

  const nodeById = new Map(nodes.map((n) => [n.id, n]))

  // Attach floating stereotype text cells (e.g. standalone "Use" / "Extends" boxes) to the nearest dashed edge
  if (!isErDiagram && standaloneStereotypeTextCells.length > 0) {
    const pointToSegmentDist = (
      px: number,
      py: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number
    ) => {
      const dx = x2 - x1
      const dy = y2 - y1
      const lenSq = dx * dx + dy * dy
      if (lenSq === 0) return Math.hypot(px - x1, py - y1)
      const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq))
      return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
    }

    for (const tc of standaloneStereotypeTextCells) {
      const tPos = getAbsPosition(tc)
      const tx = tPos.x + (tc.width || 40) / 2
      const ty = tPos.y + (tc.height || 20) / 2
      let bestEdgeId: string | null = null
      let bestDist = 140

      for (const ec of rawCells) {
        if (!ec.edge || ec.style['dashed'] !== '1') continue
        const sNodeId = cellIdToNodeId.get(ec.source)
        const tNodeId = cellIdToNodeId.get(ec.target)
        if (!sNodeId || !tNodeId) continue
        const sNode = nodeById.get(sNodeId)
        const tNode = nodeById.get(tNodeId)
        if (!sNode || !tNode) continue

        const sw = Number(sNode.data?.width) || 140
        const sh = Number(sNode.data?.height) || 64
        const tw = Number(tNode.data?.width) || 140
        const th = Number(tNode.data?.height) || 64
        const dist = pointToSegmentDist(
          tx,
          ty,
          sNode.position.x + sw / 2,
          sNode.position.y + sh / 2,
          tNode.position.x + tw / 2,
          tNode.position.y + th / 2
        )
        if (dist < bestDist) {
          bestDist = dist
          bestEdgeId = ec.id
        }
      }

      if (bestEdgeId && !edgeLabelByEdgeId.has(bestEdgeId)) {
        edgeLabelByEdgeId.set(bestEdgeId, decodeHtmlText(tc.value))
      }
    }
  }

  // Convert edges
  const edges: Edge[] = []
  for (const c of rawCells) {
    if (!c.edge) continue
    let sourceId = cellIdToNodeId.get(c.source)
    let targetId = cellIdToNodeId.get(c.target)
    if (!sourceId || !targetId) continue

    const rawLabel = edgeLabelByEdgeId.get(c.id) || decodeHtmlText(c.value)
    const isDashed = c.style['dashed'] === '1'
    const routingStyle: UmlEdgeData['routingStyle'] =
      c.style['curved'] === '1'
        ? 'bezier'
        : c.style['edgeStyle'] === 'orthogonalEdgeStyle' ||
            c.style['edgeStyle'] === 'elbowEdgeStyle'
          ? 'orthogonal'
          : 'straight'

    let edgeData: UmlEdgeData
    if (isErDiagram) {
      const startCard =
        mapErArrowToCardinality(c.style['startArrow']) || 'one_only'
      const endCard =
        mapErArrowToCardinality(c.style['endArrow']) || 'zero_or_many'
      edgeData = {
        relationshipType: 'er',
        label: rawLabel || undefined,
        erSourceCardinality: startCard,
        erTargetCardinality: endCard,
        erIdentifying: !isDashed,
        routingStyle,
      }
    } else {
      const sNode = nodeById.get(sourceId)
      const tNode = nodeById.get(targetId)
      const hasEndArrow =
        Boolean(c.style['endArrow']) && c.style['endArrow'] !== 'none'
      const hasStartArrow =
        Boolean(c.style['startArrow']) && c.style['startArrow'] !== 'none'

      // If draw.io edge has only startArrow (pointing from target -> source), flip endpoints
      if (hasStartArrow && !hasEndArrow) {
        ;[sourceId, targetId] = [targetId, sourceId]
      }

      const isIncludeText =
        /\b(use|uses|include|includes)\b/i.test(rawLabel) ||
        /(«|<<)\s*(use|uses|include|includes)\s*(»|>>)/i.test(rawLabel)
      const isExtendText =
        /\b(extend|extends)\b/i.test(rawLabel) ||
        /(«|<<)\s*(extend|extends)\s*(»|>>)/i.test(rawLabel)

      let relType: UmlRelationshipType = 'association'
      if (isExtendText || (isDashed && /\bext/i.test(rawLabel))) {
        relType = 'extend'
      } else if (isIncludeText || isDashed) {
        relType = 'include'
      } else if (
        (c.style['endArrow'] === 'block' &&
          (c.style['endFill'] === '0' || c.style['fillColor'] === '#ffffff')) ||
        ((hasEndArrow || hasStartArrow) &&
          sNode &&
          tNode &&
          ((sNode.type === 'useCase' && tNode.type === 'useCase') ||
            (sNode.type === 'actor' && tNode.type === 'actor')))
      ) {
        relType = 'generalization'
      }

      const cleanLabel = rawLabel
        .replace(
          /^(«|<<)?\s*(use|uses|include|includes|extend|extends)\s*(»|>>)?$/gi,
          ''
        )
        .replace(/(«|<<)\s*(use|uses|include|includes|extend|extends)\s*(»|>>)/gi, '')
        .trim()
      edgeData = {
        relationshipType: relType,
        label: cleanLabel || undefined,
        routingStyle,
      }
    }

    edges.push({
      id: `drawio-edge-${c.id}`,
      source: sourceId,
      target: targetId,
      type: 'umlEdge',
      data: edgeData as unknown as Record<string, unknown>,
    })
  }

  return {
    title: diagramName,
    diagramType,
    nodes,
    edges,
  }
}
