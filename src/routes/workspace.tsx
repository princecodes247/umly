import { useState, useEffect, useMemo } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Plus,
  ArrowRight,
  Trash2,
  Clock,
  Layers,
  CircleDot,
  Database,
  Boxes,
  Workflow,
  Star,
  Play,
  Search,
  Sparkles,
} from 'lucide-react'
import {
  listDiagramDrafts,
  deleteDiagramDraft,
  createDiagramDraft,
  type DiagramDraft,
  type DiagramType,
} from '../lib/diagramStorage'
import { getPlayerStats, type PlayerStats } from '../lib/storage'
import { LEVEL_SUMMARIES } from '../data/levels'
import { DIAGRAM_TEMPLATES } from '../data/templates'
import { NewDiagramModal } from '../components/studio/NewDiagramModal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

export const Route = createFileRoute('/workspace')({
  component: DashboardPage,
})

const DIAGRAM_TYPE_CONFIG: Record<
  'use_case' | 'er' | 'class' | 'dfd',
  {
    label: string
    shortLabel: string
    description: string
    pillClass: string
    iconBgClass: string
    icon: typeof CircleDot
    defaultTitle: string
  }
> = {
  use_case: {
    label: 'Use Case Diagram',
    shortLabel: 'Use Case',
    description: 'Actors, boundaries, includes & extends',
    pillClass:
      'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    iconBgClass:
      'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
    icon: CircleDot,
    defaultTitle: 'Untitled Use Case Diagram',
  },
  er: {
    label: 'ER Diagram',
    shortLabel: 'ER Diagram',
    description: 'Entities, keys, attributes & cardinality',
    pillClass:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    iconBgClass:
      'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
    icon: Database,
    defaultTitle: 'Untitled ER Diagram',
  },
  class: {
    label: 'Class Diagram',
    shortLabel: 'Class Diagram',
    description: 'Classes, interfaces, inheritance & ownership',
    pillClass:
      'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    iconBgClass:
      'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300',
    icon: Boxes,
    defaultTitle: 'Untitled Class Diagram',
  },
  dfd: {
    label: 'Data Flow Diagram',
    shortLabel: 'Data Flow',
    description: 'External entities, processes & data stores',
    pillClass:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    iconBgClass:
      'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
    icon: Workflow,
    defaultTitle: 'Untitled Data Flow Diagram',
  },
}

function getDiagramTypeMeta(type: DiagramType) {
  if (type in DIAGRAM_TYPE_CONFIG) {
    return DIAGRAM_TYPE_CONFIG[type as keyof typeof DIAGRAM_TYPE_CONFIG]
  }
  return DIAGRAM_TYPE_CONFIG.use_case
}

