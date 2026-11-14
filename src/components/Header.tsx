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
      <header className="sticky top-0 z-40 h-11 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-sm px-4 sm:px-8 select-none transition-colors">
        <div className="h-full max-w-6xl mx-auto flex items-center justify-between">
          {/* Brand & Primary Nav */}
          <div className="flex items-center gap-1 sm:gap-2 text-xs text-[var(--text-secondary)] overflow-hidden">
            <Link
              to="/"
              className="flex items-center gap-1.5 pr-1.5 py-1 rounded-[4px] hover:text-[var(--text-primary)] transition-colors group shrink-0"
            >
              <span className="text-sm">📐</span>
              <span className="font-semibold text-[var(--text-primary)] tracking-tight">
                UMLy
              </span>
            </Link>

            <div className="h-3.5 w-px bg-[var(--border-subtle)] mx-0.5 shrink-0" />

            <nav className="flex items-center gap-1" aria-label="Main navigation">
              <Link
                to="/workspace"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                  isWorkspace
                    ? 'bg-[var(--hover-bg-strong)] text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Workspace</span>
              </Link>

              <Link
                to="/puzzles"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                  isPuzzles || currentLevel
                    ? 'bg-[var(--hover-bg-strong)] text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                <Puzzle className="w-3.5 h-3.5" />
                <span>Puzzles</span>
              </Link>
            </nav>

            {currentLevel && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0 hidden md:block" />
                <span className="px-1.5 py-1 text-[var(--text-primary)] font-medium truncate max-w-[150px] sm:max-w-[200px] hidden md:block">
                  Level {currentLevel.number}: {currentLevel.title}
                </span>
              </>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Notation Guide Button */}
            <button
              type="button"
              onClick={() => setShowCheatsheet(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-[4px] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              <span className="hidden sm:inline">Notation Guide</span>
            </button>

            {/* Stars Count Pill */}
            {(isPuzzles || currentLevel) && (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-[4px] text-xs font-medium bg-[var(--notion-yellow-bg)] text-[var(--notion-yellow-text)]"
                title={`${totalStars} stars collected out of ${totalPossibleStars} possible`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="font-mono font-semibold">{totalStars}</span>
                <span className="text-[10px] opacity-75">/ {totalPossibleStars}</span>
              </div>
            )}

            <div className="h-4 w-px bg-[var(--border-subtle)] mx-0.5" />

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* UML Cheatsheet Modal */}
      <UmlCheatsheetModal
        isOpen={showCheatsheet}
        onClose={() => setShowCheatsheet(false)}
      />
    </>
  )
}
