import React, { useState, useRef } from 'react'
import {
  X,
  Plus,
  CircleDot,
  Boxes,
  Network,
  Workflow,
  GitCommit,
  CheckCircle2,
  FolderOpen,
  Database,
} from 'lucide-react'
import {
  createDiagramDraft,
  saveDiagramDraft,
  type DiagramType,
} from '../../lib/diagramStorage'
import { parseDiagramJson } from '../../lib/exportDiagram'
import { parseDrawioXml } from '../../lib/importDrawio'
import { DIAGRAM_TEMPLATES } from '../../data/templates'

interface NewDiagramModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (draftId: string) => void
}

interface DiagramTypeOption {
  type: DiagramType
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  status: 'available' | 'coming_soon'
}

const DIAGRAM_TYPES: DiagramTypeOption[] = [
  {
    type: 'use_case',
    name: 'Use Case Diagram',
    description:
      'Model system boundaries, external actors, user goals, and «include» / «extend» relationships.',
    icon: CircleDot,
    status: 'available',
  },
  {
    type: 'er',
    name: 'ER Diagram',
    description:
      'Model database entities, attributes, PK/FK keys, and Crow’s Foot cardinality relationships.',
    icon: Database,
    status: 'available',
  },
  {
    type: 'class',
    name: 'Class Diagram',
    description:
      'Model static structure: classes, attributes, operations, inheritance, and associations.',
    icon: Boxes,
    status: 'available',
  },
  {
    type: 'sequence',
    name: 'Sequence Diagram',
    description:
      'Model dynamic behavior and temporal message exchanges between object lifelines.',
    icon: Network,
    status: 'coming_soon',
  },
  {
    type: 'activity',
    name: 'Activity Diagram',
    description:
      'Model algorithmic workflows, business process decisions, parallel branches, and joins.',
    icon: Workflow,
    status: 'coming_soon',
  },
  {
    type: 'state_machine',
    name: 'State Machine Diagram',
    description:
      'Model discrete states, transitions, events, guards, and lifecycle states of entities.',
    icon: GitCommit,
    status: 'coming_soon',
  },
]