function DashboardPage() {
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState<DiagramDraft[]>([])
  const [stats, setStats] = useState<PlayerStats>({
    completedLevels: 0,
    totalStars: 0,
    progressByLevel: {},
  })
  const [draftSearch, setDraftSearch] = useState('')
  const [showAllDrafts, setShowAllDrafts] = useState(false)
  const [templateFilter, setTemplateFilter] = useState<
    'all' | 'use_case' | 'er' | 'class' | 'dfd'
  >('all')
  const [showNewModal, setShowNewModal] = useState(false)
  const [pendingDeleteDraft, setPendingDeleteDraft] = useState<{
    id: string
    title: string
  } | null>(null)

  const reloadWorkspace = () => {
    setDrafts(listDiagramDrafts())
    setStats(getPlayerStats(LEVEL_SUMMARIES.length))
  }

  useEffect(() => {
    reloadWorkspace()
  }, [])

  const handleDiagramCreated = (newId: string) => {
    navigate({ to: '/studio/$diagramId', params: { diagramId: newId } })
  }

  const handleQuickCreate = (type: 'use_case' | 'er' | 'class' | 'dfd') => {
    const meta = DIAGRAM_TYPE_CONFIG[type]
    const draft = createDiagramDraft(meta.defaultTitle, type)
    navigate({ to: '/studio/$diagramId', params: { diagramId: draft.id } })
  }

  const handleQuickTemplate = (
    templateId: string,
    templateName: string,
    diagramType: DiagramType
  ) => {
    const draft = createDiagramDraft(templateName, diagramType, templateId)
    navigate({ to: '/studio/$diagramId', params: { diagramId: draft.id } })
  }

  const handleDeleteDraft = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation()
    setPendingDeleteDraft({ id, title })
  }

  const confirmDeleteDraft = () => {
    if (!pendingDeleteDraft) return
    deleteDiagramDraft(pendingDeleteDraft.id)
    setPendingDeleteDraft(null)
    reloadWorkspace()
  }

  const filteredDrafts = useMemo(() => {
    const q = draftSearch.trim().toLowerCase()
    if (!q) return drafts
    return drafts.filter((d) => d.title.toLowerCase().includes(q))
  }, [drafts, draftSearch])

  const filteredTemplates = useMemo(() => {
    const nonBlank = DIAGRAM_TEMPLATES.filter((t) => t.id !== 'blank')
    if (templateFilter === 'all') return nonBlank.slice(0, 6)
    return nonBlank.filter((t) => t.diagramType === templateFilter)
  }, [templateFilter])

  const totalPossibleStars = LEVEL_SUMMARIES.length * 3
  const progressPercent =
    LEVEL_SUMMARIES.length > 0
      ? Math.round((stats.completedLevels / LEVEL_SUMMARIES.length) * 100)
      : 0
  const nextUnsolvedLevel =
    LEVEL_SUMMARIES.find((l) => !stats.progressByLevel[l.id]?.completed) ||
    LEVEL_SUMMARIES[0]

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-8 sm:space-y-10">
      {/* Top Workspace Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Workspace
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Create UML, ER, Class, and Data Flow diagrams or jump back into your drafts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-full bg-gray-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 font-semibold text-xs sm:text-sm px-5 py-2.5 transition shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Diagram</span>
        </button>
      </header>

      {/* Row 1: Quick Create + Practice Snapshot */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Quick Create by Diagram Type */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Create Blank Diagram
            </h2>
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="text-xs text-[var(--primary-btn)] hover:underline font-semibold"
            >
              From template...
            </button>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['use_case', 'er', 'class', 'dfd'] as const).map((typeKey) => {
              const meta = DIAGRAM_TYPE_CONFIG[typeKey]
              const Icon = meta.icon
              return (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => handleQuickCreate(typeKey)}
                  className="text-left p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--border-strong)] hover:shadow-sm transition-all flex items-start gap-3.5 group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${meta.iconBgClass} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[var(--text-primary)] truncate">
                        {meta.label}
                      </span>
                      <Plus className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors shrink-0" />
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                      {meta.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Practice Progress Snapshot */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Interactive Practice
            </h2>
            <Link
              to="/puzzles"
              className="text-xs text-[var(--primary-btn)] hover:underline font-semibold"
            >
              View all {LEVEL_SUMMARIES.length}
            </Link>
          </div>

          <div className="flex-1 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  Puzzle Progress
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 font-mono text-xs flex items-center gap-1 font-semibold">
                  <Star className="w-3 h-3 fill-current" />
                  {stats.totalStars} / {totalPossibleStars}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span>
                    {stats.completedLevels} of {LEVEL_SUMMARIES.length} solved
                  </span>
                  <span className="font-mono font-semibold text-[var(--text-primary)]">
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                  <div
                    className="h-full bg-gray-900 dark:bg-white rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {nextUnsolvedLevel && (
              <Link
                to="/play/$levelId"
                params={{ levelId: nextUnsolvedLevel.id }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 font-semibold text-xs px-4 py-2.5 transition w-full text-center"
              >
                <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                <span className="truncate">
                  {stats.completedLevels > 0
                    ? `Continue: #${nextUnsolvedLevel.number} ${nextUnsolvedLevel.title}`
                    : `Start Level 1: ${nextUnsolvedLevel.title}`}
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Row 2: Recent Diagrams */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Recent Diagrams
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-mono text-xs font-medium">
              {drafts.length}
            </span>
          </div>

          {drafts.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {showAllDrafts && filteredDrafts.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllDrafts(false)}
                  className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-full hover:bg-[var(--hover-bg)] transition-colors whitespace-nowrap shrink-0"
                >
                  Show recent 5
                </button>
              )}
              <div className="relative flex items-center flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search diagrams..."
                  value={draftSearch}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 w-full sm:w-56 text-xs rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-strong)]"
                />
              </div>
            </div>
          )}
        </div>

        {drafts.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-secondary)]/30 text-center space-y-2">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              No saved diagrams yet
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Pick a diagram type above or start from a template below.
            </p>
          </div>
        ) : filteredDrafts.length === 0 ? (
          <div className="p-8 rounded-2xl border border-[var(--border-subtle)] text-center text-xs text-[var(--text-secondary)]">
            No diagrams match &ldquo;{draftSearch}&rdquo;.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {(showAllDrafts ? filteredDrafts : filteredDrafts.slice(0, 5)).map(
              (draft) => {
                const meta = getDiagramTypeMeta(draft.type)
                const formattedDate = new Date(
                  draft.updatedAt
                ).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })

                return (
                  <div
                    key={draft.id}
                    onClick={() =>
                      navigate({
                        to: '/studio/$diagramId',
                        params: { diagramId: draft.id },
                      })
                    }
                    className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--border-strong)] hover:shadow-sm transition-all flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${meta.pillClass}`}
                        >
                          {meta.shortLabel}
                        </span>

                        <button
                          type="button"
                          title="Delete diagram"
                          aria-label={`Delete ${draft.title}`}
                          onClick={(e) =>
                            handleDeleteDraft(e, draft.id, draft.title)
                          }
                          className="p-1.5 rounded-full text-[var(--text-tertiary)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--primary-btn)] transition-colors line-clamp-1">
                        {draft.title}
                      </h3>
                    </div>

                    <div className="pt-3 mt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 text-[11px] text-[var(--text-tertiary)]">
                      <span className="flex items-center gap-2 font-mono min-w-0">
                        <span className="flex items-center gap-1 shrink-0">
                          <Layers className="w-3 h-3" />
                          {draft.nodes.length}
                        </span>
                        <span className="shrink-0">•</span>
                        <span className="flex items-center gap-1 truncate">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span className="truncate">{formattedDate}</span>
                        </span>
                      </span>
                      <span className="text-[var(--text-primary)] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0">
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                )
              }
            )}

            {!showAllDrafts && filteredDrafts.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllDrafts(true)}
                className="p-4 rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-secondary)]/40 hover:border-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-all flex flex-col items-center justify-center text-center space-y-1.5 min-h-[128px] group cursor-pointer"
              >
                <span className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1">
                  <span>View all {filteredDrafts.length} diagrams</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  +{filteredDrafts.length - 5} more saved
                </span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* Row 3: Starter Templates */}
      <section className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Starter Templates
          </h2>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'use_case', label: 'Use Case' },
                { id: 'er', label: 'ER' },
                { id: 'class', label: 'Class' },
                { id: 'dfd', label: 'Data Flow' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTemplateFilter(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  templateFilter === tab.id
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTemplates.map((tmpl) => {
            const tmplType = tmpl.diagramType ?? 'use_case'
            const meta = getDiagramTypeMeta(tmplType)
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() =>
                  handleQuickTemplate(tmpl.id, tmpl.name, tmplType)
                }
                className="text-left p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--border-strong)] hover:shadow-sm transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${meta.pillClass}`}
                    >
                      {meta.shortLabel}
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:text-amber-500 transition-colors" />
                  </div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--primary-btn)] transition-colors">
                    {tmpl.name}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-tertiary)] font-mono w-full">
                  <span>{tmpl.nodes.length} nodes</span>
                  <span className="font-sans text-[var(--text-primary)] font-semibold flex items-center gap-0.5">
                    <span>Use template</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Modals */}
      <NewDiagramModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={handleDiagramCreated}
      />

      <ConfirmDialog
        isOpen={pendingDeleteDraft !== null}
        title="Delete diagram?"
        description={
          pendingDeleteDraft
            ? `"${pendingDeleteDraft.title}" will be permanently removed from your local workspace.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={confirmDeleteDraft}
        onCancel={() => setPendingDeleteDraft(null)}
      />
    </main>
  )
}
