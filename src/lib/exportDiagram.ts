import { toPng, toSvg } from 'html-to-image'
import type { Node, Edge } from '@xyflow/react'

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

  // Hide UI overlays during export
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

export function exportDiagramAsJson(
  project: DiagramProject,
  fileName = 'diagram.umly.json'
): void {
  const jsonStr = JSON.stringify(project, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = fileName
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
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
