import React from 'react'
import { motion } from 'motion/react'
import {
  MousePointer2,
  User,
  CircleDot,
  SquareDashed,
  StickyNote,
  Wand2,
  Command,
  HelpCircle,
} from 'lucide-react'

export type StudioActiveTool =
  | 'select'
  | 'useCase'
  | 'actor'
  | 'boundary'
  | 'note'

interface StudioBottomDockProps {
  activeTool: StudioActiveTool
  onToolChange: (tool: StudioActiveTool) => void
  onTidyLayout: () => void
  onOpenCommandPalette: () => void
  onOpenShortcuts: () => void
}

export const StudioBottomDock: React.FC<StudioBottomDockProps> = ({
  activeTool,
  onToolChange,
  onTidyLayout,
  onOpenCommandPalette,
  onOpenShortcuts,
}) => {
  const tools: Array<{
    id: StudioActiveTool
    label: string
    shortcut: string
    draggable: boolean
    icon: React.ReactNode
  }> = [
    {
      id: 'select',
      label: 'Select',
      shortcut: 'V',
      draggable: false,
      icon: <MousePointer2 className="w-3.5 h-3.5" />,
    },
    {
      id: 'useCase',
      label: 'Use Case',
      shortcut: 'U',
      draggable: true,
      icon: <CircleDot className="w-3.5 h-3.5" />,
    },
    {
      id: 'actor',
      label: 'Actor',
      shortcut: 'A',
      draggable: true,
      icon: <User className="w-3.5 h-3.5" />,
    },
    {
      id: 'boundary',
      label: 'Boundary',
      shortcut: 'B',
      draggable: true,
      icon: <SquareDashed className="w-3.5 h-3.5" />,
    },
    {
      id: 'note',
      label: 'Note',
      shortcut: 'N',
      draggable: true,
      icon: <StickyNote className="w-3.5 h-3.5" />,
    },
  ]

  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    nodeType: StudioActiveTool
  ) => {
    if (nodeType === 'select') return
    e.dataTransfer.setData('application/umly-node-type', nodeType)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      className="studio-bottom-dock absolute bottom-4 left-1/2 -translate-x-1/2 z-30 select-none flex items-center gap-1 p-1 rounded-[10px] bg-[var(--bg-primary)]/95 backdrop-blur-md border border-[var(--border-default)] shadow-xl text-xs font-sans whitespace-nowrap"
    >
      {/* Direct-manipulation single-key tools (Click to select tool, or Drag onto canvas to place) */}
      <div className="flex items-center gap-0.5">
        {tools.map((t) => {
          const isActive = activeTool === t.id
          return (
            <motion.button
              key={t.id}
              type="button"
              draggable={t.draggable}
              onDragStart={(e) =>
                handleDragStart(
                  e as unknown as React.DragEvent<HTMLButtonElement>,
                  t.id
                )
              }
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onToolChange(t.id)}
              title={
                t.draggable
                  ? `${t.label} (${t.shortcut}) — Click then click canvas, or drag directly onto canvas`
                  : `${t.label} (${t.shortcut})`
              }
              className={`relative flex items-center gap-1.5 h-8 px-2.5 rounded-[7px] font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[var(--primary-btn)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
              }`}
            >
              {t.icon}
              <span className="text-xs font-medium">{t.label}</span>
              <kbd
                className={`text-[9px] font-mono px-1 py-0 rounded ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]'
                }`}
              >
                {t.shortcut}
              </kbd>
            </motion.button>
          )
        })}
      </div>

      <div className="h-5 w-px bg-[var(--border-default)] mx-0.5 shrink-0" />

      {/* One-Click Tidy Up Layout */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        onClick={onTidyLayout}
        title="Tidy Up Layout — Auto-arrange actors, use cases, and system boundary"
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-[7px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] font-medium transition-colors cursor-pointer"
      >
        <Wand2 className="w-3.5 h-3.5 text-[var(--primary-btn)]" />
        <span className="hidden sm:inline">Tidy</span>
      </motion.button>

      {/* Command Palette (Cmd+K) */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        onClick={onOpenCommandPalette}
        title="Command Palette (Cmd+K)"
        className="flex items-center gap-1 h-8 px-2 rounded-[7px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] font-medium transition-colors cursor-pointer"
      >
        <Command className="w-3.5 h-3.5" />
        <kbd className="text-[9px] font-mono px-1 py-0 rounded bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
          ⌘K
        </kbd>
      </motion.button>

      {/* Keyboard Shortcuts (?) */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        onClick={onOpenShortcuts}
        title="Keyboard Shortcuts (?)"
        className="w-8 h-8 flex items-center justify-center rounded-[7px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </motion.button>
    </motion.div>
  )
}
