import {
  X,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react'

interface UmlCheatsheetModalProps {
  isOpen: boolean
  onClose: () => void
}

export const UmlCheatsheetModal: React.FC<UmlCheatsheetModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/45 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[var(--bg-modal)] rounded-2xl border border-[var(--border-default)] shadow-xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 bg-[var(--bg-primary)] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg sm:text-xl shrink-0">📖</span>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-mono truncate">
                UML 2.5 Standard Reference
              </div>
              <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate">
                Use Case Diagram Notation Guide
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide"
            className="p-1.5 rounded-full hover:bg-[var(--hover-bg)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-4 sm:space-y-5 flex-1 text-xs">
          {/* Include vs Extend Callout */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/50 space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#337ea9] dark:text-[#5e87c9] shrink-0" />
              <span className="font-semibold text-xs sm:text-sm text-[var(--text-primary)]">
                «include» vs «extend» (Key Rules)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* Include Card */}
              <div className="p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#337ea9] dark:text-[#5e87c9]">
                    «include» (Mandatory)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-semibold shrink-0">
                    Required
                  </span>
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  The base use case <strong>always</strong> requires the included behavior to succeed.
                </p>
                <div className="px-2 py-1.5 bg-[var(--bg-secondary)] rounded-lg font-mono text-[10.5px] sm:text-[11px] text-center text-[var(--text-primary)] border border-[var(--border-subtle)] overflow-x-auto whitespace-nowrap">
                  Base UC ── «include» ──► Sub UC
                </div>
              </div>

              {/* Extend Card */}
              <div className="p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#cb912f] dark:text-[#dcb14b]">
                    «extend» (Optional)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-semibold shrink-0">
                    Optional
                  </span>
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Optional or conditional branch. Arrow points <strong>back to base</strong>!
                </p>
                <div className="px-2 py-1.5 bg-[var(--bg-secondary)] rounded-lg font-mono text-[10.5px] sm:text-[11px] text-center text-[var(--text-primary)] border border-[var(--border-subtle)] overflow-x-auto whitespace-nowrap">
                  Optional UC ── «extend» ──► Base UC
                </div>
              </div>
            </div>
          </div>

          {/* Core Symbols Grid */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Core Notational Elements
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Actor */}
              <div className="p-3 sm:p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[var(--text-primary)]">Actor</span>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-mono text-[10px] shrink-0">
                    «actor»
                  </span>
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  An external entity (person, organization, or external API/system) interacting with the system. Always placed outside the system boundary.
                </p>
              </div>

              {/* Use Case */}
              <div className="p-3 sm:p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[var(--text-primary)]">Use Case</span>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-mono text-[10px] shrink-0">
                    (Oval)
                  </span>
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  A discrete functional goal that delivers observable value. Written with an action verb + noun (e.g. &quot;Deposit Check&quot;).
                </p>
              </div>

              {/* System Boundary */}
              <div className="p-3 sm:p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[var(--text-primary)]">System Boundary</span>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-mono text-[10px] shrink-0">
                    [Box]
                  </span>
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Encloses all use cases belonging to the application under design. Actors must remain strictly outside.
                </p>
              </div>

              {/* Generalization */}
              <div className="p-3 sm:p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[var(--text-primary)]">Generalization</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] shrink-0">
                    ───▷
                  </span>
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Inheritance / specialization. Connects child entity to parent entity with a hollow triangular arrow head.
                </p>
              </div>
            </div>
          </div>

          {/* Golden Rules Callout */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#cb912f] dark:text-[#dcb14b] shrink-0" />
              <span className="font-semibold text-xs sm:text-sm text-[var(--text-primary)]">
                3 Golden Rules to Avoid Mistakes
              </span>
            </div>
            <ul className="list-disc pl-4 space-y-1.5 text-[var(--text-secondary)] leading-relaxed">
              <li>
                <strong>Never connect an Actor to a Use Case with «include» or «extend»</strong> — Actors only communicate via solid Associations.
              </li>
              <li>
                <strong>Never connect two Actors directly</strong> unless you are modeling actor generalization (e.g. Surgeon ──▷ Doctor).
              </li>
              <li>
                <strong>Arrow direction matters</strong>: «include» points to the mandatory sub-flow, whereas «extend» points back to the base use case.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-gray-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 font-semibold text-xs px-5 py-2 transition shadow-xs cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  )
}
