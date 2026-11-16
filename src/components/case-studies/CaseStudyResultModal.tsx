import {
  X,
  CheckCircle2,
  Circle,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Columns2,
  Trophy,
  ClipboardCheck,
} from 'lucide-react'
import type { CaseStudy, CaseStudyEvaluation } from '../../types/caseStudy'

interface CaseStudyResultModalProps {
  caseStudy: CaseStudy
  evaluation: CaseStudyEvaluation
  isCustom?: boolean
  nextCaseStudy: CaseStudy | null
  onClose: () => void
  onCompareReference: () => void
  onNextCaseStudy: () => void
}

export function CaseStudyResultModal({
  caseStudy,
  evaluation,
  isCustom = false,
  nextCaseStudy,
  onClose,
  onCompareReference,
  onNextCaseStudy,
}: CaseStudyResultModalProps) {
  const passed = evaluation.score >= 80
  const matchedConcepts = evaluation.conceptResults.filter((c) => c.matched).length
  const totalConcepts = evaluation.conceptResults.length
  const matchedRels = evaluation.relationshipResults.filter((r) => r.matched).length
  const totalRels = evaluation.relationshipResults.length

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl max-h-[88vh] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                passed
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400'
              }`}
            >
              {passed ? (
                <Trophy className="w-4.5 h-4.5" />
              ) : (
                <ClipboardCheck className="w-4.5 h-4.5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--text-primary)] truncate">
                  {passed ? 'Model Accepted!' : 'Model Review'}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    passed
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                      : evaluation.score >= 50
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                  }`}
                >
                  {evaluation.score}%
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                {caseStudy.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
            aria-label="Close review"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            {evaluation.summary}
          </p>

          {/* Syntax Warnings */}
          {evaluation.syntaxWarnings.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Syntax &amp; Structure ({evaluation.syntaxWarnings.length})
              </div>
              <div className="space-y-1.5">
                {evaluation.syntaxWarnings.map((w) => (
                  <div
                    key={w.id}
                    className={`flex items-start gap-2 text-xs p-2.5 rounded-xl ${
                      w.severity === 'error'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}
                  >
                    {w.severity === 'error' ? (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{w.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concepts & Relationships */}
          {(totalConcepts > 0 || totalRels > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {totalConcepts > 0 && (
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 p-3.5 space-y-2">
                  <div className="text-xs font-bold text-[var(--text-primary)]">
                    Concepts ({matchedConcepts}/{totalConcepts})
                  </div>
                  <div className="space-y-1.5">
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

              {totalRels > 0 && (
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 p-3.5 space-y-2">
                  <div className="text-xs font-bold text-[var(--text-primary)]">
                    Relationships ({matchedRels}/{totalRels})
                  </div>
                  <div className="space-y-1.5">
                    {evaluation.relationshipResults.map((r) => (
                      <div
                        key={r.requirement.id}
                        className="flex items-start gap-1.5 text-xs"
                      >
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

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {!isCustom && (
              <button
                type="button"
                onClick={onCompareReference}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>Compare Reference</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
            >
              Keep Editing
            </button>

            {passed && nextCaseStudy && (
              <button
                type="button"
                onClick={onNextCaseStudy}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-gray-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-xs"
              >
                <span>Next Case Study</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

