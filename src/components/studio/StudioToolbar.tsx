import React, { useState, useRef, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Undo2,
  Redo2,
  Download,
  Upload,
  Trash2,
  FolderOpen,
  ChevronDown,
  Check,
  FileCode,
  Image as ImageIcon,
  Sparkles,
  ArrowLeft,
  Copy,
  FileText,
} from 'lucide-react'
import { DIAGRAM_TEMPLATES } from '../../data/templates'

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
  onCopyImageToClipboard,
  onImportJson,
  isSaved = true,
}) => {
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(title)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const templatesMenuRef = useRef<HTMLDivElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTitleInput(title)
  }, [title])

  useEffect(() => {
    const handleOutside = (e: MouseEvent | PointerEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (
        templatesMenuRef.current &&
        !templatesMenuRef.current.contains(target)
      ) {
        setShowTemplatesMenu(false)
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(target)) {
        setShowExportMenu(false)
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
    <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-[6px] shadow-xs shrink-0 select-none">
      {/* Left: Back Link, New Draft, Title & Save Status */}
      <div className="flex items-center gap-2 min-w-0">
        <Link
          to="/"
          className="flex items-center gap-1 px-1.5 py-1 rounded-[4px] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors shrink-0"
          title="Return to Home Dashboard"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Dashboard</span>
        </Link>

        <div className="h-3.5 w-px bg-[var(--border-subtle)] shrink-0" />

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
            className="px-2 py-0.5 text-sm font-semibold rounded-[4px] border border-[var(--primary-btn)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none w-52"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setTitleInput(title)
              setIsEditingTitle(true)
            }}
            title="Click to rename diagram"
            className="text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--hover-bg)] px-2 py-0.5 rounded-[4px] transition-colors truncate max-w-[180px] sm:max-w-xs text-left cursor-pointer"
          >
            {title}
          </button>
        )}

        <span
          className="hidden lg:inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] shrink-0"
          title="Auto-saved to browser storage"
        >
          <Check className="w-3 h-3 text-[var(--notion-green-text)]" />
          {isSaved ? 'Saved' : 'Saving...'}
        </span>
      </div>

      {/* Right: Undo/Redo, Tidy, Templates, Export */}
      <div className="flex items-center gap-1">
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

        {/* Starter Templates Menu */}
        <div ref={templatesMenuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setShowTemplatesMenu(!showTemplatesMenu)
              setShowExportMenu(false)
            }}
            className="notion-btn py-1 px-2 text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#cb912f] dark:text-[#dcb14b]" />
            <span className="hidden sm:inline">Templates</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showTemplatesMenu && (
            <div className="absolute right-0 mt-1.5 w-64 rounded-[6px] bg-[var(--bg-primary)] border border-[var(--border-default)] shadow-lg py-1 z-50 text-xs">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] font-mono border-b border-[var(--border-subtle)]">
                Starter Templates
              </div>
              {DIAGRAM_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    setShowTemplatesMenu(false)
                    onLoadTemplate(tpl.id)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--hover-bg)] transition-colors flex flex-col gap-0.5 cursor-pointer"
                >
                  <span className="font-medium text-[var(--text-primary)]">
                    {tpl.name}
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)] line-clamp-1">
                    {tpl.description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export / Import Menu */}
        <div ref={exportMenuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setShowExportMenu(!showExportMenu)
              setShowTemplatesMenu(false)
            }}
            className="notion-btn py-1 px-2.5 text-xs"
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
                Diagram-as-Code & Project
              </div>
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
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false)
                  onExportJson()
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[var(--hover-bg)] flex items-center gap-2 text-[var(--text-primary)] cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>Save Project (.umly.json)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false)
                  fileInputRef.current?.click()
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[var(--hover-bg)] flex items-center gap-2 text-[var(--text-primary)] cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>Open Project (.umly.json)</span>
              </button>

              <div className="my-1 border-t border-[var(--border-subtle)]" />
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false)
                  onClearCanvas()
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[var(--notion-red-bg)] flex items-center gap-2 text-[var(--notion-red-text)] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Canvas</span>
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
      </div>
    </div>
  )
}
