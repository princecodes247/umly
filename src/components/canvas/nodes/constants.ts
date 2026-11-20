import type { NodeAccentColor } from '../../../types/game'

export interface NodeAccentStyle {
  border: string
  bg: string
  bandBg: string
  text: string
}

export const NODE_ACCENT_STYLES: Record<NodeAccentColor, NodeAccentStyle> = {
  default: {
    border: 'var(--border-strong)',
    bg: 'var(--bg-primary)',
    bandBg: 'var(--bg-secondary)',
    text: 'var(--text-primary)',
  },
  blue: {
    border: 'var(--notion-blue-text)',
    bg: 'var(--notion-blue-bg)',
    bandBg: 'var(--notion-blue-bg)',
    text: 'var(--notion-blue-text)',
  },
  green: {
    border: 'var(--notion-green-text)',
    bg: 'var(--notion-green-bg)',
    bandBg: 'var(--notion-green-bg)',
    text: 'var(--notion-green-text)',
  },
  amber: {
    border: 'var(--notion-yellow-text)',
    bg: 'var(--notion-yellow-bg)',
    bandBg: 'var(--notion-yellow-bg)',
    text: 'var(--notion-yellow-text)',
  },
  purple: {
    border: 'var(--notion-purple-text)',
    bg: 'var(--notion-purple-bg)',
    bandBg: 'var(--notion-purple-bg)',
    text: 'var(--notion-purple-text)',
  },
  rose: {
    border: 'var(--notion-pink-text)',
    bg: 'var(--notion-pink-bg)',
    bandBg: 'var(--notion-pink-bg)',
    text: 'var(--notion-pink-text)',
  },
}

