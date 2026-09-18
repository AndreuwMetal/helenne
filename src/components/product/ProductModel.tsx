import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react'
import type { Product } from '../../services/catalog'
import type { ModelView } from '../three/modelView'
import { createSequenceView, SEQUENCES } from '../story/sequenceView'
import { useLanguage } from '../providers/languageContext'
import styles from './ProductModel.module.css'

const SPIN_MS = 2600
const REST_TURN = -0.3 // tres cuartos, la pose de reposo
/** Visto algo desde arriba: con la cremallera siempre a la vista, el sentido del giro no engaña. */
const TILT = 0.26

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Pieza que gira (fotogramas o modelo 3D): da una vuelta completa al aparecer y se puede
 * girar arrastrando o con las flechas. three.js se descarga solo cuando la
 * pieza se acerca a la pantalla; mientras tanto se ve una imagen fija.
 */
export default function ProductModel({ product, className = '' }: { product: Product; className?: string }) {
  const { t } = useLanguage()
  const boxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const posterRef = useRef<HTMLImageElement>(null)
  const view = useRef<Pick<ModelView, 'update' | 'resize' | 'dispose'> | null>(null)
  const turn = useRef(REST_TURN)
  const animation = useRef(0)
  const drag = useRef<{ x: number; turn: number } | null>(null)
  /** Si ya la han tocado, la vuelta de bienvenida no arranca (se pelearía con el arrastre). */
  const touched = useRef(false)

  useEffect(() => {
    const box = boxRef.current
    const canvas = canvasRef.current
    if (!box || !canvas) return
    let disposed = false
    let played = false

    const spin = () => {
      if (touched.current) return
      const from = turn.current
      const start = performance.now()
      const tick = (now: number) => {
        const k = Math.min(1, (now - start) / SPIN_MS)
        const eased = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2
        turn.current = from + eased * Math.PI * 2
        view.current?.update(turn.current, TILT, 0)
        if (k < 1) animation.current = requestAnimationFrame(tick)
      }
      animation.current = requestAnimationFrame(tick)
    }

    const hidePoster = () => posterRef.current && (posterRef.current.style.visibility = 'hidden')
    const load = async () => {
      if (disposed || view.current) return
      // las piezas con fotogramas (SEQUENCES) no necesitan three.js
      if (SEQUENCES[product.slug]) {
        view.current = createSequenceView(canvas, product.slug, hidePoster)
      } else {
        const { createModelView } = await import('../three/modelView')
        if (disposed || view.current) return
        view.current = createModelView(canvas, product.slug)
        hidePoster()
      }
      view.current.update(turn.current, TILT, 0)
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) load()
          if (e.intersectionRatio >= 0.6 && !played) {
            played = true
            if (!reducedMotion()) load().then(spin)
          }
        }
      },
      { rootMargin: '300px 0px', threshold: [0, 0.6] },
    )
    io.observe(box)
    const onResize = () => view.current?.resize()
    addEventListener('resize', onResize)
    return () => {
      disposed = true
      io.disconnect()
      removeEventListener('resize', onResize)
      cancelAnimationFrame(animation.current)
      view.current?.dispose()
      view.current = null
    }
  }, [product.slug])

  const rotate = (value: number) => {
    turn.current = value
    view.current?.update(value, TILT, 0)
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    touched.current = true
    cancelAnimationFrame(animation.current)
    drag.current = { x: e.clientX, turn: turn.current }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const dx = (e.clientX - drag.current.x) / e.currentTarget.clientWidth
    rotate(drag.current.turn + dx * Math.PI * 2)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    touched.current = true
    cancelAnimationFrame(animation.current)
    rotate(turn.current + (dir * Math.PI) / 8)
  }

  return (
    <div
      ref={boxRef}
      className={`${styles.piece} ${className}`}
      role="img"
      aria-label={`${product.name}. ${t('product.dragHint')}`}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      onKeyDown={onKeyDown}
    >
      <img ref={posterRef} className={styles.layer} src={product.still} alt="" loading="lazy" />
      <canvas ref={canvasRef} className={styles.layer} />
    </div>
  )
}
