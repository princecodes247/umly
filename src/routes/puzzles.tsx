import { useState, useEffect, useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Star,
  Play,
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  Search,
  CheckCircle2,
  Circle,
  ArrowUpRight,
} from 'lucide-react'

import { LEVEL_SUMMARIES } from '../data/levels'
import {
  getPlayerStats,
  resetAllProgress,
  type PlayerStats,
} from '../lib/storage'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import type { LevelDefinition, LevelType, PuzzleDiagramType } from '../types/game'

const DIAGRAM_TYPE_META: Record<
  PuzzleDiagramType,
  { label: string; pillClass: string }
> = {
  use_case: {
    label: 'Use Case',
    pillClass:
      'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
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

export const Route = createFileRoute('/puzzles')({
  component: PuzzlesPage,
})

function PuzzlesPage() {
  const [stats, setStats] = useState<PlayerStats>({
    completedLevels: 0,
    totalStars: 0,
    progressByLevel: {},
  })
  const [selectedFilter, setSelectedFilter] = useState<'all' | LevelType>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    'all' | LevelDefinition['difficulty']
  >('all')
  const [selectedDiagramType, setSelectedDiagramType] = useState<
    'all' | PuzzleDiagramType
  >('all')
  const [viewMode, setViewMode] = useState<'gallery' | 'table'>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const reloadStats = () => {
    setStats(getPlayerStats(LEVEL_SUMMARIES.length))
  }

  useEffect(() => {
    reloadStats()
  }, [])

  const handleReset = () => {
    setShowResetConfirm(true)
  }

  const confirmResetProgress = () => {
    resetAllProgress()
    setShowResetConfirm(false)
    reloadStats()
  }

  const diagramCounts = useMemo(() => {
    const counts: Record<'all' | PuzzleDiagramType, number> = {
      all: LEVEL_SUMMARIES.length,
      use_case: 0,
      er: 0,
      class: 0,
      dfd: 0,
    }
    for (const l of LEVEL_SUMMARIES) {
      const dt = l.diagramType ?? 'use_case'
      counts[dt] += 1
    }
    return counts
  }, [])

  const filteredLevels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return LEVEL_SUMMARIES.filter((l) => {
      const matchesType = selectedFilter === 'all' || l.type === selectedFilter
      const matchesDifficulty =
        selectedDifficulty === 'all' || l.difficulty === selectedDifficulty
      const matchesDiagram =
        selectedDiagramType === 'all' ||
        (l.diagramType ?? 'use_case') === selectedDiagramType
      const matchesSearch =
        q === '' ||
        l.title.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.scenario.toLowerCase().includes(q)
      return (
        matchesType && matchesDifficulty && matchesDiagram && matchesSearch
      )
    })
  }, [selectedFilter, selectedDifficulty, selectedDiagramType, searchQuery])

  const totalPossibleStars = LEVEL_SUMMARIES.length * 3
  const progressPercent =
    LEVEL_SUMMARIES.length > 0
      ? Math.round((stats.completedLevels / LEVEL_SUMMARIES.length) * 100)
      : 0

  const nextUnsolvedLevel =
    LEVEL_SUMMARIES.find((l) => !stats.progressByLevel[l.id]?.completed) ||
    LEVEL_SUMMARIES[0]

  const difficultyPillClass = (diff: string) => {
    switch (diff) {
      case 'Beginner':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
      case 'Easy':
        return 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
      case 'Intermediate':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
      case 'Advanced':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
      default:
        return 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
    }
  }

  const hasActiveFilters =
    selectedFilter !== 'all' ||
    selectedDifficulty !== 'all' ||
    selectedDiagramType !== 'all' ||
    searchQuery.trim() !== ''

  const clearFilters = () => {
    setSelectedFilter('all')
    setSelectedDifficulty('all')
    setSelectedDiagramType('all')
    setSearchQuery('')
  }

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
      {/* Page Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Interactive Puzzles
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Practice Use Case, ER, Class, and Data Flow modeling with instant validation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {stats.completedLevels > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-[var(--border-subtle)] text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {nextUnsolvedLevel && (
            <Link
              to="/play/$levelId"
              params={{ levelId: nextUnsolvedLevel.id }}
              className="inline-flex items-center justify-center gap-2 flex-1 sm:flex-initial rounded-full bg-gray-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 font-semibold text-xs sm:text-sm px-5 py-2.5 transition shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {stats.completedLevels > 0
                  ? `Continue: Level ${nextUnsolvedLevel.number}`
                  : 'Start Level 1'}
              </span>
            </Link>
          )}
        </div>
      </header>

      {/* Stats Strip */}
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
        <div className="p-3.5 sm:p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <span className="text-xs text-[var(--text-tertiary)] font-medium">
            Solved
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-extrabold font-mono text-[var(--text-primary)]">
              {stats.completedLevels}
            </span>
            <span className="text-xs font-mono text-[var(--text-tertiary)]">
              / {LEVEL_SUMMARIES.length}
            </span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <span className="text-xs text-[var(--text-tertiary)] font-medium">
            Stars Earned
          </span>
          <div className="mt-1 flex items-center gap-1.5">
            <Star className="w-4 h-4 fill-amber-400 text-amber-500 shrink-0" />
            <span className="text-xl sm:text-2xl font-extrabold font-mono text-[var(--text-primary)]">
              {stats.totalStars}
            </span>
            <span className="text-xs font-mono text-[var(--text-tertiary)]">
              / {totalPossibleStars}
            </span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-tertiary)] font-medium">
              Completion
            </span>
            <span className="font-mono font-bold text-[var(--text-primary)]">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden mt-3">
            <div
              className="h-full bg-gray-900 dark:bg-white rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* Filter Toolbar */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'All Diagrams' },
                { id: 'use_case', label: 'Use Case' },
                { id: 'er', label: 'ER Diagram' },
                { id: 'class', label: 'Class Diagram' },
                { id: 'dfd', label: 'Data Flow' },
              ] as const
            ).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDiagramType(d.id)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  selectedDiagramType === d.id
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'bg-[var(--bg-secondary)]/60 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                <span>{d.label}</span>
                <span
                  className={`font-mono text-[10px] ${
                    selectedDiagramType === d.id
                      ? 'opacity-75'
                      : 'text-[var(--text-tertiary)]'
                  }`}
                >
                  {diagramCounts[d.id]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 self-start sm:self-auto bg-[var(--bg-secondary)] p-1 rounded-full border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setViewMode('gallery')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                viewMode === 'gallery'
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                viewMode === 'table'
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {(
                ['all', 'Beginner', 'Easy', 'Intermediate', 'Advanced'] as const
              ).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedDifficulty === diff
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                  }`}
                >
                  {diff === 'all' ? 'All Levels' : diff}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-[var(--border-subtle)] hidden sm:block" />

            <select
              aria-label="Filter by challenge type"
              value={selectedFilter}
              onChange={(e) =>
                setSelectedFilter(e.target.value as 'all' | LevelType)
              }
              className="px-3 py-1 text-xs rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
            >
              <option value="all">All Types</option>
              <option value="build">Build</option>
              <option value="fix">Fix</option>
              <option value="classify">Classify</option>
            </select>
          </div>

          <div className="relative flex items-center w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search puzzles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 w-full sm:w-56 text-xs rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-strong)]"
            />
          </div>
        </div>

        {filteredLevels.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-[var(--border-default)] text-center space-y-2">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              No puzzles match your current filters.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-[var(--primary-btn)] hover:underline font-semibold"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : viewMode === 'gallery' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredLevels.map((lvl) => {
              const progress = stats.progressByLevel[lvl.id]
              const isCompleted = progress?.completed
              const stars = progress?.stars || 0
              const dtMeta = DIAGRAM_TYPE_META[lvl.diagramType ?? 'use_case']

              return (
                <Link
                  key={lvl.id}
                  to="/play/$levelId"
                  params={{ levelId: lvl.id }}
                  className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--border-strong)] hover:shadow-sm transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[var(--text-tertiary)]">
                          #{lvl.number}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${dtMeta.pillClass}`}
                        >
                          {dtMeta.label}
                        </span>
                      </div>

                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <h2 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--primary-btn)] transition-colors leading-snug">
                        {lvl.title}
                      </h2>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {lvl.scenario}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${difficultyPillClass(
                          lvl.difficulty
                        )}`}
                      >
                        {lvl.difficulty}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] capitalize text-[11px] font-medium">
                        {lvl.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((starIdx) => (
                          <Star
                            key={starIdx}
                            className={`w-3.5 h-3.5 ${
                              starIdx <= stars
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-[var(--border-strong)]'
                            }`}
                          />
                        ))}
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="border border-[var(--border-subtle)] rounded-2xl overflow-x-auto bg-[var(--bg-primary)]">
            <table className="w-full min-w-[680px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 text-[var(--text-secondary)]">
                  <th className="py-3 px-4 font-semibold w-12">#</th>
                  <th className="py-3 px-4 font-semibold">Puzzle</th>
                  <th className="py-3 px-4 font-semibold">Diagram</th>
                  <th className="py-3 px-4 font-semibold">Difficulty</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Stars</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredLevels.map((lvl) => {
                  const progress = stats.progressByLevel[lvl.id]
                  const isCompleted = progress?.completed
                  const stars = progress?.stars || 0
                  const dtMeta = DIAGRAM_TYPE_META[lvl.diagramType ?? 'use_case']

                  return (
                    <tr
                      key={lvl.id}
                      className="hover:bg-[var(--hover-bg)] transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">
                        #{lvl.number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                        <Link
                          to="/play/$levelId"
                          params={{ levelId: lvl.id }}
                          className="hover:text-[var(--primary-btn)] transition-colors"
                        >
                          {lvl.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${dtMeta.pillClass}`}
                        >
                          {dtMeta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${difficultyPillClass(
                            lvl.difficulty
                          )}`}
                        >
                          {lvl.difficulty}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] capitalize text-[11px] font-medium">
                          {lvl.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3].map((starIdx) => (
                            <Star
                              key={starIdx}
                              className={`w-3.5 h-3.5 ${
                                starIdx <= stars
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-[var(--border-strong)]'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Solved</span>
                          </span>
                        ) : (
                          <span className="text-[var(--text-tertiary)]">
                            Todo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to="/play/$levelId"
                          params={{ levelId: lvl.id }}
                          className="inline-flex items-center gap-1 text-[var(--primary-btn)] hover:underline font-semibold"
                        >
                          <span>{isCompleted ? 'Review' : 'Solve'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset all progress?"
        description="This will clear all completed puzzle statuses and earned stars."
        confirmLabel="Reset Progress"
        onConfirm={confirmResetProgress}
        onCancel={() => setShowResetConfirm(false)}
      />
    </main>
  )
}
