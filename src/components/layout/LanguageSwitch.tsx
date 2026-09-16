import { LANGS } from '../../services/i18n'
import { useLanguage } from '../providers/languageContext'
import styles from './LanguageSwitch.module.css'

/** Selector de idioma como grupo de dos botones (sin desplegable). */
export default function LanguageSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useLanguage()
  return (
    <div className={`${styles.switch} ${className}`} role="group" aria-label={t('footer.language')}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          lang={l.code}
          aria-pressed={lang === l.code}
          className={styles.option}
          onClick={() => setLang(l.code)}
        >
          <span aria-hidden="true">{l.code.toUpperCase()}</span>
          <span className="visually-hidden">{l.label}</span>
        </button>
      ))}
    </div>
  )
}
