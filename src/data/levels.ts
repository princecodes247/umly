import type { LevelDefinition, PuzzleDiagramType } from '../types/game'
import { CLASS_LEVELS } from './puzzles/classLevels'
import { DFD_LEVELS } from './puzzles/dfdLevels'
import { ER_LEVELS } from './puzzles/erLevels'
import { USE_CASE_LEVELS } from './puzzles/useCaseLevels'

function withDiagramType(
  levels: LevelDefinition[],
  diagramType: PuzzleDiagramType
): LevelDefinition[] {
  return levels.map((level) => ({
    ...level,
    diagramType: level.diagramType ?? diagramType,
  }))
}

const ALL_RAW_LEVELS: LevelDefinition[] = [
  ...withDiagramType(USE_CASE_LEVELS, 'use_case'),
  ...withDiagramType(ER_LEVELS, 'er'),
  ...withDiagramType(CLASS_LEVELS, 'class'),
  ...withDiagramType(DFD_LEVELS, 'dfd'),
]

export const LEVELS: LevelDefinition[] = ALL_RAW_LEVELS.map((level, index) => ({
  ...level,
  number: index + 1,
}))

export function getLevelById(id: string): LevelDefinition | undefined {
  return LEVELS.find((l) => l.id === id)
}

export function getNextLevel(currentId: string): LevelDefinition | undefined {
  const currentIndex = LEVELS.findIndex((l) => l.id === currentId)
  if (currentIndex >= 0 && currentIndex < LEVELS.length - 1) {
    return LEVELS[currentIndex + 1]
  }
  return undefined
}

export function getLevelsByDiagramType(
  diagramType: PuzzleDiagramType | 'all'
): LevelDefinition[] {
  if (diagramType === 'all') return LEVELS
  return LEVELS.filter((l) => (l.diagramType ?? 'use_case') === diagramType)
}
