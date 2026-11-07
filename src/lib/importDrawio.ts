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
  // Replace <br> / <div> / <p> boundaries with spaces or newlines before stripping tags
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
    throw new Error('Compressed .drawio files require DecompressionStream support.')
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

  // Strip PK/FK/UQ prefixes and ?
  let cleaned = text
    .replace(/^(PK|FK|UQ|🔑|\*|·)\s+/i, '')
    .replace(/\b(PK|FK|UQ)\b/gi, '')
    .replace(/\?/g, '')
    .trim()

  let name = cleaned
  let dataType = 'varchar'

  // Support "col_name: type" or "col_name type" or "col_name (type)"
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

  const pushCellElement = (cellEl: Element, overrideId?: string, overrideValue?: string) => {
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

  // Build parent -> children lookup
  const childrenByParent = new Map<string, RawCell[]>()
  for (const c of rawCells) {
    const list = childrenByParent.get(c.parent) || []
    list.push(c)
    childrenByParent.set(c.parent, list)
  }

  // Helper to get absolute coordinates by walking parent chain
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

  // Identify edgeLabel cells so we don't turn them into standalone nodes
  const edgeLabelByEdgeId = new Map<string, string>()
  for (const c of rawCells) {
    if (c.vertex && c.style['edgeLabel'] && cellMap.get(c.parent)?.edge) {
      const txt = decodeHtmlText(c.value)
      if (txt) {
        edgeLabelByEdgeId.set(c.parent, txt)
      }
    }
  }

  // Detect whether this diagram is ER-oriented
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

  // Track which child cells were absorbed as table attributes
  const absorbedCellIds = new Set<string>()
  const nodes: Node[] = []
  const cellIdToNodeId = new Map<string, string>()

  const isTableContainer = (c: RawCell): boolean => {
    if (c.style['shape'] === 'table') return true
    if (c.style['swimlane'] === '1' || 'swimlane' in c.style) {
      const kids = childrenByParent.get(c.id) || []
      if (
        kids.some(
          (k) =>
            k.style['shape'] === 'tableRow' ||
            k.style['shape'] === 'partialRectangle' ||
            (k.vertex && k.height > 0 && k.height <= 42)
        )
      ) {
        return true
      }
      // Empty swimlane with ER hints is likely a table too if no large child shapes inside
      if (hasErHints && kids.length === 0 && c.width <= 360) return true
    }
    return false
  }

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
          // Sometimes a single cell has multiple lines of attributes
          for (const line of text.split('\n')) {
            const parsed = parseAttributeLine(line, attrs.length)
            if (parsed) attrs.push(parsed)
          }
        }
      }
    }
    return attrs
  }

  // First pass: mark all absorbed table sub-cells so they aren't emitted as standalone nodes
  for (const c of rawCells) {
    if (!c.vertex) continue
    if (isTableContainer(c)) {
      const kids = childrenByParent.get(c.id) || []
      for (const kid of kids) {
        absorbedCellIds.add(kid.id)
        const grandKids = childrenByParent.get(kid.id) || []
        grandKids.forEach((gk) => absorbedCellIds.add(gk.id))
      }
    }
  }

  // Second pass: convert vertex cells to ReactFlow nodes
  for (const c of rawCells) {
    if (!c.vertex) continue
    if (absorbedCellIds.has(c.id)) continue
    if (c.style['edgeLabel']) continue

    const label = decodeHtmlText(c.value)
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

    if (c.style['shape'] === 'umlActor') {
      const isSystem = /<<\s*system\s*>>/i.test(label)
      const data: UmlNodeData = {
        nodeType: 'actor',
        label: label.replace(/<<\s*system\s*>>/gi, '').trim() || 'Actor',
        actorType: isSystem ? 'system' : 'primary',
      }
      nodes.push({
        id: nodeId,
        type: 'actor',
        position: { x: Math.round(absPos.x), y: Math.round(absPos.y) },
        data: data as unknown as Record<string, unknown>,
        zIndex: 10,
      })
      cellIdToNodeId.set(c.id, nodeId)
      continue
    }

    if ('ellipse' in c.style || c.style['shape'] === 'ellipse') {
      const data: UmlNodeData = {
        nodeType: 'useCase',
        label: label || 'Use Case',
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

    if (c.style['shape'] === 'note') {
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
    const isContainerLike =
      hasChildVertices ||
      'swimlane' in c.style ||
      c.style['container'] === '1' ||
      c.style['shape'] === 'umlFrame' ||
      (c.style['dashed'] === '1' && c.width >= 240 && c.height >= 180)

    if (isContainerLike) {
      const data: UmlNodeData = {
        nodeType: 'boundary',
        boundaryTitle: label || 'System Boundary',
        label: label || 'System Boundary',
        width: Math.max(260, Math.round(c.width || 440)),
        height: Math.max(200, Math.round(c.height || 380)),
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
    if (hasErHints) {
      const lines = label.split('\n').map((l) => l.trim()).filter(Boolean)
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
    hasErHints || nodes.some((n) => n.type === 'erEntity')
  const diagramType: DiagramType = isErDiagram ? 'er' : 'use_case'

  // Convert edges
  const edges: Edge[] = []
  for (const c of rawCells) {
    if (!c.edge) continue
    const sourceId = cellIdToNodeId.get(c.source)
    const targetId = cellIdToNodeId.get(c.target)
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
      let relType: UmlRelationshipType = 'association'
      if (isDashed && /include/i.test(rawLabel)) {
        relType = 'include'
      } else if (isDashed && /extend/i.test(rawLabel)) {
        relType = 'extend'
      } else if (
        c.style['endArrow'] === 'block' &&
        c.style['endFill'] === '0'
      ) {
        relType = 'generalization'
      }
      const cleanLabel = rawLabel
        .replace(/<<\s*(include|extend)\s*>>/gi, '')
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
      type: 'uml',
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

