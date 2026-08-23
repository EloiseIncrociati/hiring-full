import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UserEvent } from '@testing-library/user-event'
import App from './App'
import { CONFIRM_TIMEOUT_MS } from './components/ActionBar'
import {
  buildUser,
  forbiddenResponse,
  jsonResponse,
  rateLimitResponse,
} from './test/helpers'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function stubFetch(response: Response) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Chaque appel construit une Response neuve : un corps ne se lit qu'une fois. */
function stubFetchSequence(...payloads: readonly unknown[]) {
  const fetchMock = vi.fn<typeof fetch>()

  for (const payload of payloads) {
    fetchMock.mockImplementationOnce(() => Promise.resolve(jsonResponse(payload)))
  }

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function search(query: string): Promise<UserEvent> {
  const user = userEvent.setup()

  render(<App />)

  await user.type(
    screen.getByRole('searchbox', { name: /search github users/i }),
    query,
  )

  return user
}

/** Rend l'app avec deux résultats et attend leur affichage. */
async function searchTwoUsers(): Promise<UserEvent> {
  stubFetch(jsonResponse({ items: [buildUser('octocat', 1), buildUser('defunkt', 2)] }))

  const user = await search('octo')
  await screen.findByText('octocat')

  return user
}

function selectAllCheckbox() {
  // `elements?` : le libellé se met au singulier à partir d'un seul élément.
  return screen.getByRole('checkbox', { name: /elements? selected/i })
}

function cardOf(login: string) {
  return screen.getByText(login).closest('li')
}

function duplicateButton() {
  return screen.getByRole('button', { name: /duplicate selected users/i })
}

function deleteButton() {
  return screen.getByRole('button', { name: /delete selected users/i })
}

function confirmDeleteButton() {
  return screen.getByRole('button', { name: /confirm delete/i })
}

/** Delete est en deux temps : armer, puis confirmer. */
async function confirmDelete(user: UserEvent) {
  await user.click(deleteButton())
  await user.click(confirmDeleteButton())
}

describe('App — recherche', () => {
  it("affiche le titre de l'application", () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /github user search/i }),
    ).toBeInTheDocument()
  })

  it('affiche les logins renvoyés par la recherche', async () => {
    await searchTwoUsers()

    expect(screen.getByText('octocat')).toBeInTheDocument()
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

    expect(
      await screen.findByText(/github request failed \(http 403\)/i),
    ).toBeInTheDocument()
  })

  it('affiche un message dédié quand le réseau échoue', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetchMock)

    await search('octo')

    expect(await screen.findByText(/network error/i)).toBeInTheDocument()
  })
})

describe('App — carte utilisateur', () => {
  it("affiche l'avatar, l'id et un lien vers le profil ouvert dans un nouvel onglet", async () => {
    await searchTwoUsers()

    const card = screen.getByText('octocat').closest('li')
    expect(card).not.toBeNull()

    const avatar = within(card!).getByRole('presentation', { hidden: true })
    expect(avatar).toHaveAttribute(
      'src',
      'https://avatars.githubusercontent.com/u/1',
    )

    expect(within(card!).getByText('1')).toBeInTheDocument()

    const link = within(card!).getByRole('link', { name: /view profile of octocat/i })
    expect(link).toHaveAttribute('href', 'https://github.com/octocat')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })
})

