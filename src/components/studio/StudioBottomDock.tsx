import React, { useRef } from 'react'
import { motion } from 'motion/react'
import {
  User,
  CircleDot,
  SquareDashed,
  StickyNote,
  Wand2,
  Command,
  HelpCircle,
} from 'lucide-react'

export type StudioElementKind = 'useCase' | 'actor' | 'boundary' | 'note'

interface StudioBottomDockProps {
  onAddNode: (type: StudioElementKind) => void
  onTidyLayout: () => void
  onOpenCommandPalette: () => void
  onOpenShortcuts: () => void
}

export const StudioBottomDock: React.FC<StudioBottomDockProps> = ({
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
  }> = [
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
      className="studio-bottom-dock absolute bottom-4 left-1/2 -translate-x-1/2 z-30 select-none flex items-center gap-1 p-1 rounded-[10px] bg-[var(--bg-primary)]/95 backdrop-blur-md border border-[var(--border-default)] shadow-xl text-xs font-sans whitespace-nowrap"
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
            className="group relative flex items-center gap-1.5 h-8 px-2.5 rounded-[7px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] active:scale-95 transition-all cursor-grab active:cursor-grabbing"
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
            <kbd className="text-[9px] font-mono px-1 py-0 rounded bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border border-[var(--border-subtle)] group-hover:border-[var(--border-default)]">
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
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-[7px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] active:scale-95 font-medium transition-all cursor-pointer"
      >
        <Wand2 className="w-3.5 h-3.5 text-[var(--primary-btn)]" />
        <span className="hidden sm:inline">Tidy</span>
      </button>

      {/* Command Palette (Cmd+K) */}
      <button
        type="button"
        onClick={onOpenCommandPalette}
        title="Command Palette (Cmd+K)"
        className="flex items-center gap-1 h-8 px-2 rounded-[7px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] active:scale-95 font-medium transition-all cursor-pointer"
      >
        <Command className="w-3.5 h-3.5" />
        <kbd className="text-[9px] font-mono px-1 py-0 rounded bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
          ⌘K
        </kbd>
      </button>

      {/* Keyboard Shortcuts (?) */}
      <button
        type="button"
        onClick={onOpenShortcuts}
        title="Keyboard Shortcuts (?)"
        className="w-8 h-8 flex items-center justify-center rounded-[7px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] active:scale-95 transition-all cursor-pointer"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}
