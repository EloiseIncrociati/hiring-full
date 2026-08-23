// Étend `expect` avec les matchers DOM de jest-dom (toBeInTheDocument, toHaveTextContent…).
// L'entrée `/vitest` branche l'augmentation de types sur Vitest et non sur Jest.
import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom n'implémente pas matchMedia. Sans ce stub, toute lecture de
// prefers-color-scheme lèverait « window.matchMedia is not a function ».
// `matches: false` = aucune préférence claire détectée → thème sombre par défaut.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

afterEach(() => {
  // Démonte l'arbre React entre deux tests : pas de fuite de DOM d'un test à l'autre.
  cleanup()

  // Le thème est posé sur <html>, hors de l'arbre React : `cleanup` ne l'efface pas.
  // Sans ce reset, un test qui bascule en clair contaminerait le suivant.
  delete document.documentElement.dataset.theme
})
