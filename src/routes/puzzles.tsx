import { useState, useEffect, useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Star,
  Play,
  RotateCcw,
  BookOpen,
  LayoutGrid,
  Table as TableIcon,
  Search,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  PenTool,
} from 'lucide-react'

import { LEVEL_SUMMARIES } from '../data/levels'
import {
  getPlayerStats,
  resetAllProgress,
  type PlayerStats,
} from '../lib/storage'
import { UmlCheatsheetModal } from '../components/game/UmlCheatsheetModal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import type { LevelDefinition, LevelType, PuzzleDiagramType } from '../types/game'

const DIAGRAM_TYPE_META: Record<
  PuzzleDiagramType,
  { label: string; tagClass: string }
> = {
  use_case: { label: 'Use Case', tagClass: 'notion-tag-blue' },
  er: { label: 'ER Diagram', tagClass: 'notion-tag-green' },
  class: { label: 'Class Diagram', tagClass: 'notion-tag-purple' },
  dfd: { label: 'Data Flow', tagClass: 'notion-tag-orange' },
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
  const [viewMode, setViewMode] = useState<'gallery' | 'table'>('gallery')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCheatsheet, setShowCheatsheet] = useState(false)
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

  const difficultyTagClass = (diff: string) => {
    switch (diff) {
      case 'Beginner':
        return 'notion-tag-green'
      case 'Easy':
        return 'notion-tag-blue'
      case 'Intermediate':
        return 'notion-tag-orange'
      case 'Advanced':
        return 'notion-tag-purple'
      default:
        return 'notion-tag-gray'
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
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      {/* Compact Page Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Interactive Puzzles
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Practice Use Case, ER, Class, and Data Flow modeling with instant validation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {stats.completedLevels > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="notion-btn notion-btn-ghost py-1.5 px-2.5 text-xs text-red-600 dark:text-red-400"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowCheatsheet(true)}
            className="notion-btn py-1.5 px-3 text-xs text-[var(--text-secondary)]"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Notation Guide</span>
          </button>

          <Link
            to="/studio"
            className="notion-btn py-1.5 px-3 text-xs text-[var(--text-secondary)]"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Studio</span>
          </Link>

          {nextUnsolvedLevel && (
            <Link
              to="/play/$levelId"
              params={{ levelId: nextUnsolvedLevel.id }}
              className="notion-btn notion-btn-primary py-1.5 px-3 text-xs font-semibold"
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

      {/* Compact Stats Strip */}
      <section className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <span className="text-[11px] text-[var(--text-tertiary)] font-medium">
            Solved
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-bold font-mono text-[var(--text-primary)]">
              {stats.completedLevels}
            </span>
            <span className="text-xs font-mono text-[var(--text-tertiary)]">
              / {LEVEL_SUMMARIES.length}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <span className="text-[11px] text-[var(--text-tertiary)] font-medium">
            Stars Earned
          </span>
          <div className="mt-1 flex items-center gap-1.5">
            <Star className="w-4 h-4 fill-[#cb912f] dark:fill-[#dcb14b] text-[#cb912f] dark:text-[#dcb14b]" />
            <span className="text-lg font-bold font-mono text-[var(--text-primary)]">
              {stats.totalStars}
            </span>
            <span className="text-xs font-mono text-[var(--text-tertiary)]">
              / {totalPossibleStars}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-tertiary)] font-medium">
              Completion
            </span>
            <span className="font-mono font-semibold text-[var(--text-primary)]">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden mt-2">
            <div
              className="h-full bg-[var(--primary-btn)] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* Filter Toolbar */}
      <section className="space-y-3">
        {/* Top Filter Row: Diagram Type Tabs + View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <div className="flex flex-wrap items-center gap-1">
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
                className={`px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  selectedDiagramType === d.id
                    ? 'bg-[var(--primary-btn)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                <span>{d.label}</span>
                <span
                  className={`font-mono text-[10px] ${
                    selectedDiagramType === d.id
                      ? 'text-white/80'
                      : 'text-[var(--text-tertiary)]'
                  }`}
                >
                  {diagramCounts[d.id]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 self-start sm:self-auto bg-[var(--bg-secondary)] p-0.5 rounded-[5px] border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setViewMode('gallery')}
              className={`flex items-center gap-1 px-2 py-1 rounded-[4px] text-xs font-medium transition-colors ${
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
              className={`flex items-center gap-1 px-2 py-1 rounded-[4px] text-xs font-medium transition-colors ${
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

        {/* Secondary Filter Row: Difficulty + Challenge Type + Search */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Difficulty Pills */}
            <div className="flex flex-wrap items-center gap-1">
              {(
                ['all', 'Beginner', 'Easy', 'Intermediate', 'Advanced'] as const
              ).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-2 py-0.5 rounded-[4px] text-xs transition-colors ${
                    selectedDifficulty === diff
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                  }`}
                >
                  {diff === 'all' ? 'All Levels' : diff}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-[var(--border-subtle)] hidden sm:block" />

            {/* Challenge Type Select */}
            <select
              aria-label="Filter by challenge type"
              value={selectedFilter}
              onChange={(e) =>
                setSelectedFilter(e.target.value as 'all' | LevelType)
              }
              className="px-2 py-1 text-xs rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
            >
              <option value="all">All Types</option>
              <option value="build">Build</option>
              <option value="fix">Fix</option>
              <option value="classify">Classify</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex items-center w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search puzzles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 w-full sm:w-56 text-xs rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-strong)]"
            />
          </div>
        </div>

        {/* Empty Filter State */}
        {filteredLevels.length === 0 ? (
          <div className="p-10 rounded-[6px] border border-dashed border-[var(--border-default)] text-center space-y-2">
            <p className="text-xs font-medium text-[var(--text-primary)]">
              No puzzles match your current filters.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-[var(--primary-btn)] hover:underline font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : viewMode === 'gallery' ? (
          /* Cards View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                  className="p-4 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--border-strong)] hover:shadow-sm transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    {/* Top Meta Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-[var(--text-tertiary)]">
                          #{lvl.number}
                        </span>
                        <span
                          className={`notion-tag ${dtMeta.tagClass} text-[10px]`}
                        >
                          {dtMeta.label}
                        </span>
                      </div>

                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-[#448361] dark:text-[#529e72] shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
                      )}
                    </div>

                    {/* Title & Scenario */}
                    <div className="space-y-1">
                      <h2 className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--primary-btn)] transition-colors leading-snug">
                        {lvl.title}
                      </h2>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {lvl.scenario}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-3 mt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`notion-tag ${difficultyTagClass(
                          lvl.difficulty
                        )} text-[10px]`}
                      >
                        {lvl.difficulty}
                      </span>
                      <span className="notion-tag notion-tag-gray capitalize text-[10px]">
                        {lvl.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((starIdx) => (
                          <Star
                            key={starIdx}
                            className={`w-3 h-3 ${
                              starIdx <= stars
                                ? 'fill-[#cb912f] dark:fill-[#dcb14b] text-[#cb912f] dark:text-[#dcb14b]'
                                : 'text-[var(--border-strong)]'
                            }`}
                          />
                        ))}
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:text-[var(--primary-btn)] transition-colors" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          /* Table View */
          <div className="border border-[var(--border-subtle)] rounded-[6px] overflow-x-auto bg-[var(--bg-primary)]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                  <th className="py-2.5 px-3 font-medium w-12">#</th>
                  <th className="py-2.5 px-3 font-medium">Puzzle</th>
                  <th className="py-2.5 px-3 font-medium">Diagram</th>
                  <th className="py-2.5 px-3 font-medium">Difficulty</th>
                  <th className="py-2.5 px-3 font-medium">Type</th>
                  <th className="py-2.5 px-3 font-medium">Stars</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium text-right">Action</th>
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
                      <td className="py-2.5 px-3 font-mono text-[var(--text-secondary)]">
                        #{lvl.number}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">
                        <Link
                          to="/play/$levelId"
                          params={{ levelId: lvl.id }}
                          className="hover:text-[var(--primary-btn)] transition-colors"
                        >
                          {lvl.title}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`notion-tag ${dtMeta.tagClass}`}>
                          {dtMeta.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`notion-tag ${difficultyTagClass(
                            lvl.difficulty
                          )}`}
                        >
                          {lvl.difficulty}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="notion-tag notion-tag-gray capitalize">
                          {lvl.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3].map((starIdx) => (
                            <Star
                              key={starIdx}
                              className={`w-3 h-3 ${
                                starIdx <= stars
                                  ? 'fill-[#cb912f] dark:fill-[#dcb14b] text-[#cb912f] dark:text-[#dcb14b]'
                                  : 'text-[var(--border-strong)]'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[#448361] dark:text-[#529e72] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Solved</span>
                          </span>
                        ) : (
                          <span className="text-[var(--text-tertiary)]">
                            Todo
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          to="/play/$levelId"
                          params={{ levelId: lvl.id }}
                          className="inline-flex items-center gap-1 text-[var(--primary-btn)] hover:underline font-medium"
                        >
                          <span>{isCompleted ? 'Review' : 'Solve'}</span>
                          <ArrowUpRight className="w-3 h-3" />
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

      {/* Cheatsheet Modal */}
      <UmlCheatsheetModal
        isOpen={showCheatsheet}
        onClose={() => setShowCheatsheet(false)}
      />

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
