import { useEffect, useState } from 'react'
import type { GithubUser } from '../types/github'

// Debounce delay.
export const DEBOUNCE_MS = 350

const SEARCH_ENDPOINT = 'https://api.github.com/search/users'

const RATE_LIMIT_MESSAGE = 'GitHub rate limit reached, try again shortly'
const NETWORK_ERROR_MESSAGE = 'Network error, check your connection and try again'

// Search state is mutually exclusive by design.
export type SearchState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly users: readonly GithubUser[] }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'rate-limited'; readonly message: string }

const IDLE_STATE: SearchState = { status: 'idle' }

// Aborted requests are expected and should not surface as errors.
function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

// GitHub uses 403 for both rate limits and forbidden requests.
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

// Validate the API payload before using it.
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

// Returns `null` when the request was aborted.
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
 * Debounced, cancellable GitHub user search.
 *
 * All network concerns live here; the UI only ever receives a state to render.
 *
 * @param query Raw input value. Leading/trailing whitespace is ignored.
 * @returns The current search state; never throws.
 */
export function useUserSearch(query: string): SearchState {
  const [state, setState] = useState<SearchState>(IDLE_STATE)
  const trimmedQuery = query.trim()

  useEffect(() => {
    if (trimmedQuery === '') {
      return
    }

    const controller = new AbortController()

    // Debounce.
    const timeoutId = setTimeout(() => {
      setState({ status: 'loading' })

      void requestUsers(trimmedQuery, controller.signal).then((nextState) => {
        // Ignore stale or aborted requests.
        if (nextState === null || controller.signal.aborted) {
          return
        }

        setState(nextState)
      })
    }, DEBOUNCE_MS)

    // Cancels both the pending debounce and any in-flight request
    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
    
  }, [trimmedQuery])

  // Empty input has no search state to display.
  return trimmedQuery === '' ? IDLE_STATE : state
}
