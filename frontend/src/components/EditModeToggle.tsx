import styles from './EditModeToggle.module.css'

type EditModeToggleProps = {
  readonly enabled: boolean
  readonly onToggle: () => void
}

/**
 * Vrai <button> avec `aria-pressed` : l'état enfoncé est porté par l'arbre
 * d'accessibilité, et Entrée/Espace fonctionnent sans aucun code clavier.
 * La piste et la pastille sont purement décoratives, d'où l'aria-hidden.
 */
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
