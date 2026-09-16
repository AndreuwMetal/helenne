import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { collections, products } from '../../services/catalog'
import { searchEntries } from '../../services/search'
import Drawer from '../ui/Drawer'
import { useLanguage } from '../providers/languageContext'
import styles from './SearchPanel.module.css'

export default function SearchPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useLanguage()
  const [query, setQuery] = useState('')

  const results = useMemo(() => searchEntries(query, lang, products, collections), [query, lang])

  return (
    <Drawer open={open} onClose={onClose} title={t('action.search')} side="top" hideTitle>
      <div className={styles.wrap}>
        <input
          type="search"
          className={styles.input}
          placeholder={t('search.placeholder')}
          aria-label={t('action.search')}
          value={query}
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
          // en un campo de búsqueda, Escape solo borraría el texto: aquí cierra el panel
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              onClose()
            }
          }}
        />
        {query.trim() && (
          <ul className={styles.results}>
            {results.length === 0 && <li className={styles.none}>{t('search.none', { q: query.trim() })}</li>}
            {results.map((r) => (
              <li key={r.href + r.title}>
                <Link to={r.href} className={styles.result} onClick={onClose}>
                  {r.image ? <img src={r.image} alt="" loading="lazy" /> : <span className={styles.placeholder} />}
                  <span>
                    <span className={styles.name}>{r.title}</span>
                    <span className={styles.meta}>{r.meta}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Drawer>
  )
}
