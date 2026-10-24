import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Keyboard } from 'lucide-react'

interface ShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const sections = [
    {
      title: 'Tools & Fast Creation',
      items: [
        { keys: ['Double-Click'], desc: 'Create Use Case at cursor & rename' },
        { keys: ['V'], desc: 'Select tool' },
        { keys: ['U'], desc: 'Use Case tool (click canvas to place)' },
        { keys: ['A'], desc: 'Actor tool (click canvas to place)' },
        { keys: ['B'], desc: 'System Boundary tool' },
        { keys: ['N'], desc: 'Note tool' },
        { keys: ['Tab'], desc: 'Create next connected element from selection' },
        { keys: ['Enter'], desc: 'Rename selected element inline' },
      ],
    },
    {
      title: 'Canvas & Manipulation',
      items: [
        { keys: ['⌘', 'K'], desc: 'Open Command Palette' },
        { keys: ['⌘', 'Z'], desc: 'Undo' },
        { keys: ['⌘', '⇧', 'Z'], desc: 'Redo' },
        { keys: ['⌘', 'D'], desc: 'Duplicate selected elements' },
        { keys: ['⌘', 'C / V'], desc: 'Copy & Paste selection' },
        { keys: ['⌘', '⇧', 'C'], desc: 'Copy diagram as PNG to clipboard' },
        { keys: ['↑ ↓ ← →'], desc: 'Nudge selection (Shift for 10px)' },
        { keys: ['Shift + Drag'], desc: 'Temporarily disable alignment snapping' },
        { keys: ['Space + Drag'], desc: 'Pan canvas' },
      ],
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
          onMouseDown={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ type: 'spring', stiffness: 460, damping: 28 }}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-[10px] bg-[var(--bg-primary)] border border-[var(--border-default)] shadow-2xl overflow-hidden font-sans text-xs"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 font-semibold text-sm text-[var(--text-primary)]">
                <Keyboard className="w-4 h-4 text-[var(--primary-btn)]" />
                <span>Keyboard Shortcuts & Workflow</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-[4px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-5 max-h-[75vh] overflow-y-auto">
              {sections.map((section) => (
                <div key={section.title} className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[var(--text-tertiary)]">
                    {section.title}
                  </div>
                  <div className="space-y-1.5">
                    {section.items.map((item) => (
                      <div
                        key={item.desc}
                        className="flex items-center justify-between gap-2 py-1 border-b border-[var(--border-subtle)]/60 last:border-0"
                      >
                        <span className="text-[var(--text-secondary)]">
                          {item.desc}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {item.keys.map((k) => (
                            <kbd
                              key={k}
                              className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] font-mono text-[10px] text-[var(--text-primary)]"
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

