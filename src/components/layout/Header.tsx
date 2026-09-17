import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router'
import { useCart } from '../providers/cartContext'
import { useLanguage } from '../providers/languageContext'
import LanguageSwitch from './LanguageSwitch'
import { mainLinks } from './links'
import MenuDrawer from './MenuDrawer'
import SearchPanel from './SearchPanel'
import styles from './Header.module.css'

/** `overlay`: transparente sobre la portada; el color lo decide la escena. */
export default function Header({ overlay = false }: { overlay?: boolean }) {
  const { t } = useLanguage()
  const cart = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`${styles.header} ${overlay ? styles.overlay : scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label="Helenne, inicio">
          <span className={styles.logoName}>Helenne</span>
          <span className={styles.logoTag}>handmade</span>
        </Link>

        <div className={styles.tools}>
          <nav className={styles.nav} aria-label={t('nav.menu')}>
            {mainLinks.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
                {t(l.key)}
              </NavLink>
            ))}
          </nav>
          <LanguageSwitch className={styles.lang} />
          <button type="button" className={styles.icon} onClick={() => setSearchOpen(true)}>
            <SearchIcon />
            <span className="visually-hidden">{t('action.search')}</span>
          </button>
          <button type="button" className={styles.icon} onClick={cart.open}>
            <BagIcon />
            {cart.count > 0 && (
              <span className={styles.badge} aria-hidden="true">
                {cart.count}
              </span>
            )}
            <span className="visually-hidden">
              {t('cart.open')} ({cart.count})
            </span>
          </button>
          <button type="button" className={`${styles.icon} ${styles.menuButton}`} onClick={() => setMenuOpen(true)}>
            <MenuIcon />
            <span className="visually-hidden">{t('nav.menu')}</span>
          </button>
        </div>
      </div>

      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <path d="M3 7h18M3 12h18M3 17h18" />
  </svg>
)

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5 21 21" />
  </svg>
)

const BagIcon = () => (
  <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <path d="M4.5 8h15l-1.2 13H5.7L4.5 8Z" />
    <path d="M8.5 10V6.5a3.5 3.5 0 0 1 7 0V10" />
  </svg>
)
