import { useEffect, useState } from 'react'
import type { GithubUser } from '../types/github'

/** Pause dans la frappe avant de déclencher un appel réseau. */
export const DEBOUNCE_MS = 350

const SEARCH_ENDPOINT = 'https://api.github.com/search/users'

const RATE_LIMIT_MESSAGE = 'GitHub rate limit reached, try again shortly'
const NETWORK_ERROR_MESSAGE = 'Network error, check your connection and try again'

/**
 * Union discriminée : le statut porte les données qui n'ont de sens que pour lui.
 * Impossible de représenter un état incohérent (« loading avec une erreur »…).
 */
export type SearchState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly users: readonly GithubUser[] }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'rate-limited'; readonly message: string }

const IDLE_STATE: SearchState = { status: 'idle' }

/** Un abort n'est pas une panne : on le distingue d'une vraie erreur réseau. */
function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

/**
 * GitHub répond 403 aussi bien pour un quota épuisé que pour un accès interdit.
 * Seul l'en-tête permet de trancher — d'où la vérification des deux conditions.
 */
function isRateLimited(response: Response): boolean {
  return (
    response.status === 403 &&
    response.headers.get('x-ratelimit-remaining') === '0'
  )
}

function isGithubUser(value: unknown): value is GithubUser {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate: Partial<Record<keyof GithubUser, unknown>> = value

  return (
    typeof candidate.id === 'number' &&
    typeof candidate.login === 'string' &&
    typeof candidate.avatar_url === 'string' &&
    typeof candidate.html_url === 'string'
  )
}

/**
 * `response.json()` renvoie `unknown` : rien ne garantit la forme au runtime.
 * On valide au lieu d'affirmer avec un `as`, qui ne serait qu'une promesse non tenue.
 */
function parseSearchResponse(payload: unknown): readonly GithubUser[] {
  if (typeof payload !== 'object' || payload === null || !('items' in payload)) {
    return []
  }

  const { items } = payload

  if (!Array.isArray(items)) {
    return []
  }

  const entries: readonly unknown[] = items

  return entries.filter(isGithubUser)
}

/** Renvoie `null` quand la requête a été annulée : il n'y a alors rien à afficher. */
async function requestUsers(
  query: string,
  signal: AbortSignal,
): Promise<SearchState | null> {
  try {
    const response = await fetch(
      `${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`,
      { signal, headers: { Accept: 'application/vnd.github+json' } },
    )

    if (isRateLimited(response)) {
      return { status: 'rate-limited', message: RATE_LIMIT_MESSAGE }
    }

    if (!response.ok) {
      return {
        status: 'error',
        message: `GitHub request failed (HTTP ${response.status})`,
      }
    }

    return { status: 'success', users: parseSearchResponse(await response.json()) }
  } catch (error) {
    if (isAbortError(error) || signal.aborted) {
      return null
    }

    return { status: 'error', message: NETWORK_ERROR_MESSAGE }
  }
}

/**
 * Recherche d'utilisateurs GitHub, debouncée et annulable.
 * Toute la logique réseau vit ici : l'UI ne reçoit qu'un état à afficher.
 */
export function useUserSearch(query: string): SearchState {
  const [state, setState] = useState<SearchState>(IDLE_STATE)
  const trimmedQuery = query.trim()

  useEffect(() => {
    if (trimmedQuery === '') {
      return
    }

    const controller = new AbortController()

    // La frappe suivante relance l'effet, donc annule ce timer : seule la
    // dernière frappe d'une rafale survit assez longtemps pour partir.
    const timeoutId = setTimeout(() => {
      setState({ status: 'loading' })

      void requestUsers(trimmedQuery, controller.signal).then((nextState) => {
        // Une réponse arrivée après l'annulation ne doit jamais écraser
        // l'état d'une recherche plus récente.
        if (nextState === null || controller.signal.aborted) {
          return
        }

        setState(nextState)
      })
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
    // Le trim est dans la dépendance : « octo » puis « octo  » ne relance rien.
  }, [trimmedQuery])

  // Champ vide = aucun résultat. Dérivé pendant le rendu plutôt que via un
  // setState dans l'effet, qui provoquerait un rendu en cascade.
  return trimmedQuery === '' ? IDLE_STATE : state
}
