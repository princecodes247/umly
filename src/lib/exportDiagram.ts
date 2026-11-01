import { toPng, toSvg, toBlob } from 'html-to-image'
import type { Node, Edge } from '@xyflow/react'
import type { UmlNodeData, UmlEdgeData } from '../types/game'

export interface DiagramProject {
  title: string
  version: string
  updatedAt: string
  nodes: Node[]
  edges: Edge[]
}

const THEME_CSS_VARS = [
  '--bg-primary',
  '--bg-secondary',
  '--bg-tertiary',
  '--bg-sidebar',
  '--bg-modal',
  '--text-primary',
  '--text-secondary',
  '--text-tertiary',
  '--border-subtle',
  '--border-default',
  '--border-strong',
  '--hover-bg',
  '--hover-bg-strong',
  '--active-bg',
  '--selection-bg',
  '--notion-default-bg',
  '--notion-default-text',
  '--notion-gray-bg',
  '--notion-gray-text',
  '--notion-brown-bg',
  '--notion-brown-text',
  '--notion-orange-bg',
  '--notion-orange-text',
  '--notion-yellow-bg',
  '--notion-yellow-text',
  '--notion-green-bg',
  '--notion-green-text',
  '--notion-blue-bg',
  '--notion-blue-text',
  '--notion-purple-bg',
  '--notion-purple-text',
  '--notion-pink-bg',
  '--notion-pink-text',
  '--notion-red-bg',
  '--notion-red-text',
  '--primary-btn',
  '--primary-btn-hover',
  '--primary-btn-text',
]

function prepareCanvasForExport(canvasElement: HTMLElement) {
  const rootStyle = getComputedStyle(document.documentElement)
  const previousInlineVars = new Map<string, string>()

  for (const varName of THEME_CSS_VARS) {
    previousInlineVars.set(
      varName,
      canvasElement.style.getPropertyValue(varName)
    )
    const resolved = rootStyle.getPropertyValue(varName).trim()
    if (resolved) {
      canvasElement.style.setProperty(varName, resolved)
    }
  }

  const bgPrimary = rootStyle.getPropertyValue('--bg-primary').trim()
  const bgSecondary = rootStyle.getPropertyValue('--bg-secondary').trim()
  const isDark =
    document.documentElement.getAttribute('data-theme') === 'dark' ||
    document.documentElement.classList.contains('dark') ||
    (document.documentElement.getAttribute('data-theme') !== 'light' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  const backgroundColor =
    bgSecondary || bgPrimary || (isDark ? '#191919' : '#ffffff')

  const prevBg = canvasElement.style.backgroundColor
  const prevColor = canvasElement.style.color
  canvasElement.style.backgroundColor = backgroundColor
  canvasElement.style.color =
    rootStyle.getPropertyValue('--text-primary').trim() ||
    (isDark ? '#e6e6e6' : '#37352f')

  const controls = canvasElement.querySelectorAll(
    '.react-flow__controls, .react-flow__minimap, .react-flow__panel, .react-flow__node-toolbar, .studio-bottom-dock'
  )
  controls.forEach((el) => {
    ;(el as HTMLElement).style.display = 'none'
  })

  const restore = () => {
    for (const [varName, prevVal] of previousInlineVars.entries()) {
      if (prevVal) {
        canvasElement.style.setProperty(varName, prevVal)
      } else {
        canvasElement.style.removeProperty(varName)
      }
    }
    canvasElement.style.backgroundColor = prevBg
    canvasElement.style.color = prevColor
    controls.forEach((el) => {
      ;(el as HTMLElement).style.display = ''
    })
  }

  return { backgroundColor, restore }
}

function shouldIncludeExportNode(node: Node | HTMLElement): boolean {
  if (node instanceof HTMLElement) {
    if (
      node.classList.contains('react-flow__controls') ||
      node.classList.contains('react-flow__minimap') ||
      node.classList.contains('react-flow__panel') ||
      node.classList.contains('react-flow__node-toolbar') ||
      node.classList.contains('studio-bottom-dock')
    ) {
      return false
    }
  }
  return true
}

export async function exportDiagramAsPng(
  canvasElement: HTMLElement,
  fileName = 'use-case-diagram.png'
): Promise<void> {
  const { backgroundColor, restore } = prepareCanvasForExport(canvasElement)

  try {
    const dataUrl = await toPng(canvasElement, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor,
      filter: (node) => shouldIncludeExportNode(node as HTMLElement),
    })

    const link = document.createElement('a')
    link.download = fileName
    link.href = dataUrl
    link.click()
  } finally {
    restore()
  }
}

