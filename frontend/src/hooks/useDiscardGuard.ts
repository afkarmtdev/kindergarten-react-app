import { useState } from 'react'

export function useDiscardGuard(onClose: () => void) {
  const [isDirty, setIsDirty] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const markDirty = () => setIsDirty(true)

  const resetDirty = () => {
    setIsDirty(false)
    setShowConfirm(false)
  }

  const requestClose = () => {
    if (isDirty) {
      setShowConfirm(true)
    } else {
      onClose()
    }
  }

  const confirmDiscard = () => {
    setShowConfirm(false)
    setIsDirty(false)
    onClose()
  }

  const cancelDiscard = () => setShowConfirm(false)

  return { markDirty, resetDirty, requestClose, showConfirm, confirmDiscard, cancelDiscard }
}
