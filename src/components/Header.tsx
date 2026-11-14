import { useState, useEffect } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  Star,
  BookOpen,
  ChevronRight,
  LayoutDashboard,
  Puzzle,
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { getStoredProgress } from '../lib/storage'
import { UmlCheatsheetModal } from './game/UmlCheatsheetModal'
import { LEVEL_SUMMARIES } from '../data/levels'

export default function Header() {
  const [totalStars, setTotalStars] = useState(0)
  const [showCheatsheet, setShowCheatsheet] = useState(false)
  const routerState = useRouterState()

  const pathname = routerState.location.pathname
  const isWorkspace = pathname.startsWith('/workspace')
  const isPuzzles = pathname.startsWith('/puzzles')
  const matchPlay = pathname.match(/\/play\/([^/]+)/)
  const currentLevelId = matchPlay ? matchPlay[1] : null
  const currentLevel = currentLevelId
    ? LEVEL_SUMMARIES.find((l) => l.id === currentLevelId)
    : null

  useEffect(() => {
    const updateStars = () => {
      const progress = getStoredProgress()
      const stars = Object.values(progress).reduce(
        (sum, p) => sum + (p.stars || 0),
        0
      )
      setTotalStars(stars)
    }

    updateStars()
    window.addEventListener('storage', updateStars)
    return () => window.removeEventListener('storage', updateStars)
  }, [pathname])

  const totalPossibleStars = LEVEL_SUMMARIES.length * 3

  return (
    <>
      <header className="sticky top-0 z-40 h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-sm px-3 sm:px-8 select-none transition-colors">
        <div className="h-full max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand & Primary Nav */}
          <div className="flex items-center gap-1.5 sm:gap-3 text-xs text-[var(--text-secondary)] min-w-0">
            <Link
              to="/"
              className="flex items-center gap-1.5 pr-0.5 sm:pr-1 py-1 hover:opacity-80 transition-opacity shrink-0"
              title="UMLy Home"
            >
              <span className="text-base">📐</span>
              <span className="hidden sm:inline text-base font-extrabold text-[var(--text-primary)] tracking-tight">
                UMLy
              </span>
            </Link>

            <div className="hidden sm:block h-4 w-px bg-[var(--border-subtle)] shrink-0" />

            <nav className="flex items-center gap-1 sm:gap-1.5" aria-label="Main navigation">
              <Link
                to="/workspace"
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap ${
                  isWorkspace
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                <span>Workspace</span>
              </Link>

              <Link
                to="/puzzles"
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap ${
                  isPuzzles || currentLevel
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                <Puzzle className="w-3.5 h-3.5 shrink-0" />
                <span>Puzzles</span>
              </Link>
            </nav>

            {currentLevel && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0 hidden md:block" />
                <span className="px-1.5 py-1 text-[var(--text-primary)] font-semibold truncate max-w-[160px] sm:max-w-[220px] hidden md:block">
                  Level {currentLevel.number}: {currentLevel.title}
                </span>
              </>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowCheatsheet(true)}
              className="flex items-center gap-1.5 p-2 sm:px-3.5 sm:py-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
              title="Notation Guide"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Notation Guide</span>
            </button>

            <div
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold bg-amber-100/80 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200"
              title={`${totalStars} stars collected out of ${totalPossibleStars} possible`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="font-mono">{totalStars}</span>
              <span className="hidden sm:inline text-[10px] opacity-75">/ {totalPossibleStars}</span>
            </div>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <UmlCheatsheetModal
        isOpen={showCheatsheet}
        onClose={() => setShowCheatsheet(false)}
      />
    </>
  )
}
