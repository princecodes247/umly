import React, { useState, useRef, useEffect } from 'react'
import {
  User,
  CircleDot,
  SquareDashed,
  StickyNote,
  ChevronDown,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ShieldAlert,
} from 'lucide-react'
import type { UmlRelationshipType } from '../../types/game'

interface StudioBottomDockProps {
  activeRelationshipType: UmlRelationshipType
  onRelationshipTypeChange: (type: UmlRelationshipType) => void
  onAddNode: (
    type: 'actor' | 'useCase' | 'boundary' | 'note',
    options?: { actorType?: 'primary' | 'secondary' | 'system' }
  ) => void
  onFitView: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
}

export const StudioBottomDock: React.FC<StudioBottomDockProps> = ({
  activeRelationshipType,
  onRelationshipTypeChange,
  onAddNode,
  onFitView,
  onZoomIn,
  onZoomOut,
}) => {
  const [showActorPopover, setShowActorPopover] = useState(false)
  const [showConnectorPopover, setShowConnectorPopover] = useState(false)
  const dockRef = useRef<HTMLDivElement>(null)

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setShowActorPopover(false)
        setShowConnectorPopover(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const relationshipTypes: Array<{
    type: UmlRelationshipType
    name: string
    badge: string
    description: string
  }> = [
    {
      type: 'association',
      name: 'Association',
      badge: '—',
      description: 'Solid line connecting external Actor to Use Case',
    },
    {
      type: 'include',
      name: '«include»',
      badge: '«inc»',
      description: 'Base use case mandatorily includes another sub-case',
    },
    {
      type: 'extend',
      name: '«extend»',
      badge: '«ext»',
      description: 'Optional extension pointing to the base use case',
    },
    {
      type: 'generalization',
      name: 'Generalization',
      badge: '—▷',
      description: 'Inheritance/specialization between actors or use cases',
    },
  ]

  const currentRelationship =
    relationshipTypes.find((r) => r.type === activeRelationshipType) ||
    relationshipTypes[0]

  return (
    <div
      ref={dockRef}
      className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 select-none flex items-center gap-1.5 p-1.5 rounded-[10px] bg-[var(--bg-primary)]/95 backdrop-blur-md border border-[var(--border-default)] shadow-xl text-xs font-sans transition-all"
    >
      {/* SECTION 1: ADD ELEMENT GROUP */}
      <div className="flex items-center gap-1">
        {/* Add Actor Button + Popover */}
        <div className="relative">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => onAddNode('actor', { actorType: 'primary' })}
              title="Add Primary Actor (User / Customer)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-l-[6px] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] font-medium transition-colors"
            >
              <User className="w-3.5 h-3.5 text-[var(--primary-btn)]" />
              <span>Actor</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowActorPopover(!showActorPopover)
                setShowConnectorPopover(false)
              }}
              className="px-1 py-1.5 rounded-r-[6px] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] border-l border-[var(--border-subtle)]"
              title="Actor Classification Options"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Actor Types Popover */}
          {showActorPopover && (
            <div className="absolute bottom-full mb-2 left-0 w-52 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[8px] shadow-2xl p-1 z-50 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="px-2.5 py-1 text-[10px] uppercase font-mono font-semibold text-[var(--text-tertiary)] border-b border-[var(--border-subtle)] mb-1">
                Actor Classification
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowActorPopover(false)
                  onAddNode('actor', { actorType: 'primary' })
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-[4px] hover:bg-[var(--hover-bg)] flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[var(--primary-btn)]" />
                  <span className="font-medium text-[var(--text-primary)]">
                    Primary Actor
                  </span>
                </div>
                <span className="notion-tag notion-tag-blue text-[9px] uppercase font-mono">
                  User
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowActorPopover(false)
                  onAddNode('actor', { actorType: 'secondary' })
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-[4px] hover:bg-[var(--hover-bg)] flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-[var(--notion-orange-text)]" />
                  <span className="font-medium text-[var(--text-primary)]">
                    Secondary Actor
                  </span>
                </div>
                <span className="notion-tag notion-tag-orange text-[9px] uppercase font-mono">
                  Support
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowActorPopover(false)
                  onAddNode('actor', { actorType: 'system' })
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-[4px] hover:bg-[var(--hover-bg)] flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[var(--notion-purple-text)]" />
                  <span className="font-medium text-[var(--text-primary)]">
                    External System
                  </span>
                </div>
                <span className="notion-tag notion-tag-purple text-[9px] uppercase font-mono">
                  API
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Add Use Case */}
        <button
          type="button"
          onClick={() => onAddNode('useCase')}
          title="Add Use Case Oval"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] font-medium transition-colors"
        >
          <CircleDot className="w-3.5 h-3.5 text-[var(--notion-blue-text)]" />
          <span>Use Case</span>
        </button>

        {/* Add Boundary */}
        <button
          type="button"
          onClick={() => onAddNode('boundary')}
          title="Add System Boundary"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] font-medium transition-colors"
        >
          <SquareDashed className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          <span className="hidden sm:inline">Boundary</span>
        </button>

        {/* Add Note */}
        <button
          type="button"
          onClick={() => onAddNode('note')}
          title="Add Note / Constraint"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] font-medium transition-colors"
        >
          <StickyNote className="w-3.5 h-3.5 text-[#cb912f] dark:text-[#dcb14b]" />
          <span className="hidden sm:inline">Note</span>
        </button>
      </div>

      <div className="h-5 w-px bg-[var(--border-default)] mx-0.5" />

      {/* SECTION 2: ACTIVE CONNECTOR TOOL POPOVER */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowConnectorPopover(!showConnectorPopover)
            setShowActorPopover(false)
          }}
          title="Active Relationship Tool. Click to change."
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--hover-bg-strong)] text-[var(--text-primary)] font-medium transition-colors"
        >
          <span className="font-mono text-xs font-semibold text-[var(--primary-btn)]">
            {currentRelationship.badge}
          </span>
          <span className="font-semibold text-xs">{currentRelationship.name}</span>
          <ChevronDown className="w-3 h-3 text-[var(--text-tertiary)]" />
        </button>

        {/* Connector Types Popover */}
        {showConnectorPopover && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[8px] shadow-2xl p-1 z-50 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-2.5 py-1 text-[10px] uppercase font-mono font-semibold text-[var(--text-tertiary)] border-b border-[var(--border-subtle)] mb-1 flex items-center justify-between">
              <span>Connector Type</span>
              <span>UML 2.5</span>
            </div>

            <div className="space-y-0.5">
              {relationshipTypes.map((rel) => {
                const isActive = rel.type === activeRelationshipType
                return (
                  <button
                    key={rel.type}
                    type="button"
                    onClick={() => {
                      onRelationshipTypeChange(rel.type)
                      setShowConnectorPopover(false)
                    }}
                    className={`w-full text-left p-2 rounded-[5px] flex flex-col transition-colors ${
                      isActive
                        ? 'bg-[var(--selection-bg)] text-[var(--primary-btn)]'
                        : 'hover:bg-[var(--hover-bg)] text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-xs">{rel.name}</span>
                      <span className="font-mono text-xs font-bold opacity-75">
                        {rel.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--text-secondary)] leading-tight mt-0.5">
                      {rel.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="h-5 w-px bg-[var(--border-default)] mx-0.5" />

      {/* SECTION 3: CANVAS HELPERS & ZOOM */}
      <div className="flex items-center gap-0.5">
        {onZoomIn && (
          <button
            type="button"
            onClick={onZoomIn}
            title="Zoom In"
            className="p-1.5 rounded-[5px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        )}
        {onZoomOut && (
          <button
            type="button"
            onClick={onZoomOut}
            title="Zoom Out"
            className="p-1.5 rounded-[5px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={onFitView}
          title="Fit diagram into view"
          className="p-1.5 rounded-[5px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
