import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Undo2,
  Redo2,
  Download,
  Upload,
  Trash2,
  ChevronDown,
  Check,
  FileCode,
  FileCode2,
  Image as ImageIcon,
  ArrowLeft,
  Copy,
  FileText,
  BookOpen,
  MoreHorizontal,
  Puzzle,
  History,
  RotateCcw,
  Plus,
} from 'lucide-react'
import type { DiagramSnapshot } from '../../lib/diagramStorage'
import ThemeToggle from '../ThemeToggle'
import { UmlCheatsheetModal } from '../game/UmlCheatsheetModal'
import { NewDiagramModal } from './NewDiagramModal'

interface StudioToolbarProps {
  title: string
  onTitleChange: (newTitle: string) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onClearCanvas: () => void
  onLoadTemplate?: (templateId: string) => void
  onExportPng: () => void
  onExportSvg: () => void
  onExportJson: () => void
  onExportPlantUml?: () => void
  onExportMermaid?: () => void
  onCopyPlantUml?: () => void
  onCopyMermaid?: () => void
  onCopyImageToClipboard?: () => void
  onImportJson?: (file: File) => void
  isSaved?: boolean
  snapshots?: DiagramSnapshot[]
  onSaveSnapshot?: (label?: string) => void
  onRestoreSnapshot?: (snapshot: DiagramSnapshot) => void
}

