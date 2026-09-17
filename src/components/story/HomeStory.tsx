import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { azulFacts, azulNotes, findProductBySlug, productsIn } from '../../services/catalog'
import { formatPrice } from '../../services/format'
import { reserveMessage, whatsappUrl } from '../../services/whatsapp'
import { useCart } from '../providers/cartContext'
import { useLanguage } from '../providers/languageContext'
import { createStoryAnimation, RANGES } from './storyAnimation'
import styles from './HomeStory.module.css'

const azul = findProductBySlug('azul')!
// el Azul abre el carrusel: la pieza que gira se convierte en su tarjeta
const collection = [azul, ...productsIn('accesorios').filter((p) => p.id !== azul.id)]

/**
 * Portada narrada: una escena fija en la que el Modelo Azul gira y se
 * desplaza mientras cambian el fondo y las secciones. La animación vive en
 * storyAnimation.ts; aquí solo está el contenido.
 */
export default function HomeStory() {
  const { t, pick, lang } = useLanguage()
  const cart = useCart()
  const rootRef = useRef<HTMLDivElement>(null)
  const [reserved, setReserved] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    // los modelos 3D (three.js) se descargan aparte para no frenar la primera carga
    let cleanup: (() => void) | undefined
    let cancelled = false
    import('../three/modelView').then(({ createModelView }) => {
      if (cancelled) return
      const open = (canvas: HTMLCanvasElement, slug: string) => {
        const view = createModelView(canvas, slug)
        ;(canvas.previousElementSibling as HTMLElement).style.visibility = 'hidden'
        return view
      }
      const main = open(root.querySelector<HTMLCanvasElement>('[data-piece] canvas')!, azul.slug)
      const cards = [...root.querySelectorAll<HTMLCanvasElement>('[data-card-canvas]')].map((canvas) => ({
        canvas,
        view: open(canvas, canvas.dataset.slug!),
      }))
      const views = [main, ...cards.map((c) => c.view)]
      const stop = createStoryAnimation(root, main, cards)
      const onResize = () => views.forEach((v) => v.resize())
      addEventListener('resize', onResize)
      cleanup = () => {
        stop()
        removeEventListener('resize', onResize)
        views.forEach((v) => v.dispose())
      }
    })
    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  const onReserve = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const who = name.trim()
    const text = reserveMessage(azul.name, lang) + (who ? (lang === 'es' ? ` Me llamo ${who}.` : ` My name is ${who}.`) : '')
    window.open(whatsappUrl(text), '_blank', 'noopener')
    setReserved(true)
  }

  // la reserva está dentro de la escena fija: se llega llevando el scroll a su tramo
  const scrollToReserve = () => {
    const root = rootRef.current
    if (!root) return
    const top = root.offsetTop + (root.offsetHeight - innerHeight) * (RANGES.reserve[0] + 0.03)
    scrollTo({ top, behavior: 'smooth' })
  }

  const panel = (key: keyof typeof RANGES) => ({ 'data-panel': key, className: `${styles.panel} ${styles[key]}` })

  return (
    <div ref={rootRef} className={styles.story}>
      <div className={styles.stage}>
        <span className={styles.wordmark} data-wordmark aria-hidden="true">
          Helenne
        </span>

        {/* la pieza protagonista */}
        <div className={styles.piece} data-piece role="img" aria-label={`${azul.name}, ${pick(azul.description)}`}>
          <img src={azul.still} alt="" />
          <canvas />
        </div>

        {/* 1 · portada */}
        <section {...panel('hero')}>
          <p className={`label ${styles.eyebrow}`}>{t('story.eyebrow')}</p>
          <h1 className={styles.heroTitle}>
            {t('story.title1')}
            <br />
            <em>{t('story.title2')}</em>.
          </h1>
          <p className={styles.heroIntro}>{t('story.intro')}</p>
          <p className={`label ${styles.side}`} aria-hidden="true">
            {t('story.side')}
          </p>
        </section>

        {/* 2 · la pieza, con notas alrededor */}
        <section {...panel('notes')}>
          <h2 className={styles.caps}>{t('story.pieceTitle')}</h2>
          {azulNotes.map((n, i) => (
            <div key={n.title.es} className={styles.note} data-note={i}>
              <h3>
                {pick(n.title)}
                <span className={styles.noteLine} data-note-line />
              </h3>
              <p className="label">{pick(n.tag)}</p>
              <p className={styles.noteText}>{pick(n.text)}</p>
            </div>
          ))}
        </section>

        {/* 3 · el detalle (oscuro) */}
        <section {...panel('detail')}>
          <p className={`label ${styles.eyebrow}`}>{t('story.detailEyebrow')}</p>
          <h2 className={styles.darkTitle}>
            {t('story.detailTitle1')}
            <br />
            <em>{t('story.detailTitle2')}</em>.
          </h2>
          <ul className={styles.facts}>
            {azulFacts.map((f, i) => (
              <li key={f.label.es} data-fact={i}>
                <span className="label">{pick(f.label)}</span> — {pick(f.text)}
              </li>
            ))}
          </ul>
          <Link to="/personalizar" className={styles.lightButton}>
            {t('action.customOrder')}
          </Link>
        </section>

        {/* 4 · la colección: carrusel que avanza con el scroll */}
        <section {...panel('collection')}>
          <h2 className={styles.caps}>{t('story.collectionTitle')}</h2>
          <span className={styles.ornament} aria-hidden="true" />
          <div className={styles.track} data-track>
            {collection.map((p, i) => (
              <article key={p.id} className={styles.card} data-card={i}>
                <div className={styles.cardPiece} data-card-piece>
                  <img src={p.still} alt="" loading="lazy" />
                  <canvas data-card-canvas data-slug={p.slug} />
                </div>
                <p className={`label ${styles.cardKind}`}>{pick(p.kind)}</p>
                <h3 className={styles.cardName}>{p.name}</h3>
                <p className={`label ${styles.cardTags}`}>{pick(p.tags)}</p>
                <p className={styles.cardPrice}>{p.price === null ? t('product.soon') : formatPrice(p.price, lang)}</p>
                {p.price === null ? (
                  <button type="button" className={styles.lineButton} onClick={scrollToReserve}>
                    {t('story.reserveButton')}
                  </button>
                ) : (
                  <button type="button" className={styles.lineButton} onClick={() => cart.add(p.id)}>
                    {t('action.addToCart')}
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* 5 · reserva (oscuro) y pie */}
        <section {...panel('reserve')}>
          <p className={`label ${styles.eyebrow} ${styles.centered}`}>{t('story.reserveEyebrow')}</p>
          <h2 className={styles.reserveTitle}>
            {t('story.reserveTitle1')} <em>{t('story.reserveTitle2')}</em>.
          </h2>
          <p className={styles.reserveText}>{t('story.reserveText')}</p>
          {reserved ? (
            <p className={styles.done} role="status">
              {t('story.reserveDone')}
            </p>
          ) : (
            <form className={styles.form} onSubmit={onReserve}>
              <input
                aria-label={t('story.reservePlaceholder')}
                placeholder={t('story.reservePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="given-name"
              />
              <button type="submit" className="label">
                {t('story.reserveButton')}
              </button>
            </form>
          )}
          <footer className={styles.footer}>
            <span className="label">Helenne — handmade</span>
            <span className="label">{t('story.footerCraft')}</span>
            <span className="label">© {new Date().getFullYear()} — helenne.es</span>
          </footer>
        </section>
      </div>
    </div>
  )
}
