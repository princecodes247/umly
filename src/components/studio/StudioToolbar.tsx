import React, { useState, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Undo2,
  Redo2,
  Maximize2,
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
  Plus,
} from 'lucide-react'
import { DIAGRAM_TEMPLATES } from '../../data/templates'

interface StudioToolbarProps {
  title: string
  onTitleChange: (newTitle: string) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onFitView: () => void
  onClearCanvas: () => void
  onLoadTemplate: (templateId: string) => void
  onExportPng: () => void
  onExportSvg: () => void
  onExportJson: () => void
  onImportJson: (file: File) => void
  onNewDiagram?: () => void
  isSaved?: boolean
}

export const StudioToolbar: React.FC<StudioToolbarProps> = ({
  title,
  onTitleChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onFitView,
  onClearCanvas,
  onLoadTemplate,
  onExportPng,
  onExportSvg,
  onExportJson,
  onImportJson,
  onNewDiagram,
  isSaved = true,
}) => {
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(title)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

        {onNewDiagram && (
          <button
            type="button"
            onClick={onNewDiagram}
            className="flex items-center gap-1 px-2 py-1 rounded-[4px] text-xs font-medium bg-[var(--selection-bg)] text-[var(--primary-btn)] hover:opacity-90 transition-opacity shrink-0"
            title="Create another diagram draft"
          >
            <Plus className="w-3 h-3" />
            <span className="hidden sm:inline">New</span>
          </button>
        )}

        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            autoFocus
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleFinishTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFinishTitle()
              if (e.key === 'Escape') {
                setTitleInput(title)
                setIsEditingTitle(false)
              }
            }}
            className="text-xs font-semibold px-1.5 py-0.5 rounded-[3px] border border-[var(--primary-btn)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none w-48 sm:w-64"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setTitleInput(title)
              setIsEditingTitle(true)
            }}
            className="text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--hover-bg)] px-1.5 py-0.5 rounded-[3px] truncate max-w-[180px] sm:max-w-xs text-left"
            title="Click to rename diagram"
          >
            {title}
          </button>
        )}

        {/* Saved indicator */}
        <span
          className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] font-mono shrink-0"
          title="Diagram changes are auto-saved in local cache"
        >
          {isSaved ? (
            <>
              <Check className="w-3 h-3 text-[var(--notion-green-text)]" />
              <span className="hidden sm:inline">Saved</span>
            </>
          ) : (
            <span className="text-[var(--notion-yellow-text)]">Saving...</span>
          )}
        </span>
      </div>

      {/* Right Actions: Undo, Redo, Templates, Export, Import, Fit, Clear */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Undo & Redo */}
        <div className="flex items-center gap-0.5 mr-1 border-r border-[var(--border-subtle)] pr-1.5">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            title="Undo (⌘Z / Ctrl+Z)"
            className="p-1.5 rounded-[4px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            title="Redo (⌘⇧Z / Ctrl+Y)"
            className="p-1.5 rounded-[4px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Templates Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowTemplatesMenu(!showTemplatesMenu)
              setShowExportMenu(false)
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-[4px] text-xs font-medium border border-[var(--border-default)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Load starter diagram templates"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#cb912f] dark:text-[#dcb14b]" />
            <span className="hidden sm:inline">Templates</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showTemplatesMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-64 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[6px] shadow-lg py-1 z-50 text-xs"
              onMouseLeave={() => setShowTemplatesMenu(false)}
            >
              <div className="px-3 py-1 font-semibold text-[10px] uppercase font-mono text-[var(--text-tertiary)] border-b border-[var(--border-subtle)]">
                Starter Diagrams
              </div>
              {DIAGRAM_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => {
                    setShowTemplatesMenu(false)
                    onLoadTemplate(tmpl.id)
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[var(--hover-bg)] transition-colors flex flex-col"
                >
                  <span className="font-medium text-[var(--text-primary)]">
                    {tmpl.name}
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] line-clamp-1">
                    {tmpl.description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowExportMenu(!showExportMenu)
              setShowTemplatesMenu(false)
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-[4px] text-xs font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3 opacity-75" />
          </button>

          {showExportMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-44 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[6px] shadow-lg py-1 z-50 text-xs"
              onMouseLeave={() => setShowExportMenu(false)}
            >
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false)
                  onExportPng()
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[var(--hover-bg)] flex items-center gap-2 text-[var(--text-primary)]"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[var(--notion-blue-text)]" />
                <span>Download PNG</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false)
                  onExportSvg()
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[var(--hover-bg)] flex items-center gap-2 text-[var(--text-primary)]"
              >
                <FileCode className="w-3.5 h-3.5 text-[var(--notion-green-text)]" />
                <span>Download SVG</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false)
                  onExportJson()
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[var(--hover-bg)] flex items-center gap-2 text-[var(--text-primary)]"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[var(--notion-purple-text)]" />
                <span>Download .umly JSON</span>
              </button>
            </div>
          )}
        </div>

        {/* Import JSON button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Load diagram from .umly JSON file"
          className="p-1.5 rounded-[4px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.umly"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              onImportJson(file)
              e.target.value = ''
            }
          }}
        />

        {/* Fit View */}
        <button
          type="button"
          onClick={onFitView}
          title="Fit diagram into view"
          className="p-1.5 rounded-[4px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Clear Canvas */}
        <button
          type="button"
          onClick={onClearCanvas}
          title="Clear all elements from canvas"
          className="p-1.5 rounded-[4px] text-[var(--text-secondary)] hover:text-[var(--notion-red-text)] hover:bg-[var(--notion-red-bg)] transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
