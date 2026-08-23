import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import {
  buildUser,
  forbiddenResponse,
  jsonResponse,
  rateLimitResponse,
} from './test/helpers'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubFetch(response: Response) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Rend l'app et saisit une requête dans le champ de recherche. */
async function search(query: string) {
  const user = userEvent.setup()

  render(<App />)

  await user.type(
    screen.getByRole('searchbox', { name: /search github users/i }),
    query,
  )
}

describe('App', () => {
  it("affiche le titre de l'application", () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /github user search/i }),
    ).toBeInTheDocument()
  })

  it('affiche les logins renvoyés par la recherche', async () => {
    stubFetch(
      jsonResponse({ items: [buildUser('octocat', 1), buildUser('defunkt', 2)] }),
    )

    await search('octo')

    expect(await screen.findByText('octocat')).toBeInTheDocument()
    expect(screen.getByText('defunkt')).toBeInTheDocument()
  })

  it('affiche « No users found » quand la recherche ne renvoie rien', async () => {
    stubFetch(jsonResponse({ items: [] }))

    await search('zzzzzz')

    expect(await screen.findByText('No users found')).toBeInTheDocument()
  })

  it('affiche le message de rate limit sur un 403 avec quota épuisé', async () => {
    stubFetch(rateLimitResponse())

    await search('octo')

    expect(
      await screen.findByText(/github rate limit reached, try again shortly/i),
    ).toBeInTheDocument()
  })

  it('traite un 403 sans quota épuisé comme une erreur générique', async () => {
    stubFetch(forbiddenResponse())

    await search('octo')

    expect(await screen.findByText(/github request failed \(http 403\)/i)).toBeInTheDocument()
  })

  it('affiche un message dédié quand le réseau échoue', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetchMock)

    await search('octo')

    expect(await screen.findByText(/network error/i)).toBeInTheDocument()
  })
})
