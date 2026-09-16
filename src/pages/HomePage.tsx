import { useRef } from 'react'
import { usePageTitle } from '../components/layout/usePageTitle'
import ProductCard from '../components/product/ProductCard'
import ProductSpin from '../components/product/ProductSpin'
import { useScrollProgress } from '../components/product/useScrollProgress'
import { useLanguage } from '../components/providers/languageContext'
import { ButtonExternal, ButtonLink } from '../components/ui/Button'
import { azulDetails, findProductBySlug, productsIn } from '../services/catalog'
import { reserveMessage, whatsappUrl } from '../services/whatsapp'
import styles from './HomePage.module.css'

const azul = findProductBySlug('azul')!

export default function HomePage() {
  const { t, pick, lang } = useLanguage()
  const detailRef = useRef<HTMLElement>(null)
  const detailProgress = useScrollProgress(detailRef)
  usePageTitle()

  // la pieza protagonista cierra la rejilla: arriba las que ya se venden
  const collection = productsIn('accesorios').sort((a, b) => Number(a.price === null) - Number(b.price === null))

  return (
    <>
      <section className={`container ${styles.hero}`}>
        <div className={styles.heroText}>
          <h1 className={styles.title}>{t('home.title')}</h1>
          <p className={styles.lead}>{t('home.lead')}</p>
          <div className={styles.actions}>
            <ButtonLink to="#coleccion">{t('action.shopCollection')}</ButtonLink>
            <ButtonLink to="/personalizar" variant="text">
              {t('action.customOrder')}
            </ButtonLink>
          </div>
        </div>
        <figure className={styles.heroPiece}>
          <ProductSpin product={azul} eager hint />
          <figcaption className={styles.caption}>{t('home.heroCaption')}</figcaption>
        </figure>
      </section>

      <section id="coleccion" className={`container ${styles.section}`}>
        <header className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>{t('home.collectionTitle')}</h2>
          <p className={styles.sectionLead}>{t('home.collectionLead')}</p>
        </header>
        <div className={styles.grid}>
          {collection.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* la pieza queda fija y gira mientras se leen sus detalles */}
      <section ref={detailRef} className={`container ${styles.detail}`} aria-labelledby="detalle-azul">
        <div className={styles.detailSticky}>
          <ProductSpin product={azul} mode="scroll" progress={detailProgress} size="large" />
        </div>
        <div className={styles.detailText}>
          <header className={styles.detailHead}>
            <h2 id="detalle-azul" className={styles.sectionTitle}>
              {t('home.detailTitle')}
            </h2>
            <p className={styles.sectionLead}>{t('home.detailLead')}</p>
          </header>
          <dl className={styles.details}>
            {azulDetails.map((d, i) => (
              <div key={d.title.es} className={styles.detailItem} data-active={Math.min(3, Math.floor(detailProgress * 4)) === i}>
                <dt>{pick(d.title)}</dt>
                <dd>{pick(d.text)}</dd>
              </div>
            ))}
          </dl>
          <figure className={styles.swatch}>
            <img src="/img/products/azul/tela.jpg" alt={pick(azulDetails[0].text)} loading="lazy" />
          </figure>
          <ButtonExternal variant="outline" href={whatsappUrl(reserveMessage(azul.name, lang))}>
            {t('action.reserve')}
          </ButtonExternal>
        </div>
      </section>

      <section className={`container ${styles.custom}`}>
        <h2 className={styles.sectionTitle}>{t('home.customTitle')}</h2>
        <p className={styles.customText}>{t('home.customText')}</p>
        <ButtonLink to="/personalizar">{t('action.customOrder')}</ButtonLink>
      </section>
    </>
  )
}
