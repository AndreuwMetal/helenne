import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

/** Título y entradilla de las páginas interiores. */
export default function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className={`container ${styles.header}`}>
      <h1 className={styles.title}>{title}</h1>
      {children && <div className={styles.lead}>{children}</div>}
    </header>
  )
}
