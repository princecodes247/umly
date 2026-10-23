import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Plus,
  User,
  CircleDot,
  SquareDashed,
  StickyNote,
  ChevronDown,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ShieldAlert,
  Cpu,
  Check,
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
  const [showAddPopover, setShowAddPopover] = useState(false)
  const [showConnectorPopover, setShowConnectorPopover] = useState(false)
  const dockRef = useRef<HTMLDivElement>(null)
  const addMenuRef = useRef<HTMLDivElement>(null)
  const connectorMenuRef = useRef<HTMLDivElement>(null)

  // Close popovers when clicking anywhere outside them (capture phase so React Flow pane/nodes cannot swallow the event) or pressing Escape
  useEffect(() => {
    const handleOutsideEvent = (e: MouseEvent | PointerEvent | TouchEvent) => {
      const target = e.target as Node | null
      if (!target) return

      if (
        addMenuRef.current &&
        !addMenuRef.current.contains(target)
      ) {
        setShowAddPopover(false)
      }

      if (
        connectorMenuRef.current &&
        !connectorMenuRef.current.contains(target)
      ) {
        setShowConnectorPopover(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddPopover(false)
        setShowConnectorPopover(false)
      }
    }

    document.addEventListener('pointerdown', handleOutsideEvent, true)
    document.addEventListener('mousedown', handleOutsideEvent, true)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handleOutsideEvent, true)
      document.removeEventListener('mousedown', handleOutsideEvent, true)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const elementItems: Array<{
    id: string
    label: string
    description: string
    badge: string
    badgeClass: string
    icon: React.ReactNode
    onSelect: () => void
  }> = [
    {
      id: 'useCase',
      label: 'Use Case',
      description: 'Functional system goal or capability oval',
      badge: 'Goal',
      badgeClass: 'notion-tag notion-tag-blue',
      icon: <CircleDot className="w-4 h-4 text-[var(--notion-blue-text)]" />,
      onSelect: () => onAddNode('useCase'),
    },
    {
      id: 'actor-primary',
      label: 'Primary Actor',
      description: 'Human user or principal role initiating a goal',
      badge: 'User',
      badgeClass: 'notion-tag notion-tag-blue',
      icon: <User className="w-4 h-4 text-[var(--primary-btn)]" />,
      onSelect: () => onAddNode('actor', { actorType: 'primary' }),
    },
    {
      id: 'actor-secondary',
      label: 'Secondary Actor',
      description: 'Supporting admin, reviewer, or back-office role',
      badge: 'Support',
      badgeClass: 'notion-tag notion-tag-orange',
      icon: (
        <ShieldAlert className="w-4 h-4 text-[var(--notion-orange-text)]" />
      ),
      onSelect: () => onAddNode('actor', { actorType: 'secondary' }),
    },
    {
      id: 'actor-system',
      label: 'External System',
      description: 'Third-party service, gateway, or external API',
      badge: 'API',
      badgeClass: 'notion-tag notion-tag-purple',
      icon: <Cpu className="w-4 h-4 text-[var(--notion-purple-text)]" />,
      onSelect: () => onAddNode('actor', { actorType: 'system' }),
    },
    {
      id: 'boundary',
      label: 'System Boundary',
      description: 'Container box that groups and moves inner use cases',
      badge: 'Scope',
      badgeClass: 'notion-tag notion-tag-gray',
      icon: <SquareDashed className="w-4 h-4 text-[var(--text-secondary)]" />,
      onSelect: () => onAddNode('boundary'),
    },
    {
      id: 'note',
      label: 'Note / Constraint',
      description: 'sticky annotation for rules or preconditions',
      badge: 'Note',
      badgeClass: 'notion-tag notion-tag-yellow',
      icon: (
        <StickyNote className="w-4 h-4 text-[#cb912f] dark:text-[#dcb14b]" />
      ),
      onSelect: () => onAddNode('note'),
    },
  ]

  const relationshipTypes: Array<{
    type: UmlRelationshipType
    name: string
    badge: string
    colorVar: string
    description: string
  }> = [
    {
      type: 'association',
      name: 'Association',
      badge: '—',
      colorVar: 'var(--text-primary)',
      description: 'Solid line connecting an Actor to a Use Case',
    },
    {
      type: 'include',
      name: '«include»',
      badge: '---▷',
      colorVar: 'var(--notion-blue-text)',
      description: 'Base use case mandatorily includes a sub-case',
    },
    {
      type: 'extend',
      name: '«extend»',
      badge: '⇠---',
      colorVar: 'var(--notion-yellow-text)',
      description: 'Conditional behavior extending a base use case',
    },
    {
      type: 'generalization',
      name: 'Generalization',
      badge: '—▷',
      colorVar: 'var(--notion-green-text)',
      description: 'Inheritance between specialized actors or use cases',
    },
  ]

  const currentRelationship =
    relationshipTypes.find((r) => r.type === activeRelationshipType) ||
    relationshipTypes[0]

  return (
    <motion.div
      ref={dockRef}
      initial={{ y: 24, opacity: 0, scale: 0.94 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="studio-bottom-dock absolute bottom-5 left-1/2 -translate-x-1/2 z-30 select-none flex items-center gap-1.5 p-1.5 rounded-[12px] bg-[var(--bg-primary)]/95 backdrop-blur-md border border-[var(--border-default)] shadow-2xl text-xs font-sans whitespace-nowrap"
    >
      {/* SECTION 1: SINGLE ICON BUTTON FOR ELEMENT CREATION + POPOVER */}
      <div ref={addMenuRef} className="relative">
        <motion.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          onClick={() => {
            setShowAddPopover((prev) => !prev)
            setShowConnectorPopover(false)
          }}
          title="Add Diagram Element"
          aria-label="Add Diagram Element"
          className={`flex items-center justify-center w-8 h-8 rounded-[8px] transition-colors cursor-pointer ${
            showAddPopover
              ? 'bg-[var(--primary-btn)] text-white shadow-sm'
              : 'bg-[var(--primary-btn)]/12 hover:bg-[var(--primary-btn)]/20 text-[var(--primary-btn)] border border-[var(--primary-btn)]/25'
          }`}
        >
          <motion.span
            animate={{ rotate: showAddPopover ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 450, damping: 22 }}
            className="flex items-center justify-center"
          >
            <Plus className="w-4 h-4 stroke-[2.25]" />
          </motion.span>
        </motion.button>

        {/* Add Element Popover */}
        <AnimatePresence>
          {showAddPopover && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.94, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 8, scale: 0.95, filter: 'blur(2px)' }}
              transition={{ type: 'spring', stiffness: 460, damping: 28 }}
              style={{ transformOrigin: 'bottom left' }}
              className="absolute bottom-full mb-2.5 left-0 w-72 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[10px] shadow-2xl p-1.5 z-50 text-xs whitespace-normal"
            >
              <div className="px-2.5 py-1.5 text-[10px] uppercase font-mono font-semibold text-[var(--text-tertiary)] border-b border-[var(--border-subtle)] mb-1 flex items-center justify-between">
                <span>Add UML Element</span>
                <span>Click to insert</span>
              </div>

              <div className="space-y-0.5">
                {elementItems.map((item, idx) => (
                  <motion.button
                    key={item.id}
                    type="button"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                      delay: idx * 0.025,
                    }}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      item.onSelect()
                      setShowAddPopover(false)
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-[7px] hover:bg-[var(--hover-bg)] flex items-start gap-2.5 transition-colors cursor-pointer group"
                  >
                    <div className="mt-0.5 p-1.5 rounded-[6px] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] group-hover:border-[var(--border-default)] transition-colors shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-[var(--text-primary)] whitespace-nowrap">
                          {item.label}
                        </span>
                        <span
                          className={`${item.badgeClass} text-[9px] uppercase font-mono shrink-0`}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-snug mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-5 w-px bg-[var(--border-default)] mx-0.5 shrink-0" />

      {/* SECTION 2: ACTIVE CONNECTOR TOOL POPOVER */}
      <div ref={connectorMenuRef} className="relative">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 450, damping: 26 }}
          onClick={() => {
            setShowConnectorPopover((prev) => !prev)
            setShowAddPopover(false)
          }}
          title="Active Relationship Tool. Click to switch connector type."
          className={`flex items-center gap-2 h-8 px-3 rounded-[8px] border font-medium transition-colors cursor-pointer whitespace-nowrap ${
            showConnectorPopover
              ? 'bg-[var(--selection-bg)] border-[var(--primary-btn)]/40 text-[var(--text-primary)]'
              : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] hover:bg-[var(--hover-bg-strong)] text-[var(--text-primary)]'
          }`}
        >
          <span
            className="font-mono text-xs font-bold whitespace-nowrap"
            style={{ color: currentRelationship.colorVar }}
          >
            {currentRelationship.badge}
          </span>
          <span className="font-semibold text-xs whitespace-nowrap">
            {currentRelationship.name}
          </span>
          <motion.span
            animate={{ rotate: showConnectorPopover ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            className="flex items-center text-[var(--text-tertiary)]"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.span>
        </motion.button>

        {/* Connector Types Popover */}
        <AnimatePresence>
          {showConnectorPopover && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.94, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 8, scale: 0.95, filter: 'blur(2px)' }}
              transition={{ type: 'spring', stiffness: 460, damping: 28 }}
              style={{ transformOrigin: 'bottom center' }}
              className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 w-68 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[10px] shadow-2xl p-1.5 z-50 text-xs whitespace-normal"
            >
              <div className="px-2.5 py-1.5 text-[10px] uppercase font-mono font-semibold text-[var(--text-tertiary)] border-b border-[var(--border-subtle)] mb-1 flex items-center justify-between">
                <span>Active Relationship Tool</span>
                <span>UML 2.5</span>
              </div>

              <div className="space-y-0.5">
                {relationshipTypes.map((rel, idx) => {
                  const isActive = rel.type === activeRelationshipType
                  return (
                    <motion.button
                      key={rel.type}
                      type="button"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                        delay: idx * 0.025,
                      }}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onRelationshipTypeChange(rel.type)
                        setShowConnectorPopover(false)
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-[7px] flex flex-col transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[var(--selection-bg)] text-[var(--primary-btn)]'
                          : 'hover:bg-[var(--hover-bg)] text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-mono text-xs font-bold whitespace-nowrap"
                            style={{ color: rel.colorVar }}
                          >
                            {rel.badge}
                          </span>
                          <span className="font-semibold text-xs whitespace-nowrap">
                            {rel.name}
                          </span>
                        </div>
                        {isActive && (
                          <Check className="w-3.5 h-3.5 text-[var(--primary-btn)] shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-[var(--text-secondary)] leading-snug mt-0.5">
                        {rel.description}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-5 w-px bg-[var(--border-default)] mx-0.5 shrink-0" />

      {/* SECTION 3: CANVAS HELPERS & ZOOM */}
      <div className="flex items-center gap-0.5">
        {onZoomIn && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            onClick={onZoomIn}
            title="Zoom In"
            className="w-8 h-8 flex items-center justify-center rounded-[7px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </motion.button>
        )}
        {onZoomOut && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            onClick={onZoomOut}
            title="Zoom Out"
            className="w-8 h-8 flex items-center justify-center rounded-[7px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </motion.button>
        )}
        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          onClick={onFitView}
          title="Fit diagram into view"
          className="w-8 h-8 flex items-center justify-center rounded-[7px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </motion.div>
  )
}
