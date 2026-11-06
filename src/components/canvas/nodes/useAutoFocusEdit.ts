import { useEffect, useRef, useState } from 'react'

/**
 * Manages auto-focusing and selecting an editable node label on creation,
 * including a short grace window so transient focus shifts from dock clicks,
 * drag-and-drop, or menu closures do not immediately exit edit mode.
 */
export function useAutoFocusEdit<T extends HTMLElement>(options: {
  id: string
  autoFocusEdit?: boolean
  selected: boolean
  updateNodeData: (id: string, data: Record<string, unknown>) => void
}) {
  const { id, autoFocusEdit, selected, updateNodeData } = options
  const [isEditing, setIsEditing] = useState(Boolean(autoFocusEdit))
  const editRef = useRef<T>(null)
  const autoFocusGraceUntilRef = useRef(
    autoFocusEdit ? Date.now() + 180 : 0
  )

  const focusAndSelect = () => {
    const el = editRef.current
    if (!el) return
    el.focus()
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(el)
    selection?.removeAllRanges()
    selection?.addRange(range)
  }

  useEffect(() => {
    if (autoFocusEdit) {
      autoFocusGraceUntilRef.current = Date.now() + 180
      setIsEditing(true)
      updateNodeData(id, { autoFocusEdit: false })
    }
  }, [id, autoFocusEdit, updateNodeData])

  useEffect(() => {
    if (!isEditing) return
    focusAndSelect()
    const ensureFocused = () => {
      if (editRef.current && document.activeElement !== editRef.current) {
        focusAndSelect()
      }
    }
    const rafId = requestAnimationFrame(ensureFocused)
    const timerId = window.setTimeout(ensureFocused, 40)
    return () => {
      cancelAnimationFrame(rafId)
      window.clearTimeout(timerId)
    }
  }, [isEditing])

  const shouldIgnoreBlur = () => {
    if (Date.now() < autoFocusGraceUntilRef.current && selected) {
      requestAnimationFrame(() => {
        if (editRef.current && document.activeElement !== editRef.current) {
          focusAndSelect()
        }
      })
      return true
    }
    return false
  }

  return {
    isEditing,
    setIsEditing,
    editRef,
    shouldIgnoreBlur,
  }
}
