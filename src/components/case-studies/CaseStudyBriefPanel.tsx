import { useState, useMemo } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  X,
  GripVertical,
} from 'lucide-react'
import type { CaseStudy, CaseStudyEvaluation } from '../../types/caseStudy'
import type { HighlightedTerm } from '../../lib/caseStudyStorage'
import type { StudioElementKind } from '../studio/StudioBottomDock'

interface CaseStudyBriefPanelProps {
  caseStudy: CaseStudy
  isCustom?: boolean
  canSubmit: boolean
  checkedDeliverables: number[]
  onToggleDeliverable: (index: number) => void
  highlightedTerms: HighlightedTerm[]
  onAddHighlightedTerm: (term: HighlightedTerm) => void
  onRemoveHighlightedTerm: (text: string) => void
  onCycleHighlightedTermKind: (text: string) => void
  hintsUsed: number
  onRevealHint: () => void
  evaluation: CaseStudyEvaluation | null
  hasSubmitted: boolean
  hasNextCase: boolean
  showReference: boolean
  onSubmitModel: () => void
  onRetry: () => void
  onNextCase: () => void
  onToggleReference: () => void
  onGiveUpRevealReference: () => void
}

const DIAGRAM_LABELS: Record<CaseStudy['diagramType'], string> = {
  use_case: 'Use Case',
  er: 'ER Diagram',
  class: 'Class Diagram',
  dfd: 'Data Flow (DFD)',
}

const DIFFICULTY_STYLES: Record<CaseStudy['difficulty'], string> = {
  Beginner: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  Easy: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  Intermediate: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  Advanced: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
}

const KIND_LABELS: Record<string, string> = {
  actor: 'Actor',
  useCase: 'Use Case',
  erEntity: 'Entity',
  umlClass: 'Class',
  dfdProcess: 'Process',
  dfdDataStore: 'Store',
  dfdExternalEntity: 'External',
}

export function getDefaultKindForDiagram(
  diagramType: CaseStudy['diagramType']
): StudioElementKind {
  if (diagramType === 'er') return 'erEntity'
  if (diagramType === 'class') return 'umlClass'
  if (diagramType === 'dfd') return 'dfdProcess'
  return 'useCase'
}

export function getNextKindForDiagram(
  diagramType: CaseStudy['diagramType'],
  current: string
): StudioElementKind {
  if (diagramType === 'use_case') {
    return current === 'actor' ? 'useCase' : 'actor'
  }
  if (diagramType === 'dfd') {
    if (current === 'dfdProcess') return 'dfdDataStore'
    if (current === 'dfdDataStore') return 'dfdExternalEntity'
    return 'dfdProcess'
  }
  return getDefaultKindForDiagram(diagramType)
}