export async function copyDiagramAsPngToClipboard(
  canvasElement: HTMLElement
): Promise<boolean> {
  const { backgroundColor, restore } = prepareCanvasForExport(canvasElement)

  try {
    const blob = await toBlob(canvasElement, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor,
      filter: (node) => shouldIncludeExportNode(node as HTMLElement),
    })

    if (!blob || !navigator.clipboard || typeof ClipboardItem === 'undefined') {
      return false
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ])
    return true
  } catch (err) {
    console.error('Failed to copy diagram image to clipboard', err)
    return false
  } finally {
    restore()
  }
}

export async function exportDiagramAsSvg(
  canvasElement: HTMLElement,
  fileName = 'use-case-diagram.svg'
): Promise<void> {
  const { backgroundColor, restore } = prepareCanvasForExport(canvasElement)

  try {
    const dataUrl = await toSvg(canvasElement, {
      backgroundColor,
      filter: (node) => shouldIncludeExportNode(node as HTMLElement),
    })

    const link = document.createElement('a')
    link.download = fileName
    link.href = dataUrl
    link.click()
  } finally {
    restore()
  }
}

export function generatePlantUml(
  title: string,
  nodes: Node[],
  edges: Edge[]
): string {
  const lines: string[] = [
    '@startuml',
    `title ${title || 'Use Case Diagram'}`,
    'left to right direction',
    'skinparam packageStyle rectangle',
    '',
  ]

  const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_]/g, '_')

  const boundaries = nodes.filter((n) => n.type === 'boundary')
  const actors = nodes.filter((n) => n.type === 'actor')
  const useCases = nodes.filter((n) => n.type === 'useCase')
  const notes = nodes.filter((n) => n.type === 'note')

  actors.forEach((a) => {
    const d = a.data as unknown as UmlNodeData
    const st = d.stereotype
      ? ` <<${d.stereotype}>>`
      : d.actorType === 'system'
        ? ' <<system>>'
        : d.actorType === 'secondary'
          ? ' <<secondary>>'
          : ''
    lines.push(`actor "${d.label || 'Actor'}" as ${safeId(a.id)}${st}`)
  })

  if (actors.length > 0) lines.push('')

  if (boundaries.length > 0) {
    const b = boundaries[0]
    const bd = b.data as unknown as UmlNodeData
    lines.push(`rectangle "${bd.boundaryTitle || bd.label || 'System'}" {`)
    useCases.forEach((u) => {
      const ud = u.data as unknown as UmlNodeData
      const st = ud.stereotype ? ` <<${ud.stereotype}>>` : ''
      lines.push(`  usecase "${ud.label || 'Use Case'}" as ${safeId(u.id)}${st}`)
    })
    lines.push('}')
  } else {
    useCases.forEach((u) => {
      const ud = u.data as unknown as UmlNodeData
      const st = ud.stereotype ? ` <<${ud.stereotype}>>` : ''
      lines.push(`usecase "${ud.label || 'Use Case'}" as ${safeId(u.id)}${st}`)
    })
  }

  if (notes.length > 0) {
    lines.push('')
    notes.forEach((n) => {
      const nd = n.data as unknown as UmlNodeData
      const text = (nd.description || nd.label || 'Note').replace(/\n/g, '\\n')
      lines.push(`note "${text}" as ${safeId(n.id)}`)
    })
  }

  if (edges.length > 0) {
    lines.push('')
    edges.forEach((e) => {
      const ed = e.data as unknown as UmlEdgeData
      const rel = ed?.relationshipType || 'association'
      const s = safeId(e.source)
      const t = safeId(e.target)
      if (rel === 'include') {
        lines.push(`${s} ..> ${t} : <<include>>`)
      } else if (rel === 'extend') {
        const cond = ed?.condition ? ` (${ed.condition})` : ''
        lines.push(`${s} ..> ${t} : <<extend>>${cond}`)
      } else if (rel === 'generalization') {
        lines.push(`${s} --|> ${t}`)
      } else {
        const lbl = ed?.label ? ` : ${ed.label}` : ''
        lines.push(`${s} --> ${t}${lbl}`)
      }
    })
  }

  lines.push('@enduml')
  return lines.join('\n')
}

