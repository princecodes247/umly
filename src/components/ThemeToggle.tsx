import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

type ThemeMode = 'light' | 'dark'

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const stored = window.localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function applyThemeMode(mode: ThemeMode) {
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(mode)
  document.documentElement.setAttribute('data-theme', mode)
  document.documentElement.style.colorScheme = mode
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('light')

  useEffect(() => {
    const initialMode = getInitialMode()
    setMode(initialMode)
    applyThemeMode(initialMode)
    if (
      window.localStorage.getItem('theme') !== 'light' &&
      window.localStorage.getItem('theme') !== 'dark'
    ) {
      window.localStorage.setItem('theme', initialMode)
    }

    const handleSync = () => {
      const next = getInitialMode()
      setMode(next)
      applyThemeMode(next)
    }

    window.addEventListener('storage', handleSync)
    window.addEventListener('umly-theme-change', handleSync)
    return () => {
      window.removeEventListener('storage', handleSync)
      window.removeEventListener('umly-theme-change', handleSync)
    }
  }, [])

  function toggleMode() {
    const nextMode: ThemeMode = mode === 'light' ? 'dark' : 'light'
    setMode(nextMode)
    applyThemeMode(nextMode)
    window.localStorage.setItem('theme', nextMode)
    window.dispatchEvent(new Event('umly-theme-change'))
  }

  const label =
    mode === 'dark'
      ? 'Theme: Dark. Click to switch to Light.'
      : 'Theme: Light. Click to switch to Dark.'

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-full text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors select-none cursor-pointer"
    >
      {mode === 'dark' ? (
        <Moon className="w-3.5 h-3.5" />
      ) : (
        <Sun className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline capitalize">{mode}</span>
    </button>
  )
}
