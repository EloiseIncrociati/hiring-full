import { useId } from 'react'
import type { SearchResultItem } from '../types/github'
import controls from '../styles/controls.module.css'
import styles from './UserCard.module.css'

type UserCardProps = {
  readonly item: SearchResultItem
  readonly selected: boolean
  /** Calculé par le hook à partir de la liste courante, jamais stocké sur l'item. */
  readonly duplicated: boolean
  /** Hors mode édition, la checkbox n'est pas montée du tout. */
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
    // Les deux états pilotent le style via des attributs de données plutôt que des
    // classes conditionnelles : ils se composent sans s'écraser, et restent lisibles
    // dans l'inspecteur comme dans les tests.
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

      {/* alt vide : le login est juste en dessous, l'annoncer deux fois est du bruit. */}
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
