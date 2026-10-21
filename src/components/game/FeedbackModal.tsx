import React from 'react'
import type { ValidationResult } from '../../types/game'
import {
  XCircle,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  X,
  RefreshCw,
} from 'lucide-react'

interface FeedbackModalProps {
  isOpen: boolean
  result: ValidationResult | null
  onClose: () => void
  onTryAgain: () => void
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  result,
  onClose,
  onTryAgain,
}) => {
  if (!isOpen || !result) return null

  const missing = result.diagnostics.filter((d) => d.type === 'missing')
  const wrongType = result.diagnostics.filter((d) => d.type === 'wrong_type')
  const wrongDirection = result.diagnostics.filter(
    (d) => d.type === 'wrong_direction'
  )
  const extra = result.diagnostics.filter((d) => d.type === 'extra')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-lg bg-[var(--bg-modal)] rounded-[6px] border border-[var(--border-default)] shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-primary)]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚠️</span>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Validation Diagnostic
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {result.summary}
              </p>
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

        {/* Diagnostic Items */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Missing Edges */}
          {missing.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--notion-red-text)]">
                <XCircle className="w-3.5 h-3.5" />
                <span>Missing Relationships ({missing.length})</span>
              </div>
              <div className="space-y-1.5">
                {missing.map((diag, i) => (
                  <div key={i} className="notion-callout notion-callout-red text-xs">
                    {diag.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wrong Direction */}
          {wrongDirection.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--notion-yellow-text)]">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reversed Direction ({wrongDirection.length})</span>
              </div>
              <div className="space-y-1.5">
                {wrongDirection.map((diag, i) => (
                  <div key={i} className="notion-callout notion-callout-yellow text-xs">
                    {diag.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wrong Relationship Type */}
          {wrongType.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--notion-blue-text)]">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Incorrect Relationship Type ({wrongType.length})</span>
              </div>
              <div className="space-y-1.5">
                {wrongType.map((diag, i) => (
                  <div key={i} className="notion-callout notion-callout-blue text-xs">
                    {diag.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extra / Invalid Edges */}
          {extra.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Unexpected Connections ({extra.length})</span>
              </div>
              <div className="space-y-1.5">
                {extra.map((diag, i) => (
                  <div key={i} className="notion-callout text-xs">
                    {diag.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex items-center justify-between gap-3">
          <div className="text-xs text-[var(--text-secondary)]">
            Diagram Accuracy: <span className="font-mono font-bold text-[var(--text-primary)]">{result.score}%</span>
          </div>
          <button
            type="button"
            onClick={onTryAgain}
            className="notion-btn notion-btn-primary"
          >
            <span>Fix on Canvas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
