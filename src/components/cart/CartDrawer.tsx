import { findProduct, products } from '../../services/catalog'
import { formatPrice } from '../../services/format'
import { orderMessage, whatsappUrl } from '../../services/whatsapp'
import { ButtonExternal, ButtonLink } from '../ui/Button'
import Drawer from '../ui/Drawer'
import { useCart } from '../providers/cartContext'
import { useLanguage } from '../providers/languageContext'
import styles from './CartDrawer.module.css'

export default function CartDrawer() {
  const cart = useCart()
  const { t, lang, pick } = useLanguage()
  const empty = cart.lines.length === 0

  const footer = empty ? null : (
    <>
      <div className={styles.subtotal}>
        <span>{t('cart.subtotal')}</span>
        <span>{formatPrice(cart.subtotal, lang)}</span>
      </div>
      <ButtonExternal className={styles.checkout} href={whatsappUrl(orderMessage(cart.lines, products, lang))}>
        {t('cart.checkout')}
      </ButtonExternal>
      <p className={styles.note}>{t('cart.note')}</p>
    </>
  )

  return (
    <Drawer open={cart.isOpen} onClose={cart.close} title={t('cart.title')} footer={footer}>
      {empty ? (
        <div className={styles.empty}>
          <p>{t('cart.empty')}</p>
          <ButtonLink to="/accesorios" variant="outline" onClick={cart.close}>
            {t('action.shopCollection')}
          </ButtonLink>
        </div>
      ) : (
        <ul className={styles.lines}>
          {cart.lines.map((line) => {
            const p = findProduct(line.id)
            if (!p || p.price === null) return null
            return (
              <li key={line.id} className={styles.line}>
                <img src={p.thumb} alt="" className={styles.thumb} />
                <div>
                  <p className={styles.name}>{p.name}</p>
                  <p className={styles.meta}>
                    {pick(p.kind)}, {formatPrice(p.price, lang)}
                  </p>
                  <div className={styles.qty}>
                    <button type="button" aria-label={t('cart.less')} onClick={() => cart.setQty(line.id, line.qty - 1)}>
                      −
                    </button>
                    <span aria-live="polite">{line.qty}</span>
                    <button type="button" aria-label={t('cart.more')} onClick={() => cart.setQty(line.id, line.qty + 1)}>
                      +
                    </button>
                  </div>
                </div>
                <button type="button" className={styles.remove} onClick={() => cart.remove(line.id)}>
                  {t('cart.remove')}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Drawer>
  )
}
