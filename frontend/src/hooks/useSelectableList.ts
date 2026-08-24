import { useCallback, useMemo, useState } from 'react'
import type { GithubUser, SearchResultItem } from '../types/github'

export type SelectionState = 'none' | 'partial' | 'all'

// Public API for the working list.
export type SelectableList = {
  readonly items: readonly SearchResultItem[]
  readonly selectedCount: number
  readonly selectionState: SelectionState
  readonly isSelected: (instanceId: string) => boolean
  readonly isDuplicated: (userId: number) => boolean
  readonly toggleItem: (instanceId: string) => void
  readonly toggleAll: () => void
  readonly clearSelection: () => void
  readonly duplicateSelected: () => void
  readonly deleteSelected: () => void
}

const EMPTY_SELECTION: ReadonlySet<string> = new Set()

let fallbackCounter = 0

// Generate a unique instance ID across supported environments.
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

// Find accounts occurring more than once in the current list.
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
 * The list as reworked by the user: selection, duplication, deletion.
 *
 * API results stay the single source of truth. Any new response restarts from a
 * fresh list, discarding previous edits these actions are front-end only.
 *
 * @param users Latest successful API results. Identity of this array is the reset
 *              trigger, so callers must pass a stable reference when nothing changed.
 */
export function useSelectableList(users: readonly GithubUser[]): SelectableList {
  const [items, setItems] = useState<readonly SearchResultItem[]>(() => toItems(users))
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(EMPTY_SELECTION)
  const [sourceUsers, setSourceUsers] = useState(users)

  // Reset local changes when new API results arrive.
  if (sourceUsers !== users) {
    setSourceUsers(users)
    setItems(toItems(users))
    setSelectedIds(EMPTY_SELECTION)
  }

  // Counted as an intersection 
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

  const duplicatedUserIds = useMemo(() => findDuplicatedUserIds(items), [items])

  const isDuplicated = useCallback(
    (userId: number) => duplicatedUserIds.has(userId),
    [duplicatedUserIds],
  )

  const toggleItem = useCallback((instanceId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)

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
          ? // Keep copies next to their original with a distinct instanceId.
            [item, { instanceId: createInstanceId(), user: item.user }]
          : [item],
      ),
    )
    // Selection deliberately stays on the originals
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
