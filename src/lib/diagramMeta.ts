import type { PuzzleDiagramType } from '../types/game'

export const DIAGRAM_TYPE_META: Record<
  PuzzleDiagramType,
  { label: string; pillClass: string }
> = {
  use_case: {
    label: 'Use Case',
    pillClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  },
  er: {
    label: 'ER Diagram',
    pillClass:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  class: {
    label: 'Class Diagram',
    pillClass:
      'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
  },
  dfd: {
    label: 'Data Flow',
    pillClass:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  },
}

