import { useState, useEffect, useMemo } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Plus,
  ArrowRight,
  PenTool,
  Trash2,
  Clock,
  Layers,
  CircleDot,
  Database,
  Boxes,
  Workflow,
  BookOpen,
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
import { UmlCheatsheetModal } from '../components/game/UmlCheatsheetModal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

const DIAGRAM_TYPE_CONFIG: Record<
  'use_case' | 'er' | 'class' | 'dfd',
  {
    label: string
    shortLabel: string
    description: string
    tagClass: string
    icon: typeof CircleDot
    defaultTitle: string
  }
> = {
  use_case: {
    label: 'Use Case Diagram',
    shortLabel: 'Use Case',
    description: 'Actors, boundaries, includes & extends',
    tagClass: 'notion-tag-blue',
    icon: CircleDot,
    defaultTitle: 'Untitled Use Case Diagram',
  },
  er: {
    label: 'ER Diagram',
    shortLabel: 'ER Diagram',
    description: 'Entities, keys, attributes & cardinality',
    tagClass: 'notion-tag-green',
    icon: Database,
    defaultTitle: 'Untitled ER Diagram',
  },
  class: {
    label: 'Class Diagram',
    shortLabel: 'Class Diagram',
    description: 'Classes, interfaces, inheritance & ownership',
    tagClass: 'notion-tag-purple',
    icon: Boxes,
    defaultTitle: 'Untitled Class Diagram',
  },
  dfd: {
    label: 'Data Flow Diagram',
    shortLabel: 'Data Flow',
    description: 'External entities, processes & data stores',
    tagClass: 'notion-tag-orange',
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
  const [showCheatsheet, setShowCheatsheet] = useState(false)
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
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8">
      {/* Top Workspace Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Workspace
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Create UML, ER, Class, and Data Flow diagrams or continue interactive puzzles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            <span>Open Studio</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="notion-btn notion-btn-primary py-1.5 px-3 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Diagram</span>
          </button>
        </div>
      </header>

      {/* Row 1: Quick Create + Practice Snapshot */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Quick Create by Diagram Type */}
        <div className="lg:col-span-8 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Create Blank Diagram
            </h2>
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="text-xs text-[var(--primary-btn)] hover:underline font-medium"
            >
              From template...
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(['use_case', 'er', 'class', 'dfd'] as const).map((typeKey) => {
              const meta = DIAGRAM_TYPE_CONFIG[typeKey]
              const Icon = meta.icon
              return (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => handleQuickCreate(typeKey)}
                  className="text-left p-3.5 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--hover-bg)] transition-all flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 rounded-[5px] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center justify-center shrink-0 group-hover:border-[var(--primary-btn)] group-hover:text-[var(--primary-btn)] transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        {meta.label}
                      </span>
                      <Plus className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:text-[var(--primary-btn)] transition-colors" />
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                      {meta.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Practice Progress Snapshot */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Interactive Practice
            </h2>
            <Link
              to="/puzzles"
              className="text-xs text-[var(--primary-btn)] hover:underline font-medium"
            >
              View all {LEVEL_SUMMARIES.length}
            </Link>
          </div>

          <div className="p-4 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 flex flex-col justify-between space-y-4 h-[calc(100%-1.75rem)]">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Puzzle Progress
                </span>
                <span className="notion-tag notion-tag-yellow font-mono text-[11px] flex items-center gap-1 font-semibold">
                  <Star className="w-3 h-3 fill-current" />
                  {stats.totalStars} / {totalPossibleStars}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                  <span>
                    {stats.completedLevels} of {LEVEL_SUMMARIES.length} solved
                  </span>
                  <span className="font-mono font-medium">{progressPercent}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary-btn)] rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {nextUnsolvedLevel && (
              <Link
                to="/play/$levelId"
                params={{ levelId: nextUnsolvedLevel.id }}
                className="notion-btn notion-btn-primary w-full justify-center py-1.5 text-xs font-semibold"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
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
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Recent Diagrams
            </h2>
            <span className="notion-tag notion-tag-gray font-mono text-[10px]">
              {drafts.length}
            </span>
          </div>

          {drafts.length > 0 && (
            <div className="flex items-center gap-2">
              {showAllDrafts && filteredDrafts.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllDrafts(false)}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1 rounded-[4px] hover:bg-[var(--hover-bg)] transition-colors"
                >
                  Show recent 5
                </button>
              )}
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search diagrams..."
                  value={draftSearch}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  className="pl-8 pr-3 py-1 w-full sm:w-56 text-xs rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-strong)]"
                />
              </div>
            </div>
          )}
        </div>

        {drafts.length === 0 ? (
          <div className="p-8 rounded-[6px] border border-dashed border-[var(--border-default)] bg-[var(--bg-secondary)]/30 text-center space-y-2.5">
            <p className="text-xs font-medium text-[var(--text-primary)]">
              No saved diagrams yet
            </p>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Pick a diagram type above or start from a template below.
            </p>
          </div>
        ) : filteredDrafts.length === 0 ? (
          <div className="p-6 rounded-[6px] border border-[var(--border-subtle)] text-center text-xs text-[var(--text-secondary)]">
            No diagrams match "{draftSearch}".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(showAllDrafts ? filteredDrafts : filteredDrafts.slice(0, 5)).map(
              (draft) => {
              const meta = getDiagramTypeMeta(draft.type)
              const formattedDate = new Date(draft.updatedAt).toLocaleDateString(
                undefined,
                {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }
              )

              return (
                <div
                  key={draft.id}
                  onClick={() =>
                    navigate({
                      to: '/studio/$diagramId',
                      params: { diagramId: draft.id },
                    })
                  }
                  className="p-3.5 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--border-strong)] hover:shadow-sm transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`notion-tag ${meta.tagClass} text-[10px] font-medium`}
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
                        className="p-1 rounded-[4px] text-[var(--text-tertiary)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--primary-btn)] transition-colors line-clamp-1">
                      {draft.title}
                    </h3>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-2 font-mono">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {draft.nodes.length}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formattedDate}
                      </span>
                    </span>
                    <span className="text-[var(--primary-btn)] font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              )
            })}

            {!showAllDrafts && filteredDrafts.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllDrafts(true)}
                className="p-3.5 rounded-[6px] border border-dashed border-[var(--border-default)] bg-[var(--bg-secondary)]/40 hover:border-[var(--primary-btn)] hover:bg-[var(--hover-bg)] transition-all flex flex-col items-center justify-center text-center space-y-1.5 min-h-[116px] group cursor-pointer"
              >
                <span className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary-btn)] transition-colors flex items-center gap-1">
                  <span>View all {filteredDrafts.length} diagrams</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  +{filteredDrafts.length - 5} more saved
                </span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* Row 3: Starter Templates */}
      <section className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Starter Templates
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1">
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
                className={`px-2 py-0.5 rounded-[4px] text-xs transition-colors ${
                  templateFilter === tab.id
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] font-medium'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                className="text-left p-3.5 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--hover-bg)] transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`notion-tag ${meta.tagClass} text-[10px]`}>
                      {meta.shortLabel}
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:text-[#cb912f] dark:group-hover:text-[#dcb14b] transition-colors" />
                  </div>
                  <h3 className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-[var(--primary-btn)] transition-colors">
                    {tmpl.name}
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-tertiary)] font-mono w-full">
                  <span>{tmpl.nodes.length} nodes</span>
                  <span className="font-sans text-[var(--primary-btn)] font-medium flex items-center gap-0.5">
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

      <UmlCheatsheetModal
        isOpen={showCheatsheet}
        onClose={() => setShowCheatsheet(false)}
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
