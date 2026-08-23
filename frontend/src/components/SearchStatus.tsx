import type { SearchState } from '../hooks/useUserSearch'
import styles from './SearchStatus.module.css'

type SearchStatusProps = {
  readonly state: SearchState
  /** Nombre d'items réellement affichés (après suppressions éventuelles). */
  readonly visibleCount: number
}

/**
 * Rend le switch exhaustif : ajouter un statut à `SearchState` sans le traiter ici
 * devient une erreur de compilation, pas un écran vide découvert en production.
 */
function assertNever(value: never): never {
  throw new Error(`Statut de recherche non géré : ${JSON.stringify(value)}`)
}

export function SearchStatus({ state, visibleCount }: SearchStatusProps) {
  switch (state.status) {
    case 'idle':
      return null

    // role="status" : annoncé par les lecteurs d'écran sans voler le focus.
    case 'loading':
      return (
        <p role="status" className={styles.message}>
          Searching…
        </p>
      )

    // role="alert" : interruption assumée, l'utilisateur doit agir.
    case 'error':
    case 'rate-limited':
      return (
        <p role="alert" className={styles.error}>
          {state.message}
        </p>
      )

    case 'success':
      if (visibleCount > 0) {
        // La grille est rendue par le parent : rien à annoncer ici.
        return null
      }

      // Deux causes distinctes pour un écran vide : l'API n'a rien trouvé,
      // ou l'utilisateur a supprimé lui-même tous les résultats.
      return (
        <p role="status" className={styles.message}>
          {state.users.length === 0 ? 'No users found' : 'All results removed'}
        </p>
      )

    default:
      return assertNever(state)
  }
}
