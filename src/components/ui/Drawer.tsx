import { useEffect, useRef, type ReactNode } from 'react'
import { useLanguage } from '../providers/languageContext'
import styles from './Drawer.module.css'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  /** Lado por el que entra el panel. */
  side?: 'left' | 'right' | 'top'
  /** Oculta el título visualmente (sigue disponible para lectores de pantalla). */
  hideTitle?: boolean
  children: ReactNode
  footer?: ReactNode
}

/**
 * Panel lateral sobre <dialog> nativo: gestiona el foco, la tecla Escape y
 * bloquea el resto de la página sin código propio.
 */
export default function Drawer({ open, onClose, title, side = 'right', hideTitle, children, footer }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const { t } = useLanguage()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`${styles.drawer} ${styles[side]}`}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        // clic en el fondo (fuera del contenido) = cerrar
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.panel}>
        <header className={styles.head}>
          <h2 className={hideTitle ? 'visually-hidden' : styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose}>
            {t('action.close')}
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.foot}>{footer}</footer>}
      </div>
    </dialog>
  )
}
