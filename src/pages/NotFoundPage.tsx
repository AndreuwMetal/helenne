import PageHeader from '../components/layout/PageHeader'
import { usePageTitle } from '../components/layout/usePageTitle'
import { useLanguage } from '../components/providers/languageContext'
import { ButtonLink } from '../components/ui/Button'

export default function NotFoundPage() {
  const { t } = useLanguage()
  usePageTitle(t('notFound.title'))
  return (
    <PageHeader title={t('notFound.title')}>
      <p>{t('notFound.text')}</p>
      <div>
        <ButtonLink to="/">{t('notFound.back')}</ButtonLink>
      </div>
    </PageHeader>
  )
}