export const NewDiagramModal: React.FC<NewDiagramModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('New Use Case Diagram')
  const [selectedType, setSelectedType] = useState<DiagramType>('use_case')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleSelectType = (nextType: DiagramType) => {
    setSelectedType(nextType)
    setSelectedTemplate('blank')
    if (
      title === 'New Use Case Diagram' ||
      title === 'New ER Diagram' ||
      !title.trim()
    ) {
      setTitle(nextType === 'er' ? 'New ER Diagram' : 'New Use Case Diagram')
    }
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const draft = createDiagramDraft(title, selectedType, selectedTemplate)
    onClose()
    onCreated(draft.id)
  }

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const isDrawio =
          /\.(drawio|xml)$/i.test(file.name) ||
          text.trimStart().startsWith('<')

        if (isDrawio) {
          const fileTitle = file.name.replace(/\.(drawio|xml)$/i, '')
          const imported = await parseDrawioXml(text, fileTitle)
          if (imported && imported.nodes.length > 0) {
            const draft = createDiagramDraft(
              imported.title || fileTitle || 'Imported Draw.io Diagram',
              imported.diagramType
            )
            draft.nodes = imported.nodes
            draft.edges = imported.edges
            saveDiagramDraft(draft)
            onClose()
            onCreated(draft.id)
            return
          }
          alert(
            'Could not import Draw.io file. Please select a valid .drawio or .xml file.'
          )
          return
        }

        const parsed = parseDiagramJson(text)
        if (parsed) {
          const fileTitle = file.name.replace(/\.(umly\.)?json$/i, '')
          const hasUmlClass = parsed.nodes?.some((n) => n.type === 'umlClass')
          const hasErEntity = parsed.nodes?.some((n) => n.type === 'erEntity')
          const draft = createDiagramDraft(
            parsed.title || fileTitle || 'Imported Diagram',
            hasUmlClass ? 'class' : hasErEntity ? 'er' : 'use_case'
          )
          draft.nodes = parsed.nodes
          draft.edges = parsed.edges || []
          saveDiagramDraft(draft)
          onClose()
          onCreated(draft.id)
        } else {
          alert(
            'Invalid diagram file. Please select a valid .umly.json or .drawio file.'
          )
        }
      } catch (err) {
        console.error('Import error:', err)
        alert('Failed to read the diagram file.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[var(--bg-modal)] border border-[var(--border-default)] rounded-[8px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[var(--selection-bg)] text-[var(--primary-btn)] flex items-center justify-center text-sm font-semibold">
              📐
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Create New Project
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Start fresh, choose a starter template, or open an existing project file.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[4px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="p-5 overflow-y-auto space-y-5 text-xs font-sans">
          {/* Quick Option: Open Existing Project File */}
          <div className="space-y-2">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-between p-3 rounded-[6px] border border-dashed border-[var(--border-default)] bg-[var(--bg-secondary)]/50 hover:bg-[var(--hover-bg)] hover:border-[var(--primary-btn)] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-[5px] bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 group-hover:border-[var(--primary-btn)] transition-colors">
                  <FolderOpen className="w-4 h-4 text-[var(--primary-btn)]" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-[var(--text-primary)]">
                    Open Existing Project (.umly.json, .drawio)
                  </div>
                  <div className="text-[11px] text-[var(--text-tertiary)] truncate">
                    Import and edit a saved Umly or Draw.io diagram file from your computer
                  </div>
                </div>
              </div>
              <span className="text-xs font-medium text-[var(--primary-btn)] shrink-0 pl-2">
                Browse file...
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json,.drawio,.xml,text/xml,application/xml"
                className="hidden"
                onChange={handleFileImport}
              />
            </div>

            <div className="relative py-1 flex items-center">
              <div className="flex-1 border-t border-[var(--border-subtle)]" />
              <span className="px-2.5 text-[10px] font-mono text-[var(--text-tertiary)] uppercase bg-[var(--bg-modal)]">
                or configure a new diagram
              </span>
              <div className="flex-1 border-t border-[var(--border-subtle)]" />
            </div>
          </div>
          {/* Section 1: Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-primary)] block">
              1. Diagram Name
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Online Store Use Case, Payment Service Architecture"
              className="w-full px-3 py-2 rounded-[5px] border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-btn)] text-xs"
              required
            />
          </div>

          {/* Section 2: Choose Diagram Type */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-primary)]">
                2. Choose Diagram Type
              </label>
              <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
                OMG UML 2.5 Specification
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DIAGRAM_TYPES.map((dt) => {
                const Icon = dt.icon
                const isSelected = selectedType === dt.type
                const isAvailable = dt.status === 'available'

                return (
                  <button
                    key={dt.type}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => handleSelectType(dt.type)}
                    className={`p-3 rounded-[6px] border text-left flex flex-col justify-between transition-all ${
                      isSelected && isAvailable
                        ? 'border-[var(--primary-btn)] bg-[var(--selection-bg)] ring-1 ring-[var(--primary-btn)] shadow-xs'
                        : isAvailable
                          ? 'border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--hover-bg)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] opacity-55 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-[4px] ${
                            isSelected && isAvailable
                              ? 'bg-[var(--primary-btn)] text-white'
                              : 'bg-[var(--hover-bg-strong)] text-[var(--text-secondary)]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-xs text-[var(--text-primary)]">
                          {dt.name}
                        </span>
                      </div>

                      {isAvailable ? (
                        <span className="notion-tag notion-tag-blue text-[9px] uppercase font-mono font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="notion-tag notion-tag-gray text-[9px] uppercase font-mono">
                          Soon
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                      {dt.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 3: Choose Starting Template */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--text-primary)]">
                3. Choose Starting Canvas
              </label>
              <span className="text-[11px] text-[var(--text-tertiary)]">
                Start from scratch or a pre-built example
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DIAGRAM_TEMPLATES.filter(
                (t) =>
                  t.id === 'blank' ||
                  (t.diagramType || 'use_case') === selectedType
              ).map((tmpl) => {
                const isSelected = selectedTemplate === tmpl.id
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`p-2.5 rounded-[5px] border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-[var(--primary-btn)] bg-[var(--selection-bg)] ring-1 ring-[var(--primary-btn)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--hover-bg)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-[var(--text-primary)] truncate">
                        {tmpl.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary-btn)] shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--text-secondary)] line-clamp-2 leading-tight">
                      {tmpl.id === 'blank' ? 'Empty canvas' : `${tmpl.nodes.length} elements`}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="notion-btn px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="notion-btn notion-btn-primary px-5 py-2 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Diagram</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
