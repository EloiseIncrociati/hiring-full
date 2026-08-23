import { useCallback, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

const LIGHT_QUERY = '(prefers-color-scheme: light)'

/**
 * Préférence système, avec repli sur le thème sombre — celui du design d'origine.
 * `matchMedia` est absent de certains environnements (jsdom sans polyfill, SSR),
 * d'où la vérification défensive plutôt qu'un appel direct.
 */
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

export function useTheme(): ThemeControls {
  // Initialiseur paresseux : la préférence système n'est lue qu'au premier rendu.
  const [theme, setTheme] = useState<Theme>(getPreferredTheme)

  // Le <html> est hors de l'arbre React : y écrire est une synchronisation avec
  // un système externe, exactement ce pour quoi useEffect existe.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}
