import type { Node, Edge } from '@xyflow/react'
import { DIAGRAM_TEMPLATES } from '../data/templates'

export type DiagramType =
  | 'use_case'
  | 'er'
  | 'class'
  | 'sequence'
  | 'activity'
  | 'state_machine'

export interface DiagramSnapshot {
  id: string
  timestamp: string
  label: string
  nodes: Node[]
  edges: Edge[]
}

export interface DiagramDraft {
  id: string
  title: string
  type: DiagramType
  createdAt: string
  updatedAt: string
  nodes: Node[]
  edges: Edge[]
  templateId?: string
}

const STORAGE_KEY = 'umly_diagram_drafts_v1'
const LAST_ACTIVE_KEY = 'umly_last_active_diagram_id'
const SNAPSHOTS_PREFIX = 'umly_snapshots_v1_'
const MAX_SNAPSHOTS = 15

export function getDefaultSeedDraft(): DiagramDraft {
  const atmTemplate =
    DIAGRAM_TEMPLATES.find((t) => t.id === 'atm-banking') ||
    DIAGRAM_TEMPLATES[1]
  const now = new Date().toISOString()

  return {
    id: 'draft-atm-demo',
    title: 'ATM Banking System',
    type: 'use_case',
    createdAt: now,
    updatedAt: now,
    nodes: atmTemplate.nodes,
    edges: atmTemplate.edges,
    templateId: 'atm-banking',
  }
}

export function listDiagramDrafts(): DiagramDraft[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seed = getDefaultSeedDraft()
      localStorage.setItem(STORAGE_KEY, JSON.stringify([seed]))
      return [seed]
    }

    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as DiagramDraft[]
    }

    const seed = getDefaultSeedDraft()
    localStorage.setItem(STORAGE_KEY, JSON.stringify([seed]))
    return [seed]
  } catch (err) {
    console.warn('Failed to load drafts from storage', err)
    return [getDefaultSeedDraft()]
  }
}

export function getDiagramDraft(id: string): DiagramDraft | null {
  const drafts = listDiagramDrafts()
  return drafts.find((d) => d.id === id) || null
}

export function saveDiagramDraft(draft: DiagramDraft): void {
  if (typeof window === 'undefined') return

  try {
    const drafts = listDiagramDrafts()
    const index = drafts.findIndex((d) => d.id === draft.id)
    const updatedDraft = {
      ...draft,
      updatedAt: new Date().toISOString(),
    }

    let nextDrafts: DiagramDraft[]
    if (index >= 0) {
      nextDrafts = [...drafts]
      nextDrafts[index] = updatedDraft
    } else {
      nextDrafts = [updatedDraft, ...drafts]
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDrafts))
    localStorage.setItem(LAST_ACTIVE_KEY, draft.id)
  } catch (err) {
    console.warn('Failed to save diagram draft', err)
  }
}

export function listDiagramSnapshots(diagramId: string): DiagramSnapshot[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(`${SNAPSHOTS_PREFIX}${diagramId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as DiagramSnapshot[]) : []
  } catch {
    return []
  }
}

export function saveDiagramSnapshot(
  diagramId: string,
  label: string,
  nodes: Node[],
  edges: Edge[]
): DiagramSnapshot[] {
  if (typeof window === 'undefined') return []
  try {
    const existing = listDiagramSnapshots(diagramId)
    // Avoid saving duplicate consecutive snapshot if topology & positions haven't changed
    if (existing.length > 0) {
      const latest = existing[0]
      const sameNodes =
        JSON.stringify(
          latest.nodes.map((n) => ({
            id: n.id,
            p: n.position,
            l: n.data?.label,
          }))
        ) ===
        JSON.stringify(
          nodes.map((n) => ({ id: n.id, p: n.position, l: n.data?.label }))
        )
      const sameEdges =
        JSON.stringify(
          latest.edges.map((e) => ({
            s: e.source,
            t: e.target,
            r: e.data?.relationshipType,
          }))
        ) ===
        JSON.stringify(
          edges.map((e) => ({
            s: e.source,
            t: e.target,
            r: e.data?.relationshipType,
          }))
        )
      if (sameNodes && sameEdges && label === 'Autosave') {
        return existing
      }
    }

    const snapshot: DiagramSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      label,
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    }

    const updated = [snapshot, ...existing].slice(0, MAX_SNAPSHOTS)
    localStorage.setItem(
      `${SNAPSHOTS_PREFIX}${diagramId}`,
      JSON.stringify(updated)
    )
    return updated
  } catch (err) {
    console.warn('Failed to save snapshot', err)
    return []
  }
}

export function deleteDiagramDraft(id: string): void {
  if (typeof window === 'undefined') return

  try {
    const drafts = listDiagramDrafts()
    const filtered = drafts.filter((d) => d.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    localStorage.removeItem(`${SNAPSHOTS_PREFIX}${id}`)

    const lastActive = localStorage.getItem(LAST_ACTIVE_KEY)
    if (lastActive === id) {
      if (filtered.length > 0) {
        localStorage.setItem(LAST_ACTIVE_KEY, filtered[0].id)
      } else {
        localStorage.removeItem(LAST_ACTIVE_KEY)
      }
    }
  } catch (err) {
    console.warn('Failed to delete diagram draft', err)
  }
}

export function createDiagramDraft(
  title: string,
  type: DiagramType = 'use_case',
  templateId?: string
): DiagramDraft {
  const id = `diagram-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
  const now = new Date().toISOString()

  let initialNodes: Node[] = []
  let initialEdges: Edge[] = []

  if (templateId && templateId !== 'blank') {
    const template = DIAGRAM_TEMPLATES.find((t) => t.id === templateId)
    if (template) {
      initialNodes = JSON.parse(JSON.stringify(template.nodes))
      initialEdges = JSON.parse(JSON.stringify(template.edges))
    }
  }

  const newDraft: DiagramDraft = {
    id,
    title: title.trim() || 'Untitled Diagram',
    type,
    createdAt: now,
    updatedAt: now,
    nodes: initialNodes,
    edges: initialEdges,
    templateId,
  }

  saveDiagramDraft(newDraft)
  return newDraft
}

export function getLastActiveDiagramId(): string {
  if (typeof window === 'undefined') return 'draft-atm-demo'
  const stored = localStorage.getItem(LAST_ACTIVE_KEY)
  if (stored) return stored

  const drafts = listDiagramDrafts()
  return drafts.length > 0 ? drafts[0].id : 'draft-atm-demo'
}
