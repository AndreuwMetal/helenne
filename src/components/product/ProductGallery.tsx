import { useEffect, useRef, useState } from 'react'
import type { Product } from '../../services/catalog'
import { useLanguage } from '../providers/languageContext'
import styles from './ProductGallery.module.css'

interface ProductGalleryProps {
  product: Product
  open: boolean
  onClose: () => void
}

/** Visor de fotos a pantalla completa sobre <dialog>: flechas, miniaturas y deslizar. */
export default function ProductGallery({ product, open, onClose }: ProductGalleryProps) {
  const { t } = useLanguage()
  const ref = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState(0)
  const touchX = useRef<number | null>(null)
  const total = product.photos.length
  const go = (i: number) => setIndex((i + total) % total)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      setIndex(0)
      dialog.showModal()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={styles.gallery}
      aria-label={product.name}
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(index - 1)
        if (e.key === 'ArrowRight') go(index + 1)
      }}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1))
        touchX.current = null
      }}
    >
      <header className={styles.head}>
        <h2 className={styles.title}>{product.name}</h2>
        <span className={styles.count}>{t('product.photoOf', { n: index + 1, total })}</span>
        <button type="button" className={styles.close} onClick={onClose}>
          {t('action.close')}
        </button>
      </header>

      <div className={styles.stage}>
        <button type="button" className={`${styles.nav} ${styles.prev}`} aria-label={t('product.prev')} onClick={() => go(index - 1)}>
          ‹
        </button>
        <img src={product.photos[index]} alt={`${product.name}, ${t('product.photoOf', { n: index + 1, total })}`} />
        <button type="button" className={`${styles.nav} ${styles.next}`} aria-label={t('product.next')} onClick={() => go(index + 1)}>
          ›
        </button>
      </div>

      <div className={styles.thumbs}>
        {product.photos.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={t('product.photoOf', { n: i + 1, total })}
            aria-current={i === index}
            onClick={() => setIndex(i)}
          >
            <img src={src} alt="" loading="lazy" />
          </button>
        ))}
      </div>
    </dialog>
  )
}
