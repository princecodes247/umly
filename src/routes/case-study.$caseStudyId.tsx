import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import type { Edge, Node } from '@xyflow/react'
import confetti from 'canvas-confetti'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { CASE_STUDIES } from '../data/caseStudies'
import { CUSTOM_CASE_STUDY_KEY } from './case-studies'
import { StudioCanvas } from '../components/studio/StudioCanvas'
import {
  CaseStudyBriefPanel,
  getNextKindForDiagram,
} from '../components/case-studies/CaseStudyBriefPanel'
import { ReferenceSolutionSplit } from '../components/case-studies/ReferenceSolutionSplit'
import { evaluateCaseStudy } from '../lib/caseStudyEvaluator'
import {
  clearCaseStudyDraft,
  getCaseStudyDraft,
  saveCaseStudyDraft,
  saveCaseStudyProgress,
  type HighlightedTerm,
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
      'Model your own system statement on the canvas and submit anytime for syntax feedback.',
    deliverables: [],
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

function getInitialNodesForCaseStudy(cs: CaseStudy): Node[] {
  if (cs.diagramType === 'use_case') {
    return [
      {
        id: `boundary-${cs.id}`,
        type: 'boundary',
        position: { x: 240, y: 40 },
        zIndex: -1,
        data: {
          label: 'System Boundary',
          nodeType: 'boundary',
          boundaryTitle: `${cs.domain} System`,
          width: 480,
          height: 380,
        },
      },
    ]
  }
  return []
}

function getEmptyHintText(diagramType: PuzzleDiagramType): string {
  if (diagramType === 'er') {
    return 'Press E to add an Entity · or drag tagged words from the statement'
  }
  if (diagramType === 'class') {
    return 'Press C to add a Class · or drag tagged words from the statement'
  }
  if (diagramType === 'dfd') {
    return 'Press P for Process · D for Data Store · E for External Entity'
  }
  return 'Press A to add an Actor · U for a Use Case · or drag tagged words from the statement'
}

function CaseStudyWorkspacePage() {
  const { caseStudyId } = Route.useParams()
  const navigate = useNavigate()
  const isCustom = caseStudyId === 'custom'

  const caseStudy = useMemo(() => {
    if (isCustom) return loadCustomCaseStudy()
    return CASE_STUDIES.find((c) => c.id === caseStudyId) || null
  }, [caseStudyId, isCustom])

  const currentIndex = useMemo(() => {
    if (isCustom || !caseStudy) return -1
    return CASE_STUDIES.findIndex((c) => c.id === caseStudy.id)
  }, [caseStudy, isCustom])

  const prevCaseStudy = currentIndex > 0 ? CASE_STUDIES[currentIndex - 1] : null
  const nextCaseStudy =
    currentIndex !== -1 && currentIndex + 1 < CASE_STUDIES.length
      ? CASE_STUDIES[currentIndex + 1]
      : null

  const [seedNodes, setSeedNodes] = useState<Node[]>([])
  const [seedEdges, setSeedEdges] = useState<Edge[]>([])
  const [userNodeCount, setUserNodeCount] = useState(0)
  const [resetKey, setResetKey] = useState(0)
  const [showBrief, setShowBrief] = useState(true)
  const [showReference, setShowReference] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [evaluation, setEvaluation] = useState<CaseStudyEvaluation | null>(null)
  const [checkedDeliverables, setCheckedDeliverables] = useState<number[]>([])
  const [highlightedTerms, setHighlightedTerms] = useState<HighlightedTerm[]>([])
  const [hintsUsed, setHintsUsed] = useState(0)

  const latestNodesRef = useRef<Node[]>([])
  const latestEdgesRef = useRef<Edge[]>([])

  // Load saved draft (or pre-placed boundary) when switching cases
  useEffect(() => {
    if (!caseStudy) return
    const draft = getCaseStudyDraft(caseStudy.id)
    const nodes =
      draft && draft.nodes.length > 0
        ? draft.nodes
        : getInitialNodesForCaseStudy(caseStudy)
    const edges = draft?.edges || []
    latestNodesRef.current = nodes
    latestEdgesRef.current = edges
    setSeedNodes(nodes)
    setSeedEdges(edges)
    setUserNodeCount(nodes.filter((n) => n.type !== 'boundary').length)
    setCheckedDeliverables(draft?.checkedDeliverables || [])
    setHighlightedTerms(draft?.highlightedTerms || [])
    setHintsUsed(draft?.hintsUsed || 0)
    setHasSubmitted(Boolean(draft?.hasSubmitted))
    setEvaluation(null)
    setShowReference(false)
    setShowBrief(true)
    setResetKey((k) => k + 1)
  }, [caseStudy])

  const persistExtraDraftState = useCallback(
    (patch: {
      checkedDeliverables?: number[]
      highlightedTerms?: HighlightedTerm[]
      hintsUsed?: number
      hasSubmitted?: boolean
    }) => {
      if (!caseStudy) return
      saveCaseStudyDraft(caseStudy.id, {
        nodes: latestNodesRef.current,
        edges: latestEdgesRef.current,
        ...patch,
      })
    },
    [caseStudy]
  )

  const handleDiagramChange = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      latestNodesRef.current = nodes
      latestEdgesRef.current = edges
      setUserNodeCount(nodes.filter((n) => n.type !== 'boundary').length)
      if (caseStudy) {
        saveCaseStudyDraft(caseStudy.id, { nodes, edges })
      }
    },
    [caseStudy]
  )

  const handleSubmitModel = useCallback(() => {
    if (!caseStudy) return
    const result = evaluateCaseStudy(
      caseStudy,
      latestNodesRef.current,
      latestEdgesRef.current,
      hintsUsed
    )
    setEvaluation(result)
    setHasSubmitted(true)
    setShowBrief(true)
    persistExtraDraftState({ hasSubmitted: true })
    if (!isCustom) {
      saveCaseStudyProgress(caseStudy.id, result.score, result.stars)
      if (result.score >= 80) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.65 } })
      }
    }
  }, [caseStudy, hintsUsed, isCustom, persistExtraDraftState])

  const handleRetry = useCallback(() => {
    setEvaluation(null)
  }, [])

  const handleToggleReference = useCallback(() => {
    setShowReference((prev) => {
      const next = !prev
      setShowBrief(!next)
      return next
    })
  }, [])

  const handleGiveUpRevealReference = useCallback(() => {
    setHasSubmitted(true)
    persistExtraDraftState({ hasSubmitted: true })
    setShowBrief(false)
    setShowReference(true)
  }, [persistExtraDraftState])

  const handleResetCanvas = useCallback(() => {
    if (!caseStudy) return
    clearCaseStudyDraft(caseStudy.id)
    const initialNodes = getInitialNodesForCaseStudy(caseStudy)
    latestNodesRef.current = initialNodes
    latestEdgesRef.current = []
    setSeedNodes(initialNodes)
    setSeedEdges([])
    setUserNodeCount(0)
    setCheckedDeliverables([])
    setHighlightedTerms([])
    setHintsUsed(0)
    setHasSubmitted(false)
    setEvaluation(null)
    setShowReference(false)
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
    setUserNodeCount(refNodes.filter((n) => n.type !== 'boundary').length)
    saveCaseStudyDraft(caseStudy.id, { nodes: refNodes, edges: refEdges })
    setSeedNodes(refNodes)
    setSeedEdges(refEdges)
    setResetKey((k) => k + 1)
  }, [caseStudy])

  const handleToggleDeliverable = useCallback(
    (index: number) => {
      setCheckedDeliverables((prev) => {
        const next = prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
        persistExtraDraftState({ checkedDeliverables: next })
        return next
      })
    },
    [persistExtraDraftState]
  )

  const handleAddHighlightedTerm = useCallback(
    (term: HighlightedTerm) => {
      setHighlightedTerms((prev) => {
        if (prev.some((t) => t.text.toLowerCase() === term.text.toLowerCase())) {
          return prev
        }
        const next = [...prev, term]
        persistExtraDraftState({ highlightedTerms: next })
        return next
      })
    },
    [persistExtraDraftState]
  )

  const handleRemoveHighlightedTerm = useCallback(
    (text: string) => {
      setHighlightedTerms((prev) => {
        const next = prev.filter(
          (t) => t.text.toLowerCase() !== text.toLowerCase()
        )
        persistExtraDraftState({ highlightedTerms: next })
        return next
      })
    },
    [persistExtraDraftState]
  )

  const handleCycleHighlightedTermKind = useCallback(
    (text: string) => {
      if (!caseStudy) return
      setHighlightedTerms((prev) => {
        const next = prev.map((t) =>
          t.text.toLowerCase() === text.toLowerCase()
            ? { ...t, kind: getNextKindForDiagram(caseStudy.diagramType, t.kind) }
            : t
        )
        persistExtraDraftState({ highlightedTerms: next })
        return next
      })
    },
    [caseStudy, persistExtraDraftState]
  )

  const handleRevealHint = useCallback(() => {
    setHintsUsed((prev) => {
      const next = prev + 1
      persistExtraDraftState({ hintsUsed: next })
      return next
    })
  }, [persistExtraDraftState])

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
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
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
          title={showBrief ? 'Hide brief panel' : 'Show brief panel'}
        >
          {showBrief ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeftOpen className="w-4 h-4" />
          )}
        </button>

        <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
          {caseStudy.title}
        </span>

        {!isCustom && currentIndex !== -1 && (
          <div className="hidden sm:flex items-center gap-0.5 ml-1 pl-2 border-l border-[var(--border-subtle)] shrink-0">
            <button
              type="button"
              disabled={!prevCaseStudy}
              onClick={() =>
                prevCaseStudy &&
                navigate({
                  to: '/case-study/$caseStudyId',
                  params: { caseStudyId: prevCaseStudy.id },
                })
              }
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] disabled:opacity-30 disabled:pointer-events-none"
              title="Previous case study"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-medium text-[var(--text-tertiary)] px-1 whitespace-nowrap">
              Case {currentIndex + 1} of {CASE_STUDIES.length}
            </span>
            <button
              type="button"
              disabled={!nextCaseStudy}
              onClick={() =>
                nextCaseStudy &&
                navigate({
                  to: '/case-study/$caseStudyId',
                  params: { caseStudyId: nextCaseStudy.id },
                })
              }
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] disabled:opacity-30 disabled:pointer-events-none"
              title="Next case study"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {showReference && !isCustom && (
          <button
            type="button"
            onClick={() => {
              setShowReference(false)
              setShowBrief(true)
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
          >
            Hide Reference
          </button>
        )}
        <button
          type="button"
          onClick={handleResetCanvas}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
          title="Reset case study canvas"
        >
          Reset
        </button>
      </div>
    </div>
  )

  const emptyStateHint =
    userNodeCount === 0 ? (
      <div className="pointer-events-none absolute inset-x-0 top-16 z-10 flex justify-center px-4">
        <div className="px-3.5 py-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-xs text-[11px] font-medium text-[var(--text-secondary)] shadow-xs text-center">
          {getEmptyHintText(caseStudy.diagramType)}
        </div>
      </div>
    ) : null

  return (
    <main className="flex-1 w-full lg:h-[calc(100vh-3.5rem)] min-h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-[var(--bg-primary)]">
      {showBrief && (
        <div className="max-h-[46vh] lg:max-h-none lg:h-full overflow-hidden flex">
          <CaseStudyBriefPanel
            caseStudy={caseStudy}
            isCustom={isCustom}
            canSubmit={userNodeCount > 0}
            checkedDeliverables={checkedDeliverables}
            onToggleDeliverable={handleToggleDeliverable}
            highlightedTerms={highlightedTerms}
            onAddHighlightedTerm={handleAddHighlightedTerm}
            onRemoveHighlightedTerm={handleRemoveHighlightedTerm}
            onCycleHighlightedTermKind={handleCycleHighlightedTermKind}
            hintsUsed={hintsUsed}
            onRevealHint={handleRevealHint}
            evaluation={evaluation}
            hasSubmitted={hasSubmitted}
            hasNextCase={Boolean(nextCaseStudy)}
            showReference={showReference}
            onSubmitModel={handleSubmitModel}
            onRetry={handleRetry}
            onNextCase={() => {
              if (!nextCaseStudy) return
              navigate({
                to: '/case-study/$caseStudyId',
                params: { caseStudyId: nextCaseStudy.id },
              })
            }}
            onToggleReference={handleToggleReference}
            onGiveUpRevealReference={handleGiveUpRevealReference}
          />
        </div>
      )}

      <div className="flex-1 min-w-0 min-h-[420px] lg:min-h-0 flex flex-col">
        <StudioCanvas
          puzzle={{
            initialNodes: seedNodes,
            initialEdges: seedEdges,
            diagramType: caseStudy.diagramType,
            title: caseStudy.title,
            resetKey,
            onDiagramChange: handleDiagramChange,
            customHeader,
            hideInspector: showReference,
            collapseInspectorByDefault: true,
            emptyStateHint,
            highlightedNodeIds: evaluation?.offendingNodeIds,
          }}
        />
      </div>

      {showReference && !isCustom && (
        <ReferenceSolutionSplit
          caseStudy={caseStudy}
          onClose={() => {
            setShowReference(false)
            setShowBrief(true)
          }}
          onLoadIntoCanvas={handleLoadReferenceIntoCanvas}
        />
      )}
    </main>
  )
}
