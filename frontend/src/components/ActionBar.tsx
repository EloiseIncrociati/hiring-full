import { useEffect, useId, useRef, useState } from 'react'
import type { SelectionState } from '../hooks/useSelectableList'
import controls from '../styles/controls.module.css'
import styles from '../styles/ActionBar.module.css'

// Delete confirmation timeout.
export const CONFIRM_TIMEOUT_MS = 3000

type ActionBarProps = {
  readonly selectedCount: number
  readonly selectionState: SelectionState
  readonly onToggleAll: () => void
  readonly onDuplicate: () => void
  readonly onDelete: () => void
}

function DuplicateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" strokeLinecap="round" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6" strokeLinecap="round" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

export function ActionBar({
  selectedCount,
  selectionState,
  onToggleAll,
  onDuplicate,
  onDelete,
}: ActionBarProps) {
  const checkboxId = useId()
  const checkboxRef = useRef<HTMLInputElement>(null)

  // Local confirmation state.
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [confirmedSelection, setConfirmedSelection] = useState(selectedCount)

  // Reset confirmation when the selection changes.
  if (confirmedSelection !== selectedCount) {
    setConfirmedSelection(selectedCount)
    setIsConfirmingDelete(false)
  }

  // Sync the native indeterminate state.
  useEffect(() => {
    const checkbox = checkboxRef.current

    if (checkbox) {
      checkbox.indeterminate = selectionState === 'partial'
    }
  }, [selectionState])

  // Cancel confirmation after the timeout.
  useEffect(() => {
    if (!isConfirmingDelete) {
      return
    }

    const timeoutId = setTimeout(() => setIsConfirmingDelete(false), CONFIRM_TIMEOUT_MS)

    return () => clearTimeout(timeoutId)
  }, [isConfirmingDelete])

  const hasSelection = selectedCount > 0

  function handleDeleteClick() {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true)
      return
    }

    setIsConfirmingDelete(false)
    onDelete()
  }

  return (
    <div className={styles.bar}>
      <div className={styles.selection}>
        <input
          ref={checkboxRef}
          id={checkboxId}
          type="checkbox"
          className={controls.checkbox}
          checked={selectionState === 'all'}
          onChange={onToggleAll}
        />
        <label htmlFor={checkboxId} className={styles.counter}>
          {selectedCount} {selectedCount === 1 ? 'element' : 'elements'} selected
        </label>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={`${controls.iconButton} ${styles.duplicateAction}`}
          onClick={onDuplicate}
          disabled={!hasSelection}
          aria-label="Duplicate selected users"
        >
          <DuplicateIcon />
        </button>
        <button
          type="button"
          className={`${controls.iconButton} ${styles.deleteAction} ${
            isConfirmingDelete ? styles.deleteConfirming : ''
          }`}
          onClick={handleDeleteClick}
          // Cancel confirmation when focus leaves the button.
          onBlur={() => setIsConfirmingDelete(false)}
          disabled={!hasSelection}
          // Keep the visible confirmation text as the accessible name.
          aria-label={isConfirmingDelete ? undefined : 'Delete selected users'}
        >
          <DeleteIcon />
          {isConfirmingDelete && (
            <span className={styles.confirmLabel}>Confirm delete ({selectedCount})</span>
          )}
        </button>
      </div>

      {/* Announce the confirmation state to screen readers. */}
      <span role="status" className={styles.srOnly}>
        {isConfirmingDelete
          ? `Confirmation required to delete ${selectedCount}. Activate the button again.`
          : ''}
      </span>
    </div>
  )
}
