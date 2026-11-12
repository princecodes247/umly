import type {
  LevelDefinition,
  LevelSummary,
  PuzzleDiagramType,
} from '../types/game'
import { PUZZLE_FILE_BY_ID, PUZZLE_SUMMARIES } from './puzzles'

const puzzleModules = import.meta.glob<{ default: LevelDefinition }>(
  './puzzles/*/*.json'
)

const levelCache = new Map<string, LevelDefinition>()

export const LEVEL_SUMMARIES: LevelSummary[] = PUZZLE_SUMMARIES

export function getLevelSummaryById(id: string): LevelSummary | undefined {
  return LEVEL_SUMMARIES.find((l) => l.id === id)
}

export function getNextLevelSummary(
  currentId: string
): LevelSummary | undefined {
  const currentIndex = LEVEL_SUMMARIES.findIndex((l) => l.id === currentId)
  if (currentIndex >= 0 && currentIndex < LEVEL_SUMMARIES.length - 1) {
    return LEVEL_SUMMARIES[currentIndex + 1]
  }
  return undefined
}

export function getLevelSummariesByDiagramType(
  diagramType: PuzzleDiagramType | 'all'
): LevelSummary[] {
  if (diagramType === 'all') return LEVEL_SUMMARIES
  return LEVEL_SUMMARIES.filter(
    (l) => (l.diagramType ?? 'use_case') === diagramType
  )
}

export async function loadLevelById(
  id: string
): Promise<LevelDefinition | undefined> {
  const cached = levelCache.get(id)
  if (cached) return cached

  const modulePath = PUZZLE_FILE_BY_ID[id]
  if (!modulePath) return undefined

  const loader = puzzleModules[modulePath]
  if (!loader) return undefined

  const mod = await loader()
  const summary = getLevelSummaryById(id)
  const level: LevelDefinition = {
    ...mod.default,
    number: summary?.number ?? mod.default.number,
    diagramType: summary?.diagramType ?? mod.default.diagramType ?? 'use_case',
  }

  levelCache.set(id, level)
  return level
}
