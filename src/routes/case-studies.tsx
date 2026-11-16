import { useState, useEffect, useMemo } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  BookOpenText,
  Search,
  CheckCircle2,
  ArrowUpRight,
  Plus,
  X,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react'
import { CASE_STUDIES } from '../data/caseStudies'
import { getAllCaseStudyProgress } from '../lib/caseStudyStorage'
import type { PuzzleDiagramType } from '../types/game'
import type { CaseStudy, CaseStudyProgress } from '../types/caseStudy'

const DIAGRAM_TYPE_META: Record<
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

const DIFFICULTY_STYLES: Record<CaseStudy['difficulty'], string> = {
  Beginner:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  Easy: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
  Intermediate:
    'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  Advanced:
    'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
}

export const CUSTOM_CASE_STUDY_KEY = 'umly_custom_case_study_v1'

export const Route = createFileRoute('/case-studies')({
  component: CaseStudiesPage,
})

function CaseStudiesPage() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState<Record<string, CaseStudyProgress>>({})
  const [selectedType, setSelectedType] = useState<'all' | PuzzleDiagramType>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    'all' | CaseStudy['difficulty']
  >('all')
  const [viewMode, setViewMode] = useState<'gallery' | 'table'>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [customType, setCustomType] = useState<PuzzleDiagramType>('use_case')
  const [customStatement, setCustomStatement] = useState('')

  useEffect(() => {
    setProgress(getAllCaseStudyProgress())
  }, [])

  const completedCount = Object.values(progress).filter((p) => p.completed).length

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return CASE_STUDIES.filter((cs) => {
      if (selectedType !== 'all' && cs.diagramType !== selectedType) return false
      if (selectedDifficulty !== 'all' && cs.difficulty !== selectedDifficulty)
        return false
      if (
        q &&
        !cs.title.toLowerCase().includes(q) &&
        !cs.domain.toLowerCase().includes(q) &&
        !cs.statement.toLowerCase().includes(q)
      ) {
        return false
      }
      return true
    })
  }, [selectedType, selectedDifficulty, searchQuery])

  const handleLaunchCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customStatement.trim()) return
    const payload = {
      title: customTitle.trim() || 'Custom System Statement',
      diagramType: customType,
      statement: customStatement.trim(),
    }
    localStorage.setItem(CUSTOM_CASE_STUDY_KEY, JSON.stringify(payload))
    setShowCustomModal(false)
    navigate({
      to: '/case-study/$caseStudyId',
      params: { caseStudyId: 'custom' },
    })
  }

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 sm:px-8 py-8 sm:py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
              <BookOpenText className="w-3.5 h-3.5" />
              <span>Freeform System Modeling</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Case Studies
            </h1>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Read a real-world system statement, model the architecture from
              scratch on an open canvas, check syntax &amp; requirement coverage,
              and compare side-by-side with a reference solution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3.5 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 text-xs font-semibold">
              Completed:{' '}
              <span className="text-[var(--text-primary)]">
                {completedCount} / {CASE_STUDIES.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCustomModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Custom Statement</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-[var(--border-subtle)]">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['all', 'All Types'],
                ['use_case', 'Use Case'],
                ['er', 'ER Diagram'],
                ['class', 'Class'],
                ['dfd', 'DFD'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedType(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  selectedType === key
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {label}
              </button>
            ))}

            <div className="h-4 w-px bg-[var(--border-subtle)] mx-1 hidden sm:block" />

            {(['all', 'Easy', 'Intermediate', 'Advanced'] as const).map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedDifficulty === diff
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                {diff === 'all' ? 'Any Difficulty' : diff}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search domains or topics..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div className="inline-flex items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
                title="Table view"
                aria-label="Table view"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('gallery')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'gallery'
                    ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
                title="Gallery view"
                aria-label="Gallery view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Table or Gallery */}
        {viewMode === 'table' ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                    <th className="py-3 px-4 w-12">#</th>
                    <th className="py-3 px-4">Case Study</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4 hidden md:table-cell">Domain</th>
                    <th className="py-3 px-4 hidden sm:table-cell">Scope</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
                  {filtered.map((cs) => {
                    const typeMeta = DIAGRAM_TYPE_META[cs.diagramType]
                    const prog = progress[cs.id]
                    return (
                      <tr
                        key={cs.id}
                        onClick={() =>
                          navigate({
                            to: '/case-study/$caseStudyId',
                            params: { caseStudyId: cs.id },
                          })
                        }
                        className="group cursor-pointer hover:bg-[var(--hover-bg)] transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono text-[var(--text-tertiary)]">
                          {cs.number}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[var(--text-primary)] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {cs.title}
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)] line-clamp-1 max-w-md mt-0.5">
                            {cs.statement}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${typeMeta.pillClass}`}
                          >
                            {typeMeta.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${DIFFICULTY_STYLES[cs.difficulty]}`}
                          >
                            {cs.difficulty}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[var(--text-secondary)] hidden md:table-cell whitespace-nowrap">
                          {cs.domain}
                        </td>
                        <td className="py-3.5 px-4 text-[var(--text-secondary)] hidden sm:table-cell whitespace-nowrap">
                          {cs.concepts.length} concepts · {cs.relationships.length} links
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {prog?.completed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {prog.bestScore}%
                            </span>
                          ) : prog ? (
                            <span className="text-[11px] font-semibold text-[var(--text-tertiary)]">
                              Best {prog.bestScore}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                              Model <ArrowUpRight className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cs) => {
            const typeMeta = DIAGRAM_TYPE_META[cs.diagramType]
            const prog = progress[cs.id]
            return (
              <Link
                key={cs.id}
                to="/case-study/$caseStudyId"
                params={{ caseStudyId: cs.id }}
                className="group rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--text-tertiary)] p-5 flex flex-col justify-between gap-4 transition-all hover:shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${typeMeta.pillClass}`}
                      >
                        {typeMeta.label}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${DIFFICULTY_STYLES[cs.difficulty]}`}
                      >
                        {cs.difficulty}
                      </span>
                    </div>

                    {prog?.completed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {prog.bestScore}%
                      </span>
                    ) : prog ? (
                      <span className="text-[11px] font-semibold text-[var(--text-tertiary)]">
                        Best {prog.bestScore}%
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <div className="text-[11px] font-medium text-[var(--text-tertiary)] mb-0.5">
                      Case Study #{cs.number} · {cs.domain}
                    </div>
                    <h2 className="text-base font-bold text-[var(--text-primary)] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {cs.title}
                    </h2>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                    {cs.statement}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                  <span>
                    {cs.concepts.length} concepts · {cs.relationships.length} links
                  </span>
                  <span className="inline-flex items-center gap-1">
                    Model <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
        )}
      </div>

      {/* Custom Statement Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-bold">Model Your Own System Statement</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLaunchCustom} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Parking Garage Ticketing System"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Target Diagram Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      ['use_case', 'Use Case'],
                      ['er', 'ER Diagram'],
                      ['class', 'Class'],
                      ['dfd', 'DFD'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCustomType(val)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        customType === val
                          ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                          : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  System Statement
                </label>
                <textarea
                  rows={5}
                  required
                  value={customStatement}
                  onChange={(e) => setCustomStatement(e.target.value)}
                  placeholder="Paste or write your problem statement here..."
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90"
                >
                  Start Modeling
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
