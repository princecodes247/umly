import { useState, useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Plus,
  ArrowRight,
  PenTool,
  Puzzle,
  Trash2,
  Calendar,
  Layers,
  CircleDot,
  Boxes,
  Network,
  Workflow,
  Sparkles,
  BookOpen,
} from 'lucide-react'
import {
  listDiagramDrafts,
  deleteDiagramDraft,
  createDiagramDraft,
  type DiagramDraft,
} from '../lib/diagramStorage'
import { NewDiagramModal } from '../components/studio/NewDiagramModal'
import { UmlCheatsheetModal } from '../components/game/UmlCheatsheetModal'
import { DIAGRAM_TEMPLATES } from '../data/templates'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState<DiagramDraft[]>([])
  const [showNewModal, setShowNewModal] = useState(false)
  const [showCheatsheet, setShowCheatsheet] = useState(false)

  const reloadDrafts = () => {
    setDrafts(listDiagramDrafts())
  }

  useEffect(() => {
    reloadDrafts()
  }, [])

  const handleDiagramCreated = (newId: string) => {
    navigate({ to: '/studio/$diagramId', params: { diagramId: newId } })
  }

  const handleDeleteDraft = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation()
    if (window.confirm(`Delete diagram "${title}"?`)) {
      deleteDiagramDraft(id)
      reloadDrafts()
    }
  }

  const handleQuickTemplate = (templateId: string, templateName: string) => {
    const draft = createDiagramDraft(templateName, 'use_case', templateId)
    navigate({ to: '/studio/$diagramId', params: { diagramId: draft.id } })
  }

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-10">
      {/* Notion Page Header / Hero */}
      <section className="space-y-4">
        {/* Page Icon */}
        <div className="w-14 h-14 rounded-md flex items-center justify-center text-4xl select-none hover:bg-[var(--hover-bg)] cursor-default transition-colors">
          📐
        </div>

        {/* Hero Title & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            UMLy — Diagram Studio & Interactive Practice
          </h1>
          <p className="text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            Create clean, standards-compliant UML 2.5 diagrams in your browser.
            Focusing on hands-on Use Case diagrams with instant export to PNG,
            SVG, and JSON, plus interactive auto-graded challenges.
          </p>
        </div>

        {/* Notion Callout Box */}
        <div className="notion-callout notion-callout-blue">
          <span className="text-lg select-none">💡</span>
          <div className="space-y-1">
            <p className="font-medium text-xs text-[var(--text-primary)]">
              Free Draw Mode is now the main mode of UMLy.
            </p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Start a new diagram draft below, choose your diagram type, and
              build using actors, use cases, system boundaries, and precise UML
              relationships (<code>«include»</code>, <code>«extend»</code>, and
              generalization).
            </p>
          </div>
        </div>

        {/* Hero Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="notion-btn notion-btn-primary flex items-center gap-2 py-2 px-4 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="font-semibold">New Diagram Draft</span>
          </button>

          <Link
            to="/studio"
            className="notion-btn flex items-center gap-1.5 py-2 px-3 text-xs"
          >
            <PenTool className="w-3.5 h-3.5 text-[var(--primary-btn)]" />
            <span>Open Studio</span>
          </Link>

          <Link
            to="/puzzles"
            className="notion-btn flex items-center gap-1.5 py-2 px-3 text-xs"
          >
            <Puzzle className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>Browse Puzzles</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowCheatsheet(true)}
            className="notion-btn notion-btn-ghost flex items-center gap-1.5 py-2 px-3 text-xs text-[var(--text-secondary)]"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Notation Rules</span>
          </button>
        </div>
      </section>

      {/* Section 1: My Diagram Drafts */}
      <section className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              My Diagram Drafts
            </h2>
            <span className="notion-tag notion-tag-gray font-mono text-[10px]">
              {drafts.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="text-xs text-[var(--primary-btn)] hover:underline flex items-center gap-1 font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Draft</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* New Diagram Card CTA */}
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="p-4 rounded-[6px] border-2 border-dashed border-[var(--border-default)] hover:border-[var(--primary-btn)] hover:bg-[var(--hover-bg)] transition-all flex flex-col items-center justify-center min-h-[140px] text-center group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-[var(--selection-bg)] text-[var(--primary-btn)] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <span className="font-semibold text-xs text-[var(--text-primary)]">
              Create New Diagram
            </span>
            <span className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
              Choose diagram type & template
            </span>
          </button>

          {/* List of existing drafts */}
          {drafts.map((draft) => {
            const nodeCount = draft.nodes.length
            const edgeCount = draft.edges.length
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
                className="notion-card p-3.5 rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-primary)] hover:border-[var(--border-strong)] transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="notion-tag notion-tag-blue text-[9px] uppercase font-mono font-semibold">
                      Use Case Diagram
                    </span>

                    <button
                      type="button"
                      title="Delete draft"
                      onClick={(e) =>
                        handleDeleteDraft(e, draft.id, draft.title)
                      }
                      className="p-1 rounded-[3px] text-[var(--text-tertiary)] hover:text-[var(--notion-red-text)] hover:bg-[var(--notion-red-bg)] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--primary-btn)] transition-colors line-clamp-1">
                    {draft.title}
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)] font-mono">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[var(--text-tertiary)]" />
                      {nodeCount} nodes
                    </span>
                    <span>•</span>
                    <span>{edgeCount} links</span>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formattedDate}
                  </span>
                  <span className="text-[var(--primary-btn)] font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Section 2: Supported UML Diagram Types */}
      <section className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            UML Diagram Types
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            UMLy is built on the OMG Unified Modeling Language specification.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Use Case Diagram Card */}
          <div className="p-3.5 rounded-[6px] border border-[var(--primary-btn)] bg-[var(--selection-bg)] flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-[4px] bg-[var(--primary-btn)] text-white flex items-center justify-center">
                  <CircleDot className="w-4 h-4" />
                </div>
                <span className="notion-tag notion-tag-green text-[9px] font-mono font-semibold uppercase">
                  Available Now
                </span>
              </div>
              <h3 className="font-semibold text-xs text-[var(--text-primary)]">
                Use Case Diagram
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Actors, boundaries, use cases, mandatory <code>«include»</code>,
                optional <code>«extend»</code>, and generalizations.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="notion-btn notion-btn-primary w-full text-center py-1 text-xs"
            >
              Create Use Case Diagram
            </button>
          </div>

          {/* Class Diagram Card */}
          <div className="p-3.5 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex flex-col justify-between space-y-3 opacity-60">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-[4px] bg-[var(--hover-bg-strong)] text-[var(--text-secondary)] flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <span className="notion-tag notion-tag-gray text-[9px] font-mono uppercase">
                  Roadmap
                </span>
              </div>
              <h3 className="font-semibold text-xs text-[var(--text-primary)]">
                Class Diagram
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Classes, attributes, methods, associations, aggregations, and
                compositions.
              </p>
            </div>
            <span className="text-[10px] text-[var(--text-tertiary)] italic">
              Coming in future updates
            </span>
          </div>

          {/* Sequence Diagram Card */}
          <div className="p-3.5 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex flex-col justify-between space-y-3 opacity-60">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-[4px] bg-[var(--hover-bg-strong)] text-[var(--text-secondary)] flex items-center justify-center">
                  <Network className="w-4 h-4" />
                </div>
                <span className="notion-tag notion-tag-gray text-[9px] font-mono uppercase">
                  Roadmap
                </span>
              </div>
              <h3 className="font-semibold text-xs text-[var(--text-primary)]">
                Sequence Diagram
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Lifelines, execution specifications, synchronous/async messages,
                and reply returns.
              </p>
            </div>
            <span className="text-[10px] text-[var(--text-tertiary)] italic">
              Coming in future updates
            </span>
          </div>

          {/* Activity Diagram Card */}
          <div className="p-3.5 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex flex-col justify-between space-y-3 opacity-60">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-[4px] bg-[var(--hover-bg-strong)] text-[var(--text-secondary)] flex items-center justify-center">
                  <Workflow className="w-4 h-4" />
                </div>
                <span className="notion-tag notion-tag-gray text-[9px] font-mono uppercase">
                  Roadmap
                </span>
              </div>
              <h3 className="font-semibold text-xs text-[var(--text-primary)]">
                Activity Diagram
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Action states, decision diamonds, fork/join bars, and swimlanes.
              </p>
            </div>
            <span className="text-[10px] text-[var(--text-tertiary)] italic">
              Coming in future updates
            </span>
          </div>
        </div>
      </section>

      {/* Section 3: Quick Starter Templates */}
      <section className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Starter Templates
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Jump straight into a pre-structured diagram.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DIAGRAM_TEMPLATES.filter((t) => t.id !== 'blank').map((tmpl) => (
            <div
              key={tmpl.id}
              className="notion-card p-4 rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-primary)] hover:border-[var(--border-strong)] transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 text-[#cb912f] dark:text-[#dcb14b]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-mono font-semibold">
                    Template
                  </span>
                </div>
                <h3 className="font-semibold text-xs text-[var(--text-primary)]">
                  {tmpl.name}
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleQuickTemplate(tmpl.id, tmpl.name)}
                className="notion-btn w-full text-center py-1.5 text-xs text-[var(--primary-btn)] hover:bg-[var(--selection-bg)]"
              >
                Use Template
              </button>
            </div>
          ))}
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
    </main>
  )
}
