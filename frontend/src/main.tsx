import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Explicit check instead of non-null assertion: it gives a clearer error if root is missing.
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Élément #root introuvable dans index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
