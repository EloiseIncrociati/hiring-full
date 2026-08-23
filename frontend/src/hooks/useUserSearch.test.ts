import { act, renderHook } from '@testing-library/react'
import { buildUser, jsonResponse } from '../test/helpers'
import { DEBOUNCE_MS, useUserSearch } from './useUserSearch'

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>

beforeEach(() => {
  vi.useFakeTimers()
  fetchMock = vi.fn<typeof fetch>()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

/** Fait avancer le temps simulé ET vide la file de microtâches (promesses). */
async function advance(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

function renderSearch(initialQuery: string) {
  return renderHook(({ query }) => useUserSearch(query), {
    initialProps: { query: initialQuery },
  })
}

describe('useUserSearch', () => {
  it('reste idle et ne déclenche aucun appel pour une requête vide', async () => {
    const { result } = renderSearch('   ')

    await advance(DEBOUNCE_MS)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.status).toBe('idle')
  })

  it("n'émet qu'un seul appel pour une rafale de frappe (debounce)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [] }))

    const { rerender } = renderSearch('')

    for (const query of ['o', 'oc', 'oct', 'octo']) {
      rerender({ query })
    }

    // Juste avant l'échéance : le timer de la dernière frappe n'a pas encore expiré.
    await advance(DEBOUNCE_MS - 1)
    expect(fetchMock).not.toHaveBeenCalled()

    await advance(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // Et c'est bien la dernière valeur saisie qui part, pas une intermédiaire.
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('q=octo')
  })

  it('expose les utilisateurs renvoyés en statut success', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ items: [buildUser('octocat', 1), buildUser('defunkt', 2)] }),
    )

    const { result } = renderSearch('octo')

    await advance(DEBOUNCE_MS)

    expect(result.current).toEqual({
      status: 'success',
      users: [buildUser('octocat', 1), buildUser('defunkt', 2)],
    })
  })

  it('passe le signal à fetch et abandonne la requête en vol à la frappe suivante', async () => {
    // Promesse jamais résolue : la requête reste « en vol » pour toute la durée du test.
    fetchMock.mockReturnValue(new Promise<Response>(() => {}))

    const { rerender } = renderSearch('octo')

    await advance(DEBOUNCE_MS)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const signal = fetchMock.mock.calls[0]?.[1]?.signal
    expect(signal).toBeInstanceOf(AbortSignal)
    expect(signal?.aborted).toBe(false)

    rerender({ query: 'octoc' })

    expect(signal?.aborted).toBe(true)
  })

  it('abandonne la requête en vol au démontage', async () => {
    fetchMock.mockReturnValue(new Promise<Response>(() => {}))

    const { unmount } = renderSearch('octo')

    await advance(DEBOUNCE_MS)

    const signal = fetchMock.mock.calls[0]?.[1]?.signal
    expect(signal?.aborted).toBe(false)

    unmount()

    expect(signal?.aborted).toBe(true)
  })

  it("ne bascule pas en erreur quand l'annulation rejette avec AbortError", async () => {
    fetchMock.mockImplementation(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'))
          })
        }),
    )

    const { result, rerender } = renderSearch('octo')

    await advance(DEBOUNCE_MS)
    expect(result.current.status).toBe('loading')

    // Annule la première requête ; son rejet ne doit pas remonter comme une panne.
    rerender({ query: 'octoc' })
    await advance(DEBOUNCE_MS)

    expect(result.current.status).not.toBe('error')
  })
})
