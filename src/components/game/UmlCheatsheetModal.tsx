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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-2xl bg-[var(--bg-modal)] rounded-[6px] border border-[var(--border-default)] shadow-xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📖</span>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-mono">
                UML 2.5 Standard Reference
              </div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Use Case Diagram Notation Guide
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[3px] hover:bg-[var(--hover-bg)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Include vs Extend Callout */}
          <div className="notion-callout notion-callout-blue">
            <Lightbulb className="w-4 h-4 text-[#337ea9] dark:text-[#5e87c9] shrink-0 mt-0.5" />
            <div className="space-y-2 w-full">
              <span className="font-semibold text-xs text-[var(--text-primary)] block">
                «include» vs «extend» (Key Rules)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Include Card */}
                <div className="p-3 bg-[var(--bg-primary)] rounded-[4px] border border-[var(--border-subtle)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#337ea9] dark:text-[#5e87c9]">
                      «include» (Mandatory)
                    </span>
                    <span className="notion-tag notion-tag-blue font-mono text-[9px]">
                      Required
                    </span>
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    The base use case <strong>always</strong> requires the included behavior to succeed.
                  </p>
                  <div className="p-1.5 bg-[var(--bg-secondary)] rounded-[3px] font-mono text-[11px] text-center text-[var(--text-primary)] border border-[var(--border-subtle)]">
                    Base UC ── «include» ──► Sub UC
                  </div>
                </div>

                {/* Extend Card */}
                <div className="p-3 bg-[var(--bg-primary)] rounded-[4px] border border-[var(--border-subtle)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#cb912f] dark:text-[#dcb14b]">
                      «extend» (Optional)
                    </span>
                    <span className="notion-tag notion-tag-yellow font-mono text-[9px]">
                      Optional
                    </span>
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Optional or conditional branch. Arrow points <strong>back to base</strong>!
                  </p>
                  <div className="p-1.5 bg-[var(--bg-secondary)] rounded-[3px] font-mono text-[11px] text-center text-[var(--text-primary)] border border-[var(--border-subtle)]">
                    Optional UC ── «extend» ──► Base UC
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Core Symbols Grid */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Core Notational Elements
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Actor */}
              <div className="p-3 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)]">Actor</span>
                  <span className="notion-tag notion-tag-gray font-mono text-[10px]">
                    «actor»
                  </span>
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  An external entity (person, organization, or external API/system) interacting with the system. Always placed outside the system boundary.
                </p>
              </div>

              {/* Use Case */}
              <div className="p-3 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)]">Use Case</span>
                  <span className="notion-tag notion-tag-gray font-mono text-[10px]">
                    (Oval)
                  </span>
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  A discrete functional goal that delivers observable value. Written with an action verb + noun (e.g. &quot;Deposit Check&quot;).
                </p>
              </div>

              {/* System Boundary */}
              <div className="p-3 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)]">System Boundary</span>
                  <span className="notion-tag notion-tag-gray font-mono text-[10px]">
                    [Box]
                  </span>
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Encloses all use cases belonging to the application under design. Actors must remain strictly outside.
                </p>
              </div>

              {/* Generalization */}
              <div className="p-3 rounded-[4px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)]">Generalization</span>
                  <span className="notion-tag notion-tag-green font-mono text-[10px]">
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
          <div className="notion-callout notion-callout-yellow">
            <CheckCircle2 className="w-4 h-4 text-[#cb912f] dark:text-[#dcb14b] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-xs text-[var(--text-primary)] block">
                3 Golden Rules to Avoid Mistakes
              </span>
              <ul className="list-disc pl-4 space-y-1 text-[var(--text-secondary)] leading-relaxed">
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
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="notion-btn notion-btn-primary"
          >
            <span>Close Guide</span>
          </button>
        </div>
      </div>
    </div>
  )
}
