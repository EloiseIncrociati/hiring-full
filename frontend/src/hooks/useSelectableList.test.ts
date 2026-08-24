import { act, renderHook } from '@testing-library/react'
import { buildUser } from '../test/helpers'
import { useSelectableList } from './useSelectableList'
import type { GithubUser } from '../types/github'

const OCTOCAT = buildUser('octocat', 1)
const DEFUNKT = buildUser('defunkt', 2)
const MOJOMBO = buildUser('mojombo', 3)

function renderList(users: readonly GithubUser[]) {
  return renderHook(({ source }) => useSelectableList(source), {
    initialProps: { source: users },
  })
}

describe('useSelectableList', () => {
  it("crée un item par utilisateur, avec un identifiant d'instance unique", () => {
    const { result } = renderList([OCTOCAT, DEFUNKT])

    expect(result.current.items).toHaveLength(2)
    expect(result.current.items.map((item) => item.user)).toEqual([OCTOCAT, DEFUNKT])

    const instanceIds = result.current.items.map((item) => item.instanceId)
    expect(new Set(instanceIds).size).toBe(2)

    expect(result.current.selectedCount).toBe(0)
    expect(result.current.selectionState).toBe('none')
  })

  it('sélectionne puis désélectionne un item', () => {
    const { result } = renderList([OCTOCAT, DEFUNKT])
    const target = result.current.items[0]!.instanceId

    act(() => result.current.toggleItem(target))

    expect(result.current.isSelected(target)).toBe(true)
    expect(result.current.selectedCount).toBe(1)

    act(() => result.current.toggleItem(target))

    expect(result.current.isSelected(target)).toBe(false)
    expect(result.current.selectedCount).toBe(0)
  })

  it('passe en état indéterminé quand une partie seulement est sélectionnée', () => {
    const { result } = renderList([OCTOCAT, DEFUNKT, MOJOMBO])

    act(() => result.current.toggleItem(result.current.items[0]!.instanceId))
    expect(result.current.selectionState).toBe('partial')

    act(() => result.current.toggleItem(result.current.items[1]!.instanceId))
    expect(result.current.selectionState).toBe('partial')

    act(() => result.current.toggleItem(result.current.items[2]!.instanceId))
    expect(result.current.selectionState).toBe('all')
  })

  it('sélectionne tout puis désélectionne tout', () => {
    const { result } = renderList([OCTOCAT, DEFUNKT])

    act(() => result.current.toggleAll())

    expect(result.current.selectedCount).toBe(2)
    expect(result.current.selectionState).toBe('all')

    act(() => result.current.toggleAll())

    expect(result.current.selectedCount).toBe(0)
    expect(result.current.selectionState).toBe('none')
  })

  it("duplique les items sélectionnés avec de nouveaux identifiants d'instance", () => {
    const { result } = renderList([OCTOCAT, DEFUNKT])
    const original = result.current.items[0]!

    act(() => result.current.toggleItem(original.instanceId))
    act(() => result.current.duplicateSelected())

    expect(result.current.items).toHaveLength(3)

    const instanceIds = result.current.items.map((item) => item.instanceId)
    expect(new Set(instanceIds).size).toBe(3)

    // La copie est insérée juste après son original et porte les mêmes données.
    expect(result.current.items[1]!.user).toEqual(original.user)
    expect(result.current.items[1]!.instanceId).not.toBe(original.instanceId)
  })

  it('conserve la sélection sur les originaux après duplication', () => {
    const { result } = renderList([OCTOCAT, DEFUNKT])
    const original = result.current.items[0]!

    act(() => result.current.toggleItem(original.instanceId))
    act(() => result.current.duplicateSelected())

    expect(result.current.isSelected(original.instanceId)).toBe(true)
    expect(result.current.isSelected(result.current.items[1]!.instanceId)).toBe(false)
    expect(result.current.selectedCount).toBe(1)

    // duplicating twice is linear, not exponential.
    act(() => result.current.duplicateSelected())
    expect(result.current.items).toHaveLength(4)
  })

  it('ne marque aucun compte présent une seule fois', () => {
    const { result } = renderList([OCTOCAT, DEFUNKT, MOJOMBO])

    expect(
      result.current.items.every((item) => !result.current.isDuplicated(item.user.id)),
    ).toBe(true)
  })

  it('marque toutes les occurrences d’un compte dupliqué, original compris', () => {
    const { result } = renderList([OCTOCAT, DEFUNKT])

    act(() => result.current.toggleItem(result.current.items[0]!.instanceId))
    act(() => result.current.duplicateSelected())

    // The original and the copy both bear the marker.
    expect(result.current.isDuplicated(OCTOCAT.id)).toBe(true)
    expect(result.current.isDuplicated(DEFUNKT.id)).toBe(false)
  })

  it('cesse de marquer un compte redevenu unique après suppressions', () => {
    const { result } = renderList([OCTOCAT])

    act(() => result.current.toggleAll())
    act(() => result.current.duplicateSelected())
    act(() => result.current.duplicateSelected())

    expect(result.current.items).toHaveLength(3)
    expect(result.current.isDuplicated(OCTOCAT.id)).toBe(true)

    // We delete two of the three occurrences
    act(() => result.current.toggleItem(result.current.items[1]!.instanceId))
    act(() => result.current.deleteSelected())

    expect(result.current.items).toHaveLength(1)
    expect(result.current.isDuplicated(OCTOCAT.id)).toBe(false)
  })

  it('ne marque rien quand de nouveaux résultats arrivent', () => {
    const { result, rerender } = renderList([OCTOCAT])

    act(() => result.current.toggleAll())
    act(() => result.current.duplicateSelected())
    expect(result.current.isDuplicated(OCTOCAT.id)).toBe(true)

    rerender({ source: [MOJOMBO] })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.isDuplicated(MOJOMBO.id)).toBe(false)
  })

  it('supprime les items sélectionnés et vide la sélection', () => {
    const { result } = renderList([OCTOCAT, DEFUNKT, MOJOMBO])

    act(() => result.current.toggleItem(result.current.items[0]!.instanceId))
    act(() => result.current.toggleItem(result.current.items[2]!.instanceId))
    act(() => result.current.deleteSelected())

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0]!.user).toEqual(DEFUNKT)
    expect(result.current.selectedCount).toBe(0)
    expect(result.current.selectionState).toBe('none')
  })

  it('réinitialise liste et sélection quand de nouveaux résultats arrivent', () => {
    const { result, rerender } = renderList([OCTOCAT, DEFUNKT])

    act(() => result.current.toggleAll())
    act(() => result.current.duplicateSelected())
    expect(result.current.items).toHaveLength(4)
    expect(result.current.selectedCount).toBe(2)

    // New API response
    rerender({ source: [MOJOMBO] })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0]!.user).toEqual(MOJOMBO)
    expect(result.current.selectedCount).toBe(0)
    expect(result.current.selectionState).toBe('none')
  })

  it('ne réinitialise pas si la référence des résultats est inchangée', () => {
    const users = [OCTOCAT, DEFUNKT]
    const { result, rerender } = renderList(users)

    act(() => result.current.toggleItem(result.current.items[0]!.instanceId))
    act(() => result.current.duplicateSelected())

    const before = result.current.items.map((item) => item.instanceId)

    rerender({ source: users })

    expect(result.current.items.map((item) => item.instanceId)).toEqual(before)
    expect(result.current.selectedCount).toBe(1)
  })
})
