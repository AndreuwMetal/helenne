import { NavLink } from 'react-router'
import Drawer from '../ui/Drawer'
import { useLanguage } from '../providers/languageContext'
import LanguageSwitch from './LanguageSwitch'
import { mainLinks } from './links'
import styles from './MenuDrawer.module.css'

export default function MenuDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage()
  return (
    <Drawer open={open} onClose={onClose} title={t('nav.menu')} side="left" footer={<LanguageSwitch />}>
      <nav className={styles.nav}>
        <NavLink to="/" end className={styles.link} onClick={onClose}>
          {t('nav.home')}
        </NavLink>
        {mainLinks.map((l) => (
          <NavLink key={l.to} to={l.to} className={styles.link} onClick={onClose}>
            {t(l.key)}
          </NavLink>
        ))}
      </nav>
    </Drawer>
  )
}
