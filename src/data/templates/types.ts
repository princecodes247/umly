import type { Node, Edge } from '@xyflow/react'

export interface DiagramTemplate {
  id: string
  name: string
  description: string
  diagramType?: 'use_case' | 'er' | 'class' | 'dfd'
  nodes: Node[]
  edges: Edge[]
}

