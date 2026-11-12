import { useState, useEffect } from 'react'
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
import type { LevelType, PuzzleDiagramType } from '../types/game'

const DIAGRAM_TYPE_META: Record<
  PuzzleDiagramType,
  { label: string; short: string; tagClass: string }
> = {
  use_case: { label: 'Use Case', short: 'UC', tagClass: 'notion-tag-blue' },
  er: { label: 'ER Diagram', short: 'ER', tagClass: 'notion-tag-green' },
  class: { label: 'Class Diagram', short: 'CLS', tagClass: 'notion-tag-purple' },
  dfd: { label: 'Data Flow', short: 'DFD', tagClass: 'notion-tag-amber' },
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
  const [selectedDiagramType, setSelectedDiagramType] = useState<
    'all' | PuzzleDiagramType
  >('all')
  const [viewMode, setViewMode] = useState<'gallery' | 'table'>('gallery')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCheatsheet, setShowCheatsheet] = useState(false)

  const reloadStats = () => {
    setStats(getPlayerStats(LEVEL_SUMMARIES.length))
  }

  useEffect(() => {
    reloadStats()
  }, [])

  const handleReset = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all your progress and stars?'
      )
    ) {
      resetAllProgress()
      reloadStats()
    }
  }

  const filteredLevels = LEVEL_SUMMARIES.filter((l) => {
    const matchesFilter = selectedFilter === 'all' || l.type === selectedFilter
    const matchesDiagram =
      selectedDiagramType === 'all' ||
      (l.diagramType ?? 'use_case') === selectedDiagramType
    const matchesSearch =
      searchQuery.trim() === '' ||
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.scenario.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesDiagram && matchesSearch
  })

  const totalPossibleStars = LEVEL_SUMMARIES.length * 3
  const progressPercent = Math.round(
    (stats.completedLevels / LEVEL_SUMMARIES.length) * 100
  )

  const nextUnsolvedLevel =
    LEVEL_SUMMARIES.find((l) => !stats.progressByLevel[l.id]?.completed) || LEVEL_SUMMARIES[0]

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

  const categoryTagClass = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'banking & finance':
      case 'banking':
        return 'notion-tag-blue'
      case 'healthcare':
        return 'notion-tag-green'
      case 'e-commerce':
        return 'notion-tag-orange'
      case 'hospitality':
        return 'notion-tag-yellow'
      case 'iot & smart devices':
        return 'notion-tag-purple'
      case 'security & auth':
        return 'notion-tag-red'
      default:
        return 'notion-tag-gray'
    }
  }

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
      {/* Notion Page Header */}
      <section className="space-y-4">
        {/* Page Icon */}
        <div className="w-14 h-14 rounded-md flex items-center justify-center text-4xl select-none hover:bg-[var(--hover-bg)] cursor-default transition-colors">
          🧩
        </div>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              UML Use Case Diagram Puzzles
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Practice and test your understanding of UML 2.5 use case relationships with interactive auto-graded challenges.
            </p>
          </div>

          <Link
            to="/"
            className="notion-btn self-start sm:self-auto text-[var(--primary-btn)] border-[var(--primary-btn)] hover:bg-[var(--selection-bg)]"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Open Diagram Studio</span>
          </Link>
        </div>

        {/* Notion Page Properties Block */}
        <div className="border-t border-b border-[var(--border-subtle)] py-2 my-4 space-y-1 font-sans text-xs">
          <div className="notion-property-row">
            <div className="notion-property-name">
              <span className="text-[var(--text-tertiary)]">Status</span>
            </div>
            <div className="notion-property-value flex items-center gap-2">
              <span className="notion-tag notion-tag-blue">
                {stats.completedLevels === LEVEL_SUMMARIES.length
                  ? 'Completed'
                  : stats.completedLevels > 0
                    ? 'In Progress'
                    : 'Not Started'}
              </span>
              <span className="text-[var(--text-secondary)]">
                {stats.completedLevels} of {LEVEL_SUMMARIES.length} levels solved ({progressPercent}%)
              </span>
            </div>
          </div>

          <div className="notion-property-row">
            <div className="notion-property-name">
              <span className="text-[var(--text-tertiary)]">Stars Collected</span>
            </div>
            <div className="notion-property-value flex items-center gap-2 font-mono">
              <span className="notion-tag notion-tag-yellow flex items-center gap-1 font-semibold">
                <Star className="w-3 h-3 fill-current" />
                {stats.totalStars} / {totalPossibleStars}
              </span>
              <div className="w-32 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div
                  className="h-full bg-[#cb912f] dark:bg-[#dcb14b] rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round((stats.totalStars / totalPossibleStars) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="notion-property-row">
            <div className="notion-property-name">
              <span className="text-[var(--text-tertiary)]">Specification</span>
            </div>
            <div className="notion-property-value text-[var(--text-secondary)]">
              OMG Unified Modeling Language (UML) 2.5.1
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Link
            to="/play/$levelId"
            params={{ levelId: nextUnsolvedLevel.id }}
            className="notion-btn notion-btn-primary"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>
              {stats.completedLevels > 0
                ? `Continue: Level ${nextUnsolvedLevel.number}`
                : 'Start Level 1'}
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setShowCheatsheet(true)}
            className="notion-btn"
          >
            <BookOpen className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>Open Notation Guide</span>
          </button>

          {stats.completedLevels > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="notion-btn notion-btn-ghost text-[var(--notion-red-text)]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Progress</span>
            </button>
          )}
        </div>
      </section>

      {/* Notion Database Section */}
      <section className="space-y-3 pt-4">
        {/* Database Header & View Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-2">
          {/* Left: View Tabs */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('gallery')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                viewMode === 'gallery'
                  ? 'bg-[var(--hover-bg-strong)] text-[var(--text-primary)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Gallery</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-[var(--hover-bg-strong)] text-[var(--text-primary)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Right: Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Diagram Type Filter Pills */}
            <div className="flex items-center gap-1 text-xs">
              {(
                [
                  { id: 'all', label: 'All Diagrams' },
                  { id: 'use_case', label: 'Use Case' },
                  { id: 'er', label: 'ER' },
                  { id: 'class', label: 'Class' },
                  { id: 'dfd', label: 'Data Flow' },
                ] as const
              ).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDiagramType(d.id)}
                  className={`px-2 py-0.5 rounded-[3px] text-xs transition-colors ${
                    selectedDiagramType === d.id
                      ? 'bg-[var(--primary-btn)] text-white font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-[var(--border-subtle)]" />

            {/* Filter Pills */}
            <div className="flex items-center gap-1 text-xs">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'build', label: 'Build' },
                  { id: 'fix', label: 'Fix' },
                  { id: 'classify', label: 'Classify' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFilter(f.id)}
                  className={`px-2 py-0.5 rounded-[3px] text-xs transition-colors ${
                    selectedFilter === f.id
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-[var(--border-subtle)]" />

            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] absolute left-2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter puzzles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-2 py-1 w-36 sm:w-44 text-xs rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-strong)]"
              />
            </div>
          </div>
        </div>

        {/* Database Content: Gallery View */}
        {viewMode === 'gallery' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredLevels.map((lvl) => {
              const progress = stats.progressByLevel[lvl.id]
              const isCompleted = progress?.completed
              const stars = progress?.stars || 0

              return (
                <Link
                  key={lvl.id}
                  to="/play/$levelId"
                  params={{ levelId: lvl.id }}
                  className="notion-card group flex flex-col justify-between overflow-hidden"
                >
                  {/* Card Cover Area */}
                  <div className="h-24 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] p-3 relative flex items-center justify-between select-none">
                    <div className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full border border-[var(--text-primary)]" />
                        <div className="w-0.5 h-3 bg-[var(--text-primary)]" />
                        <div className="w-4 h-0.5 bg-[var(--text-primary)]" />
                      </div>

                      <div className="flex items-center">
                        <div
                          className={`w-8 h-0.5 ${
                            lvl.type === 'fix'
                              ? 'border-t border-dashed border-[var(--text-secondary)]'
                              : 'bg-[var(--text-secondary)]'
                          }`}
                        />
                        <span className="text-[10px] text-[var(--text-tertiary)] -ml-1">
                          ▸
                        </span>
                      </div>

                      <div className="px-2 py-1 rounded-full border border-[var(--text-primary)] text-[9px] font-mono text-[var(--text-secondary)] bg-[var(--bg-primary)]">
                        ({DIAGRAM_TYPE_META[lvl.diagramType ?? 'use_case'].short})
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-start">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-[#448361] dark:text-[#529e72]" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                      )}
                      <span className="font-mono text-xs font-semibold text-[var(--text-secondary)]">
                        #{lvl.number}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`notion-tag ${
                            DIAGRAM_TYPE_META[lvl.diagramType ?? 'use_case']
                              .tagClass
                          }`}
                        >
                          {DIAGRAM_TYPE_META[lvl.diagramType ?? 'use_case'].label}
                        </span>
                        <span
                          className={`notion-tag ${categoryTagClass(
                            lvl.category
                          )}`}
                        >
                          {lvl.category}
                        </span>
                        <span
                          className={`notion-tag ${difficultyTagClass(
                            lvl.difficulty
                          )}`}
                        >
                          {lvl.difficulty}
                        </span>
                        <span className="notion-tag notion-tag-gray capitalize">
                          {lvl.type}
                        </span>
                      </div>

                      <h2 className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--primary-btn)] transition-colors leading-snug">
                        {lvl.title}
                      </h2>

                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {lvl.scenario}
                      </p>
                    </div>

                    {/* Card Footer: Stars & Open CTA */}
                    <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((starIdx) => (
                          <Star
                            key={starIdx}
                            className={`w-3.5 h-3.5 ${
                              starIdx <= stars
                                ? 'fill-[#cb912f] dark:fill-[#dcb14b] text-[#cb912f] dark:text-[#dcb14b]'
                                : 'text-[var(--border-strong)]'
                            }`}
                          />
                        ))}
                      </div>

                      <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] flex items-center gap-0.5 font-medium transition-colors">
                        <span>{isCompleted ? 'Review' : 'Solve'}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          /* Table View */
          <div className="border border-[var(--border-subtle)] rounded-[4px] overflow-x-auto bg-[var(--bg-primary)]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                  <th className="py-2 px-3 font-medium w-12">#</th>
                  <th className="py-2 px-3 font-medium">Name</th>
                  <th className="py-2 px-3 font-medium">Category</th>
                  <th className="py-2 px-3 font-medium">Difficulty</th>
                  <th className="py-2 px-3 font-medium">Type</th>
                  <th className="py-2 px-3 font-medium">Stars</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredLevels.map((lvl) => {
                  const progress = stats.progressByLevel[lvl.id]
                  const isCompleted = progress?.completed
                  const stars = progress?.stars || 0

                  return (
                    <tr
                      key={lvl.id}
                      className="hover:bg-[var(--hover-bg)] transition-colors group cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-mono text-[var(--text-tertiary)]">
                        {lvl.number}
                      </td>
                      <td className="py-2.5 px-3">
                        <Link
                          to="/play/$levelId"
                          params={{ levelId: lvl.id }}
                          className="font-medium text-[var(--text-primary)] hover:underline flex items-center gap-1.5"
                        >
                          <span>{lvl.title}</span>
                        </Link>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`notion-tag ${categoryTagClass(
                            lvl.category
                          )}`}
                        >
                          {lvl.category}
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
                          <span className="notion-tag notion-tag-green">
                            Solved
                          </span>
                        ) : (
                          <span className="notion-tag notion-tag-gray">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          to="/play/$levelId"
                          params={{ levelId: lvl.id }}
                          className="inline-flex items-center gap-1 text-[var(--primary-btn)] hover:underline font-medium"
                        >
                          <span>Open</span>
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
    </main>
  )
}

