import { useId } from 'react'
import type { SearchResultItem } from '../types/github'
import controls from '../styles/controls.module.css'
import styles from '../styles/UserCard.module.css'

type UserCardProps = {
  readonly item: SearchResultItem
  readonly selected: boolean
  // Derived from the current list.
  readonly duplicated: boolean
  // Checkbox is only mounted in edit mode.
  readonly selectable: boolean
  readonly onToggle: (instanceId: string) => void
}

export function UserCard({
  item,
  selected,
  duplicated,
  selectable,
  onToggle,
}: UserCardProps) {
  const checkboxId = useId()
  const { user } = item

  return (
    <li
      className={styles.card}
      data-selected={selected ? 'true' : undefined}
      data-duplicate={duplicated ? 'true' : undefined}
    >
      {selectable && (
        <input
          id={checkboxId}
          type="checkbox"
          className={`${controls.checkbox} ${styles.cardCheckbox}`}
          checked={selected}
          onChange={() => onToggle(item.instanceId)}
          aria-label={`Select ${user.login}`}
        />
      )}

      <img className={styles.avatar} src={user.avatar_url} alt="" loading="lazy" />

      <p className={styles.login}>{user.login}</p>
      <p className={styles.id}>{user.id}</p>

      <a
        className={styles.profileLink}
        href={user.html_url}
        target="_blank"
        rel="noreferrer"
        aria-label={`View profile of ${user.login}`}
      >
        View profile
      </a>
    </li>
  )
}
