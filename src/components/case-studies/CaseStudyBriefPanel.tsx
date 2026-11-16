import { useState } from 'react'
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  FileText,
  ClipboardCheck,
} from 'lucide-react'
import type { CaseStudy } from '../../types/caseStudy'

interface CaseStudyBriefPanelProps {
  caseStudy: CaseStudy
  isCustom?: boolean
  onSubmitModel: () => void
  onToggleReference?: () => void
  showReference?: boolean
}

const DIAGRAM_LABELS: Record<CaseStudy['diagramType'], string> = {
  use_case: 'Use Case',
  er: 'ER Diagram',
  class: 'Class Diagram',
  dfd: 'Data Flow (DFD)',
}

const DIFFICULTY_STYLES: Record<CaseStudy['difficulty'], string> = {
  Beginner: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  Easy: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
  Intermediate: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  Advanced: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
}

export function CaseStudyBriefPanel({
  caseStudy,
  isCustom = false,
  onSubmitModel,
  onToggleReference,
  showReference = false,
}: CaseStudyBriefPanelProps) {
  const [hintsOpen, setHintsOpen] = useState(false)
  const [revealedHints, setRevealedHints] = useState(0)

  return (
    <aside className="w-full lg:w-[320px] xl:w-[350px] shrink-0 h-full overflow-y-auto border-b lg:border-b-0 lg:border-r border-[var(--border-subtle)] bg-[var(--bg-primary)] flex flex-col">
      <div className="p-4 space-y-4 flex-1">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            {DIAGRAM_LABELS[caseStudy.diagramType]}
          </span>
          {!isCustom && (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${DIFFICULTY_STYLES[caseStudy.difficulty]}`}
            >
              {caseStudy.difficulty}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium text-[var(--text-tertiary)] bg-[var(--bg-secondary)]">
            {caseStudy.domain}
          </span>
        </div>

        {/* System Statement */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            <FileText className="w-3.5 h-3.5" />
            <span>System Statement</span>
          </div>
          <p className="text-[13px] leading-relaxed text-[var(--text-primary)] whitespace-pre-line">
            {caseStudy.statement}
          </p>
        </div>

        {/* Deliverables */}
        {caseStudy.deliverables.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Modeling Deliverables
            </h3>
            <ul className="space-y-1.5">
              {caseStudy.deliverables.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-[var(--text-secondary)] leading-snug"
                >
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Progressive Hints */}
        {caseStudy.hints.length > 0 && (
          <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setHintsOpen((v) => !v)
                if (!hintsOpen && revealedHints === 0) setRevealedHints(1)
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Hints ({revealedHints}/{caseStudy.hints.length})
              </span>
              {hintsOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              )}
            </button>
            {hintsOpen && (
              <div className="px-3 pb-3 pt-1 space-y-2 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40">
                {caseStudy.hints.slice(0, revealedHints).map((hint, i) => (
                  <p key={i} className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    <span className="font-semibold text-[var(--text-primary)]">
                      {i + 1}.
                    </span>{' '}
                    {hint}
                  </p>
                ))}
                {revealedHints < caseStudy.hints.length && (
                  <button
                    type="button"
                    onClick={() => setRevealedHints((n) => n + 1)}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    + Reveal next hint
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Sticky Actions */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] flex flex-col gap-2">
        <button
          type="button"
          onClick={onSubmitModel}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-xs"
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          Submit
        </button>

        {!isCustom && onToggleReference && (
          <button
            type="button"
            onClick={onToggleReference}
            className="w-full px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
          >
            {showReference ? 'Hide Reference Solution' : 'Compare Side-by-Side'}
          </button>
        )}
      </div>
    </aside>
  )
}
