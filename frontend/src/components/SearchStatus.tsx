import type { SearchState } from '../hooks/useUserSearch'
import styles from '../styles/SearchStatus.module.css'

type SearchStatusProps = {
  readonly state: SearchState
  // Items currently rendered after user actions.
  readonly visibleCount: number
}

// Keep status handling exhaustive.
function assertNever(value: never): never {
  throw new Error(`Statut de recherche non géré : ${JSON.stringify(value)}`)
}

export function SearchStatus({ state, visibleCount }: SearchStatusProps) {
  switch (state.status) {
    case 'idle':
      return null

    case 'loading':
      return (
        <p role="status" className={styles.message}>
          Searching…
        </p>
      )

    case 'error':
    case 'rate-limited':
      return (
        <p role="alert" className={styles.error}>
          {state.message}
        </p>
      )

    case 'success':
      if (visibleCount > 0) {
        return null
      }

      // Distinguish empty API results from user-deleted results.
      return (
        <p role="status" className={styles.message}>
          {state.users.length === 0 ? 'No users found' : 'All results removed'}
        </p>
      )

    default:
      return assertNever(state)
  }
}
