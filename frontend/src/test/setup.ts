// Étend `expect` avec les matchers DOM de jest-dom (toBeInTheDocument, toHaveTextContent…).
// L'entrée `/vitest` branche l'augmentation de types sur Vitest et non sur Jest.
import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Démonte l'arbre React entre deux tests : pas de fuite de DOM d'un test à l'autre.
afterEach(() => {
  cleanup()
})