describe('App — sélection et actions', () => {
  it('met à jour le compteur au fil de la sélection', async () => {
    const user = await searchTwoUsers()

    expect(screen.getByText('0 elements selected')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Select octocat' }))
    expect(screen.getByText('1 element selected')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Select defunkt' }))
    expect(screen.getByText('2 elements selected')).toBeInTheDocument()
  })

  it('désactive les deux actions tant que rien n’est sélectionné', async () => {
    const user = await searchTwoUsers()

    expect(duplicateButton()).toBeDisabled()
    expect(deleteButton()).toBeDisabled()

    await user.click(screen.getByRole('checkbox', { name: 'Select octocat' }))

    expect(duplicateButton()).toBeEnabled()
    expect(deleteButton()).toBeEnabled()
  })

  it('reflète les trois états de la checkbox « tout sélectionner »', async () => {
    const user = await searchTwoUsers()

    expect(selectAllCheckbox()).not.toBeChecked()
    expect(selectAllCheckbox()).not.toBePartiallyChecked()

    await user.click(screen.getByRole('checkbox', { name: 'Select octocat' }))
    expect(selectAllCheckbox()).toBePartiallyChecked()

    await user.click(screen.getByRole('checkbox', { name: 'Select defunkt' }))
    expect(selectAllCheckbox()).toBeChecked()
    expect(selectAllCheckbox()).not.toBePartiallyChecked()
  })

  it('sélectionne puis désélectionne tout depuis la barre d’actions', async () => {
    const user = await searchTwoUsers()

    await user.click(selectAllCheckbox())
    expect(screen.getByText('2 elements selected')).toBeInTheDocument()

    await user.click(selectAllCheckbox())
    expect(screen.getByText('0 elements selected')).toBeInTheDocument()
  })

  it('duplique les cartes sélectionnées', async () => {
    const user = await searchTwoUsers()

    await user.click(screen.getByRole('checkbox', { name: 'Select octocat' }))
    await user.click(duplicateButton())

    expect(screen.getAllByText('octocat')).toHaveLength(2)
    expect(screen.getAllByText('defunkt')).toHaveLength(1)
    // La sélection reste sur l'original : la copie arrive décochée.
    expect(screen.getByText('1 element selected')).toBeInTheDocument()
  })

  it('traite deux copies du même compte comme deux lignes indépendantes', async () => {
    const user = await searchTwoUsers()

    await user.click(screen.getByRole('checkbox', { name: 'Select octocat' }))
    await user.click(duplicateButton())

    const copies = screen.getAllByRole('checkbox', { name: 'Select octocat' })
    expect(copies).toHaveLength(2)
    expect(copies[0]).toBeChecked()
    expect(copies[1]).not.toBeChecked()

    // Cocher la copie n'affecte pas l'original : identité par instance, pas par user.id.
    await user.click(copies[1]!)
    expect(screen.getByText('2 elements selected')).toBeInTheDocument()

    // Et décocher l'original laisse la copie sélectionnée.
    await user.click(copies[0]!)
    expect(screen.getByText('1 element selected')).toBeInTheDocument()
    expect(
      screen.getAllByRole('checkbox', { name: 'Select octocat' })[1],
    ).toBeChecked()
  })

  it('supprime les cartes sélectionnées', async () => {
    const user = await searchTwoUsers()

    await user.click(screen.getByRole('checkbox', { name: 'Select octocat' }))
    await confirmDelete(user)

    expect(screen.queryByText('octocat')).not.toBeInTheDocument()
    expect(screen.getByText('defunkt')).toBeInTheDocument()
    expect(screen.getByText('0 elements selected')).toBeInTheDocument()
  })

  it('repart d’une liste fraîche quand une nouvelle recherche aboutit', async () => {
    stubFetchSequence(
      { items: [buildUser('octocat', 1), buildUser('defunkt', 2)] },
      { items: [buildUser('mojombo', 3)] },
    )

    const user = await search('octo')
    await screen.findByText('octocat')

    // On modifie la liste : tout sélectionner, puis dupliquer.
    await user.click(selectAllCheckbox())
    await user.click(duplicateButton())
    expect(screen.getAllByText('octocat')).toHaveLength(2)

    // Nouvelle recherche : duplications et sélection doivent disparaître.
    await user.type(
      screen.getByRole('searchbox', { name: /search github users/i }),
      'mojo',
    )

    expect(await screen.findByText('mojombo')).toBeInTheDocument()
    expect(screen.queryByText('octocat')).not.toBeInTheDocument()
    expect(screen.getByText('0 elements selected')).toBeInTheDocument()
  })
})

describe('App — état vide', () => {
  it('distingue « tout supprimé » de « aucun résultat »', async () => {
    const user = await searchTwoUsers()

    await user.click(selectAllCheckbox())
    await confirmDelete(user)

    expect(screen.getByText('All results removed')).toBeInTheDocument()
    expect(screen.queryByText('No users found')).not.toBeInTheDocument()
  })

  it('affiche à nouveau « No users found » si la recherche suivante ne trouve rien', async () => {
    stubFetchSequence(
      { items: [buildUser('octocat', 1)] },
      { items: [] },
    )

    const user = await search('octo')
    await screen.findByText('octocat')

    await user.click(selectAllCheckbox())
    await confirmDelete(user)
    expect(screen.getByText('All results removed')).toBeInTheDocument()

    await user.type(
      screen.getByRole('searchbox', { name: /search github users/i }),
      'zzz',
    )

    expect(await screen.findByText('No users found')).toBeInTheDocument()
    expect(screen.queryByText('All results removed')).not.toBeInTheDocument()
  })
})

describe('App — confirmation de suppression', () => {
  /** Sélectionne octocat et arme la confirmation. */
  async function armDelete(): Promise<UserEvent> {
    const user = await searchTwoUsers()

    await user.click(screen.getByRole('checkbox', { name: 'Select octocat' }))
    await user.click(deleteButton())

    return user
  }

  it('ne supprime rien au premier clic et passe en mode confirmation', async () => {
    await armDelete()

    expect(confirmDeleteButton()).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /delete selected users/i }),
    ).not.toBeInTheDocument()

    // Rien n'a été supprimé.
    expect(screen.getByText('octocat')).toBeInTheDocument()
    expect(screen.getByText('defunkt')).toBeInTheDocument()
    expect(screen.getByText('1 element selected')).toBeInTheDocument()
  })

  it('annonce la demande de confirmation dans une région live', async () => {
    await armDelete()

    expect(
      screen.getByText(/confirmation required to delete 1/i),
    ).toBeInTheDocument()
  })

  it('supprime réellement au second clic, puis revient à l’état initial', async () => {
    const user = await armDelete()

    await user.click(confirmDeleteButton())

    expect(screen.queryByText('octocat')).not.toBeInTheDocument()
    expect(screen.getByText('defunkt')).toBeInTheDocument()
    expect(deleteButton()).toBeInTheDocument()
  })

  it('annule la confirmation quand la sélection change, sans rien supprimer', async () => {
    await armDelete()

    // fireEvent ne déplace pas le focus : le blur ne peut donc pas expliquer
    // l'annulation, c'est bien le changement de sélection qui la provoque.
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select defunkt' }))

    expect(deleteButton()).toBeInTheDocument()
    expect(screen.getByText('octocat')).toBeInTheDocument()
    expect(screen.getByText('2 elements selected')).toBeInTheDocument()
  })

  it('annule la confirmation quand le focus quitte le bouton', async () => {
    const user = await armDelete()

    await user.click(screen.getByRole('searchbox', { name: /search github users/i }))

    expect(deleteButton()).toBeInTheDocument()
    expect(screen.getByText('octocat')).toBeInTheDocument()
  })

  it('annule la confirmation après expiration du délai', async () => {
    const user = await searchTwoUsers()
    await user.click(screen.getByRole('checkbox', { name: 'Select octocat' }))

    // Les fake timers doivent être installés AVANT que l'effet ne programme le
    // délai : un timer créé avec le vrai setTimeout ne serait pas pilotable.
    // fireEvent est synchrone et ne dépend d'aucun timer, contrairement à userEvent.
    vi.useFakeTimers()
    fireEvent.click(deleteButton())
    expect(confirmDeleteButton()).toBeInTheDocument()

    // Juste avant l'échéance : toujours armé.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(CONFIRM_TIMEOUT_MS - 1)
    })
    expect(confirmDeleteButton()).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    expect(deleteButton()).toBeInTheDocument()
    expect(screen.getByText('octocat')).toBeInTheDocument()
  })

  it('redémarre proprement un cycle après annulation', async () => {
    const user = await armDelete()

    // Annulation par perte de focus.
    await user.click(screen.getByRole('searchbox', { name: /search github users/i }))
    expect(deleteButton()).toBeInTheDocument()

    // Nouveau cycle complet : armer puis confirmer supprime bien.
    await user.click(deleteButton())
    expect(confirmDeleteButton()).toBeInTheDocument()

    await user.click(confirmDeleteButton())
    expect(screen.queryByText('octocat')).not.toBeInTheDocument()
    expect(screen.getByText('defunkt')).toBeInTheDocument()
  })

  it('ne demande aucune confirmation pour la duplication', async () => {
    const user = await searchTwoUsers()

    await user.click(screen.getByRole('checkbox', { name: 'Select octocat' }))
    await user.click(duplicateButton())

    // Un seul clic suffit : l'action est immédiate.
    expect(screen.getAllByText('octocat')).toHaveLength(2)
  })
})

