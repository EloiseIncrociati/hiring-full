import { useState } from 'react'
import { SearchBar } from './components/SearchBar'
import { SearchResults } from './components/SearchResults'
import { useUserSearch } from './hooks/useUserSearch'

export default function App() {
  const [query, setQuery] = useState('')
  const searchState = useUserSearch(query)

  return (
    <main className="app">
      <h1>GitHub User Search</h1>
      <SearchBar value={query} onChange={setQuery} />
      <SearchResults state={searchState} />
    </main>
  )
}
