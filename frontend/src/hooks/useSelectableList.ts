import { useCallback, useMemo, useState } from 'react'
import type { GithubUser, SearchResultItem } from '../types/github'

export type SelectionState = 'none' | 'partial' | 'all'

export type SelectableList = {
  readonly items: readonly SearchResultItem[]
  readonly selectedCount: number
  readonly selectionState: SelectionState
  readonly isSelected: (instanceId: string) => boolean
  /** Vrai si ce compte apparaît au moins deux fois dans la liste affichée. */
  readonly isDuplicated: (userId: number) => boolean
  readonly toggleItem: (instanceId: string) => void
  readonly toggleAll: () => void
  /** Désélection globale, sans toucher à la liste. */
  readonly clearSelection: () => void
  readonly duplicateSelected: () => void
  readonly deleteSelected: () => void
}

const EMPTY_SELECTION: ReadonlySet<string> = new Set()

let fallbackCounter = 0

/**
 * `crypto.randomUUID` n'existe qu'en contexte sécurisé (https ou localhost).
 * Le repli garantit des identifiants uniques partout — y compris en http sur IP locale.
 */
function createInstanceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  fallbackCounter += 1
  return `item-${Date.now().toString(36)}-${fallbackCounter}`
}

function toItems(users: readonly GithubUser[]): readonly SearchResultItem[] {
  return users.map((user) => ({ instanceId: createInstanceId(), user }))
}

/**
 * Comptes présents plus d'une fois dans la liste courante.
 *
 * « Être un doublon » n'est pas une propriété de l'item mais une relation entre
 * items : elle se recalcule à chaque modification de la liste, jamais ne se stocke.
 */
function findDuplicatedUserIds(
  items: readonly SearchResultItem[],
): ReadonlySet<number> {
  const occurrences = new Map<number, number>()

  for (const item of items) {
    occurrences.set(item.user.id, (occurrences.get(item.user.id) ?? 0) + 1)
  }

  const duplicated = new Set<number>()

  for (const [userId, count] of occurrences) {
    if (count > 1) {
      duplicated.add(userId)
    }
  }

  return duplicated
}

/**
 * Liste « travaillée » par l'utilisateur : sélection, duplication, suppression.
 *
 * Les résultats de l'API restent la source ; toute nouvelle réponse repart d'une
 * liste fraîche, sans conserver les modifications précédentes (actions front-only).
 */
export function useSelectableList(users: readonly GithubUser[]): SelectableList {
  const [items, setItems] = useState<readonly SearchResultItem[]>(() => toItems(users))
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(EMPTY_SELECTION)
  const [sourceUsers, setSourceUsers] = useState(users)

  // Ajustement d'état pendant le rendu (pattern React « adjusting state when a prop
  // changes ») : React relance le rendu immédiatement, sans commit ni rendu en
  // cascade. Un useEffect provoquerait un flash de l'ancienne liste à l'écran.
  if (sourceUsers !== users) {
    setSourceUsers(users)
    setItems(toItems(users))
    setSelectedIds(EMPTY_SELECTION)
  }

  const selectedCount = useMemo(
    () =>
      items.reduce(
        (count, item) => (selectedIds.has(item.instanceId) ? count + 1 : count),
        0,
      ),
    [items, selectedIds],
  )

  const selectionState: SelectionState =
    selectedCount === 0 ? 'none' : selectedCount === items.length ? 'all' : 'partial'

  const isSelected = useCallback(
    (instanceId: string) => selectedIds.has(instanceId),
    [selectedIds],
  )

  // Recalculé uniquement quand la liste change — pas à chaque clic de sélection.
  const duplicatedUserIds = useMemo(() => findDuplicatedUserIds(items), [items])

  const isDuplicated = useCallback(
    (userId: number) => duplicatedUserIds.has(userId),
    [duplicatedUserIds],
  )

  const toggleItem = useCallback((instanceId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)

      // `delete` renvoie false si l'élément était absent : un seul aller-retour.
      if (!next.delete(instanceId)) {
        next.add(instanceId)
      }

      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedIds((current) => {
      const allSelected =
        items.length > 0 && items.every((item) => current.has(item.instanceId))

      return allSelected
        ? EMPTY_SELECTION
        : new Set(items.map((item) => item.instanceId))
    })
  }, [items])

  const clearSelection = useCallback(() => {
    setSelectedIds(EMPTY_SELECTION)
  }, [])

  const duplicateSelected = useCallback(() => {
    setItems((current) =>
      current.flatMap((item) =>
        selectedIds.has(item.instanceId)
          ? // La copie est insérée juste après son original : le lien reste visible
            // sans avoir à scroller jusqu'en bas de la grille.
            [item, { instanceId: createInstanceId(), user: item.user }]
          : [item],
      ),
    )
    // La sélection est conservée sur les originaux : l'action ne modifie pas
    // l'intention de l'utilisateur, et dupliquer deux fois ajoute n puis n copies
    // (linéaire) au lieu de doubler à chaque clic (exponentiel).
  }, [selectedIds])

  const deleteSelected = useCallback(() => {
    setItems((current) => current.filter((item) => !selectedIds.has(item.instanceId)))
    setSelectedIds(EMPTY_SELECTION)
  }, [selectedIds])

  return {
    items,
    selectedCount,
    selectionState,
    isSelected,
    isDuplicated,
    toggleItem,
    toggleAll,
    clearSelection,
    duplicateSelected,
    deleteSelected,
  }
}
