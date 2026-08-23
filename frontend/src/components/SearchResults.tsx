import type { SearchState } from '../hooks/useUserSearch'

type SearchResultsProps = {
  readonly state: SearchState
}

/**
 * Rend le switch exhaustif : ajouter un statut à `SearchState` sans le traiter ici
 * devient une erreur de compilation, pas un écran vide découvert en production.
 */
function assertNever(value: never): never {
  throw new Error(`Statut de recherche non géré : ${JSON.stringify(value)}`)
}

export function SearchResults({ state }: SearchResultsProps) {
  switch (state.status) {
    case 'idle':
      return null

    // role="status" : annoncé par les lecteurs d'écran sans voler le focus.
    case 'loading':
      return <p role="status">Searching…</p>

    // role="alert" : interruption assumée, l'utilisateur doit agir.
    case 'error':
    case 'rate-limited':
      return <p role="alert">{state.message}</p>

    case 'success':
      if (state.users.length === 0) {
        return <p role="status">No users found</p>
      }

      return (
        <ul className="results">
          {state.users.map((user) => (
            <li key={user.id}>{user.login}</li>
          ))}
        </ul>
      )

    default:
      return assertNever(state)
  }
}
