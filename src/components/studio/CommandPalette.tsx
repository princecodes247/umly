import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, CornerDownLeft } from 'lucide-react'

export interface CommandItem {
  id: string
  category: string
  label: string
  shortcut?: string
  icon: React.ReactNode
  onSelect: () => void
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  commands: CommandItem[]
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
}) => {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveIndex(0)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }, [isOpen])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    )
  }, [commands, query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (filtered.length > 0) {
        setActiveIndex((prev) => (prev + 1) % filtered.length)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (filtered.length > 0) {
        setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = filtered[activeIndex]
      if (item) {
        item.onSelect()
        onClose()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] px-4 bg-black/45 backdrop-blur-[2px]"
          onMouseDown={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 480, damping: 30 }}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            className="w-full max-w-lg rounded-[10px] bg-[var(--bg-primary)] border border-[var(--border-default)] shadow-2xl overflow-hidden font-sans text-xs"
          >
            {/* Search input */}
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-[var(--border-subtle)]">
              <Search className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search actions..."
                className="flex-1 bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
              />
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-tertiary)]">
                ESC
              </kbd>
            </div>

            {/* Command list */}
            <div className="max-h-80 overflow-y-auto p-1.5 space-y-0.5">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-[var(--text-tertiary)] text-xs">
                  No matching commands found.
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const isActive = idx === activeIndex
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => {
                        item.onSelect()
                        onClose()
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-[6px] text-left transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[var(--selection-bg)] text-[var(--primary-btn)]'
                          : 'text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[var(--text-secondary)] shrink-0">
                          {item.icon}
                        </span>
                        <span className="text-[10px] uppercase font-mono text-[var(--text-tertiary)] shrink-0">
                          {item.category}
                        </span>
                        <span className="font-medium truncate">
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.shortcut && (
                          <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)]">
                            {item.shortcut}
                          </kbd>
                        )}
                        {isActive && (
                          <CornerDownLeft className="w-3 h-3 opacity-70" />
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

