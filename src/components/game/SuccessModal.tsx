import React, { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { Star, ArrowRight, RotateCcw, ListOrdered } from 'lucide-react'
import type { LevelDefinition } from '../../types/game'

interface SuccessModalProps {
  isOpen: boolean
  level: LevelDefinition
  stars: number
  hintsUsed: number
  attempts: number
  onNextLevel?: () => void
  onReplay: () => void
  onLevelSelect: () => void
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  level,
  stars,
  hintsUsed,
  attempts,
  onNextLevel,
  onReplay,
  onLevelSelect,
}) => {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#2383e2', '#448361', '#cb912f', '#9065b0'],
        })
      } catch (e) {
        // Fallback
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-lg bg-[var(--bg-modal)] rounded-[6px] border border-[var(--border-default)] shadow-xl overflow-hidden flex flex-col p-6 text-center space-y-4">
        {/* Notion Celebration Icon */}
        <div className="text-4xl">🎉</div>

        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Level Complete!
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Level {level.number}: {level.title}
          </p>
        </div>

        {/* Stars Display */}
        <div className="flex items-center justify-center gap-2 my-2">
          {[1, 2, 3].map((starIndex) => {
            const isEarned = starIndex <= stars
            return (
              <div
                key={starIndex}
                className={`transition-all duration-200 ${
                  isEarned
                    ? 'text-[#cb912f] dark:text-[#dcb14b]'
                    : 'text-[var(--border-strong)]'
                }`}
              >
                <Star
                  className={`w-7 h-7 ${
                    isEarned ? 'fill-current' : 'stroke-current'
                  }`}
                />
              </div>
            )
          })}
        </div>

        {/* Metrics Row */}
        <div className="flex items-center justify-center gap-4 py-1.5 px-3 rounded-[4px] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] mx-auto">
          <span>Attempts: <strong className="text-[var(--text-primary)]">{attempts}</strong></span>
          <span>•</span>
          <span>Hints Used: <strong className="text-[var(--text-primary)]">{hintsUsed}</strong></span>
        </div>

        {/* UML Explanation Callout */}
        <div className="notion-callout notion-callout-green text-left text-xs leading-relaxed">
          <div className="space-y-1">
            <span className="font-semibold text-[var(--text-primary)] block">
              UML Specification Takeaway
            </span>
            <p className="text-[var(--text-secondary)]">
              {level.solutionExplanation}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onLevelSelect}
            className="notion-btn w-full sm:w-auto flex-1 justify-center py-2"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Puzzles List</span>
          </button>

          <button
            type="button"
            onClick={onReplay}
            className="notion-btn py-2 px-3"
            title="Replay level"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {onNextLevel ? (
            <button
              type="button"
              onClick={onNextLevel}
              className="notion-btn notion-btn-primary w-full sm:w-auto flex-1 justify-center py-2"
            >
              <span>Next Level</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onLevelSelect}
              className="notion-btn notion-btn-primary w-full sm:w-auto flex-1 justify-center py-2"
            >
              <span>Done</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
