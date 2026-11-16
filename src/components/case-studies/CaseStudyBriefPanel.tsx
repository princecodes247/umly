import { useState } from 'react'
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
} from 'lucide-react'
import type { CaseStudy, CaseStudyEvaluation } from '../../types/caseStudy'

interface CaseStudyBriefPanelProps {
  caseStudy: CaseStudy
  evaluation: CaseStudyEvaluation | null
  isCustom?: boolean
  onCheckModel: () => void
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
  evaluation,
  isCustom = false,
  onCheckModel,
  onToggleReference,
  showReference = false,
}: CaseStudyBriefPanelProps) {
  const [hintsOpen, setHintsOpen] = useState(false)
  const [revealedHints, setRevealedHints] = useState(0)

  return (
    <aside className="w-full lg:w-[340px] xl:w-[370px] shrink-0 h-full overflow-y-auto border-b lg:border-b-0 lg:border-r border-[var(--border-subtle)] bg-[var(--bg-primary)] flex flex-col">
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

        {/* Evaluation Results */}
        {evaluation && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Model Review
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  evaluation.score >= 80
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                    : evaluation.score >= 50
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                }`}
              >
                {evaluation.score}%
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {evaluation.summary}
            </p>

            {/* Syntax Warnings */}
            {evaluation.syntaxWarnings.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  Syntax & Structure ({evaluation.syntaxWarnings.length})
                </div>
                <div className="space-y-1">
                  {evaluation.syntaxWarnings.map((w) => (
                    <div
                      key={w.id}
                      className={`flex items-start gap-1.5 text-[11px] p-2 rounded-lg ${
                        w.severity === 'error'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}
                    >
                      {w.severity === 'error' ? (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      )}
                      <span>{w.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Concept Coverage */}
            {evaluation.conceptResults.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  Concepts ({evaluation.conceptResults.filter((c) => c.matched).length}/
                  {evaluation.conceptResults.length})
                </div>
                <div className="space-y-1">
                  {evaluation.conceptResults.map((c) => (
                    <div key={c.requirement.id} className="space-y-0.5">
                      <div className="flex items-start gap-1.5 text-xs">
                        {c.matched ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0 mt-0.5" />
                        )}
                        <span
                          className={
                            c.matched
                              ? 'text-[var(--text-primary)]'
                              : 'text-[var(--text-secondary)]'
                          }
                        >
                          {c.requirement.label}
                          {c.matched && c.matchedNodeLabels.length > 0 && (
                            <span className="text-[11px] text-[var(--text-tertiary)]">
                              {' '}
                              ({c.matchedNodeLabels[0]})
                            </span>
                          )}
                        </span>
                      </div>
                      {c.memberWarning && (
                        <p className="pl-5 text-[11px] text-amber-600 dark:text-amber-400">
                          {c.memberWarning}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Relationship Coverage */}
            {evaluation.relationshipResults.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  Relationships ({evaluation.relationshipResults.filter((r) => r.matched).length}/
                  {evaluation.relationshipResults.length})
                </div>
                <div className="space-y-1">
                  {evaluation.relationshipResults.map((r) => (
                    <div key={r.requirement.id} className="flex items-start gap-1.5 text-xs">
                      {r.matched ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0 mt-0.5" />
                      )}
                      <span
                        className={
                          r.matched
                            ? 'text-[var(--text-primary)]'
                            : 'text-[var(--text-secondary)]'
                        }
                      >
                        {r.requirement.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Sticky Actions */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] flex flex-col gap-2">
        <button
          type="button"
          onClick={onCheckModel}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Check My Model
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

