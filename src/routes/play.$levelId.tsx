import { useState, useEffect, useCallback, useMemo } from 'react'
import { createFileRoute, Link, useNavigate, notFound } from '@tanstack/react-router'
import type { Node, Edge } from '@xyflow/react'
import {
  ArrowLeft,
  CheckCircle2,
  BookOpen,
} from 'lucide-react'

import { getLevelById, getNextLevel } from '../data/levels'
import { StudioCanvas } from '../components/studio/StudioCanvas'
import { ScenarioPanel } from '../components/game/ScenarioPanel'
import { FeedbackModal } from '../components/game/FeedbackModal'
import { SuccessModal } from '../components/game/SuccessModal'
import { UmlCheatsheetModal } from '../components/game/UmlCheatsheetModal'
import { validateLevelDiagram } from '../lib/validator'
import { saveLevelProgress } from '../lib/storage'
import type {
  ValidationResult,
  UmlNodeData,
  UmlEdgeData,
} from '../types/game'

export const Route = createFileRoute('/play/$levelId')({
  loader: ({ params }) => {
    const level = getLevelById(params.levelId)
    if (!level) {
      throw notFound()
    }
    return { level }
  },
  component: PlayLevelPage,
})

function PlayLevelPage() {
  const { level } = Route.useLoaderData()
  const navigate = useNavigate()

  // Prepare initial react-flow nodes & edges from level definition
  const defaultNodes: Node[] = useMemo(() => {
    return level.initialNodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: n.data as unknown as Record<string, unknown>,
    }))
  }, [level])

  const defaultEdges: Edge[] = useMemo(() => {
    if (!level.initialEdges) return []
    return level.initialEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'umlEdge',
      data: e.data as unknown as Record<string, unknown>,
    }))
  }, [level])

  // Current canvas state
  const [currentNodes, setCurrentNodes] = useState<Node[]>(defaultNodes)
  const [currentEdges, setCurrentEdges] = useState<Edge[]>(defaultEdges)
  const [resetCounter, setResetCounter] = useState(0)

  // Game state
  const [attempts, setAttempts] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showCheatsheet, setShowCheatsheet] = useState(false)
  const [earnedStars, setEarnedStars] = useState(0)

  // Reset local state when level changes
  useEffect(() => {
    setCurrentNodes(defaultNodes)
    setCurrentEdges(defaultEdges)
    setAttempts(0)
    setHintsUsed(0)
    setValidationResult(null)
    setShowFeedbackModal(false)
    setShowSuccessModal(false)
  }, [defaultNodes, defaultEdges])

  const handleDiagramChange = useCallback((nodes: Node[], edges: Edge[]) => {
    setCurrentNodes(nodes)
    setCurrentEdges(edges)
  }, [])

  const handleUseHint = useCallback(() => {
    setHintsUsed((prev) => Math.min(prev + 1, level.hints.length))
  }, [level.hints.length])

  const handleResetDiagram = useCallback(() => {
    setCurrentNodes(defaultNodes)
    setCurrentEdges(defaultEdges)
    setValidationResult(null)
    setResetCounter((c) => c + 1)
  }, [defaultNodes, defaultEdges])

  // Validation execution
  const handleValidate = () => {
    const newAttemptCount = attempts + 1
    setAttempts(newAttemptCount)

    const userNodes = currentNodes.map((n) => ({
      id: n.id,
      data: n.data as unknown as UmlNodeData,
    }))

    const userEdges = currentEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      data: e.data as unknown as UmlEdgeData,
    }))

    const result = validateLevelDiagram(level, userNodes, userEdges)
    setValidationResult(result)

    if (result.isCorrect) {
      let stars = 3
      if (hintsUsed > 0 || newAttemptCount > 2) {
        stars = 2
      }
      if (hintsUsed >= 2 || newAttemptCount > 4) {
        stars = 1
      }

      setEarnedStars(stars)
      saveLevelProgress(level.id, stars, hintsUsed, newAttemptCount)
      setShowSuccessModal(true)
    } else {
      setShowFeedbackModal(true)
    }
  }

  const nextLevel = getNextLevel(level.id)

  const handleNextLevel = () => {
    if (nextLevel) {
      navigate({ to: '/play/$levelId', params: { levelId: nextLevel.id } })
    }
  }

  const handleLevelSelect = () => {
    navigate({ to: '/puzzles' })
  }

  const puzzleHeader = (
    <header className="flex items-center justify-between px-3 py-1.5 mx-1.5 sm:mx-2 mt-1.5 sm:mt-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-[6px] shadow-xs shrink-0 select-none">
      {/* Left: Back Link & Level Indicator */}
      <div className="flex items-center gap-2">
        <Link
          to="/puzzles"
          className="flex items-center gap-1 px-2 py-1 rounded-[4px] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Puzzles</span>
        </Link>

        <div className="h-3.5 w-px bg-[var(--border-subtle)]" />

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono font-semibold text-[var(--text-primary)]">
            Level {level.number}
          </span>
          <span className="text-[var(--text-secondary)] hidden md:inline truncate max-w-xs">
            {level.title}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowCheatsheet(true)}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] text-xs font-medium border border-[var(--border-default)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] transition-colors cursor-pointer"
          title="Open UML Notation Rules"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Rules</span>
        </button>

        <button
          type="button"
          onClick={handleValidate}
          className="notion-btn notion-btn-primary cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Check Diagram</span>
        </button>
      </div>
    </header>
  )

  const scenarioSidebar = (
    <div className="w-full md:w-80 lg:w-96 shrink-0 h-48 md:h-full flex flex-col min-h-0">
      <ScenarioPanel
        level={level}
        hintsUsedCount={hintsUsed}
        onUseHint={handleUseHint}
        onReset={handleResetDiagram}
      />
    </div>
  )

  return (
    <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden bg-[var(--bg-primary)]">
      <StudioCanvas
        puzzle={{
          initialNodes: defaultNodes,
          initialEdges: defaultEdges,
          diagramType: 'use_case',
          title: `Level ${level.number}: ${level.title}`,
          resetKey: `${level.id}-${resetCounter}`,
          onDiagramChange: handleDiagramChange,
          customHeader: puzzleHeader,
          leftSidebar: scenarioSidebar,
        }}
      />

      {/* Feedback Modal for Diagnostics */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        result={validationResult}
        onClose={() => setShowFeedbackModal(false)}
        onTryAgain={() => setShowFeedbackModal(false)}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        level={level}
        stars={earnedStars}
        hintsUsed={hintsUsed}
        attempts={attempts}
        onNextLevel={nextLevel ? handleNextLevel : undefined}
        onReplay={() => {
          setShowSuccessModal(false)
          handleResetDiagram()
        }}
        onLevelSelect={handleLevelSelect}
      />

      {/* Visual Cheatsheet Modal */}
      <UmlCheatsheetModal
        isOpen={showCheatsheet}
        onClose={() => setShowCheatsheet(false)}
      />
    </div>
  )
}
