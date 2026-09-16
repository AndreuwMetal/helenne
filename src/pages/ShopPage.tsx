import { Link } from 'react-router'
import PageHeader from '../components/layout/PageHeader'
import { usePageTitle } from '../components/layout/usePageTitle'
import { useLanguage } from '../components/providers/languageContext'
import { collections, productsIn } from '../services/catalog'
import styles from './ShopPage.module.css'

export default function ShopPage() {
  const { t, pick } = useLanguage()
  usePageTitle(t('shop.title'))

  return (
    <>
      <PageHeader title={t('shop.title')} />
      <div className={`container ${styles.grid}`}>
        {collections.map((c) => {
          const count = productsIn(c.slug).length
          return (
            <Link key={c.slug} to={`/${c.slug}`} className={styles.tile}>
              <div className={styles.media}>
                <img src={c.image} alt="" loading="lazy" />
              </div>
              <h2 className={styles.name}>{pick(c.name)}</h2>
              <p className={styles.meta}>{count > 0 ? t('shop.pieces', { n: count }) : t('product.soon')}</p>
            </Link>
          )
        })}
      </div>
    </>
  )
}
