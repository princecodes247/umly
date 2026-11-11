import React, { useState } from 'react'
import type { LevelDefinition } from '../../types/game'
import {
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Lightbulb,
  Target,
  BookOpen,
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
  const [conceptOpen, setConceptOpen] = useState(false)

  const revealedHints = level.hints.slice(0, hintsUsedCount)
  const hasMoreHints = hintsUsedCount < level.hints.length

  const difficultyColor = (diff: string) => {
    switch (diff) {
      case 'Beginner':
        return 'text-[var(--notion-green-text)] bg-[var(--notion-green-bg)]'
      case 'Intermediate':
        return 'text-[var(--notion-yellow-text)] bg-[var(--notion-yellow-bg)]'
      case 'Advanced':
        return 'text-[var(--notion-purple-text)] bg-[var(--notion-purple-bg)]'
      default:
        return 'text-[var(--text-secondary)] bg-[var(--bg-secondary)]'
    }
  }

  return (
    <aside className="flex flex-col h-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-[6px] overflow-hidden text-xs font-sans">
      {/* Compact Header */}
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] space-y-2 select-none">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-[10.5px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              Level {level.number}
            </span>
            <span className="text-[var(--text-tertiary)]">·</span>
            <span
              className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium ${difficultyColor(level.difficulty)}`}
            >
              {level.difficulty}
            </span>
            <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] capitalize">
              {level.type}
            </span>
          </div>

          <button
            type="button"
            onClick={onReset}
            title="Reset diagram to initial state"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[11px] text-[var(--text-tertiary)] hover:text-[var(--notion-red-text)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        <div>
          <h1 className="text-[14px] font-bold text-[var(--text-primary)] leading-snug">
            {level.title}
          </h1>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
            {level.category}
          </p>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4">
        {/* Scenario Narrative */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] select-none">
            Scenario
          </div>
          <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed">
            {level.scenario}
          </p>
        </div>

        {/* Mission Objective */}
        <div className="rounded-[6px] border border-[var(--primary-btn)]/20 bg-[var(--selection-bg)]/45 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--primary-btn)]">
            <Target className="w-3.5 h-3.5 shrink-0" />
            <span>Objective</span>
          </div>
          <p className="text-[12px] text-[var(--text-primary)] whitespace-pre-line leading-relaxed">
            {level.goal}
          </p>
        </div>

        {/* Key Concept */}
        <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1.5">
          <button
            type="button"
            onClick={() => setConceptOpen(!conceptOpen)}
            className="flex items-center justify-between w-full py-0.5 text-left text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors select-none cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <span>Key UML Concept</span>
            </span>
            {conceptOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            )}
          </button>

          {conceptOpen && (
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed pt-1">
              {level.learningObjective}
            </p>
          )}
        </div>

        {/* Hints */}
        <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
          <button
            type="button"
            onClick={() => setHintsOpen(!hintsOpen)}
            className="flex items-center justify-between w-full py-0.5 text-left text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors select-none cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-[#cb912f]" />
              <span>
                Hints ({revealedHints.length}/{level.hints.length})
              </span>
            </span>

            <span className="flex items-center gap-1.5">
              {hasMoreHints && (
                <span className="text-[10px] font-medium text-[#cb912f]">
                  -1 ★ per hint
                </span>
              )}
              {hintsOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              )}
            </span>
          </button>

          {hintsOpen && (
            <div className="space-y-2 pt-1">
              {revealedHints.length === 0 ? (
                <p className="text-[11.5px] text-[var(--text-tertiary)] italic">
                  No hints used yet. Solve without hints for 3 stars.
                </p>
              ) : (
                revealedHints.map((hint, i) => (
                  <div
                    key={i}
                    className="rounded-[5px] bg-[var(--notion-yellow-bg)]/60 border border-[var(--border-subtle)] px-2.5 py-2 space-y-0.5"
                  >
                    <span className="text-[10px] font-mono font-semibold text-[var(--notion-yellow-text)] uppercase">
                      Hint {i + 1}
                    </span>
                    <p className="text-[11.5px] text-[var(--text-primary)] leading-relaxed">
                      {hint}
                    </p>
                  </div>
                ))
              )}

              {hasMoreHints && (
                <button
                  type="button"
                  onClick={onUseHint}
                  className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-[5px] text-[11px] font-medium bg-[var(--notion-yellow-bg)] text-[var(--notion-yellow-text)] hover:brightness-95 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Reveal Hint {revealedHints.length + 1}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
