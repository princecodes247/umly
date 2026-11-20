import type { Edge, Node } from '@xyflow/react'
import type { CaseStudyProgress } from '../types/caseStudy'

const PROGRESS_KEY = 'umly_case_studies_progress_v1'
const DRAFT_PREFIX = 'umly_case_study_draft_v1_'

export interface HighlightedTerm {
  text: string
  kind: string
}

export interface CaseStudyDraft {
  nodes: Node[]
  edges: Edge[]
  checkedDeliverables?: number[]
  highlightedTerms?: HighlightedTerm[]
  hintsUsed?: number
  hasSubmitted?: boolean
  updatedAt: string
}

export function getCaseStudyDraft(caseStudyId: string): CaseStudyDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`${DRAFT_PREFIX}${caseStudyId}`)
    if (!raw) return null
    return JSON.parse(raw) as CaseStudyDraft
  } catch {
    return null
  }
}

export function saveCaseStudyDraft(
  caseStudyId: string,
  partial: Partial<CaseStudyDraft> & { nodes: Node[]; edges: Edge[] }
): void {
  if (typeof window === 'undefined') return
  try {
    const existing = getCaseStudyDraft(caseStudyId)
    const payload: CaseStudyDraft = {
      ...existing,
      ...partial,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(`${DRAFT_PREFIX}${caseStudyId}`, JSON.stringify(payload))
  } catch (e) {
    console.error('Failed to save case study draft', e)
  }
}

export function clearCaseStudyDraft(caseStudyId: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(`${DRAFT_PREFIX}${caseStudyId}`)
  } catch (e) {
    console.error('Failed to clear case study draft', e)
  }
}

export function getAllCaseStudyProgress(): Record<string, CaseStudyProgress> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, CaseStudyProgress>
  } catch {
    return {}
  }
}

export function saveCaseStudyProgress(
  caseStudyId: string,
  score: number,
  stars = 0
): CaseStudyProgress {
  const completed = score >= 80
  if (typeof window === 'undefined') {
    return {
      caseStudyId,
      completed,
      bestScore: score,
      stars,
      attempts: 1,
      lastUpdatedAt: new Date().toISOString(),
    }
  }

  const all = getAllCaseStudyProgress()
  const existing = all[caseStudyId]
  const next: CaseStudyProgress = {
    caseStudyId,
    completed: Boolean(existing?.completed || completed),
    bestScore: Math.max(existing?.bestScore ?? 0, score),
    stars: Math.max(existing?.stars ?? 0, stars),
    attempts: (existing?.attempts ?? 0) + 1,
    lastUpdatedAt: new Date().toISOString(),
  }
  all[caseStudyId] = next

  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all))
  } catch (e) {
    console.error('Failed to save case study progress', e)
  }

  return next
}
