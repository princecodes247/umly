import { toPng, toSvg } from 'html-to-image'
import type { Node, Edge } from '@xyflow/react'

export interface DiagramProject {
  title: string
  version: string
  updatedAt: string
  nodes: Node[]
  edges: Edge[]
}

export async function exportDiagramAsPng(
  canvasElement: HTMLElement,
  fileName = 'use-case-diagram.png'
): Promise<void> {
  // Hide UI overlays during export
  const controls = canvasElement.querySelectorAll('.react-flow__controls, .react-flow__minimap, .react-flow__panel')
  controls.forEach((el) => {
    ;(el as HTMLElement).style.display = 'none'
  })

  try {
    const dataUrl = await toPng(canvasElement, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      filter: (node) => {
        // Exclude minimap or controls if any
        if (
          node instanceof HTMLElement &&
          (node.classList.contains('react-flow__controls') ||
            node.classList.contains('react-flow__minimap'))
        ) {
          return false
        }
        return true
      },
    })

    const link = document.createElement('a')
    link.download = fileName
    link.href = dataUrl
    link.click()
  } finally {
    // Restore UI overlays
    controls.forEach((el) => {
      ;(el as HTMLElement).style.display = ''
    })
  }
}

export async function exportDiagramAsSvg(
  canvasElement: HTMLElement,
  fileName = 'use-case-diagram.svg'
): Promise<void> {
  const controls = canvasElement.querySelectorAll('.react-flow__controls, .react-flow__minimap')
  controls.forEach((el) => {
    ;(el as HTMLElement).style.display = 'none'
  })

  try {
    const dataUrl = await toSvg(canvasElement, {
      backgroundColor: '#ffffff',
      filter: (node) => {
        if (
          node instanceof HTMLElement &&
          (node.classList.contains('react-flow__controls') ||
            node.classList.contains('react-flow__minimap'))
        ) {
          return false
        }
        return true
      },
    })

    const link = document.createElement('a')
    link.download = fileName
    link.href = dataUrl
    link.click()
  } finally {
    controls.forEach((el) => {
      ;(el as HTMLElement).style.display = ''
    })
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

