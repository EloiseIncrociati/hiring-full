import { useId } from 'react'
import styles from '../styles/SearchBar.module.css'

type SearchBarProps = {
  readonly value: string
  readonly onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
// Stable unique id for the input.
  const inputId = useId()

  return (
    <div className={styles.wrapper}>
      <label htmlFor={inputId} className={styles.label}>
        Search GitHub users
      </label>
      <input
        id={inputId}
        type="search"
        className={styles.input}
        value={value}
        placeholder="Search users"
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
