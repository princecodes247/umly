import { useState, useCallback, useMemo, useRef } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import type { Edge, Node } from '@xyflow/react'
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Columns2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { CASE_STUDIES } from '../data/caseStudies'
import { CUSTOM_CASE_STUDY_KEY } from './case-studies'
import { StudioCanvas } from '../components/studio/StudioCanvas'
import { CaseStudyBriefPanel } from '../components/case-studies/CaseStudyBriefPanel'
import { ReferenceSolutionSplit } from '../components/case-studies/ReferenceSolutionSplit'
import { evaluateCaseStudy } from '../lib/caseStudyEvaluator'
import {
  clearCaseStudyDraft,
  getCaseStudyDraft,
  saveCaseStudyDraft,
  saveCaseStudyProgress,
} from '../lib/caseStudyStorage'
import type { CaseStudy, CaseStudyEvaluation } from '../types/caseStudy'
import type { PuzzleDiagramType } from '../types/game'

export const Route = createFileRoute('/case-study/$caseStudyId')({
  component: CaseStudyWorkspacePage,
})

function loadCustomCaseStudy(): CaseStudy {
  let parsed: { title?: string; diagramType?: PuzzleDiagramType; statement?: string } = {}
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(CUSTOM_CASE_STUDY_KEY)
      if (raw) parsed = JSON.parse(raw)
    } catch {
      // ignore
    }
  }
  return {
    id: 'custom',
    number: 0,
    title: parsed.title || 'Custom System Statement',
    diagramType: parsed.diagramType || 'use_case',
    difficulty: 'Intermediate',
    domain: 'Custom Prompt',
    statement:
      parsed.statement ||
      'Model your own system statement on the canvas and run syntax checks anytime.',
    deliverables: [
      'Identify the core domain elements from your statement.',
      'Connect elements using valid diagram syntax.',
    ],
    hints: [],
    concepts: [],
    relationships: [],
    referenceSolution: {
      explanation: '',
      nodes: [],
      edges: [],
    },
  }
}

function CaseStudyWorkspacePage() {
  const { caseStudyId } = Route.useParams()
  const isCustom = caseStudyId === 'custom'

  const caseStudy = useMemo(() => {
    if (isCustom) return loadCustomCaseStudy()
    return CASE_STUDIES.find((c) => c.id === caseStudyId) || null
  }, [caseStudyId, isCustom])

  const initialDraft = useMemo(
    () => (caseStudy ? getCaseStudyDraft(caseStudy.id) : null),
    [caseStudy]
  )

  const [seedNodes, setSeedNodes] = useState<Node[]>(
    () => initialDraft?.nodes || []
  )
  const [seedEdges, setSeedEdges] = useState<Edge[]>(
    () => initialDraft?.edges || []
  )
  const [resetKey, setResetKey] = useState(0)
  const [showBrief, setShowBrief] = useState(true)
  const [showReference, setShowReference] = useState(false)
  const [evaluation, setEvaluation] = useState<CaseStudyEvaluation | null>(null)

  const latestNodesRef = useRef<Node[]>(seedNodes)
  const latestEdgesRef = useRef<Edge[]>(seedEdges)

  const handleDiagramChange = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      latestNodesRef.current = nodes
      latestEdgesRef.current = edges
      if (caseStudy) {
        saveCaseStudyDraft(caseStudy.id, nodes, edges)
      }
    },
    [caseStudy]
  )

  const handleCheckModel = useCallback(() => {
    if (!caseStudy) return
    const result = evaluateCaseStudy(
      caseStudy,
      latestNodesRef.current,
      latestEdgesRef.current
    )
    setEvaluation(result)
    setShowBrief(true)
    if (!isCustom) {
      saveCaseStudyProgress(caseStudy.id, result.score)
    }
  }, [caseStudy, isCustom])

  const handleResetCanvas = useCallback(() => {
    if (!caseStudy) return
    clearCaseStudyDraft(caseStudy.id)
    latestNodesRef.current = []
    latestEdgesRef.current = []
    setSeedNodes([])
    setSeedEdges([])
    setEvaluation(null)
    setResetKey((k) => k + 1)
  }, [caseStudy])

  const handleLoadReferenceIntoCanvas = useCallback(() => {
    if (!caseStudy) return
    const refNodes: Node[] = caseStudy.referenceSolution.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      zIndex: n.type === 'boundary' ? -1 : undefined,
      data: n.data as unknown as Record<string, unknown>,
    }))
    const refEdges: Edge[] = caseStudy.referenceSolution.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'umlEdge',
      data: e.data,
    }))
    latestNodesRef.current = refNodes
    latestEdgesRef.current = refEdges
    saveCaseStudyDraft(caseStudy.id, refNodes, refEdges)
    setSeedNodes(refNodes)
    setSeedEdges(refEdges)
    setResetKey((k) => k + 1)
  }, [caseStudy])

  if (!caseStudy) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-3">
        <h1 className="text-lg font-bold">Case Study Not Found</h1>
        <Link
          to="/case-studies"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Back to Case Studies
        </Link>
      </main>
    )
  }

  const customHeader = (
    <div className="h-12 px-3 sm:px-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] flex items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <Link
          to="/case-studies"
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors shrink-0"
          title="Back to Case Studies"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <button
          type="button"
          onClick={() => setShowBrief((v) => !v)}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors shrink-0"
          title={showBrief ? 'Hide statement panel' : 'Show statement panel'}
        >
          {showBrief ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeftOpen className="w-4 h-4" />
          )}
        </button>
        <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
          {isCustom
            ? caseStudy.title
            : `Case Study #${caseStudy.number}: ${caseStudy.title}`}
        </span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={handleResetCanvas}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
          title="Clear canvas"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {!isCustom && (
          <button
            type="button"
            onClick={() => setShowReference((v) => !v)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              showReference
                ? 'border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {showReference ? 'Hide Reference' : 'Reference'}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={handleCheckModel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Check Model</span>
        </button>
      </div>
    </div>
  )

  return (
    <main className="flex-1 w-full lg:h-[calc(100vh-3.5rem)] min-h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-[var(--bg-primary)]">
      {showBrief && (
        <div className="max-h-[42vh] lg:max-h-none lg:h-full overflow-hidden flex">
          <CaseStudyBriefPanel
            caseStudy={caseStudy}
            evaluation={evaluation}
            isCustom={isCustom}
            onCheckModel={handleCheckModel}
            onToggleReference={
              !isCustom ? () => setShowReference((v) => !v) : undefined
            }
            showReference={showReference}
          />
        </div>
      )}

      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <StudioCanvas
          puzzle={{
            initialNodes: seedNodes,
            initialEdges: seedEdges,
            diagramType: caseStudy.diagramType,
            title: caseStudy.title,
            resetKey,
            onDiagramChange: handleDiagramChange,
            customHeader,
          }}
        />
      </div>

      {showReference && !isCustom && (
        <ReferenceSolutionSplit
          caseStudy={caseStudy}
          onClose={() => setShowReference(false)}
          onLoadIntoCanvas={handleLoadReferenceIntoCanvas}
        />
      )}
    </main>
  )
}
