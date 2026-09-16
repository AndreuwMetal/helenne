import { useParams } from 'react-router'
import PageHeader from '../components/layout/PageHeader'
import { usePageTitle } from '../components/layout/usePageTitle'
import ProductCard from '../components/product/ProductCard'
import { useLanguage } from '../components/providers/languageContext'
import { ButtonLink } from '../components/ui/Button'
import { findCollection, productsIn } from '../services/catalog'
import NotFoundPage from './NotFoundPage'
import styles from './CollectionPage.module.css'

export default function CollectionPage() {
  const { collection: slug = '' } = useParams()
  const { t, pick } = useLanguage()
  const collection = findCollection(slug)
  usePageTitle(collection ? pick(collection.name) : undefined)

  if (!collection) return <NotFoundPage />
  const items = productsIn(collection.slug)

  return (
    <>
      <PageHeader title={pick(collection.name)}>
        <p>{pick(collection.description)}</p>
      </PageHeader>

      <div className="container">
        {items.length > 0 ? (
          <div className={styles.grid}>
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <h2>{t('empty.title')}</h2>
            {collection.emptyText && <p>{pick(collection.emptyText)}</p>}
            <ButtonLink to="/accesorios" variant="outline">
              {t('action.seeAccessories')}
            </ButtonLink>
          </div>
        )}
      </div>
    </>
  )
}
