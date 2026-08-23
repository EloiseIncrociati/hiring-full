import type { SearchResultItem } from '../types/github'
import { UserCard } from './UserCard'
import styles from './UserGrid.module.css'

type UserGridProps = {
  readonly items: readonly SearchResultItem[]
  readonly isSelected: (instanceId: string) => boolean
  readonly isDuplicated: (userId: number) => boolean
  readonly selectable: boolean
  readonly onToggleItem: (instanceId: string) => void
}

export function UserGrid({
  items,
  isSelected,
  isDuplicated,
  selectable,
  onToggleItem,
}: UserGridProps) {
  return (
    <div className={styles.scroller}>
      <ul className={styles.grid}>
        {items.map((item) => (
          // key = instanceId : deux copies du même compte GitHub restent
          // deux lignes distinctes pour React.
          <UserCard
            key={item.instanceId}
            item={item}
            selected={isSelected(item.instanceId)}
            duplicated={isDuplicated(item.user.id)}
            selectable={selectable}
            onToggle={onToggleItem}
          />
        ))}
      </ul>
    </div>
  )
}
