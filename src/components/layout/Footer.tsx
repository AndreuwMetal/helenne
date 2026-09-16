import { Link } from 'react-router'
import { WHATSAPP_DISPLAY, whatsappUrl } from '../../services/whatsapp'
import { useLanguage } from '../providers/languageContext'
import LanguageSwitch from './LanguageSwitch'
import { mainLinks } from './links'
import styles from './Footer.module.css'

export default function Footer() {
  const { t } = useLanguage()
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <span className={styles.logo}>Helenne</span>
          <p>{t('footer.tagline')}</p>
        </div>

        <nav className={styles.links} aria-label="Helenne">
          {mainLinks.map((l) => (
            <Link key={l.to} to={l.to}>
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className={styles.contact}>
          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
            {t('footer.contact')}
          </a>
          <span className={styles.phone}>{WHATSAPP_DISPLAY}</span>
          <LanguageSwitch />
        </div>
      </div>
      <div className={`container ${styles.legal}`}>
        <span>© {new Date().getFullYear()} Helenne</span>
        <a href="https://helenne.es">helenne.es</a>
      </div>
    </footer>
  )
}
