// Use the Vitest entry point for jest-dom matchers.
import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom does not provide matchMedia.
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
  // Unmounts the React tree between tests so no DOM leaks from one into the next.
  cleanup()
  // Theme state lives outside the React tree.
  delete document.documentElement.dataset.theme
})
