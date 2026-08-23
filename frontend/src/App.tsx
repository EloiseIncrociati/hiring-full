import { useState } from 'react'
import { ActionBar } from './components/ActionBar'
import { SearchBar } from './components/SearchBar'
import { SearchStatus } from './components/SearchStatus'
import { UserGrid } from './components/UserGrid'
import { useSelectableList } from './hooks/useSelectableList'
import { useUserSearch } from './hooks/useUserSearch'
import type { GithubUser } from './types/github'
import styles from './App.module.css'

// Référence stable : hors succès, `useSelectableList` reçoit toujours le même
// tableau et ne se réinitialise donc pas à chaque rendu.
const NO_USERS: readonly GithubUser[] = []

export default function App() {
  const [query, setQuery] = useState('')
  const searchState = useUserSearch(query)

  // Source unique de la liste travaillée : les résultats de l'API.
  const users = searchState.status === 'success' ? searchState.users : NO_USERS
  const list = useSelectableList(users)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>GitHub User Search</h1>
      </header>

      <main className={styles.main}>
        <SearchBar value={query} onChange={setQuery} />
        <SearchStatus state={searchState} visibleCount={list.items.length} />

        {list.items.length > 0 && (
          <>
            <ActionBar
              selectedCount={list.selectedCount}
              selectionState={list.selectionState}
              onToggleAll={list.toggleAll}
              onDuplicate={list.duplicateSelected}
              onDelete={list.deleteSelected}
            />
            <UserGrid
              items={list.items}
              isSelected={list.isSelected}
              isDuplicated={list.isDuplicated}
              onToggleItem={list.toggleItem}
            />
          </>
        )}
      </main>
    </div>
  )
}
