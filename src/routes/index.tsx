import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  CircleDot,
  Database,
  Boxes,
  Workflow,
  Puzzle,
  Download,
  Zap,
  CheckCircle2,
  Play,
} from 'lucide-react'
import { LEVEL_SUMMARIES } from '../data/levels'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

const DIAGRAM_CAPABILITIES = [
  {
    icon: CircleDot,
    title: 'Use Case Diagrams',
    description:
      'Actors, system boundaries, mandatory «include», optional «extend», and generalizations.',
    tag: 'UML 2.5',
    tagClass: 'notion-tag-blue',
  },
  {
    icon: Database,
    title: 'ER Diagrams',
    description:
      'Entities, primary & foreign keys, weak entities, and crow’s foot cardinality.',
    tag: 'Database',
    tagClass: 'notion-tag-green',
  },
  {
    icon: Boxes,
    title: 'Class Diagrams',
    description:
      'Classes, interfaces, enums, attributes, methods, realization, and composition.',
    tag: 'OOP',
    tagClass: 'notion-tag-purple',
  },
  {
    icon: Workflow,
    title: 'Data Flow Diagrams',
    description:
      'External entities, numbered processes, data stores, and directional data flows.',
    tag: 'Systems',
    tagClass: 'notion-tag-orange',
  },
] as const

const HIGHLIGHTS = [
  {
    icon: Zap,
    title: 'Zero-Friction Studio',
    description:
      'Snap-to-grid canvas, keyboard shortcuts, undo/redo history, and starter templates with no account required.',
  },
  {
    icon: Puzzle,
    title: 'Auto-Graded Puzzles',
    description: `${LEVEL_SUMMARIES.length} interactive challenges across Beginner, Easy, Intermediate, and Advanced tiers with instant diagnostics.`,
  },
  {
    icon: Download,
    title: 'Local-First & Exportable',
    description:
      'Drafts persist in your browser automatically. Export crisp PNG, SVG, or JSON files in one click.',
  },
] as const

function LandingPage() {
  const firstLevel = LEVEL_SUMMARIES[0]

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-16">
      {/* Hero */}
      <section className="max-w-3xl mx-auto text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 text-[11px] font-medium text-[var(--text-secondary)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-btn)]" />
          <span>Browser-native • No login • Local-first</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)] leading-[1.12]">
          Design &amp; practice system diagrams, right in your browser.
        </h1>

        <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
          UMLy pairs a fast studio for Use Case, ER, Class, and Data Flow
          diagrams with interactive, auto-graded puzzles.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/workspace"
            className="notion-btn notion-btn-primary py-2 px-4 text-xs sm:text-sm font-semibold"
          >
            <span>Open Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/puzzles"
            className="notion-btn py-2 px-4 text-xs sm:text-sm font-medium text-[var(--text-primary)]"
          >
            <Puzzle className="w-4 h-4 text-[var(--text-secondary)]" />
            <span>Browse {LEVEL_SUMMARIES.length} Puzzles</span>
          </Link>
        </div>
      </section>

      {/* Lightweight Studio Canvas Preview */}
      <section className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 p-4 sm:p-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--border-strong)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--border-strong)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--border-strong)]" />
            <span className="ml-2 text-[11px] font-mono text-[var(--text-tertiary)]">
              checkout-architecture.umly
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#448361] dark:text-[#529e72]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Auto-saved locally</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          {/* Node 1 */}
          <div className="p-3.5 rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-primary)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="notion-tag notion-tag-purple text-[10px]">
                «interface»
              </span>
              <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                Class
              </span>
            </div>
            <div className="text-xs font-semibold text-[var(--text-primary)]">
              PaymentProcessor
            </div>
            <div className="pt-1.5 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)]">
              + charge(amount): boolean
            </div>
          </div>

          {/* Node 2 */}
          <div className="p-3.5 rounded-[6px] border border-[var(--primary-btn)] bg-[var(--bg-primary)] space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="notion-tag notion-tag-green text-[10px]">
                Entity
              </span>
              <span className="text-[10px] font-mono text-[var(--primary-btn)]">
                1 : N
              </span>
            </div>
            <div className="text-xs font-semibold text-[var(--text-primary)]">
              Order
            </div>
            <div className="pt-1.5 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)] space-y-0.5">
              <div>PK order_id : UUID</div>
              <div>FK customer_id : UUID</div>
            </div>
          </div>

          {/* Node 3 */}
          <div className="p-3.5 rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-primary)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="notion-tag notion-tag-orange text-[10px]">
                1.0 Process
              </span>
              <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                DFD
              </span>
            </div>
            <div className="text-xs font-semibold text-[var(--text-primary)]">
              Process Checkout
            </div>
            <div className="pt-1.5 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
              Customer → Process → D1 Orders
            </div>
          </div>
        </div>
      </section>

      {/* Supported Diagram Types */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
              Four diagram types, one unified studio
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Every diagram type includes dedicated nodes, relationship connectors, and starter templates.
            </p>
          </div>
          <Link
            to="/workspace"
            className="text-xs text-[var(--primary-btn)] hover:underline font-medium inline-flex items-center gap-1"
          >
            <span>Create a diagram</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DIAGRAM_CAPABILITIES.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="p-4 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-[5px] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`notion-tag ${item.tagClass} text-[10px]`}>
                    {item.tag}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-[var(--text-primary)]">
                  {item.title}
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Core Highlights */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-[var(--border-subtle)]">
        {HIGHLIGHTS.map((feat) => {
          const Icon = feat.icon
          return (
            <div key={feat.title} className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <Icon className="w-4 h-4 text-[var(--primary-btn)]" />
                <span>{feat.title}</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {feat.description}
              </p>
            </div>
          )
        })}
      </section>

      {/* Bottom CTA */}
      <section className="p-6 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">
            Ready to model your next system?
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Jump straight into the workspace or test your skills with Level 1.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/workspace"
            className="notion-btn notion-btn-primary py-1.5 px-3.5 text-xs font-semibold"
          >
            <span>Open Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          {firstLevel && (
            <Link
              to="/play/$levelId"
              params={{ levelId: firstLevel.id }}
              className="notion-btn py-1.5 px-3.5 text-xs font-medium"
            >
              <Play className="w-3.5 h-3.5 fill-current text-[var(--text-secondary)]" />
              <span>Start Level 1</span>
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}
