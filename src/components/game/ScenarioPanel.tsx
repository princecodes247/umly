import React, { useState } from 'react'
import type { LevelDefinition } from '../../types/game'
import {
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Lightbulb,
  CheckSquare,
  Award,
} from 'lucide-react'

interface ScenarioPanelProps {
  level: LevelDefinition
  hintsUsedCount: number
  onUseHint: () => void
  onReset: () => void
}

export const ScenarioPanel: React.FC<ScenarioPanelProps> = ({
  level,
  hintsUsedCount,
  onUseHint,
  onReset,
}) => {
  const [hintsOpen, setHintsOpen] = useState(false)
  const [conceptOpen, setConceptOpen] = useState(true)

  const revealedHints = level.hints.slice(0, hintsUsedCount)
  const hasMoreHints = hintsUsedCount < level.hints.length

  const difficultyTag = (diff: string) => {
    switch (diff) {
      case 'Beginner':
        return 'notion-tag-green'
      case 'Intermediate':
        return 'notion-tag-orange'
      case 'Advanced':
        return 'notion-tag-purple'
      default:
        return 'notion-tag-gray'
    }
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-[6px] shadow-sm overflow-hidden text-xs">
      {/* Notion Document Header */}
      <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] space-y-2 select-none">
        <div className="flex items-center justify-between text-[var(--text-tertiary)]">
          <div className="flex items-center gap-1.5 font-mono">
            <span>Level {level.number}</span>
            <span>/</span>
            <span>{level.id}</span>
          </div>

          <button
            type="button"
            onClick={onReset}
            title="Reset diagram to initial state"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[11px] text-[var(--text-secondary)] hover:text-[var(--notion-red-text)] hover:bg-[var(--hover-bg)] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-snug">
          {level.title}
        </h1>

        {/* Notion Properties Rows */}
        <div className="pt-1 space-y-1 font-sans">
          <div className="flex items-center gap-2">
            <span className="w-16 text-[var(--text-tertiary)] flex-shrink-0">
              Category
            </span>
            <span className="notion-tag notion-tag-blue">
              {level.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-16 text-[var(--text-tertiary)] flex-shrink-0">
              Difficulty
            </span>
            <span className={`notion-tag ${difficultyTag(level.difficulty)}`}>
              {level.difficulty}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-16 text-[var(--text-tertiary)] flex-shrink-0">
              Type
            </span>
            <span className="notion-tag notion-tag-gray capitalize">
              {level.type}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Document Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Scenario Narrative */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] select-none">
            Scenario Narrative
          </div>
          <div className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed bg-[var(--bg-secondary)] p-3 rounded-[4px] border border-[var(--border-subtle)]">
            {level.scenario}
          </div>
        </div>

        {/* Mission Goal Callout */}
        <div className="notion-callout notion-callout-blue">
          <CheckSquare className="w-4 h-4 text-[#337ea9] dark:text-[#5e87c9] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-semibold text-xs text-[var(--text-primary)]">
              Mission Objective
            </div>
            <div className="text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
              {level.goal}
            </div>
          </div>
        </div>

        {/* Key Concept Toggle */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setConceptOpen(!conceptOpen)}
            className="flex items-center gap-1.5 w-full py-1 text-left font-semibold text-xs text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded-[3px] select-none"
          >
            {conceptOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            )}
            <Award className="w-3.5 h-3.5 text-[#cb912f] dark:text-[#dcb14b]" />
            <span>Key UML Concept</span>
          </button>

          {conceptOpen && (
            <div className="pl-5 text-xs text-[var(--text-secondary)] leading-relaxed border-l-2 border-[var(--border-subtle)] ml-1.5 py-1">
              {level.learningObjective}
            </div>
          )}
        </div>

        {/* Hints Toggle */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setHintsOpen(!hintsOpen)}
            className="flex items-center justify-between w-full py-1 text-left font-semibold text-xs text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded-[3px] select-none"
          >
            <div className="flex items-center gap-1.5">
              {hintsOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              )}
              <HelpCircle className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <span>
                Hints ({revealedHints.length} / {level.hints.length})
              </span>
            </div>

            {hasMoreHints && (
              <span className="text-[10px] text-[#cb912f] dark:text-[#dcb14b] font-medium">
                Unlock next (-★)
              </span>
            )}
          </button>

          {hintsOpen && (
            <div className="space-y-2 pl-4 border-l-2 border-[var(--border-subtle)] ml-1.5">
              {revealedHints.length === 0 ? (
                <div className="text-xs text-[var(--text-tertiary)] italic py-1">
                  No hints revealed. Solve without hints for full 3-star rating.
                </div>
              ) : (
                revealedHints.map((hint, i) => (
                  <div
                    key={i}
                    className="notion-callout notion-callout-yellow py-2 text-xs"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-[#cb912f] dark:text-[#dcb14b] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-semibold text-[11px] block">
                        Hint {i + 1}
                      </span>
                      <p className="text-[var(--text-secondary)]">{hint}</p>
                    </div>
                  </div>
                ))
              )}

              {hasMoreHints && (
                <button
                  type="button"
                  onClick={onUseHint}
                  className="notion-btn text-xs w-full justify-center bg-[var(--notion-yellow-bg)] text-[var(--notion-yellow-text)] border-[var(--border-subtle)]"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Reveal Hint {revealedHints.length + 1} (Costs 1 Star)</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
