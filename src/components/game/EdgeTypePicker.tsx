import React from 'react'
import type { UmlRelationshipType } from '../../types/game'
import {
  Link2,
  ArrowRight,
  CornerUpLeft,
  Share2,
} from 'lucide-react'

interface EdgeTypePickerProps {
  activeType: UmlRelationshipType
  onChange: (type: UmlRelationshipType) => void
}

export const EdgeTypePicker: React.FC<EdgeTypePickerProps> = ({
  activeType,
  onChange,
}) => {
  const tools: Array<{
    type: UmlRelationshipType
    label: string
    sublabel: string
    badge: string
    icon: React.ReactNode
    description: string
  }> = [
    {
      type: 'association',
      label: 'Association',
      sublabel: 'Actor ── UC',
      badge: 'Solid',
      icon: <Link2 className="w-3.5 h-3.5" />,
      description: 'Communication link between an Actor and a Use Case',
    },
    {
      type: 'include',
      label: '«include»',
      sublabel: 'Base ──► Sub',
      badge: 'Mandatory',
      icon: <ArrowRight className="w-3.5 h-3.5 text-[#337ea9] dark:text-[#5e87c9]" />,
      description: 'Mandatory sub-flow required by the base use case',
    },
    {
      type: 'extend',
      label: '«extend»',
      sublabel: 'Extension ──► Base',
      badge: 'Optional',
      icon: <CornerUpLeft className="w-3.5 h-3.5 text-[#cb912f] dark:text-[#dcb14b]" />,
      description: 'Optional / conditional enhancement pointing back to base',
    },
    {
      type: 'generalization',
      label: 'Generalization',
      sublabel: 'Child ──► Parent',
      badge: 'Inherits',
      icon: <Share2 className="w-3.5 h-3.5 text-[#448361] dark:text-[#529e72]" />,
      description: 'Inheritance/specialization between actors or use cases',
    },
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[6px] shadow-sm select-none">
      <span className="hidden xl:inline text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] px-2">
        Connector:
      </span>
      {tools.map((t) => {
        const isActive = activeType === t.type
        return (
          <button
            key={t.type}
            type="button"
            onClick={() => onChange(t.type)}
            className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] text-xs font-medium transition-all ${
              isActive
                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-xs font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
            }`}
            title={`${t.label}: ${t.description}`}
          >
            {t.icon}
            <div className="flex items-baseline gap-1 text-left">
              <span>{t.label}</span>
              <span
                className={`text-[10px] opacity-70 hidden sm:inline ${
                  isActive ? 'text-[var(--bg-primary)]' : 'text-[var(--text-tertiary)]'
                }`}
              >
                ({t.badge})
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