export const StudioToolbar: React.FC<StudioToolbarProps> = ({
  title,
  onTitleChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClearCanvas,
  onExportPng,
  onExportSvg,
  onExportJson,
  onImportJson,
  onExportPlantUml,
  onExportMermaid,
  onCopyPlantUml,
  onCopyMermaid,
  onCopyImageToClipboard,
  isSaved = true,
  snapshots = [],
  onSaveSnapshot,
  onRestoreSnapshot,
}) => {
  const navigate = useNavigate()
  const [showNavMenu, setShowNavMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showHistoryMenu, setShowHistoryMenu] = useState(false)
  const [showCheatsheet, setShowCheatsheet] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(title)

  const navMenuRef = useRef<HTMLDivElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const historyMenuRef = useRef<HTMLDivElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const handleDiagramCreated = (newId: string) => {
    navigate({ to: '/studio/$diagramId', params: { diagramId: newId } })
  }

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
      if (historyMenuRef.current && !historyMenuRef.current.contains(target)) {
        setShowHistoryMenu(false)
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
      <header className="h-14 px-4 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] flex items-center justify-between gap-2 shrink-0 select-none z-30">
        {/* Left: Back Arrow + Global Nav, Editable Title, Saved Indicator */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Global Nav behind Back Arrow */}
          <div ref={navMenuRef} className="relative flex items-center rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-0.5">
            <Link
              to="/workspace"
              className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors flex items-center justify-center shrink-0"
              title="Back to Workspace"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => setShowNavMenu((prev) => !prev)}
              className="p-1 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors shrink-0 cursor-pointer"
              title="Open global navigation (Workspace, Puzzles, Theme)"
            >
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showNavMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {showNavMenu && (
              <div className="absolute left-0 top-full mt-2 w-56 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] shadow-xl py-1.5 z-50 text-xs">
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] font-mono border-b border-[var(--border-subtle)]">
                  UMLy Navigation
                </div>
                <Link
                  to="/workspace"
                  onClick={() => setShowNavMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                >
                  <span className="text-sm">📐</span>
                  <div className="flex flex-col">
                    <span className="font-medium">Workspace</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      Drafts &amp; overview
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
                    setShowNewModal(true)
                  }}
                  className="w-full text-left px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer flex items-center gap-2.5"
                >
                  <Plus className="w-3.5 h-3.5 text-[var(--primary-btn)]" />
                  <div className="flex flex-col">
                    <span className="font-medium">New Project...</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      Create draft, templates, or open file
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

          {/* New Project Flow Trigger */}
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            title="Create a new diagram, choose a template, or open a project file"
            className="flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-medium bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--primary-btn)]" />
            <span>New</span>
          </button>

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
              className="px-2.5 py-1 text-xs sm:text-sm font-semibold rounded-lg border border-[var(--primary-btn)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none w-44 sm:w-64"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setTitleInput(title)
                setIsEditingTitle(true)
              }}
              title="Click to rename diagram"
              className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--hover-bg)] px-2.5 py-1 rounded-lg transition-colors truncate max-w-[140px] sm:max-w-xs md:max-w-sm text-left cursor-pointer"
            >
              {title}
            </button>
          )}

          {/* Saved Indicator */}
          <span
            className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[11px] font-medium text-[var(--text-tertiary)] shrink-0 ml-0.5"
            title="Auto-saved to browser storage"
          >
            <Check className="w-3 h-3 text-[var(--notion-green-text)]" />
            {isSaved ? 'Saved' : 'Saving...'}
          </span>
        </div>

        {/* Right: Undo/Redo, Export, and ⋯ Menu (Templates & Notation Guide) */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Undo / Redo / Version History */}
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
            <div ref={historyMenuRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowHistoryMenu(!showHistoryMenu)
                  setShowExportMenu(false)
                  setShowMoreMenu(false)
                }}
                title="Version History & Snapshots"
                className={`notion-btn notion-btn-ghost p-1.5 ${
                  showHistoryMenu
                    ? 'bg-[var(--hover-bg)] text-[var(--text-primary)]'
                    : ''
                }`}
              >
                <History className="w-3.5 h-3.5" />
              </button>

              {/* Version History Popover */}
              {showHistoryMenu && (
                <div className="absolute right-0 top-full mt-2 z-50 w-76 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-2xl shadow-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                      <History className="w-3.5 h-3.5 text-[var(--primary-btn)]" />
                      <span>Version History</span>
                    </div>
                    {onSaveSnapshot && (
                      <button
                        type="button"
                        onClick={() => {
                          onSaveSnapshot('Manual Checkpoint')
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[var(--primary-btn)] text-white hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                        title="Create a restore point snapshot"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Save Snapshot</span>
                      </button>
                    )}
                  </div>

                  {snapshots.length === 0 ? (
                    <div className="py-4 text-center space-y-1">
                      <p className="text-xs text-[var(--text-secondary)] font-medium">
                        No snapshots saved yet
                      </p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">
                        Click <strong>Save Snapshot</strong> to pin a restore point.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                      {snapshots.map((snap) => {
                        const date = new Date(snap.timestamp)
                        const timeStr = date.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                        const dateStr = date.toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })
                        return (
                          <div
                            key={snap.id}
                            className="group flex items-center justify-between p-2 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 hover:bg-[var(--hover-bg)] transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-xs font-medium text-[var(--text-primary)] truncate">
                                {snap.label}
                              </div>
                              <div className="text-[10px] font-mono text-[var(--text-tertiary)]">
                                {dateStr} at {timeStr} · {snap.nodes.length} nodes
                              </div>
                            </div>
                            {onRestoreSnapshot && (
                              <button
                                type="button"
                                onClick={() => {
                                  onRestoreSnapshot(snap)
                                  setShowHistoryMenu(false)
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-[4px] bg-[var(--bg-primary)] border border-[var(--border-default)] text-[10px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-all cursor-pointer shrink-0 shadow-2xs"
                                title="Restore this version (with Undo support)"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                                <span>Restore</span>
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
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
              className="py-1.5 px-3 sm:px-3.5 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-gray-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] shadow-xl py-1.5 z-50 text-xs">
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
          </div>

          {/* ⋯ Menu for Notation Guide and Clear */}
          <div ref={moreMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setShowMoreMenu(!showMoreMenu)
                setShowExportMenu(false)
              }}
              className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
              title="More options (Notation Guide, Clear Canvas)"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] shadow-xl py-1.5 z-50 text-xs">
                {/* Import Diagram (.umly.json, .drawio) */}
                {onImportJson && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        importInputRef.current?.click()
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[var(--hover-bg)] flex items-center gap-2.5 text-[var(--text-primary)] cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                      <div className="flex flex-col">
                        <span className="font-medium">Import Diagram</span>
                        <span className="text-[10px] text-[var(--text-tertiary)]">
                          Open .umly.json or .drawio file
                        </span>
                      </div>
                    </button>
                    <input
                      ref={importInputRef}
                      type="file"
                      accept=".json,application/json,.drawio,.xml,text/xml,application/xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        if (file) {
                          setShowMoreMenu(false)
                          onImportJson(file)
                        }
                      }}
                    />
                  </>
                )}

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

                <div className="my-1 border-t border-[var(--border-subtle)]" />

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false)
                    onClearCanvas()
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--notion-red-bg)] flex items-center gap-2 text-[var(--notion-red-text)] cursor-pointer transition-colors"
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

      {/* New Project / Diagram Modal (Centralized New Project Flow) */}
      <NewDiagramModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={handleDiagramCreated}
      />
    </>
  )
}