export function CaseStudyBriefPanel({
  caseStudy,
  isCustom = false,
  canSubmit,
  checkedDeliverables,
  onToggleDeliverable,
  highlightedTerms,
  onAddHighlightedTerm,
  onRemoveHighlightedTerm,
  onCycleHighlightedTermKind,
  hintsUsed,
  onRevealHint,
  evaluation,
  hasSubmitted,
  hasNextCase,
  showReference,
  onSubmitModel,
  onRetry,
  onNextCase,
  onToggleReference,
  onGiveUpRevealReference,
}: CaseStudyBriefPanelProps) {
  const [hintsOpen, setHintsOpen] = useState(false)

  const statementSegments = useMemo(() => {
    const text = caseStudy.statement
    if (highlightedTerms.length === 0) {
      return [{ text, highlighted: false }]
    }
    const sorted = [...highlightedTerms]
      .map((t) => t.text.trim())
      .filter((t) => t.length >= 2)
      .sort((a, b) => b.length - a.length)

    if (sorted.length === 0) {
      return [{ text, highlighted: false }]
    }

    const escaped = sorted.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi')
    const parts = text.split(regex)
    const termSet = new Set(sorted.map((t) => t.toLowerCase()))

    return parts
      .filter((p) => p.length > 0)
      .map((part) => ({
        text: part,
        highlighted: termSet.has(part.toLowerCase()),
      }))
  }, [caseStudy.statement, highlightedTerms])

  const handleStatementMouseUp = (e: React.MouseEvent<HTMLParagraphElement>) => {
    const sel = window.getSelection()
    const selectedText = sel?.toString().trim() || ''

    if (selectedText.length >= 2 && selectedText.length <= 48) {
      const cleaned = selectedText.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')
      if (cleaned.length >= 2) {
        onAddHighlightedTerm({
          text: cleaned,
          kind: getDefaultKindForDiagram(caseStudy.diagramType),
        })
      }
      sel?.removeAllRanges()
      return
    }

    // Simple click with no drag selection: if clicking inside a <mark>, mark's onClick handles removal
    if ((e.target as HTMLElement).tagName === 'MARK') return

    // Otherwise extract clicked word from caret anchorNode
    const anchorNode = sel?.anchorNode
    const offset = sel?.anchorOffset ?? -1
    if (anchorNode && anchorNode.nodeType === Node.TEXT_NODE && offset >= 0) {
      const content = anchorNode.textContent || ''
      let start = offset
      let end = offset
      while (start > 0 && /[a-zA-Z0-9-]/.test(content[start - 1])) start--
      while (end < content.length && /[a-zA-Z0-9-]/.test(content[end])) end++
      const word = content.slice(start, end).replace(/^-+|-+$/g, '')
      if (word.length >= 2) {
        onAddHighlightedTerm({
          text: word,
          kind: getDefaultKindForDiagram(caseStudy.diagramType),
        })
      }
    }
  }

  const maxEarnableStars = hintsUsed === 0 ? 3 : hintsUsed === 1 ? 2 : 1
  const foundConcepts = evaluation?.conceptResults.filter((c) => c.matched) || []
  const missingConcepts = evaluation?.conceptResults.filter((c) => !c.matched) || []
  const missingRels = evaluation?.relationshipResults.filter((r) => !r.matched) || []
  const foundRels = evaluation?.relationshipResults.filter((r) => r.matched) || []

  return (
    <aside className="w-full lg:w-[340px] xl:w-[370px] shrink-0 h-full border-b lg:border-b-0 lg:border-r border-[var(--border-subtle)] bg-[var(--bg-primary)] flex flex-col min-h-0">
      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* Badges — Difficulty colored, others neutral */}
        <div className="flex flex-wrap items-center gap-1.5">
          {!isCustom && (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${DIFFICULTY_STYLES[caseStudy.difficulty]}`}
            >
              {caseStudy.difficulty}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            {DIAGRAM_LABELS[caseStudy.diagramType]}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            {caseStudy.domain}
          </span>
        </div>

        {/* Interactive System Statement */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/55 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              System Statement
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)]">
              Click or select words to tag
            </span>
          </div>

          <p
            onMouseUp={handleStatementMouseUp}
            className="text-[13px] leading-relaxed text-[var(--text-primary)] select-text cursor-text"
          >
            {statementSegments.map((seg, idx) =>
              seg.highlighted ? (
                <mark
                  key={idx}
                  onClick={() => onRemoveHighlightedTerm(seg.text)}
                  title="Click to remove highlight"
                  className="bg-amber-200/80 dark:bg-amber-500/30 text-[var(--text-primary)] underline decoration-amber-500/70 underline-offset-2 rounded px-0.5 cursor-pointer"
                >
                  {seg.text}
                </mark>
              ) : (
                <span key={idx}>{seg.text}</span>
              )
            )}
          </p>

          {/* Draggable Tagged Chips */}
          {highlightedTerms.length > 0 && (
            <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Drag onto canvas
              </div>
              <div className="flex flex-wrap gap-1.5">
                {highlightedTerms.map((term) => (
                  <div
                    key={term.text}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/umly-node-type', term.kind)
                      e.dataTransfer.setData('application/umly-node-label', term.text)
                      e.dataTransfer.effectAllowed = 'copyMove'
                    }}
                    className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[11px] shadow-2xs cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical className="w-3 h-3 text-[var(--text-tertiary)]" />
                    <span className="font-medium text-[var(--text-primary)]">
                      {term.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => onCycleHighlightedTermKind(term.text)}
                      className="px-1.5 py-0.2 rounded bg-[var(--bg-secondary)] text-[10px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      title="Click to switch element type"
                    >
                      {KIND_LABELS[term.kind] || term.kind}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveHighlightedTerm(term.text)}
                      className="p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                      aria-label={`Remove ${term.text}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Self-Checkable Deliverables */}
        {caseStudy.deliverables.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Self-Check Deliverables
            </h3>
            <ul className="space-y-1.5">
              {caseStudy.deliverables.map((item, idx) => {
                const checked = checkedDeliverables.includes(idx)
                return (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => onToggleDeliverable(idx)}
                      className="w-full flex items-start gap-2 text-left text-xs leading-snug group"
                    >
                      <span
                        className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                          checked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-[var(--border-default)] bg-[var(--bg-primary)] group-hover:border-[var(--text-tertiary)]'
                        }`}
                      >
                        {checked && <Check className="w-2.5 h-2.5" />}
                      </span>
                      <span
                        className={
                          checked
                            ? 'line-through text-[var(--text-tertiary)]'
                            : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                        }
                      >
                        {item}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* Hints (Cost Stars) */}
        {caseStudy.hints.length > 0 && (
          <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden">
            <button
              type="button"
              onClick={() => setHintsOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
            >
              <span>
                Hints ({hintsUsed}/{caseStudy.hints.length})
                <span className="ml-1.5 text-[10px] font-normal text-[var(--text-tertiary)]">
                  max {maxEarnableStars}★
                </span>
              </span>
              {hintsOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              )}
            </button>
            {hintsOpen && (
              <div className="px-3 pb-3 pt-1.5 space-y-2 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40">
                {hintsUsed === 0 ? (
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Each hint reveals a modeling clue and reduces your maximum
                    earned stars by 1★.
                  </p>
                ) : (
                  caseStudy.hints.slice(0, hintsUsed).map((hint, i) => (
                    <p
                      key={i}
                      className="text-xs text-[var(--text-secondary)] leading-relaxed"
                    >
                      <span className="font-semibold text-[var(--text-primary)]">
                        {i + 1}.
                      </span>{' '}
                      {hint}
                    </p>
                  ))
                )}
                {hintsUsed < caseStudy.hints.length && (
                  <button
                    type="button"
                    onClick={onRevealHint}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    + Reveal hint (-1★)
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Inline Result View (Found / Missing / Wrong + Stars) */}
        {evaluation && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((n) => (
                  <Star
                    key={n}
                    className={`w-4 h-4 ${
                      n <= evaluation.stars
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-[var(--text-tertiary)]/40'
                    }`}
                  />
                ))}
              </div>
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

            {/* Wrong / Syntax Warnings */}
            {evaluation.syntaxWarnings.length > 0 && (
              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Wrong / Issues ({evaluation.syntaxWarnings.length})
                </div>
                {evaluation.syntaxWarnings.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-start gap-1.5 text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 rounded-lg p-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{w.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Missing */}
            {(missingConcepts.length > 0 || missingRels.length > 0) && (
              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Missing ({missingConcepts.length + missingRels.length})
                </div>
                {missingConcepts.map((c) => (
                  <div
                    key={c.requirement.id}
                    className="flex items-start gap-1.5 text-xs text-[var(--text-secondary)]"
                  >
                    <XCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{c.requirement.label}</span>
                  </div>
                ))}
                {missingRels.map((r) => (
                  <div
                    key={r.requirement.id}
                    className="flex items-start gap-1.5 text-xs text-[var(--text-secondary)]"
                  >
                    <XCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{r.requirement.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Found */}
            {(foundConcepts.length > 0 || foundRels.length > 0) && (
              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Found ({foundConcepts.length + foundRels.length})
                </div>
                {foundConcepts.map((c) => (
                  <div
                    key={c.requirement.id}
                    className="flex items-start gap-1.5 text-xs text-[var(--text-primary)]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{c.requirement.label}</span>
                  </div>
                ))}
                {foundRels.map((r) => (
                  <div
                    key={r.requirement.id}
                    className="flex items-start gap-1.5 text-xs text-[var(--text-primary)]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{r.requirement.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pinned Bottom Footer */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] shrink-0 space-y-2">
        {!evaluation ? (
          <>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={onSubmitModel}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-gray-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-xs"
            >
              Submit Model
            </button>
            {!isCustom && !hasSubmitted && (
              <button
                type="button"
                onClick={onGiveUpRevealReference}
                className="w-full text-[11px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors py-0.5"
              >
                Give up &amp; unlock reference
              </button>
            )}
            {!isCustom && hasSubmitted && (
              <button
                type="button"
                onClick={onToggleReference}
                className="w-full px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
              >
                {showReference ? 'Hide Reference' : 'Compare Reference'}
              </button>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRetry}
                className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
              >
                Retry
              </button>
              {hasNextCase && (
                <button
                  type="button"
                  onClick={onNextCase}
                  className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-xs"
                >
                  Next Case →
                </button>
              )}
            </div>
            {!isCustom && (
              <button
                type="button"
                onClick={onToggleReference}
                className="w-full px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
              >
                {showReference ? 'Hide Reference' : 'Compare Reference'}
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
