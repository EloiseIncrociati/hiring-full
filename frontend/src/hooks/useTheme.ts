import { useCallback, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

const LIGHT_QUERY = '(prefers-color-scheme: light)'

// System preference with dark as the fallback.
function getPreferredTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'dark'
  }

  return window.matchMedia(LIGHT_QUERY).matches ? 'light' : 'dark'
}

export type ThemeControls = {
  readonly theme: Theme
  readonly toggleTheme: () => void
}

// Session-scoped light/dark theme.
export function useTheme(): ThemeControls {
  // Read the system preference on first render.
  const [theme, setTheme] = useState<Theme>(getPreferredTheme)

  // Sync the theme with the document.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}
