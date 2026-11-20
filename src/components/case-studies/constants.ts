import type { CaseStudy } from '../../types/caseStudy'

export const DIAGRAM_LABELS: Record<CaseStudy['diagramType'], string> = {
  use_case: 'Use Case',
  er: 'ER Diagram',
  class: 'Class Diagram',
  dfd: 'Data Flow (DFD)',
}

export const DIFFICULTY_STYLES: Record<CaseStudy['difficulty'], string> = {
  Beginner:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  Easy: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  Intermediate:
    'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  Advanced:
    'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
}

export const KIND_LABELS: Record<string, string> = {
  actor: 'Actor',
  useCase: 'Use Case',
  erEntity: 'Entity',
  umlClass: 'Class',
  dfdProcess: 'Process',
  dfdDataStore: 'Store',
  dfdExternalEntity: 'External',
}

export interface HighlightStyle {
  mark: string
  chipBorder: string
  badge: string
}

const PURPLE_HIGHLIGHT: HighlightStyle = {
  mark: 'bg-purple-200/75 dark:bg-purple-500/30 decoration-purple-500/75',
  chipBorder: 'border-purple-300/80 dark:border-purple-700/60',
  badge:
    'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300',
}

const BLUE_HIGHLIGHT: HighlightStyle = {
  mark: 'bg-blue-200/75 dark:bg-blue-500/30 decoration-blue-500/75',
  chipBorder: 'border-blue-300/80 dark:border-blue-700/60',
  badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300',
}

const EMERALD_HIGHLIGHT: HighlightStyle = {
  mark: 'bg-emerald-200/75 dark:bg-emerald-500/30 decoration-emerald-500/75',
  chipBorder: 'border-emerald-300/80 dark:border-emerald-700/60',
  badge:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
}

export const KIND_HIGHLIGHT_STYLES: Record<string, HighlightStyle> = {
  actor: PURPLE_HIGHLIGHT,
  dfdExternalEntity: PURPLE_HIGHLIGHT,
  useCase: BLUE_HIGHLIGHT,
  umlClass: BLUE_HIGHLIGHT,
  dfdProcess: BLUE_HIGHLIGHT,
  erEntity: EMERALD_HIGHLIGHT,
  dfdDataStore: EMERALD_HIGHLIGHT,
}

export const DEFAULT_HIGHLIGHT_STYLE: HighlightStyle = {
  mark: 'bg-amber-200/80 dark:bg-amber-500/30 decoration-amber-500/70',
  chipBorder: 'border-[var(--border-subtle)]',
  badge: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
}

