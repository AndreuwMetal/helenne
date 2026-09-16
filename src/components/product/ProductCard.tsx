import { useState } from 'react'
import type { Product } from '../../services/catalog'
import { formatPrice } from '../../services/format'
import { reserveMessage, whatsappUrl } from '../../services/whatsapp'
import { Button, ButtonExternal } from '../ui/Button'
import { useCart } from '../providers/cartContext'
import { useLanguage } from '../providers/languageContext'
import ProductGallery from './ProductGallery'
import ProductSpin from './ProductSpin'
import styles from './ProductCard.module.css'

export default function ProductCard({ product }: { product: Product }) {
  const { t, lang, pick } = useLanguage()
  const cart = useCart()
  const [galleryOpen, setGalleryOpen] = useState(false)
  const forSale = product.price !== null

  return (
    <article className={styles.card} id={product.slug}>
      <ProductSpin product={product} />

      <div className={styles.info}>
        <div>
          <h3 className={styles.name}>{product.name}</h3>
          <p className={styles.kind}>{pick(product.kind)}</p>
        </div>
        <p className={styles.price}>
          {forSale ? (
            <>
              {formatPrice(product.price!, lang)} <span className={styles.shipping}>{t('product.shipping')}</span>
            </>
          ) : (
            t('product.soon')
          )}
        </p>
      </div>

      <p className={styles.description}>{pick(product.description)}</p>

      <div className={styles.actions}>
        {forSale ? (
          <Button onClick={() => cart.add(product.id)}>{t('action.addToCart')}</Button>
        ) : (
          <ButtonExternal variant="outline" href={whatsappUrl(reserveMessage(product.name, lang))}>
            {t('action.reserve')}
          </ButtonExternal>
        )}
        {product.photos.length > 0 && (
          <Button variant="text" onClick={() => setGalleryOpen(true)}>
            {t('action.seePhotos')} ({product.photos.length})
          </Button>
        )}
      </div>

      {product.photos.length > 0 && (
        <ProductGallery product={product} open={galleryOpen} onClose={() => setGalleryOpen(false)} />
      )}
    </article>
  )
}
