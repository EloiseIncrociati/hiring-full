import { useId } from 'react'
import styles from './SearchBar.module.css'

type SearchBarProps = {
  readonly value: string
  readonly onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  // useId garantit un identifiant unique et stable même si le composant est monté
  // plusieurs fois : indispensable pour lier <label> et <input> sans collision.
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
