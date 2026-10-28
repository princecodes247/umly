import React, { useState, useRef, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Undo2,
  Redo2,
  Download,
  Trash2,
  FolderOpen,
  ChevronDown,
  Check,
  FileCode,
  FileCode2,
  Image as ImageIcon,
  Sparkles,
  ArrowLeft,
  Copy,
  FileText,
  BookOpen,
  MoreHorizontal,
  Puzzle,
} from 'lucide-react'
import { DIAGRAM_TEMPLATES } from '../../data/templates'
import ThemeToggle from '../ThemeToggle'
import { UmlCheatsheetModal } from '../game/UmlCheatsheetModal'

interface StudioToolbarProps {
  title: string
  onTitleChange: (newTitle: string) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onClearCanvas: () => void
  onLoadTemplate: (templateId: string) => void
  onExportPng: () => void
  onExportSvg: () => void
  onExportJson: () => void
  onExportPlantUml?: () => void
  onExportMermaid?: () => void
  onCopyPlantUml?: () => void
  onCopyMermaid?: () => void
  onCopyImageToClipboard?: () => void
  onImportJson: (file: File) => void
  isSaved?: boolean
}

export const StudioToolbar: React.FC<StudioToolbarProps> = ({
  title,
  onTitleChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClearCanvas,
  onLoadTemplate,
  onExportPng,
  onExportSvg,
  onExportJson,
  onExportPlantUml,
  onExportMermaid,
  onCopyPlantUml,
  onCopyMermaid,
  onCopyImageToClipboard,
  onImportJson,
  isSaved = true,
}) => {
  const [showNavMenu, setShowNavMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showCheatsheet, setShowCheatsheet] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(title)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const navMenuRef = useRef<HTMLDivElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTitleInput(title)
  }, [title])

  useEffect(() => {
    const handleOutside = (e: MouseEvent | PointerEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (navMenuRef.current && !navMenuRef.current.contains(target)) {
        setShowNavMenu(false)
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(target)) {
        setShowExportMenu(false)
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setShowMoreMenu(false)
      }
    }
    document.addEventListener('pointerdown', handleOutside, true)
    return () =>
      document.removeEventListener('pointerdown', handleOutside, true)
  }, [])

  const handleFinishTitle = () => {
    setIsEditingTitle(false)
    const trimmed = titleInput.trim() || 'Untitled Use Case Diagram'
    setTitleInput(trimmed)
    onTitleChange(trimmed)
  }

  return (
    <>
      <header className="h-11 px-3 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] flex items-center justify-between gap-2 shrink-0 select-none z-30">
        {/* Left: Back Arrow + Global Nav, Editable Title, Saved Indicator */}
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Global Nav behind Back Arrow */}
          <div ref={navMenuRef} className="relative flex items-center">
            <Link
              to="/"
              className="p-1.5 rounded-[5px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors flex items-center justify-center shrink-0"
              title="Return to Home Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => setShowNavMenu((prev) => !prev)}
              className="p-1 rounded-[4px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors shrink-0"
              title="Open global navigation (Home, Puzzles, Theme)"
            >
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showNavMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {showNavMenu && (
              <div className="absolute left-0 top-full mt-1.5 w-52 rounded-[6px] bg-[var(--bg-primary)] border border-[var(--border-default)] shadow-lg py-1 z-50 text-xs">
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] font-mono border-b border-[var(--border-subtle)]">
                  UMLy Navigation
                </div>
                <Link
                  to="/"
                  onClick={() => setShowNavMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                >
                  <span className="text-sm">🏠</span>
                  <div className="flex flex-col">
                    <span className="font-medium">Home Dashboard</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      Drafts & overview
                    </span>
                  </div>
                </Link>
                <Link
                  to="/puzzles"
                  onClick={() => setShowNavMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                >
                  <Puzzle className="w-3.5 h-3.5 text-[var(--primary-btn)]" />
                  <div className="flex flex-col">
                    <span className="font-medium">UML Puzzles</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      Interactive practice levels
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setShowNavMenu(false)
                    fileInputRef.current?.click()
                  }}
                  className="w-full text-left px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer flex items-center gap-2.5"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <div className="flex flex-col">
                    <span className="font-medium">Open Project...</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      Import .umly.json file
                    </span>
                  </div>
                </button>
                <div className="my-1 border-t border-[var(--border-subtle)]" />
                <div className="px-3 py-2 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span className="font-medium">Appearance</span>
                  <ThemeToggle />
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-[var(--border-subtle)] mx-0.5 shrink-0" />

          {/* Editable Title */}
          {isEditingTitle ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleFinishTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishTitle()
                if (e.key === 'Escape') {
                  setTitleInput(title)
                  setIsEditingTitle(false)
                }
              }}
              autoFocus
              className="px-2 py-0.5 text-xs sm:text-sm font-semibold rounded-[4px] border border-[var(--primary-btn)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none w-44 sm:w-64"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setTitleInput(title)
                setIsEditingTitle(true)
              }}
              title="Click to rename diagram"
              className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--hover-bg)] px-2 py-1 rounded-[4px] transition-colors truncate max-w-[140px] sm:max-w-xs md:max-w-sm text-left cursor-pointer"
            >
              {title}
            </button>
          )}

          {/* Saved Indicator */}
          <span
            className="hidden md:inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] shrink-0 ml-0.5"
            title="Auto-saved to browser storage"
          >
            <Check className="w-3 h-3 text-[var(--notion-green-text)]" />
            {isSaved ? 'Saved' : 'Saving...'}
          </span>
        </div>

        {/* Right: Undo/Redo, Export, and ⋯ Menu (Templates & Notation Guide) */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Cmd+Z)"
              className="notion-btn notion-btn-ghost p-1.5 disabled:opacity-35 disabled:pointer-events-none"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Cmd+Shift+Z)"
              className="notion-btn notion-btn-ghost p-1.5 disabled:opacity-35 disabled:pointer-events-none"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-[var(--border-subtle)] mx-0.5" />

          {/* Export Dropdown */}
          <div ref={exportMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setShowExportMenu(!showExportMenu)
                setShowMoreMenu(false)
              }}
              className="notion-btn py-1 px-2 sm:px-2.5 text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-60 rounded-[6px] bg-[var(--bg-primary)] border border-[var(--border-default)] shadow-lg py-1 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] font-mono">
                  Image & Clipboard
                </div>
                {onCopyImageToClipboard && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false)
                      onCopyImageToClipboard()
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[var(--hover-bg)] flex items-center justify-between gap-2 text-[var(--text-primary)] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5 text-[var(--primary-btn)]" />
                      <span>Copy PNG to Clipboard</span>
                    </span>
                    <kbd className="text-[9px] font-mono text-[var(--text-tertiary)]">
                      ⌘⇧C
                    </kbd>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false)
                    onExportPng()
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[var(--hover-bg)] flex items-center gap-2 text-[var(--text-primary)] cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[var(--notion-blue-text)]" />
                  <span>Export PNG Image (.png)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false)
                    onExportSvg()
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[var(--hover-bg)] flex items-center gap-2 text-[var(--text-primary)] cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5 text-[var(--notion-purple-text)]" />
                  <span>Export Vector SVG (.svg)</span>
                </button>

                <div className="my-1 border-t border-[var(--border-subtle)]" />
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] font-mono">
                  Diagram-as-Code
                </div>
                {onCopyPlantUml && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false)
                      onCopyPlantUml()
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[var(--hover-bg)] flex items-center justify-between gap-2 text-[var(--text-primary)] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <FileCode2 className="w-3.5 h-3.5 text-[var(--notion-orange-text)]" />
                      <span>Copy PlantUML</span>
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)]">code</span>
                  </button>
                )}
                {onExportPlantUml && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false)
                      onExportPlantUml()
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[var(--hover-bg)] flex items-center gap-2 text-[var(--text-primary)] cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[var(--notion-orange-text)]" />
                    <span>Export PlantUML (.puml)</span>
                  </button>
                )}
                {onCopyMermaid && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false)
                      onCopyMermaid()
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[var(--hover-bg)] flex items-center justify-between gap-2 text-[var(--text-primary)] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <FileCode2 className="w-3.5 h-3.5 text-[var(--notion-green-text)]" />
                      <span>Copy Mermaid</span>
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)]">code</span>
                  </button>
                )}
                {onExportMermaid && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false)
                      onExportMermaid()
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[var(--hover-bg)] flex items-center gap-2 text-[var(--text-primary)] cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[var(--notion-green-text)]" />
                    <span>Export Mermaid (.mmd)</span>
                  </button>
                )}

                <div className="my-1 border-t border-[var(--border-subtle)]" />
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] font-mono">
                  Project Backup
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false)
                    onExportJson()
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[var(--hover-bg)] flex items-center gap-2 text-[var(--text-primary)] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <span>Save Project (.umly.json)</span>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.umly.json"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  onImportJson(file)
                  e.target.value = ''
                }
              }}
              className="hidden"
            />
          </div>

          {/* ⋯ Menu for Templates, Notation Guide, and Clear */}
          <div ref={moreMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setShowMoreMenu(!showMoreMenu)
                setShowExportMenu(false)
              }}
              className="notion-btn notion-btn-ghost p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="More options (Templates, Open Project, Notation Guide)"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 mt-1.5 w-64 rounded-[6px] bg-[var(--bg-primary)] border border-[var(--border-default)] shadow-lg py-1 z-50 text-xs">
                {/* Notation Guide */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false)
                    setShowCheatsheet(true)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--hover-bg)] flex items-center gap-2.5 text-[var(--text-primary)] cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[var(--primary-btn)]" />
                  <div className="flex flex-col">
                    <span className="font-medium">Notation Guide</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      UML 2.5 use case symbols & rules
                    </span>
                  </div>
                </button>

                {/* Open Project */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false)
                    fileInputRef.current?.click()
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--hover-bg)] flex items-center gap-2.5 text-[var(--text-primary)] cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <div className="flex flex-col">
                    <span className="font-medium">Open Project...</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      Import a .umly.json diagram file
                    </span>
                  </div>
                </button>

                <div className="my-1 border-t border-[var(--border-subtle)]" />

                {/* Templates Header */}
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] font-mono flex items-center justify-between">
                  <span>Starter Templates</span>
                  <Sparkles className="w-3 h-3 text-[#cb912f]" />
                </div>

                {DIAGRAM_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false)
                      onLoadTemplate(tpl.id)
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[var(--hover-bg)] transition-colors flex flex-col gap-0.5 cursor-pointer"
                  >
                    <span className="font-medium text-[var(--text-primary)]">
                      {tpl.name}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] line-clamp-1">
                      {tpl.description}
                    </span>
                  </button>
                ))}

                <div className="my-1 border-t border-[var(--border-subtle)]" />

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false)
                    onClearCanvas()
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[var(--notion-red-bg)] flex items-center gap-2 text-[var(--notion-red-text)] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Canvas</span>
                </button>
              </div>
            )}
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
