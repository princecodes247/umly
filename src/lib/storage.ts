import type { LevelProgress } from '../types/game'

const STORAGE_KEY = 'umly_player_progress_v1'

export interface PlayerStats {
  completedLevels: number
  totalStars: number
  progressByLevel: Record<string, LevelProgress>
}

export function getStoredProgress(): Record<string, LevelProgress> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to parse progress from localStorage', e)
    return {}
  }
}

export function saveLevelProgress(
  levelId: string,
  stars: number,
  hintsUsed: number,
  attempts: number
): LevelProgress {
  if (typeof window === 'undefined') {
    return { levelId, completed: true, stars, attempts, hintsUsed }
  }

  const allProgress = getStoredProgress()
  const existing = allProgress[levelId]

  const newProgress: LevelProgress = {
    levelId,
    completed: true,
    stars: Math.max(existing?.stars || 0, stars),
    attempts: (existing?.attempts || 0) + attempts,
    hintsUsed: Math.max(existing?.hintsUsed || 0, hintsUsed),
    completedAt: new Date().toISOString(),
  }

  allProgress[levelId] = newProgress

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress))
  } catch (e) {
    console.error('Failed to save progress to localStorage', e)
  }

  return newProgress
}

export function getPlayerStats(_totalLevelsCount: number): PlayerStats {
  const progress = getStoredProgress()
  const progressList = Object.values(progress)
  const completed = progressList.filter((p) => p.completed).length
  const totalStars = progressList.reduce((sum, p) => sum + (p.stars || 0), 0)

  return {
    completedLevels: completed,
    totalStars,
    progressByLevel: progress,
  }
}

export function resetAllProgress(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.error('Failed to reset progress', e)
  }
}
