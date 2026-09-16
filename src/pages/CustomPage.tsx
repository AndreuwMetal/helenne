import { useState, type FormEvent } from 'react'
import PageHeader from '../components/layout/PageHeader'
import { usePageTitle } from '../components/layout/usePageTitle'
import { useLanguage } from '../components/providers/languageContext'
import { Button } from '../components/ui/Button'
import type { TextKey } from '../services/i18n'
import { customOrderMessage, whatsappUrl, type CustomOrder } from '../services/whatsapp'
import styles from './CustomPage.module.css'

const fields: { name: keyof CustomOrder; label: TextKey; type: string; autoComplete: string }[] = [
  { name: 'name', label: 'custom.name', type: 'text', autoComplete: 'name' },
  { name: 'phone', label: 'custom.phone', type: 'tel', autoComplete: 'tel' },
  { name: 'email', label: 'custom.email', type: 'email', autoComplete: 'email' },
]

export default function CustomPage() {
  const { t, lang } = useLanguage()
  const [form, setForm] = useState<CustomOrder>({ name: '', phone: '', email: '' })
  usePageTitle(t('custom.title'))

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    window.open(whatsappUrl(customOrderMessage(form, lang)), '_blank', 'noopener')
  }

  return (
    <>
      <PageHeader title={t('custom.title')}>
        <p>{t('custom.p1')}</p>
        <p>{t('custom.p2')}</p>
      </PageHeader>

      <div className={`container ${styles.layout}`}>
        <form className={styles.form} onSubmit={onSubmit}>
          {fields.map((f) => (
            <label key={f.name} className={styles.field}>
              <span>{t(f.label)}</span>
              <input
                name={f.name}
                type={f.type}
                autoComplete={f.autoComplete}
                required
                value={form[f.name]}
                onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
              />
            </label>
          ))}
          <Button type="submit" className={styles.submit}>
            {t('custom.submit')}
          </Button>
          <p className={styles.hint}>{t('custom.hint')}</p>
        </form>

        <img className={styles.photo} src="/img/products/hada/1.jpg" alt="" loading="lazy" />
      </div>
    </>
  )
}