describe('App — marqueur de duplication', () => {
  /** Toutes les cartes portant ce login, dans l'ordre de la grille. */
  function cardsOf(login: string) {
    return screen.getAllByText(login).map((node) => node.closest('li'))
  }

  it('ne marque jamais un compte présent une seule fois', async () => {
    await searchTwoUsers()

    expect(cardOf('octocat')).not.toHaveAttribute('data-duplicate')
    expect(cardOf('defunkt')).not.toHaveAttribute('data-duplicate')
  })

  it('marque l’original ET la copie, sans distinction', async () => {
    const user = await searchTwoUsers()

    await user.click(screen.getByRole('checkbox', { name: 'Select octocat' }))
    await user.click(duplicateButton())

    for (const card of cardsOf('octocat')) {
      expect(card).toHaveAttribute('data-duplicate', 'true')
    }

    // Le compte resté unique n'est pas affecté.
    expect(cardOf('defunkt')).not.toHaveAttribute('data-duplicate')
  })

  it('retire le marqueur dès qu’un compte redevient unique', async () => {
    const user = await searchTwoUsers()

    // A → A, A1, A2 : trois occurrences, toutes marquées.
    await user.click(screen.getByRole('checkbox', { name: 'Select octocat' }))
    await user.click(duplicateButton())
    await user.click(duplicateButton())

    expect(cardsOf('octocat')).toHaveLength(3)
    for (const card of cardsOf('octocat')) {
      expect(card).toHaveAttribute('data-duplicate', 'true')
    }

    // On supprime deux des trois occurrences.
    const checkboxes = screen.getAllByRole('checkbox', { name: 'Select octocat' })
    await user.click(checkboxes[1]!)
    await confirmDelete(user)

    // Il n'en reste qu'une : elle n'est plus un doublon.
    expect(cardsOf('octocat')).toHaveLength(1)
    expect(cardOf('octocat')).not.toHaveAttribute('data-duplicate')
  })

  it('fait coexister le marqueur de duplication et celui de sélection', async () => {
    const user = await searchTwoUsers()

    await user.click(screen.getByRole('checkbox', { name: 'Select octocat' }))
    await user.click(duplicateButton())

    // On sélectionne la copie : elle porte alors les deux attributs à la fois.
    const copyCheckbox = screen.getAllByRole('checkbox', { name: 'Select octocat' })[1]!
    await user.click(copyCheckbox)

    const copyCard = copyCheckbox.closest('li')
    expect(copyCard).toHaveAttribute('data-duplicate', 'true')
    expect(copyCard).toHaveAttribute('data-selected', 'true')
  })

  it('repart sans marqueur quand une nouvelle recherche aboutit', async () => {
    stubFetchSequence(
      { items: [buildUser('octocat', 1)] },
      { items: [buildUser('mojombo', 3)] },
    )

    const user = await search('octo')
    await screen.findByText('octocat')

    await user.click(selectAllCheckbox())
    await user.click(duplicateButton())
    expect(screen.getAllByText('octocat')).toHaveLength(2)

    await user.type(
      screen.getByRole('searchbox', { name: /search github users/i }),
      'mojo',
    )

    expect(await screen.findByText('mojombo')).toBeInTheDocument()
    expect(cardOf('mojombo')).not.toHaveAttribute('data-duplicate')
  })
})
