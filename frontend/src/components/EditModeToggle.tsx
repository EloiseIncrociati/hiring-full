import styles from '../styles/EditModeToggle.module.css'

type EditModeToggleProps = {
  readonly enabled: boolean
  readonly onToggle: () => void
}

// Accessible toggle using aria-pressed.
export function EditModeToggle({ enabled, onToggle }: EditModeToggleProps) {
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={onToggle}
      aria-pressed={enabled}
    >
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
      Edit mode
    </button>
  )
}
