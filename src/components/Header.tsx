import { useState, useEffect } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Star, BookOpen, ChevronRight, PenTool, Puzzle } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { getStoredProgress } from '../lib/storage'
import { UmlCheatsheetModal } from './game/UmlCheatsheetModal'
import { LEVELS } from '../data/levels'

export default function Header() {
  const [totalStars, setTotalStars] = useState(0)
  const [showCheatsheet, setShowCheatsheet] = useState(false)
  const routerState = useRouterState()

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
  }, [])

  // Check route status
  const pathname = routerState.location.pathname
  const isStudio = pathname === '/'
  const isPuzzles = pathname.startsWith('/puzzles')
  const matchPlay = pathname.match(/\/play\/([^/]+)/)
  const currentLevelId = matchPlay ? matchPlay[1] : null
  const currentLevel = currentLevelId
    ? LEVELS.find((l) => l.id === currentLevelId)
    : null

  const totalPossibleStars = LEVELS.length * 3

  return (
    <>
      <header className="sticky top-0 z-40 h-11 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 sm:px-6 select-none transition-colors">
        <div className="h-full max-w-7xl mx-auto flex items-center justify-between">
          {/* Notion Breadcrumbs & Brand */}
          <div className="flex items-center gap-1 sm:gap-2 text-xs text-[var(--text-secondary)] overflow-hidden">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-1.5 py-1 rounded-[4px] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] transition-colors group shrink-0"
            >
              <span className="text-sm">📐</span>
              <span className="font-semibold text-[var(--text-primary)] tracking-tight">
                UMLy
              </span>
            </Link>

            <div className="h-3.5 w-px bg-[var(--border-subtle)] mx-0.5 shrink-0" />

            {/* Mode Switcher */}
            <div className="flex items-center gap-1">
              <Link
                to="/"
                className={`flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                  isStudio
                    ? 'bg-[var(--hover-bg-strong)] text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Studio</span>
                <span className="hidden sm:inline-block text-[9px] uppercase px-1 py-0 rounded bg-[var(--selection-bg)] text-[var(--primary-btn)] font-semibold">
                  Free Draw
                </span>
              </Link>

              <Link
                to="/puzzles"
                className={`flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-xs font-medium transition-colors ${
                  isPuzzles || currentLevel
                    ? 'bg-[var(--hover-bg-strong)] text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                <Puzzle className="w-3.5 h-3.5" />
                <span>Puzzles</span>
              </Link>
            </div>

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

      <UmlCheatsheetModal
        isOpen={showCheatsheet}
        onClose={() => setShowCheatsheet(false)}
      />
    </>
  )
}