export function generateMermaid(
  title: string,
  nodes: Node[],
  edges: Edge[]
): string {
  const erEntities = nodes.filter((n) => n.type === 'erEntity')
  if (erEntities.length > 0) {
    const safeName = (s: string) =>
      (s || 'Entity').replace(/[^a-zA-Z0-9_]/g, '_')
    const entityNameMap = new Map(
      erEntities.map((n) => {
        const d = n.data as unknown as UmlNodeData
        return [n.id, safeName(d.label || n.id)]
      })
    )
    const lines: string[] = [
      `---`,
      `title: ${title || 'ER Diagram'}`,
      `---`,
      `erDiagram`,
    ]

    erEntities.forEach((n) => {
      const d = n.data as unknown as UmlNodeData
      const name = entityNameMap.get(n.id) || 'Entity'
      const attrs = Array.isArray(d.attributes) ? d.attributes : []
      if (attrs.length === 0) {
        lines.push(`  ${name} { }`)
      } else {
        lines.push(`  ${name} {`)
        attrs.forEach((a) => {
          const keys = [
            a.isPrimaryKey ? 'PK' : '',
            a.isForeignKey ? 'FK' : '',
            a.isUnique && !a.isPrimaryKey ? 'UK' : '',
          ]
            .filter(Boolean)
            .join(',')
          lines.push(
            `    ${safeName(a.dataType || 'varchar')} ${safeName(a.name)}${keys ? ` ${keys}` : ''}`
          )
        })
        lines.push(`  }`)
      }
    })

    const leftCard = (c?: string) => {
      switch (c) {
        case 'zero_or_one':
          return '|o'
        case 'many':
        case 'zero_or_many':
          return '}o'
        case 'one_or_many':
          return '}|'
        case 'one':
        case 'one_only':
        default:
          return '||'
      }
    }
    const rightCard = (c?: string) => {
      switch (c) {
        case 'zero_or_one':
          return 'o|'
        case 'many':
        case 'zero_or_many':
          return 'o{'
        case 'one_or_many':
          return '|{'
        case 'one':
        case 'one_only':
        default:
          return '||'
      }
    }

    edges.forEach((e) => {
      const sName = entityNameMap.get(e.source)
      const tName = entityNameMap.get(e.target)
      if (!sName || !tName) return
      const ed = e.data as unknown as UmlEdgeData
      const link = ed?.erIdentifying ? '--' : '..'
      const lbl = (ed?.label || 'relates').replace(/"/g, "'")
      lines.push(
        `  ${sName} ${leftCard(ed?.erSourceCardinality)}${link}${rightCard(ed?.erTargetCardinality)} ${tName} : "${lbl}"`
      )
    })

    return lines.join('\n')
  }

  const lines: string[] = [
    `---`,
    `title: ${title || 'Use Case Diagram'}`,
    `---`,
    `flowchart LR`,
  ]

  const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_]/g, '_')

  const boundaries = nodes.filter((n) => n.type === 'boundary')
  const actors = nodes.filter((n) => n.type === 'actor')
  const useCases = nodes.filter((n) => n.type === 'useCase')
  const notes = nodes.filter((n) => n.type === 'note')

  actors.forEach((a) => {
    const d = a.data as unknown as UmlNodeData
    const prefix = d.actorType === 'system' ? '⚙️ ' : '👤 '
    lines.push(`  ${safeId(a.id)}["${prefix}${d.label || 'Actor'}"]`)
  })

  if (boundaries.length > 0) {
    const b = boundaries[0]
    const bd = b.data as unknown as UmlNodeData
    lines.push(
      `  subgraph ${safeId(b.id)}["${bd.boundaryTitle || bd.label || 'System Boundary'}"]`
    )
    useCases.forEach((u) => {
      const ud = u.data as unknown as UmlNodeData
      lines.push(`    ${safeId(u.id)}(["${ud.label || 'Use Case'}"])`)
    })
    lines.push(`  end`)
  } else {
    useCases.forEach((u) => {
      const ud = u.data as unknown as UmlNodeData
      lines.push(`  ${safeId(u.id)}(["${ud.label || 'Use Case'}"])`)
    })
  }

  notes.forEach((n) => {
    const nd = n.data as unknown as UmlNodeData
    lines.push(
      `  ${safeId(n.id)}["📝 ${(nd.description || nd.label || 'Note').replace(/"/g, "'")}"]`
    )
  })

  edges.forEach((e) => {
    const ed = e.data as unknown as UmlEdgeData
    const rel = ed?.relationshipType || 'association'
    const s = safeId(e.source)
    const t = safeId(e.target)
    if (rel === 'include') {
      lines.push(`  ${s} -. "«include»" .-> ${t}`)
    } else if (rel === 'extend') {
      const lbl = ed?.condition ? `«extend» [${ed.condition}]` : '«extend»'
      lines.push(`  ${s} -. "${lbl}" .-> ${t}`)
    } else if (rel === 'generalization') {
      lines.push(`  ${s} --|> ${t}`)
    } else {
      const lbl = ed?.label ? `|${ed.label}|` : ''
      lines.push(`  ${s} ---${lbl} ${t}`)
    }
  })

  return lines.join('\n')
}

export function downloadTextFile(
  content: string,
  fileName: string,
  mimeType = 'text/plain;charset=utf-8'
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = fileName
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

export function exportDiagramAsJson(
  project: DiagramProject,
  fileName = 'diagram.umly.json'
): void {
  const jsonStr = JSON.stringify(project, null, 2)
  downloadTextFile(jsonStr, fileName, 'application/json')
}

export function parseDiagramJson(jsonString: string): DiagramProject | null {
  try {
    const parsed = JSON.parse(jsonString)
    if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
      return parsed as DiagramProject
    }
    return null
  } catch (err) {
    console.error('Failed to parse diagram JSON', err)
    return null
  }
}
