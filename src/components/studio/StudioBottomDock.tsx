import React, { useRef } from 'react'
import { motion } from 'motion/react'
import {
  User,
  CircleDot,
  SquareDashed,
  StickyNote,
  Table2,
  Boxes,
  Cpu,
  HardDrive,
  SquareUser,
  Wand2,
  Command,
  HelpCircle,
} from 'lucide-react'
import type { DiagramType } from '../../lib/diagramStorage'

export type StudioElementKind =
  | 'useCase'
  | 'actor'
  | 'boundary'
  | 'note'
  | 'erEntity'
  | 'umlClass'
  | 'dfdProcess'
  | 'dfdDataStore'
  | 'dfdExternalEntity'

interface StudioBottomDockProps {
  diagramType?: DiagramType
  onAddNode: (type: StudioElementKind) => void
  onTidyLayout: () => void
  onOpenCommandPalette: () => void
  onOpenShortcuts: () => void
}

export const StudioBottomDock: React.FC<StudioBottomDockProps> = ({
  diagramType = 'use_case',
  onAddNode,
  onTidyLayout,
  onOpenCommandPalette,
  onOpenShortcuts,
}) => {
  const didDragRef = useRef(false)

  const items: Array<{
    id: StudioElementKind
    label: string
    shortcut: string
    icon: React.ReactNode
  }> =
    diagramType === 'er'
      ? [
          {
            id: 'erEntity',
            label: 'Entity',
            shortcut: 'E',
            icon: <Table2 className="w-3.5 h-3.5 text-[#2383e2]" />,
          },
          {
            id: 'boundary',
            label: 'Schema',
            shortcut: 'B',
            icon: <SquareDashed className="w-3.5 h-3.5 text-[#9065b0]" />,
          },
          {
            id: 'note',
            label: 'Note',
            shortcut: 'N',
            icon: <StickyNote className="w-3.5 h-3.5 text-[#cb912f]" />,
          },
        ]
      : diagramType === 'class'
      ? [
          {
            id: 'umlClass',
            label: 'Class',
            shortcut: 'C',
            icon: <Boxes className="w-3.5 h-3.5 text-[#2383e2]" />,
          },
          {
            id: 'boundary',
            label: 'Package',
            shortcut: 'B',
            icon: <SquareDashed className="w-3.5 h-3.5 text-[#9065b0]" />,
          },
          {
            id: 'note',
            label: 'Note',
            shortcut: 'N',
            icon: <StickyNote className="w-3.5 h-3.5 text-[#cb912f]" />,
          },
        ]
      : diagramType === 'dfd'
      ? [
          {
            id: 'dfdProcess',
            label: 'Process',
            shortcut: 'P',
            icon: <Cpu className="w-3.5 h-3.5 text-[#2383e2]" />,
          },
          {
            id: 'dfdDataStore',
            label: 'Data Store',
            shortcut: 'D',
            icon: <HardDrive className="w-3.5 h-3.5 text-[#448361]" />,
          },
          {
            id: 'dfdExternalEntity',
            label: 'External',
            shortcut: 'E',
            icon: <SquareUser className="w-3.5 h-3.5 text-[#9065b0]" />,
          },
          {
            id: 'note',
            label: 'Note',
            shortcut: 'N',
            icon: <StickyNote className="w-3.5 h-3.5 text-[#cb912f]" />,
          },
        ]
      : [
          {
            id: 'useCase',
            label: 'Use Case',
            shortcut: 'U',
            icon: <CircleDot className="w-3.5 h-3.5 text-[#2383e2]" />,
          },
          {
            id: 'actor',
            label: 'Actor',
            shortcut: 'A',
            icon: <User className="w-3.5 h-3.5 text-[var(--primary-btn)]" />,
          },
          {
            id: 'boundary',
            label: 'Boundary',
            shortcut: 'B',
            icon: <SquareDashed className="w-3.5 h-3.5 text-[#9065b0]" />,
          },
          {
            id: 'note',
            label: 'Note',
            shortcut: 'N',
            icon: <StickyNote className="w-3.5 h-3.5 text-[#cb912f]" />,
          },
        ]

  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    nodeType: StudioElementKind
  ) => {
    didDragRef.current = true
    e.dataTransfer.setData('application/umly-node-type', nodeType)
    e.dataTransfer.setData('text/plain', nodeType)
    e.dataTransfer.effectAllowed = 'copyMove'
  }

  const handleDragEnd = () => {
    setTimeout(() => {
      didDragRef.current = false
    }, 50)
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      className="studio-bottom-dock absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 select-none flex items-center gap-0.5 sm:gap-1 p-1 max-w-[calc(100vw-1.5rem)] overflow-x-auto no-scrollbar rounded-2xl bg-[var(--bg-primary)]/95 backdrop-blur-md border border-[var(--border-default)] shadow-xl text-xs font-sans whitespace-nowrap"
    >
      {/* Click to auto-drop onto canvas, or drag directly to any spot */}
      <div className="flex items-center gap-0.5">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            draggable
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragEnd={handleDragEnd}
            onClick={() => {
              if (didDragRef.current) return
              onAddNode(item.id)
            }}
            title={`${item.label} (${item.shortcut}) — Click to drop on canvas, or drag to position`}
            className="group relative flex items-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-xl font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] active:scale-95 transition-all cursor-grab active:cursor-grabbing shrink-0"
          >
            {item.icon}
            <span className="text-[11px] sm:text-xs font-medium">{item.label}</span>
            <kbd className="hidden sm:inline-block text-[9px] font-mono px-1 py-0 rounded bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border border-[var(--border-subtle)] group-hover:border-[var(--border-default)]">
              {item.shortcut}
            </kbd>
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-[var(--border-default)] mx-0.5 shrink-0" />

      {/* One-Click Tidy Up Layout */}
      <button
        type="button"
        onClick={onTidyLayout}
        title="Tidy Up Layout — Auto-arrange actors, use cases, and system boundary"
        className="flex items-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] active:scale-95 font-medium transition-all cursor-pointer shrink-0"
      >
        <Wand2 className="w-3.5 h-3.5 text-[var(--primary-btn)]" />
        <span className="hidden sm:inline">Tidy</span>
      </button>

      {/* Command Palette (Cmd+K) */}
      <button
        type="button"
        onClick={onOpenCommandPalette}
        title="Command Palette (Cmd+K)"
        className="flex items-center gap-1 h-8 px-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] active:scale-95 font-medium transition-all cursor-pointer shrink-0"
      >
        <Command className="w-3.5 h-3.5" />
        <kbd className="hidden sm:inline-block text-[9px] font-mono px-1 py-0 rounded bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
          ⌘K
        </kbd>
      </button>

      {/* Keyboard Shortcuts (?) */}
      <button
        type="button"
        onClick={onOpenShortcuts}
        title="Keyboard Shortcuts (?)"
        className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] active:scale-95 transition-all cursor-pointer shrink-0"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}
