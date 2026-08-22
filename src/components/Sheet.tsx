import { X } from 'lucide-react'
import { useEffect, type PropsWithChildren } from 'react'

interface SheetProps extends PropsWithChildren {
  open: boolean
  onClose: () => void
  title: string
  description?: string
}

export function Sheet({ open, onClose, title, description, children }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, open])

  if (!open) return null
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div>
            <h2 id="sheet-title">{title}</h2>
            {description && <p className="muted small">{description}</p>}
          </div>
          <button className="btn btn-ghost btn-icon" type="button" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        {children}
      </section>
    </div>
  )
}
