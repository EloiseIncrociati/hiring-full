import { useState } from 'react'
import { ActionBar } from './components/ActionBar'
import { EditModeToggle } from './components/EditModeToggle'
import { SearchBar } from './components/SearchBar'
import { SearchStatus } from './components/SearchStatus'
import { ThemeToggle } from './components/ThemeToggle'
import { UserGrid } from './components/UserGrid'
import { useSelectableList } from './hooks/useSelectableList'
import { useTheme } from './hooks/useTheme'
import { useUserSearch } from './hooks/useUserSearch'
import type { GithubUser } from './types/github'
import styles from './styles/App.module.css'

// Stable reference for the empty state.
const NO_USERS: readonly GithubUser[] = []

export default function App() {
  const [query, setQuery] = useState('')
  // Edit mode is enabled by default.
  const [isEditMode, setIsEditMode] = useState(true)

  const { theme, toggleTheme } = useTheme()
  const searchState = useUserSearch(query)

  // API results are the source of the working list.  
  const users = searchState.status === 'success' ? searchState.users : NO_USERS
  const list = useSelectableList(users)

  function handleToggleEditMode() {
    setIsEditMode((current) => !current)
    // Selection only exists in edit mode.
    list.clearSelection()
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>GitHub User Search</h1>
        <div className={styles.headerActions}>
          <EditModeToggle enabled={isEditMode} onToggle={handleToggleEditMode} />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <main className={styles.main}>
        <SearchBar value={query} onChange={setQuery} />
        <SearchStatus state={searchState} visibleCount={list.items.length} />

        {list.items.length > 0 && (
          <>
            {isEditMode && (
              <ActionBar
                selectedCount={list.selectedCount}
                selectionState={list.selectionState}
                onToggleAll={list.toggleAll}
                onDuplicate={list.duplicateSelected}
                onDelete={list.deleteSelected}
              />
            )}
            <UserGrid
              items={list.items}
              isSelected={list.isSelected}
              isDuplicated={list.isDuplicated}
              selectable={isEditMode}
              onToggleItem={list.toggleItem}
            />
          </>
        )}
      </main>
    </div>
  )
}
